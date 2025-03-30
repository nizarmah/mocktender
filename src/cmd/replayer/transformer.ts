import { mockSource } from "../../pkg/mocker/client.ts"
import { createFactory } from "../../pkg/transformer/factory.ts"

// Exports to be used in the Jest config.
export type { Config } from "../../pkg/transformer/index.ts"
export { defaultConfig } from "../../pkg/transformer/index.ts"

// This is the entry point for the Replayer transformer.
// Jest requires the factory to be a default export.
export default createFactory(
  (sourceText, sourcePath) => {
    // Only support TS files for now.
    if (!sourcePath.endsWith(".ts")) {
      return sourceText
    }

    // If test path is not set, the runner hasn't started.
    // So, we don't mock anything, because it's only internal code.
    // TODO: Use local packages to avoid transforming internal code.
    if (!global.__testPath) {
      return sourceText
    }

    // Get test file prefix, eg. `.../index.test.ts` -> `.../index.`.
    // It makes it easier to match against the tested and test files.
    const testedFile = global.__testPath.replace(/\.test\.ts$/, '.')
    // Don't mock the tested file, only its dependencies.
    if (sourcePath.startsWith(testedFile)) {
      return sourceText
    }

    return mockSource(sourcePath, sourceText)
  }
)
