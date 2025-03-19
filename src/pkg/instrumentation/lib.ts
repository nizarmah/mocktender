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
> = (fn: FunctionType, dir: string, self: unknown, args: unknown[]) => unknown

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
 *   return __tsf(
 *     function test(a: number, b: number) {
 *       return a + b;
 *     },           // reference to the original code
 *     this,        // 'this' context (important for class methods)
 *     [a, b],      // arguments as an array
 *   );
 * }
 * ```
 *
 * @param fn - The original synchronous function
 * @param dir - The directory of the file containing the original function
 * @param self - The `this` context to apply
 * @param args - The arguments passed to the function
 * @returns The original function's return value
 */
export const __tsf: TracerFn<SyncFn> = (fn, dir, self, args) => {
  try {
    const result = fn.apply(self, args)

    __l(`sync.func.${fn.name}.return`, {
      name: fn.name,
      path: dir,
      args,
      result,
    })

    return result
  } catch (err) {
    __l(`sync.func.${fn.name}.error`, {
      name: fn.name,
      path: dir,
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
 * @param fn - The original async function
 * @param dir - The directory of the file containing the original function
 * @param self - The `this` context to apply
 * @param args - The arguments passed to the function
 * @returns A promise that resolves or rejects exactly like the original async function
 */
export const __taf: TracerFn<AsyncFn> = async (fn, dir, self, args) => {
  try {
    const result = await fn.apply(self, args)

    __l(`async.func.${fn.name}.return`, {
      name: fn.name,
      path: dir,
      args,
      result,
    })

    return result
  } catch (err) {
    __l(`async.func.${fn.name}.error`, {
      name: fn.name,
      path: dir,
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
 * @param fn - The original generator function
 * @param dir - The directory of the file containing the original function
 * @param self - The `this` context to apply
 * @param args - The arguments passed to the function
 * @returns An iterator (IterableIterator) that wraps the original generator’s iteration
 */
export const __tsg: TracerFn<SyncGn> = (fn, dir, self, args) => {
  __l(`sync.gen.${fn.name}.init`, {
    name: fn.name,
    path: dir,
    args,
  })

  let iterator
  try {
    iterator = fn.apply(self, args)
  } catch (err) {
    __l(`sync.gen.${fn.name}.error`, {
      name: fn.name,
      path: dir,
      args,
      err,
    })

    throw err
  }

  return __wsi(fn.name, iterator)
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
 * @param fn - The original async generator function
 * @param dir - The directory of the file containing the original function
 * @param self - The `this` context to apply
 * @param args - The arguments passed to the function
 * @returns An async iterator (AsyncIterableIterator) that wraps the original async generator’s iteration
 */
export const __tag: TracerFn<AsyncGn> = (fn, dir, self, args) => {
  __l(`async.gen.${fn.name}.init`, {
    name: fn.name,
    path: dir,
    args,
  })

  let asyncIterator
  try {
    asyncIterator = fn.apply(self, args)
  } catch (err) {
    __l(`async.gen.${fn.name}.error`, {
      name: fn.name,
      path: dir,
      args,
      err,
    })

    throw err
  }

  return __wai(fn.name, asyncIterator)
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
