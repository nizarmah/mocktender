import commonConfig from "./jest.common.config.js"

const replayer = "<rootDir>/src/cmd/replayer/index.ts"
/** @type {import('./src/cmd/replayer').Config} */
const replayerConfig = {
  transformer: {
    lib: "babel-jest",
    config: undefined
  }
}

/** @type {import('jest').Config} */
const config = {
  ...commonConfig,
  displayName: "replay",

  setupFiles: [
    // Setup the replayer.
    "<rootDir>/src/cmd/replayer/setup.ts",
  ],

  setupFilesAfterEnv: [
    // Setup the replayer.
    "<rootDir>/src/cmd/replayer/setupAfterEnv.ts",
  ],

  transform: {
    // The following files are setup files for the replayer.
    // They should not be instrumented.
    "src/cmd/replayer/setup.ts": "babel-jest",
    "src/cmd/replayer/setupAfterEnv.ts": "babel-jest",
    "src/pkg/mocker/lib.ts": "babel-jest",

    // Enable tracing.
    "\\.[jt]sx?$": [replayer, replayerConfig],
  },
}

export default config
