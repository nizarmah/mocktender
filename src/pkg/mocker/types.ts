export declare type Behavior = {
  args: unknown[]
  result: unknown
}

export type BehaviorCache = Record<string, Record<string, Record<string, Behavior[]>>>

export type GetRunIDFn = () => string
export type GetBehaviorFn = (
  name: string, filepath: string, runtimeID: string, behaviorIndex: number) => Behavior | undefined

export type SerializeFn = (value: unknown) => string

// TODO: Add support for async functions and generators.
export type SyncFn = StatefulFn & ((...args: unknown[]) => unknown)

export type MockerFn<
  FunctionType extends
    | SyncFn
> = (fn: FunctionType, filepath: string, self: unknown, args: unknown[]) => unknown

type StatefulFn = {
  runID: string
  behaviorIndex: number
}
