import type {
  AsyncFn,
  AsyncGn,
  LoggerFn,
  SyncFn,
  SyncGn,
  TracerFn,
} from "./types.ts"

/**
 * Creates a tracer for a **sync** function.
 *
 * @example: Tracing a sync function
 * ```ts title="original code"
 * function test(a: number, b: number) {
 *   return a + b;
 * }
 * ```
 *
 * ```ts title="traced code"
 * function test(a: number, b: number) {
 *   function test(a: number, b: number) {
 *     return a + b;
 *   }
 *
 *   return tracer(test, __filename, this, [a, b]);
 * }
 * ```
 */
export const createSyncFunctionTracer = (logger: LoggerFn): TracerFn<SyncFn> =>
  (fn, filepath, self, args) => {
    try {
      const result = fn.apply(self, args)

      logger(`sync.func.${fn.name}.return`, {
        name: fn.name,
        path: filepath,
        args,
        result,
      })

      return result
    } catch (err) {
      logger(`sync.func.${fn.name}.error`, {
        name: fn.name,
        path: filepath,
        args,
        err
      })

      throw err
    }
  }

/**
 * Creates a tracer for an **async** function.
 *
 * @example: Tracing an async function
 * ```ts title="original code"
 * async function fetchData(url: string) {
 *   return (await fetch(url)).json();
 * }
 * ```
 *
 * ```ts title="traced code"
 * async function fetchData(url: string) {
 *   async function fetchData(url: string) {
 *     return (await fetch(url)).json;
 *   }
 *
 *   return await tracer(fetchData, __filename, this, [url]);
 * }
 * ```
 */
export const createAsyncFunctionTracer = (logger: LoggerFn): TracerFn<AsyncFn> =>
  async (fn, filepath, self, args) => {
    try {
      const result = await fn.apply(self, args)

      logger(`async.func.${fn.name}.return`, {
        name: fn.name,
        path: filepath,
        args,
        result,
      })

      return result
    } catch (err) {
      logger(`async.func.${fn.name}.error`, {
        name: fn.name,
        path: filepath,
        args,
        err,
      })

      throw err
    }
  }

/**
 * Creates a tracer for a **sync** generator.
 *
 * @example: Tracing a sync generator
 * ```ts title="original code"
 * function* numbersUpTo(n: number) {
 *   for (let i = 0; i < n; i++) {
 *     yield i;
 *   }
 * }
 * ```
 *
 * ```ts title="traced code"
 * function* numbersUpTo(n: number) {
 *   function* numbersUpTo(n: number) {
 *     for (let i = 0; i < n; i++) {
 *       yield i;
 *     }
 *   }
 *
 *   return yield* tracer(numbersUpTo, __filename, this, [n]);
 * }
 * ```
 */
export const createSyncGeneratorTracer = (logger: LoggerFn): TracerFn<SyncGn> => {
  const iteratorTracer = createSyncIteratorTracer(logger)

  return (fn, filepath, self, args) => {
    logger(`sync.gen.${fn.name}.init`, {
      name: fn.name,
      path: filepath,
      args,
    })

    let iterator
    try {
      iterator = fn.apply(self, args)
    } catch (err) {
      logger(`sync.gen.${fn.name}.error`, {
        name: fn.name,
        path: filepath,
        args,
        err,
      })

      throw err
    }

    return iteratorTracer(fn.name, filepath, iterator)
  }
}

/**
 * Creates a tracer for an **async** generator.
 *
 * @example: Tracing an async generator
 * ```ts title="original code"
 * async function* asyncNumbersUpTo(n: number) {
 *   for (let i = 0; i < n; i++) {
 *     yield i;
 *   }
 * }
 * ```
 *
 * ```ts title="traced code"
 * async function* asyncNumbersUpTo(n: number) {
 *   async function* asyncNumbersUpTo(n: number) {
 *     for (let i = 0; i < n; i++) {
 *       yield i;
 *     }
 *   }
 *
 *   return yield* tracer(asyncNumbersUpTo, __filename, this, [n]);
 * }
 * ```
 */
export const createAsyncGeneratorTracer = (logger: LoggerFn): TracerFn<AsyncGn> => {
  const iteratorTracer = createAsyncIteratorTracer(logger)

  return (fn, filepath, self, args) => {
    logger(`async.gen.${fn.name}.init`, {
      name: fn.name,
      path: filepath,
      args,
    })

    let asyncIterator
    try {
      asyncIterator = fn.apply(self, args)
    } catch (err) {
      logger(`async.gen.${fn.name}.error`, {
        name: fn.name,
        path: filepath,
        args,
        err,
      })

      throw err
    }

    return iteratorTracer(fn.name, filepath, asyncIterator)
  }
}

// Creates a tracer for a **sync** iterator.
const createSyncIteratorTracer = (logger: LoggerFn) =>
  (
    fnName: string,
    filepath: string,
    iterator: Iterator<unknown, unknown>
  ): IterableIterator<unknown, unknown> => {
    return {
      next: (input?: unknown) => {
        try {
          const out = iterator.next?.(input)

          logger(`sync.gen.${fnName}.next.return`, {
            name: fnName,
            path: filepath,
            context: 'next',
            args: input,
            value: out?.value,
            done: out?.done,
          })

          return out
        } catch (err) {
          logger(`sync.gen.${fnName}.next.error`, {
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

          logger(`sync.gen.${fnName}.throw.return`, {
            name: fnName,
            path: filepath,
            context: 'throw',
            args: input,
            value: out?.value,
            done: out?.done,
          })

          return out as IteratorResult<unknown, unknown>
        } catch (err) {
          logger(`sync.gen.${fnName}.throw.error`, {
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

          logger(`sync.gen.${fnName}.return.return`, {
            name: fnName,
            path: filepath,
            context: 'return',
            args: input,
            value: out?.value,
            done: out?.done,
          })

          return out as IteratorResult<unknown, unknown>
        } catch (err) {
          logger(`sync.gen.${fnName}.return.error`, {
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

// Creates a tracer for an **async** iterator.
const createAsyncIteratorTracer = (logger: LoggerFn) =>
  (
    fnName: string,
    filepath: string,
    iterator: AsyncIterator<unknown, unknown>
  ): AsyncIterableIterator<unknown, unknown> => {
    return {
      next: async (input?: unknown) => {
        try {
          const out = await iterator.next?.(input)

          logger(`async.gen.${fnName}.next.return`, {
            name: fnName,
            path: filepath,
            context: 'next',
            args: input,
            value: out?.value,
            done: out?.done,
          })

          return out
        } catch (err) {
          logger(`async.gen.${fnName}.next.error`, {
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

          logger(`async.gen.${fnName}.throw.return`, {
            name: fnName,
            path: filepath,
            context: 'throw',
            args: input,
            value: out?.value,
            done: out?.done,
          })

          return out as IteratorResult<unknown, unknown>
        } catch (err) {
          logger(`async.gen.${fnName}.throw.error`, {
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

          logger(`async.gen.${fnName}.return.return`, {
            name: fnName,
            path: filepath,
            context: 'return',
            args: input,
            value: out?.value,
            done: out?.done,
          })

          return out as IteratorResult<unknown, unknown>
        } catch (err) {
          logger(`async.gen.${fnName}.return.error`, {
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
