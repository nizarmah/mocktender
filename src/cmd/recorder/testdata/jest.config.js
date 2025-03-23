/** @type {import('jest').Config} */
const config = {
  displayName: "testdata",

  // Use the project's root directory.
  // This allows us to use the recorder transformer.
  rootDir: process.cwd(),

  // Disable caching, so transformer updates are reflected.
  cache: false,

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
    "\\.[jt]sx?$": "<rootDir>/src/cmd/recorder/index.ts",
  },
}

export default config
