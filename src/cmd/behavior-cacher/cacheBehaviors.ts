import {
  createInterface as createReadline,
  Interface as ReadlineInterface,
} from "node:readline"

import type { Log } from "../../pkg/instrumenter/types.ts"
import type { Behavior, BehaviorCache } from "../../pkg/mocker/types.ts"

// CacheBehaviors creates a behavior cache from a stream of recorder logs.
export async function cacheBehaviors(
  readStream: NodeJS.ReadableStream,
): Promise<BehaviorCache> {
  return buildBehaviorCache(
    createReadline({
      input: readStream,
    })
  )
}

// BuildBehaviorCache builds a map of all the behaviors recorded by the recorder.
// This allows us to re-use these behaviors in "replay" mode.
async function buildBehaviorCache(rl: ReadlineInterface): Promise<BehaviorCache> {
  const behaviors: BehaviorCache = {}

  for await (const line of rl) {
    const log: Log = deserialize(line)

    if (!(log.path in behaviors)) {
      behaviors[log.path] = {}
    }

    if (!(log.name in behaviors[log.path])) {
      behaviors[log.path][log.name] = {}
    }

    if (!(log.rid in behaviors[log.path][log.name])) {
      behaviors[log.path][log.name][log.rid] = []
    }

    // TODO: Order by timestamp.
    behaviors[log.path][log.name][log.rid].push({
      // TODO: Re-use the Log and Behavior types, and remove type casting.
      args: log.data.args as Behavior["args"],
      result: log.data.result as Behavior["result"],
    })
  }
  return behaviors
}

// Deserialize deserializes strings serialized with `serialize-javascript`.
// Ref: https://www.npmjs.com/package/serialize-javascript#deserializing.
function deserialize(str: string) {
  return eval(`(${str})`)
}
