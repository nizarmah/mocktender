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
 * @param originalFn - The original synchronous function
 * @param self - The `this` context to apply
 * @param args - The arguments passed to the function
 * @returns The original function's return value
 */
export function __tsf(
  fnName: string,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  originalFn: Function,
  self: unknown,
  args: unknown[]
) {
  try {
    const result = originalFn.apply(self, args)

    __l(`sync.func.${fnName}.return`, {
      args: __s(args),
      result: __s(result),
    })

    return result
  } catch (err) {
    __l(`sync.func.${fnName}.error`, {
      args: __s(args),
      err: __s(err),
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
 * @param fnName - Display name of the async function being traced
 * @param originalFn - The original async function
 * @param self - The `this` context to apply
 * @param args - The arguments passed to the function
 * @returns A promise that resolves or rejects exactly like the original async function
 */
export async function __taf(
  fnName: string,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  originalFn: Function,
  self: unknown,
  args: unknown[]
) {
  try {
    const result = await originalFn.apply(self, args)

    __l(`async.func.${fnName}.return`, {
      args: __s(args),
      result: __s(result),
    })

    return result
  } catch (err) {
    __l(`async.func.${fnName}.error`, {
      args: __s(args),
      err: __s(err),
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
 * @param fnName - Display name of the generator function being traced
 * @param originalGen - The original generator function
 * @param self - The `this` context to apply
 * @param args - The arguments passed to the function
 * @returns An iterator (IterableIterator) that wraps the original generator’s iteration
 */
export function __tsg(
  fnName: string,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  originalGen: Function,
  self: unknown,
  args: unknown[]
) {
  __l(`sync.gen.${fnName}.init`, {
    args: __s(args),
  })

  let iterator
  try {
    iterator = originalGen.apply(self, args)
  } catch (err) {
    __l(`sync.gen.${fnName}.error`, {
      args: __s(args),
      err: __s(err),
    })

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
 * @param originalGen - The original async generator function
 * @param self - The `this` context to apply
 * @param args - The arguments passed to the function
 * @returns An async iterator (AsyncIterableIterator) that wraps the original async generator’s iteration
 */
export function __tag(
  fnName: string,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  originalGen: Function,
  self: unknown,
  args: unknown[]
) {
  __l(`async.gen.${fnName}.init`, {
    args: __s(args),
  })

  let asyncIterator
  try {
    asyncIterator = originalGen.apply(self, args)
  } catch (err) {
    __l(`async.gen.${fnName}.error`, {
      args: __s(args),
      err: __s(err),
    })

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
          args: __s(input),
          value: __s(out?.value),
          done: out?.done,
        })

        return out
      } catch (err) {
        __l(`sync.gen.${fnName}.next.error`, {
          context: 'next',
          args: __s(input),
          err: __s(err),
        })

        throw err
      }
    },
    throw: (input?: unknown) => {
      try {
        const out = iterator.throw?.(input)

        __l(`sync.gen.${fnName}.throw.return`, {
          context: 'throw',
          args: __s(input),
          value: __s(out?.value),
          done: out?.done,
        })

        return out!
      } catch (err) {
        __l(`sync.gen.${fnName}.throw.error`, {
          context: 'throw',
          args: __s(input),
          err: __s(err),
        })

        throw err
      }
    },
    return: (input?: unknown) => {
      try {
        const out = iterator.return?.(input)

        __l(`sync.gen.${fnName}.return.return`, {
          context: 'return',
          args: __s(input),
          value: __s(out?.value),
          done: out?.done,
        })

        return out!
      } catch (err) {
        __l(`sync.gen.${fnName}.return.error`, {
          context: 'return',
          args: __s(input),
          err: __s(err),
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
          args: __s(input),
          value: __s(out?.value),
          done: out?.done,
        })

        return out
      } catch (err) {
        __l(`async.gen.${fnName}.next.error`, {
          context: 'next',
          args: __s(input),
          err: __s(err),
        })

        throw err
      }
    },
    throw: async (input?: unknown) => {
      try {
        const out = await iterator.throw?.(input)

        __l(`async.gen.${fnName}.throw.return`, {
          context: 'throw',
          args: __s(input),
          value: __s(out?.value),
          done: out?.done,
        })

        return out!
      } catch (err) {
        __l(`async.gen.${fnName}.throw.error`, {
          context: 'throw',
          args: __s(input),
          err: __s(err),
        })

        throw err
      }
    },
    return: async (input?: unknown) => {
      try {
        const out = await iterator.return?.(input)

        __l(`async.gen.${fnName}.return.return`, {
          context: 'return',
          args: __s(input),
          value: __s(out?.value),
          done: out?.done,
        })

        return out!
      } catch (err) {
        __l(`async.gen.${fnName}.return.error`, {
          context: 'return',
          args: __s(input),
          err: __s(err),
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
const __l = (...args: unknown[]) => {
  console.log(...args)
}

// Serialize a value to a string.
const __s = (v: unknown): unknown => {
  // TODO: Figure out how to serialize objects, without circular references.
  // We also need to re-use the object in mock test behavior.
  return v
}
