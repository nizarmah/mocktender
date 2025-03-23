import { createReadStream, writeFileSync } from "node:fs"
import path from "node:path"
import {
  createInterface as createReadline,
  Interface as ReadlineInterface,
} from "node:readline"
import serialize from "serialize-javascript"

import type { Log } from "../../pkg/instrumenter/types.ts"

// Main is the entrypoint for the mocker script.
export async function main() {
  const args = process.argv.slice(2)

  const [inputPath, outputPath] = args
  if (!inputPath || !outputPath) {
    throw new Error(
      "Usage: ./src/cmd/mocker <tracer-stdout-log-path> <cached-behavior-file-path>"
    )
  }

  const behaviors = await buildBehaviorMap(
    createReadline({
      input: createReadStream(
        path.join(process.cwd(), inputPath)
      ),
    })
  )

  writeFileSync(
    path.join(process.cwd(), outputPath),
    serialize(behaviors, { space: 4 }),
    {
      flag: "w",
      encoding: "utf-8",
    }
  )
}

// BuildBehaviorMap builds a map of all the behaviors recorded by the tracer.
// This allows us to re-use these behaviors in "replay" mode.
async function buildBehaviorMap(rl: ReadlineInterface) {
  const behaviorMap: Record<
    Log["path"],
    Record<
      Log["name"],
      Record<
        Log["rid"],
        Log["data"]
      >
    >
  > = {}

  for await (const line of rl) {
    const log: Log = deserialize(line)

    if (!(log.path in behaviorMap)) {
      behaviorMap[log.path] = {}
    }

    if (!(log.name in behaviorMap[log.path])) {
      behaviorMap[log.path][log.name] = {}
    }

    const shortRID = log.rid.split("-").pop()
    if (!shortRID) {
      throw new Error("Invalid rid")
    }

    behaviorMap[log.path][log.name][shortRID] = log.data
  }
  return behaviorMap
}

// Deserialize deserializes strings serialized with `serialize-javascript`.
// Ref: https://www.npmjs.com/package/serialize-javascript#deserializing.
function deserialize(str: string) {
  return eval(`(${str})`)
}
