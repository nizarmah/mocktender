// Config defines the config for the Tracer transformer.
export declare type Config = {
  // Transformer is the transformer that Tracer will wrap.
  // Jest can't define two transformers for the same matching pattern.
  // So we rely on wrapping the transformer you want to originally use.
  // Otherwise, we fallback to the default Jest transformer.
  transformer?: {
    lib: string
    config: unknown
  }
}
