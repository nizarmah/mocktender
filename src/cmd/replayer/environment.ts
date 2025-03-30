import { readFileSync } from "node:fs"
import { join as joinPath } from "node:path"
import { TestEnvironment } from "jest-environment-node"
import type {
  EnvironmentContext,
  JestEnvironmentConfig,
} from "@jest/environment"
import type { Circus } from "@jest/types"
import serialize from "serialize-javascript"

import type { Behavior, BehaviorCache, MockerFn, SyncFn } from "../../pkg/mocker/types.ts"
import { createSyncFunctionMocker } from "../../pkg/mocker/lib.ts"

declare global {
  // Mocking functions.
  // eslint-disable-next-line no-var
  var __msf: MockerFn<SyncFn>
}

export default class Environment extends TestEnvironment {
  // Blocks stores the current test suite hierarchy.
  // It's used to generate unique test run IDs.
  private blocks: string[] = []

  // TestRunID is the unique ID of the current test run.
  private testRunID: string = ""

  // Behaviors stores the behaviors cache.
  private behaviors: BehaviorCache

  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context)

    // TODO: Cache the behaviors next to each code file.
    const cachePath = process.env.BEHAVIOR_CACHE ?? joinPath(process.cwd(), `behaviors.json`)
    this.behaviors = deserialize(readFileSync(cachePath, "utf-8")) as BehaviorCache
  }

  async setup() {
    await super.setup()

    const getBehavior = this.getBehavior.bind(this)
    const getRunID = this.getRunID.bind(this)

    this.global.__msf = createSyncFunctionMocker(getRunID, getBehavior, serialize)
  }

  async teardown() {
    // ...

    await super.teardown()
  }

  handleTestEvent(event: Circus.Event) {
    if (event.name === "start_describe_definition") {
      this.blocks.push(event.blockName)
      return
    }

    if (event.name === "finish_describe_definition") {
      this.blocks.pop()
      return
    }

    if (event.name === "test_start") {
      // TODO: Include the suite name in the test run ID.
      this.testRunID = event.test.name
      return
    }

    // Ignore other events.
    return
  }

  private getBehavior(
    fnName: string,
    filePath: string,
    runID: string,
    behaviorIndex: number
  ): Behavior | undefined {
    return this.behaviors?.[filePath]?.[fnName]?.[runID]?.[behaviorIndex]
  }

  private getRunID() {
    return this.testRunID
  }
}

// Deserialize deserializes strings serialized with `serialize-javascript`.
// Ref: https://www.npmjs.com/package/serialize-javascript#deserializing.
const deserialize = (str: string): unknown => {
  return eval(`(${str})`)
}
