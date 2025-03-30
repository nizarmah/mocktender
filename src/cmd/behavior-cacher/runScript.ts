import { createReadStream, writeFileSync } from "node:fs"
import serialize from "serialize-javascript"

import type { BehaviorCache } from "../../pkg/mocker/types.ts"

import { cacheBehaviors } from "./cacheBehaviors.ts"

export async function runScript([outputPath, ...inputPaths]: string[]): Promise<string> {
  if (!outputPath || inputPaths.length === 0) {
    throw new Error(
      "Usage: ./src/cmd/behavior/cache/index.ts <./path/to/behaviors.json> <./path/to/file.trace.log>..."
    )
  }

  let behaviors: BehaviorCache = {}
  for await (const inputPath of inputPaths) {
    // Create a stream to read the input file.
    const readStream = createReadStream(inputPath)

    // Cache the behaviors.
    const cache = await cacheBehaviors(readStream)

    // Merge the cache into the behaviors.
    behaviors = { ...behaviors, ...cache }
  }

  const serialized = serialize(behaviors, { space: 4 })

  // Write the behavior cache to the output file.
  writeFileSync(
    outputPath,
    serialized,
    {
      flag: "w",
      encoding: "utf-8",
    }
  )

  // Return the output path.
  return outputPath
}
