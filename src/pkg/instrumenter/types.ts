export declare type Log = {
  // Runtime ID ties logs of the same run to handle stateful operations.
  // Eg. Creating user in DB with same email fails if user already exists.
  rid: string
  // Time is the timestamp of the log.
  time: number

  // Message is the log message.
  // It contains context on where the log is coming from.
  // Eg. `{sync,async}.{func,gen}.{function_name}.returned`.
  msg: string
  // Data contains args, return value, error, etc.
  // Cached behavior will be as JSON for now.
  // So this makes typing it less of a priority.
  data: Record<string, unknown>

  // Name is the function name: `func.name`.
  name: string
  // Path is the function filename: `__filename`.
  path: string
}
