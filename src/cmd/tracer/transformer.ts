import type {
  AsyncTransformer,
  SyncTransformer,
  TransformedSource,
  Transformer,
  TransformOptions
} from "@jest/transform"

import { instrument } from "../../pkg/monkeypatch/instrument.ts"
import { createSourceFile, printSourceFile } from "../../pkg/typescript/index.ts"

type Config = Partial<{
  transformer: {
    lib: string
    config: unknown
  }
}>

const defaultConfig: Config = {
  // Jest's default transformer that we want to extend.
  transformer: {
    lib: "babel-jest",
    config: {}
  }
}

export default {
  async createTransformer(overrides: Config = {}) {
    const config = { ...defaultConfig, ...overrides }

    if (
      !config.transformer ||
      !config.transformer.lib
    ) {
      throw new Error("Transformer is required")
    }

    const factory = await import(config.transformer.lib)
    const transformer: Transformer = factory.createTransformer(config.transformer.config)

    return new Tracer(transformer)
  }
}

class Tracer implements SyncTransformer<Config> {
  private transformer: Transformer

  constructor (transformer: Transformer) {
    this.transformer = transformer
  }

  process(
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<Config>
  ): TransformedSource {
    // There should always be a sync process method.
    if (!this.transformer.process) {
      throw new Error("Transformer does not support sync processing")
    }

    return wrappedProcessor(
      sourceText,
      sourcePath,
      options,
      this.transformer.process
    )
  }

  async processAsync(
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<Config>
  ): Promise<TransformedSource> {
    // If there's no async process method, we can use the sync one.
    if (!this.transformer.processAsync) {
      return this.process(sourceText, sourcePath, options)
    }

    return wrappedProcessor(
      sourceText,
      sourcePath,
      options,
      this.transformer.processAsync
    )
  }
}

// Wrapping `Tracer` helps extend the transformer, without replacing it.
function wrappedProcessor<
  T extends SyncTransformer['process'] | AsyncTransformer['processAsync'],
  R extends ReturnType<T> = ReturnType<T>
>(
  sourceText: string,
  sourcePath: string,
  options: TransformOptions<Config | undefined>,
  nextProcess: T
): R {
  // Remove `Tracer` config, otherwise some transformers will fail.
  const transformerOptions = {
    ...options,
    transformerConfig: options.transformerConfig?.transformer?.config
  }

  // We only support TS files for now.
  if (!sourcePath.endsWith(".ts")) {
    return nextProcess(sourceText, sourcePath, transformerOptions) as R
  }

  const instrumented = instrumentSource(sourcePath, sourceText)

  return nextProcess(instrumented, sourcePath, transformerOptions) as R
}

// Instrument the source code.
export function instrumentSource(
  sourcePath: string,
  sourceText: string
): string {
  // Without this, the instrumentation lib will get infinite recursion.
  if (sourcePath.endsWith("instrumentation/lib.ts")) {
    return sourceText
  }

  const source = createSourceFile(sourcePath, sourceText)
  const instrumented = instrument(source)

  return printSourceFile(instrumented)
}
