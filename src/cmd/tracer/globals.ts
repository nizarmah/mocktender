/* eslint-disable no-var */
import { v4 as uuidv4 } from "uuid"

import { __taf, __tag, __tsf, __tsg } from "../../pkg/instrumenter/lib.ts"
import type { AsyncFn, AsyncGn, SyncFn, SyncGn, TracerFn } from "../../pkg/instrumenter/lib.ts"

declare global {
  // Tracer functions.
  var __tsf: TracerFn<SyncFn>
  var __taf: TracerFn<AsyncFn>
  var __tsg: TracerFn<SyncGn>
  var __tag: TracerFn<AsyncGn>

  // Run ID to track unique runs.
  var __rid: string
}

global.__taf = __taf
global.__tag = __tag
global.__tsf = __tsf
global.__tsg = __tsg

beforeEach(() => {
  // We use UUIDs because it's the cheapest solution at the moment.
  // The ideal solution is using: test path, test suite name, & test name.
  // TODO: Improve this by using a custom Jest env to remove randomness.
  global.__rid = uuidv4()
})
