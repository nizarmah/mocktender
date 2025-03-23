import type {
  Transformer as WrappedTransformer,
  TransformerFactory
} from "@jest/transform"

import { Transformer } from "./transformer.ts"
import type { Config, Preprocessor } from './types.ts'

// DefaultConfig defines the default config for the wrapper transformer.
export const defaultConfig: Required<Config> = {
  // Jest's default transformer that we want to extend.
  transformer: {
    lib: "babel-jest",
    config: undefined
  }
}

// CreateFactory creates the wrapper Transformer factory which can be exported to Jest.
export function createFactory<C extends Config = Config>(
  preprocessor: Preprocessor
): TransformerFactory<
  // @ts-expect-error: There is a bug in Jest's type, expecting `Wrapper<unknown>`.
  // We can do this safely here because `Wrapper<C>` implements `SyncTransformer<C>`.
  Transformer<C>
> {
  return {
    createTransformer: async (overrides: unknown) => {
      assertConfig(overrides)

      const config = { ...defaultConfig, ...overrides }

      const factory = await import(config.transformer.lib)
      const wrappedTransformer: WrappedTransformer = factory.createTransformer(
        config.transformer.config
      )

      const wrapperTransformer = new Transformer<C>(wrappedTransformer, preprocessor)

      return wrapperTransformer
    }
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

  // If the transformer is not defined, no need to validate.
  if (
    !('transformer' in config) ||
    config.transformer === undefined
  ) {
    return
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
