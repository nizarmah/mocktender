import type { Transformer, TransformerFactory } from "@jest/transform"

import { Tracer } from "./transformer.ts"
import type { Config } from "./types.ts"

// DefaultConfig defines the default config for the Tracer transformer.
export const defaultConfig: Required<Config> = {
  // Jest's default transformer that we want to extend.
  transformer: {
    lib: "babel-jest",
    config: undefined
  }
}

// TracerFactory creates the Tracer with the wrapped transformer.
export const TracerFactory: TransformerFactory<
  // @ts-expect-error: There is a bug in Jest's type, expecting `Transformer<unknown>`.
  // We can do this safely here because `Tracer` implements `SyncTransformer<Config>`.
  Tracer
> = {
  async createTransformer(overrides: unknown) {
    assertConfig(overrides)

    const config = { ...defaultConfig, ...overrides }

    const factory = await import(config.transformer.lib)
    const transformer: Transformer = factory.createTransformer(config.transformer.config)

    return new Tracer(transformer)
  }
}

function assertConfig(config: unknown): asserts config is Config | undefined {
  // If config is undefined, no need to validate.
  if (config === undefined) {
    return
  }

  // Validate the config object.
  if (
    typeof config !== "object" ||
    config === null
  ) {
    throw new Error("Invalid config: config must be an object")
  }

  // Validate the overrides.transformer object.
  if (
    !('transformer' in config) ||
    typeof config.transformer !== "object" ||
    config.transformer === null
  ) {
    throw new Error("Invalid config: config.transformer must be an object")
  }

  const { transformer } = config

  // Validate the overrides.transformer.lib property.
  if (
    !('lib' in transformer) ||
    typeof transformer.lib !== "string"
  ) {
    throw new Error("Invalid config: config.transformer.lib must be a string")
  }

  // No need to validate the overrides.transformer.config property.
  // It can be anything, depending on the transformer used.

  return
}
