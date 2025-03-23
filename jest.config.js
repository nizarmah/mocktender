const recorder = "<rootDir>/src/cmd/recorder/index.ts"
/** @type {import('./src/cmd/recorder').Config} */
const recorderConfig = {
  transformer: {
    lib: "babel-jest",
    config: undefined
  }
}

/** @type {import('jest').Config} */
const commonConfig = {
  // Disable caching, so transformer updates are reflected.
  cache: false,

  // Ignores tests that match the pattern.
  modulePathIgnorePatterns: [
    // Tests under /testdata/ are run programmatically.
    // Eg. `<rootDir>/src/cmd/recorder/index.test.ts`.
    "/testdata/",
  ],
}

/** @type {import('jest').Config} */
const config = {
  projects: [
    {
      ...commonConfig,
      displayName: "record",

      setupFilesAfterEnv: [
        // Add tracing globals.
        "<rootDir>/src/cmd/recorder/globals.ts",
      ],

      transform: {
        // The following files are setup files for the recorder.
        // They should not be instrumented.
        "src/cmd/recorder/globals.ts": "babel-jest",
        "src/pkg/instrumenter/lib.ts": "babel-jest",

        // Enable tracing.
        "\\.[jt]sx?$": [recorder, recorderConfig],
      },
    }
}

export default config
