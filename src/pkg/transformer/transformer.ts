import type {
  AsyncTransformer,
  SyncTransformer,
  TransformedSource,
  Transformer as WrappedTransformer,
  TransformOptions
} from "@jest/transform"

import type { Config, Preprocessor } from "./types.ts"

export class Transformer<C extends Config> implements SyncTransformer<C> {
  private preprocessor: Preprocessor
  private wrappedTransformer: WrappedTransformer

  constructor (
    wrappedTransformer: WrappedTransformer,
    preprocessor: Preprocessor
  ) {
    this.wrappedTransformer = wrappedTransformer
    this.preprocessor = preprocessor
  }

  process(
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<Config>
  ): TransformedSource {
    // There should always be a sync process method.
    if (!this.wrappedTransformer.process) {
      throw new Error("Transformer does not support sync processing")
    }

    return wrapperProcessor(
      sourceText,
      sourcePath,
      options,
      this.preprocessor,
      this.wrappedTransformer.process
    )
  }

  async processAsync(
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<Config>
  ): Promise<TransformedSource> {
    // If there's no async process method, we can use the sync one.
    if (!this.wrappedTransformer.processAsync) {
      return this.process(sourceText, sourcePath, options)
    }

    return wrapperProcessor(
      sourceText,
      sourcePath,
      options,
      this.preprocessor,
      this.wrappedTransformer.processAsync
    )
  }
}

// WrapperProcessor processes the source code with `Transformer`, then the wrapped transformer.
function wrapperProcessor<
  T extends SyncTransformer['process'] | AsyncTransformer['processAsync'],
  R extends ReturnType<T> = ReturnType<T>
>(
  sourceText: string,
  sourcePath: string,
  options: TransformOptions<Config | undefined>,
  preprocessor: Preprocessor,
  nextProcess: T
): R {
  // For Jest, the transformer is `Transformer`, so options.transformerConfig is Transformer's `Config`.
  // But the wrapped transformer expects the WrappedTransformer config from Transformer's `Config.transformer.config`.
  const transformerOptions = {
    ...options,
    // Replace the Transformer config with the WrappedTransformer's config.
    transformerConfig: options.transformerConfig?.transformer?.config
  }

  // Only support TS files for now.
  if (!sourcePath.endsWith(".ts")) {
    return nextProcess(sourceText, sourcePath, transformerOptions) as R
  }

  const processed = preprocessor(sourceText, sourcePath)

  return nextProcess(processed, sourcePath, transformerOptions) as R
}
