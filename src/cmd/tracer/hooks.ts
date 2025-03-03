import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"
import type { LoadFnOutput, LoadHook } from "node:module"
import { fileURLToPath } from "node:url"

import { instrument } from "../../pkg/monkeypatch/instrument.ts"

import { readSourceFile } from "../../pkg/typescript/reader.ts"
import { printSourceFile } from "../../pkg/typescript/printer.ts"

// Intercepts the loading of a module to add instrumentation.
export const load: LoadHook = async (url, ctx, nextLoad): Promise<LoadFnOutput> => {
  // Only instrument local TS files.
  if (
    !url.startsWith("file://") ||
    !url.endsWith(".ts")
  ) {
    return nextLoad(url)
  }

  // Get file path.
  const path = fileURLToPath(url)

  // Get instrumented code.
  const instrumented = getInstrumentedCode(path)

  // Strip types for NodeJS --experimental-strip-types.
  const stripped = stripTypeScriptTypes(instrumented, { mode: "transform" })

  // Return.
  return {
    // Avoid loading original file.
    shortCircuit: true,
    // Patched module.
    format: "module",
    source: stripped,
  }
}

function getInstrumentedCode(path: string): string {
  // Skip the instrumentation library.
  // TODO: Stop relative importing instrumentation lib.
  if (
    path.endsWith("pkg/instrumentation/lib.ts")
  ) {
    return readFileSync(path, "utf-8")
  }

  // Read the parsed code.
  const source = readSourceFile(path)

  // Instrument it.
  const instrumented = instrument(source)

  // Convert to stringified code.
  return printSourceFile(instrumented)
}