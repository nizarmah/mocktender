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
    // Enable tracing.
    "\\.[jt]sx?$": "<rootDir>/src/cmd/tracer/transformer.ts",
  },
}

export default config
