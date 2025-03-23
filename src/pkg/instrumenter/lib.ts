import { Console } from "node:console"
import { createWriteStream } from "node:fs"
import path from "node:path"
import serialize from "serialize-javascript"

import type { Log } from "./types.ts"

export type SyncFn = (...args: unknown[]) => unknown
export type AsyncFn = (...args: unknown[]) => Promise<unknown>
export type SyncGn = (...args: unknown[]) => IterableIterator<unknown>
export type AsyncGn = (...args: unknown[]) => AsyncIterableIterator<unknown>

export type TracerFn<
  FunctionType extends
    | SyncFn
    | AsyncFn
    | SyncGn
    | AsyncGn
> = (fn: FunctionType, filepath: string, self: unknown, args: unknown[]) => unknown

/**
 * Trace calls for a **sync** function.
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
 *   function test(a: number, b: number) {
 *     return a + b;
 *   }
 *
 *   return __tsf(
 *     test,        // reference to the original code
 *     __filename,  // path of the file containing the original code
 *     this,        // 'this' context (important for class methods)
 *     [a, b],      // arguments as an array
 *   );
 * }
 * ```
 *
 * @param fn - The original synchronous function
 * @param filepath - The path of the file containing the original function
 * @param self - The `this` context to apply
 * @param args - The arguments passed to the function
 * @returns The original function's return value
 */
export const __tsf: TracerFn<SyncFn> = (fn, filepath, self, args) => {
  try {
    const result = fn.apply(self, args)

    __l(`sync.func.${fn.name}.return`, {
      name: fn.name,
      path: filepath,
      args,
      result,
    })

    return result
  } catch (err) {
    __l(`sync.func.${fn.name}.error`, {
      name: fn.name,
      path: filepath,
      args,
      err
    })

    throw err
  }
}

/**
 * Trace calls for an **async** function.
 *
 * @example
 * ```ts
 * // Original code:
 * // async function fetchData(url: string) {
 * //   const resp = await fetch(url);
 * //   return resp.json();
 * // }
 *
 * // Traced code:
 * async function fetchData(url: string) {
 *   async function fetchData(url: string) {
 *     const resp = await fetch(url);
 *     return resp.json();
 *   }
 *
 *   // Then we call __taf with:
 *   return await __taf(
 *     fetchData,
 *     __filename,
 *     this,
 *     [url],
 *   );
 * }
 * ```
 *
 * @param fn - The original async function
 * @param filepath - The path of the file containing the original function
 * @param self - The `this` context to apply
 * @param args - The arguments passed to the function
 * @returns A promise that resolves or rejects exactly like the original async function
 */
export const __taf: TracerFn<AsyncFn> = async (fn, filepath, self, args) => {
  try {
    const result = await fn.apply(self, args)

    __l(`async.func.${fn.name}.return`, {
      name: fn.name,
      path: filepath,
      args,
      result,
    })

    return result
  } catch (err) {
    __l(`async.func.${fn.name}.error`, {
      name: fn.name,
      path: filepath,
      args,
      err,
    })

    throw err
  }
}

/**
 * Trace calls for a **sync** generator.
 *
 * @example
 * ```ts
 * // Original code:
 * // function* numbersUpTo(n: number) {
 * //   for (let i = 0; i < n; i++) {
 * //     yield i;
 * //   }
 * // }
 *
 * // Traced code:
 * function* numbersUpTo(n: number) {
 *   function* numbersUpTo(n: number) {
 *     for (let i = 0; i < n; i++) {
 *       yield i;
 *     }
 *   }
 *
 *   // Then we call __tsg with:
 *   return yield* __tsg(
 *     numbersUpTo,
 *     __filename,
 *     this,
 *     [n],
 *   );
 * }
 * ```
 *
 * @param fn - The original generator function
 * @param filepath - The path of the file containing the original function
 * @param self - The `this` context to apply
 * @param args - The arguments passed to the function
 * @returns An iterator (IterableIterator) that wraps the original generator’s iteration
 */
export const __tsg: TracerFn<SyncGn> = (fn, filepath, self, args) => {
  __l(`sync.gen.${fn.name}.init`, {
    name: fn.name,
    path: filepath,
    args,
  })

  let iterator
  try {
    iterator = fn.apply(self, args)
  } catch (err) {
    __l(`sync.gen.${fn.name}.error`, {
      name: fn.name,
      path: filepath,
      args,
      err,
    })

    throw err
  }

  return __wsi(fn.name, filepath, iterator)
}

/**
 * Trace calls for an **async** generator.
 *
 * @example
 * ```ts
 * // Original code (before transformation):
 * // async function* asyncNumbersUpTo(n: number) {
 * //   for (let i = 0; i < n; i++) {
 * //     yield i;
 * //   }
 * // }
 *
 * // Transformed code might look like:
 * async function* asyncNumbersUpTo(n: number) {
 *   async function* asyncNumbersUpTo(n: number) {
 *     for (let i = 0; i < n; i++) {
 *       yield i;
 *     }
 *   }
 *
 *   // Then we call __tag with:
 *   return yield* __tag(
 *     asyncNumbersUpTo,
 *     __filename,
 *     this,
 *     [n],
 *   );
 * }
 * ```
 *
 * @param fn - The original async generator function
 * @param filepath - The path of the file containing the original function
 * @param self - The `this` context to apply
 * @param args - The arguments passed to the function
 * @returns An async iterator (AsyncIterableIterator) that wraps the original async generator’s iteration
 */
