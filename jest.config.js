/** @type {import('jest').Config} */
const config = {
  // Use node not browser.
  testEnvironment: "node",

  // Jest setup, mainly for globals.
  setupFiles: [
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
