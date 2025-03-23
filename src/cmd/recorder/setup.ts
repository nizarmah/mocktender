/* eslint-disable no-var */
import path from "node:path"

declare global {
  // Path to the tracer log output file.
  var __tracerStdout: string
  // Path to the tracer log stderr file.
  var __tracerStderr: string
}

// TODO: Scope the values to the test suite that's running.
// In case two tests are running in parallel, they will overwrite one another.
global.__tracerStdout = path.join(process.cwd(), "tracer.stdout.log")
global.__tracerStderr = path.join(process.cwd(), "tracer.stderr.log")
