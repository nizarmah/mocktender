import type {
  AsyncTransformer,
  SyncTransformer,
  TransformedSource,
  Transformer,
  TransformOptions
} from "@jest/transform"

import { instrumentSource } from "../../pkg/instrumenter/client.ts"

import type { Config } from "./types.ts"

export class Tracer implements SyncTransformer<Config> {
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

// WrappedProcessor processes the source code with Tracer, then the wrapped transformer.
function wrappedProcessor<
  T extends SyncTransformer['process'] | AsyncTransformer['processAsync'],
  R extends ReturnType<T> = ReturnType<T>
>(
  sourceText: string,
  sourcePath: string,
  options: TransformOptions<Config | undefined>,
  nextProcess: T
): R {
  // For Jest, the transformer is Tracer, so options.transformerConfig is `TracerConfig`.
  // But the wrapped transformer expects the config in `TracerConfig.transformer.config`.
  const transformerOptions = {
    ...options,
    // Replace the Tracer config with the wrapped transformer's config.
    transformerConfig: options.transformerConfig?.transformer?.config
  }

  // Only support TS files for now.
  if (!sourcePath.endsWith(".ts")) {
    return nextProcess(sourceText, sourcePath, transformerOptions) as R
  }

  const instrumented = instrumentSource(sourcePath, sourceText)

  return nextProcess(instrumented, sourcePath, transformerOptions) as R
}
