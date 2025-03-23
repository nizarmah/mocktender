const tracer = "<rootDir>/src/cmd/tracer/index.ts"
/** @type {import('./src/cmd/tracer').Config} */
const tracerConfig = {
  transformer: {
    lib: "babel-jest",
    config: undefined
  }
}

/** @type {import('jest').Config} */
const config = {
  // Use node not browser.
  testEnvironment: "node",

  // Disable caching, so transformer updates are reflected.
  cache: false,

  // Jest setup, mainly for globals.
  // AfterEnv because we use Jest globals.
  setupFilesAfterEnv: [
    // Add tracing globals.
    "<rootDir>/src/cmd/tracer/globals.ts",
  ],

  // Transforms source code.
  transform: {
    "src/cmd/tracer/globals.ts": "babel-jest",
    "src/pkg/instrumenter/lib.ts": "babel-jest",

    // Enable tracing.
    "\\.[jt]sx?$": [tracer, tracerConfig],
  },

  // Ignores tests that match the pattern.
  testPathIgnorePatterns: [
    // Tests under tracer/testdata are run programmatically.
    // Reference: `<rootDir>/src/cmd/tracer/index.test.ts`.
    "<rootDir>/src/cmd/tracer/testdata/*.test.ts",
  ],
}

export default config
