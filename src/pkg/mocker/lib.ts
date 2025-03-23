import { readFileSync } from "node:fs"
import serialize from "serialize-javascript"

type StatefulFn = {
  runtimeID: string
  behaviorIndex: number
}

export type SyncFn = StatefulFn & ((...args: unknown[]) => unknown)
// TODO: Add support for async functions and generators.
// export type AsyncFn = (...args: unknown[]) => Promise<unknown>
// export type SyncGn = (...args: unknown[]) => IterableIterator<unknown>
// export type AsyncGn = (...args: unknown[]) => AsyncIterableIterator<unknown>

export type MockerFn<
  FunctionType extends
    | SyncFn
> = (fn: FunctionType, filepath: string, self: unknown, args: unknown[]) => unknown

/**
 * Mock calls for a **sync** function.
 *
 * @example
 * ```ts
 * // Original code:
 * // function test(a: number, b: number) {
 * //   return a + b;
 * // }
 *
 * // Traced code:
 * function test(a: number, b: number) {
 *   return __msf(
 *     test,   // reference to the original code
 *     __filename,  // path of the file containing the original code
 *     this,        // 'this' context (important for class methods)
 *     [a, b],      // arguments as an array
 *   )
 * }
 * ```
 *
 * @param fn - The original function
 * @param filepath - The path of the file containing the original function
 * @param self - The `this` context to apply
 * @param args - The arguments passed to the function
 * @returns The original function's return value
 */
export const __msf: MockerFn<SyncFn> = (fn, filepath, _self, args) => {
  // We can safely do this because tests inside a single file are run serially.
  if (fn.runtimeID !== global.__rid) {
    fn.runtimeID = global.__rid
    fn.behaviorIndex = 0
  }

  const behavior = __b(fn.name, filepath, fn.runtimeID, fn.behaviorIndex)
  fn.behaviorIndex += 1

  if (args.length !== behavior?.args.length) {
    throw new Error(`Expected ${args.length} arguments, but got ${behavior?.args?.length}`)
  }

  // TODO: Improve this by using DI for comparison logic.
  const gotArgs = __s(args)
  const wantArgs = __s(behavior?.args)
  if (gotArgs !== wantArgs) {
    throw new Error(`Expected arguments "${wantArgs}", but got "${gotArgs}"`)
  }

  return behavior?.result
}

// Serialize a value to a string.
const __s = (v: unknown): string => {
  // TODO: Handle circular references, check `createSourceFile`.
  return serialize(v)
}

// Deserializes strings serialized with `serialize-javascript`.
// Ref: https://www.npmjs.com/package/serialize-javascript#deserializing.
const __d = (str: string): unknown => {
  return eval(`(${str})`)
}


// Gets a behavior from the cache.
const __b = (() => {
  type FilePath = string
  type FuncName = string
  type RuntimeID = string
  type Cache = Record<FilePath, Record<FuncName, Record<RuntimeID, Behavior[]>>>
  type Behavior = {
    args: unknown[]
    result: unknown
  }

  // TODO: Remove the type cast. We need it for now because `__d` returns `unknown`.
  const cache = __d(readFileSync(global.__behaviorCache, "utf-8")) as Cache

  return (
    fnName: string,
    filepath: string,
    runtimeID: string,
    behaviorIndex: number
  ): Behavior | undefined => {
    return cache[filepath]?.[fnName]?.[runtimeID]?.[behaviorIndex]
  }
})()
