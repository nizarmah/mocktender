import { readFileSync } from "node:fs"
import type { LoadFnOutput } from "node:module"
import { fileURLToPath, pathToFileURL } from "node:url"

import { load } from "./hooks.ts"

load(
  pathToFileURL("./src/cmd/tracer/hooks.ts").toString(),
  {
    conditions: [],
    format: "module",
    importAttributes: {},
  },
  function nextLoad(url: string): LoadFnOutput {
    const path = fileURLToPath(url)
    const source = readFileSync(path, "utf-8")

    return {
      shortCircuit: true,
      format: "module",
      source,
    }
  },
)
