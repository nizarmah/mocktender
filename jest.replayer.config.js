import commonConfig from "./jest.common.config.js"

/** @type {import('jest').Config} */
const config = {
  ...commonConfig,
  displayName: "replay",

  // Use replayer's runner.
  testRunner: "<rootDir>/src/cmd/replayer/runner.ts",

  // Use replayer's environment.
  testEnvironment: "<rootDir>/src/cmd/replayer/environment.ts",

  transform: {
    // Use replayer's transformer.
    "\\.[jt]sx?$": "<rootDir>/src/cmd/replayer/transformer.ts",
  },
}

export default config
