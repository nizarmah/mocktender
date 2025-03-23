import { createReadStream, writeFileSync } from "node:fs"

import { cacheBehaviors } from "./cacheBehaviors.ts"

export async function runScript([inputPath, outputPath]: string[]): Promise<string> {
  if (!inputPath || !outputPath) {
    throw new Error(
      "Usage: ./src/cmd/behavior/cache/index.ts <recorder-stdout-log-path> <cached-behavior-file-path>"
    )
  }

  // Create a stream to read the input file.
  const readStream = createReadStream(inputPath)

  // Cache the behaviors.
  const behaviorCache = await cacheBehaviors(readStream)

  // Write the behavior cache to the output file.
  writeFileSync(
    outputPath,
    behaviorCache,
    {
      flag: "w",
      encoding: "utf-8",
    }
  )

  // Return the output path.
  return outputPath
}
