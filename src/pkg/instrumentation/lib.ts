import serialize from "serialize-javascript"

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
> = (name: string, fn: FunctionType, self: unknown, args: unknown[]) => unknown

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
 *   // Original function body::
 *   function __fn(a: number, b: number) {
 *     return a + b;
 *   }
 *
 *   // Then we call __tsf with:
 *   return __tsf(
 *     "test",      // function name
 *     __fn,        // reference to the original code
 *     this,        // 'this' context (important for class methods)
 *     [a, b],      // arguments as an array
 *   );
 * }
 * ```
 *
 * @param fnName - Display name of the function being traced
 * @param ogFn - The original synchronous function
 * @param self - The `this` context to apply
 * @param args - The arguments passed to the function
 * @returns The original function's return value
 */
export const __tsf: TracerFn<SyncFn> = (fnName, ogFn, self, args) => {
  try {
    const result = ogFn.apply(self, args)

    __l(`sync.func.${fnName}.return`, { args, result })

    return result
  } catch (err) {
    __l(`sync.func.${fnName}.error`, { args, err })

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
 *   async function __fn(url: string) {
 *     const resp = await fetch(url);
 *     return resp.json();
 *   }
 *
 *   // Then we call __taf with:
 *   return await __taf(
 *     "fetchData",
 *     __fn,
 *     this,
 *     [url],
 *   );
 * }
 * ```
 *
 * @param fnName - Display name of the async function being traced
 * @param ogFn - The original async function
 * @param self - The `this` context to apply
 * @param args - The arguments passed to the function
 * @returns A promise that resolves or rejects exactly like the original async function
 */
export const __taf: TracerFn<AsyncFn> = async (fnName, ogFn, self, args) => {
  try {
    const result = await ogFn.apply(self, args)

    __l(`async.func.${fnName}.return`, { args, result })

    return result
  } catch (err) {
    __l(`async.func.${fnName}.error`, { args, err })

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
 *   function* __fn(n: number) {
 *     for (let i = 0; i < n; i++) {
 *       yield i;
 *     }
 *   }
 *
 *   // Then we call __tsg with:
 *   return yield* __tsg(
 *     "numbersUpTo",
 *     __fn,
 *     this,
 *     [n],
 *   );
 * }
 * ```
 *
 * @param fnName - Display name of the generator function being traced
 * @param ogFn - The original generator function
 * @param self - The `this` context to apply
 * @param args - The arguments passed to the function
 * @returns An iterator (IterableIterator) that wraps the original generator’s iteration
 */
export const __tsg: TracerFn<SyncGn> = (fnName, ogFn, self, args) => {
  __l(`sync.gen.${fnName}.init`, { args })

  let iterator
  try {
    iterator = ogFn.apply(self, args)
  } catch (err) {
    __l(`sync.gen.${fnName}.error`, { args, err })

    throw err
  }

  return __wsi(fnName, iterator)
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
 *   async function* __original(n: number) {
 *     for (let i = 0; i < n; i++) {
 *       yield i;
 *     }
 *   }
 *
 *   // Then we call __tag with:
 *   return yield* __tag(
 *     "asyncNumbersUpTo",
 *     __original,
 *     this,
 *     [n],
 *   );
 * }
 * ```
 *
 * @param fnName - Display name of the async generator function being traced
 * @param ogFn - The original async generator function
 * @param self - The `this` context to apply
 * @param args - The arguments passed to the function
 * @returns An async iterator (AsyncIterableIterator) that wraps the original async generator’s iteration
 */
export const __tag: TracerFn<AsyncGn> = (fnName, ogFn, self, args) => {
  __l(`async.gen.${fnName}.init`, { args })

  let asyncIterator
  try {
    asyncIterator = ogFn.apply(self, args)
  } catch (err) {
    __l(`async.gen.${fnName}.error`, { args, err })

    throw err
  }

  return __wai(fnName, asyncIterator)
}

// Wraps a **sync** iterator so that .next(), .throw(), .return() all get logged.
function __wsi(fnName: string, iterator: Iterator<unknown, unknown>): IterableIterator<unknown, unknown> {
  return {
    next: (input?: unknown) => {
      try {
        const out = iterator.next?.(input)

        __l(`sync.gen.${fnName}.next.return`, {
          context: 'next',
          args: input,
          value: out?.value,
          done: out?.done,
        })

        return out
      } catch (err) {
        __l(`sync.gen.${fnName}.next.error`, {
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
          context: 'throw',
          args: input,
          value: out?.value,
          done: out?.done,
        })

        return out as IteratorResult<unknown, unknown>
      } catch (err) {
        __l(`sync.gen.${fnName}.throw.error`, {
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
          context: 'return',
          args: input,
          value: out?.value,
          done: out?.done,
        })

        return out as IteratorResult<unknown, unknown>
      } catch (err) {
        __l(`sync.gen.${fnName}.return.error`, {
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
function __wai(fnName: string, iterator: AsyncIterator<unknown, unknown>): AsyncIterableIterator<unknown, unknown> {
  return {
    next: async (input?: unknown) => {
      try {
        const out = await iterator.next?.(input)

        __l(`async.gen.${fnName}.next.return`, {
          context: 'next',
          args: input,
          value: out?.value,
          done: out?.done,
        })

        return out
      } catch (err) {
        __l(`async.gen.${fnName}.next.error`, {
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
          context: 'throw',
          args: input,
          value: out?.value,
          done: out?.done,
        })

        return out as IteratorResult<unknown, unknown>
      } catch (err) {
        __l(`async.gen.${fnName}.throw.error`, {
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
          context: 'return',
          args: input,
          value: out?.value,
          done: out?.done,
        })

        return out as IteratorResult<unknown, unknown>
      } catch (err) {
        __l(`async.gen.${fnName}.return.error`, {
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
const __l = (msg: string, data: Record<string, unknown>) => {
  console.log({
    msg,
    data: __s(data),
  })
}

// Serialize a value to a string.
const __s = (v: unknown): string => {
  // TODO: Handle circular references, check `createSourceFile`.
  return serialize(v, { space: 2 })
}
