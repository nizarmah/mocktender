import { register } from "node:module"
import { pathToFileURL } from "node:url"

// Registers tracer hooks to intercept module resolution and loading.
export function registerTracer() {
  register(
    "./hooks.ts",
    pathToFileURL("./src/cmd/tracer/"),
  )
}

// Entrypoint.
registerTracer()