export const __tag: TracerFn<AsyncGn> = (fn, filepath, self, args) => {
  __l(`async.gen.${fn.name}.init`, {
    name: fn.name,
    path: filepath,
    args,
  })

  let asyncIterator
  try {
    asyncIterator = fn.apply(self, args)
  } catch (err) {
    __l(`async.gen.${fn.name}.error`, {
      name: fn.name,
      path: filepath,
      args,
      err,
    })

    throw err
  }

  return __wai(fn.name, filepath, asyncIterator)
}

// Wraps a **sync** iterator so that .next(), .throw(), .return() all get logged.
function __wsi(
  fnName: string,
  filepath: string,
  iterator: Iterator<unknown, unknown>
): IterableIterator<unknown, unknown> {
  return {
    next: (input?: unknown) => {
      try {
        const out = iterator.next?.(input)

        __l(`sync.gen.${fnName}.next.return`, {
          name: fnName,
          path: filepath,
          context: 'next',
          args: input,
          value: out?.value,
          done: out?.done,
        })

        return out
      } catch (err) {
        __l(`sync.gen.${fnName}.next.error`, {
          name: fnName,
          path: filepath,
          context: 'next',
          args: input,
          err,
        })

        throw err
      }
    },
    throw: (input?: unknown) => {
      try {
        const out = iterator.throw?.(input)

        __l(`sync.gen.${fnName}.throw.return`, {
          name: fnName,
          path: filepath,
          context: 'throw',
          args: input,
          value: out?.value,
          done: out?.done,
        })

        return out as IteratorResult<unknown, unknown>
      } catch (err) {
        __l(`sync.gen.${fnName}.throw.error`, {
          name: fnName,
          path: filepath,
          context: 'throw',
          args: input,
          err,
        })

        throw err
      }
    },
    return: (input?: unknown) => {
      try {
        const out = iterator.return?.(input)

        __l(`sync.gen.${fnName}.return.return`, {
          name: fnName,
          path: filepath,
          context: 'return',
          args: input,
          value: out?.value,
          done: out?.done,
        })

        return out as IteratorResult<unknown, unknown>
      } catch (err) {
        __l(`sync.gen.${fnName}.return.error`, {
          name: fnName,
          path: filepath,
          context: 'return',
          args: input,
          err,
        })

        throw err
      }
    },
    [Symbol.iterator]() {
      return this
    },
  }
}

// Wraps an **async** iterator so that .next(), .throw(), .return() all get logged.
function __wai(
  fnName: string,
  filepath: string,
  iterator: AsyncIterator<unknown, unknown>
): AsyncIterableIterator<unknown, unknown> {
  return {
    next: async (input?: unknown) => {
      try {
        const out = await iterator.next?.(input)

        __l(`async.gen.${fnName}.next.return`, {
          name: fnName,
          path: filepath,
          context: 'next',
          args: input,
          value: out?.value,
          done: out?.done,
        })

        return out
      } catch (err) {
        __l(`async.gen.${fnName}.next.error`, {
          name: fnName,
          path: filepath,
          context: 'next',
          args: input,
          err: err,
        })

        throw err
      }
    },
    throw: async (input?: unknown) => {
      try {
        const out = await iterator.throw?.(input)

        __l(`async.gen.${fnName}.throw.return`, {
          name: fnName,
          path: filepath,
          context: 'throw',
          args: input,
          value: out?.value,
          done: out?.done,
        })

        return out as IteratorResult<unknown, unknown>
      } catch (err) {
        __l(`async.gen.${fnName}.throw.error`, {
          name: fnName,
          path: filepath,
          context: 'throw',
          args: input,
          err,
        })

        throw err
      }
    },
    return: async (input?: unknown) => {
      try {
        const out = await iterator.return?.(input)

        __l(`async.gen.${fnName}.return.return`, {
          name: fnName,
          path: filepath,
          context: 'return',
          args: input,
          value: out?.value,
          done: out?.done,
        })

        return out as IteratorResult<unknown, unknown>
      } catch (err) {
        __l(`async.gen.${fnName}.return.error`, {
          name: fnName,
          path: filepath,
          context: 'return',
          args: input,
          err,
        })

        throw err
      }
    },
    [Symbol.asyncIterator]() {
      return this
    },
  }
}

// Log a message.
const __l = (() => {
  // Create streams for stdout and stderr in the closure.
  // TODO: Improve this by using dependency injection.
  const stdout = createWriteStream(
    path.join(process.cwd(), "tracer.stdout.log"),
    { flags: "a", encoding: "utf-8" }
  )
  const stderr = createWriteStream(
    path.join(process.cwd(), "tracer.stderr.log"),
    { flags: "a", encoding: "utf-8" }
  )

  // Create a logger that writes to the streams.
  // TODO: Improve this by using dependency injection.
  const logger = new Console(stdout, stderr)

  return (
    msg: string,
    {
      name,
      path,
      ...data
    }: Record<string, unknown> & Pick<Log, "name" | "path">
  ) => {
    // TODO: Improve this by passing it as a parameter to logger.
    const runtimeID = global.__rid

    const log: Log = {
      rid: runtimeID,
      time: Date.now(),
      name,
      path,
      msg,
      data,
    }

    logger.log(__s(log))
  }
})()

// Serialize a value to a string.
const __s = (v: unknown): string => {
  // TODO: Handle circular references, check `createSourceFile`.
  return serialize(v)
}
