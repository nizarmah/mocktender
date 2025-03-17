import { __taf, __tag, __tsf, __tsg } from "../../pkg/instrumentation/lib.ts"
import type { AsyncFn, AsyncGn, SyncFn, SyncGn, TracerFn } from "../../pkg/instrumentation/lib.ts"

declare global {
  // eslint-disable-next-line no-var
  var __tsf: TracerFn<SyncFn>
  // eslint-disable-next-line no-var
  var __taf: TracerFn<AsyncFn>
  // eslint-disable-next-line no-var
  var __tsg: TracerFn<SyncGn>
  // eslint-disable-next-line no-var
  var __tag: TracerFn<AsyncGn>
}

global.__taf = __taf
global.__tag = __tag
global.__tsf = __tsf
global.__tsg = __tsg
