/* eslint-disable no-var */
import { __msf } from "../../pkg/mocker/lib.ts"
import type { SyncFn, MockerFn } from "../../pkg/mocker/lib.ts"

declare global {
  // Mocking functions.
  var __msf: MockerFn<SyncFn>

  // Run ID to track unique runs.
  var __rid: string
}

global.__msf = __msf
// TODO: Support the other mocking functions.
// global.__msg = __msg
// global.__maf = __maf
// global.__mag = __mag
