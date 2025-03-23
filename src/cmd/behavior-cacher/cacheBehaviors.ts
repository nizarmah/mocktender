import {
  createInterface as createReadline,
  Interface as ReadlineInterface,
} from "node:readline"
import serialize from "serialize-javascript"

import type { Log } from "../../pkg/instrumenter/types.ts"

// Main is the entrypoint for the cacher script.
export async function cacheBehaviors(
  readStream: NodeJS.ReadableStream,
): Promise<string> {
  const behaviors = await buildBehaviorMap(
    createReadline({
      input: readStream,
    })
  )

  return serialize(behaviors, { space: 4 })
}

// BuildBehaviorMap builds a map of all the behaviors recorded by the recorder.
// This allows us to re-use these behaviors in "replay" mode.
async function buildBehaviorMap(rl: ReadlineInterface) {
  const behaviorMap: Record<
    Log["path"],
    Record<
      Log["name"],
      Record<
        Log["rid"],
        Log["data"][]
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

    if (!(log.rid in behaviorMap[log.path][log.name])) {
      behaviorMap[log.path][log.name][log.rid] = []
    }

    // TODO: Order by timestamp.
    behaviorMap[log.path][log.name][log.rid].push(log.data)
  }
  return behaviorMap
}

// Deserialize deserializes strings serialized with `serialize-javascript`.
// Ref: https://www.npmjs.com/package/serialize-javascript#deserializing.
function deserialize(str: string) {
  return eval(`(${str})`)
}
