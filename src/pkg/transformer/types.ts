// Config defines the config for the wrapper transformer.
export declare type Config = {
  // Transformer is the transformer that WrapperTransformer will wrap.
  // Jest can't define two transformers for the same matching pattern.
  // So we rely on wrapping the transformer you want to originally use.
  // Otherwise, we fallback to the default Jest transformer.
  transformer?: {
    lib: string
    config: unknown
  }
}

// Preprocessor is a function that preprocesses the source code.
// It is used by the wrapper transformer before the wrapped transformer is applied.
export declare type Preprocessor = (sourceText: string, sourcePath: string) => string
