import commonConfig from "./jest.common.config.js"

const recorder = "<rootDir>/src/cmd/recorder/index.ts"
/** @type {import('./src/cmd/recorder').Config} */
const recorderConfig = {
  transformer: {
    lib: "babel-jest",
    config: undefined
  }
}

/** @type {import('jest').Config} */
const config = {
  ...commonConfig,
  displayName: "record",

  setupFiles: [
    // Setup the recorder.
    "<rootDir>/src/cmd/recorder/setup.ts",
  ],

  setupFilesAfterEnv: [
    // Setup the recorder.
    "<rootDir>/src/cmd/recorder/setupAfterEnv.ts",
  ],

  transform: {
    // The following files are setup files for the recorder.
    // They should not be instrumented.
    "src/cmd/recorder/setup.ts": "babel-jest",
    "src/cmd/recorder/setupAfterEnv.ts": "babel-jest",
    "src/pkg/instrumenter/lib.ts": "babel-jest",

    // Enable tracing.
    "\\.[jt]sx?$": [recorder, recorderConfig],
  },
}

export default config
