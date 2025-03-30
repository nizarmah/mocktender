import type {
  GetBehaviorFn,
  GetRunIDFn,
  MockerFn,
  SerializeFn,
  SyncFn
} from "./types.ts"

/**
 * Creates a mocker for a **sync** function.
 *
 * @example
 * ```ts title="original code"
 * function test(a: number, b: number) {
 *   return a + b;
 * }
 * ```
 *
 * ```ts title="mocked code"
 * function test(a: number, b: number) {
 *   return mocker(test, __filename, this, [a, b])
 * }
 * ```
 */
export const createSyncFunctionMocker = (
  getRunID: GetRunIDFn,
  getBehavior: GetBehaviorFn,
  serialize: SerializeFn
): MockerFn<SyncFn> =>
  (fn, filepath, _self, args) => {
    // We can safely do this because tests inside a single file are run serially.
    const runID = getRunID()
    if (fn.runID !== runID) {
      fn.runID = runID
      fn.behaviorIndex = 0
    }

    const behavior = getBehavior(fn.name, filepath, fn.runID, fn.behaviorIndex)
    fn.behaviorIndex += 1

    if (args.length !== behavior?.args.length) {
      throw new Error(`Expected ${args.length} arguments, but got ${behavior?.args?.length}`)
    }

    // TODO: Improve this by using DI for comparison logic.
    const gotArgs = serialize(args)
    const wantArgs = serialize(behavior?.args)
    if (gotArgs !== wantArgs) {
      throw new Error(`Expected arguments "${wantArgs}", but got "${gotArgs}"`)
    }

    return behavior?.result
  }
