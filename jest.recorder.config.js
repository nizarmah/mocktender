import commonConfig from "./jest.common.config.js"

/** @type {import('jest').Config} */
const config = {
  ...commonConfig,
  displayName: "record",

  // Use recorder's environment.
  testEnvironment: "<rootDir>/src/cmd/recorder/environment.ts",

  transform: {
    // Use recorder's transformer.
    "\\.[jt]sx?$": "<rootDir>/src/cmd/recorder/transformer.ts",
  },
}

export default config
