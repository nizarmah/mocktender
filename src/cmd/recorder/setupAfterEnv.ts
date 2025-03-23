/* eslint-disable no-var */
import type { AsyncFn, AsyncGn, SyncFn, SyncGn, TracerFn } from "../../pkg/instrumenter/lib.ts"
import { __taf, __tag, __tsf, __tsg } from "../../pkg/instrumenter/lib.ts"

declare global {
  // Tracing functions.
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
