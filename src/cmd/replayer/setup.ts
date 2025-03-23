/* eslint-disable no-var */
import path from "node:path"

declare global {
  // Path to the behavior cache file.
  var __behaviorCache: string
}

// TODO: Provide the value from a Jest custom ENV.
global.__behaviorCache = path.join(process.cwd(), "behaviors.json")
