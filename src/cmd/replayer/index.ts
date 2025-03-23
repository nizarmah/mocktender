import { mockSource } from "../../pkg/mocker/client.ts"
import { createFactory } from "../../pkg/transformer/factory.ts"

// Exports to be used in the Jest config.
export type { Config } from "../../pkg/transformer/index.ts"
export { defaultConfig } from "../../pkg/transformer/index.ts"

// This is the entry point for the Replayer transformer.
// Jest requires the factory to be a default export.
export default createFactory(
  (sourceText, sourcePath) => {
    return mockSource(sourcePath, sourceText)
  }
)
