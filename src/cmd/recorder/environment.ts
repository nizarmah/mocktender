import { Console } from "node:console"
import { createWriteStream, WriteStream } from "node:fs"
import { basename, dirname, join as joinPath } from "node:path"
import { TestEnvironment } from "jest-environment-node"
import type {
  EnvironmentContext,
  JestEnvironmentConfig,
} from "@jest/environment"
import type { Circus } from "@jest/types"
import serialize from "serialize-javascript"

import type {
  AsyncFn,
  AsyncGn,
  Log,
  SyncFn,
  SyncGn,
  TracerFn,
} from "../../pkg/instrumenter/types.ts"
import {
  createAsyncFunctionTracer,
  createAsyncGeneratorTracer,
  createSyncFunctionTracer,
  createSyncGeneratorTracer,
} from "../../pkg/instrumenter/lib.ts"

declare global {
  // Tracing functions.
  // eslint-disable-next-line no-var
  var __tsf: TracerFn<SyncFn>
  // eslint-disable-next-line no-var
  var __taf: TracerFn<AsyncFn>
  // eslint-disable-next-line no-var
  var __tsg: TracerFn<SyncGn>
  // eslint-disable-next-line no-var
  var __tag: TracerFn<AsyncGn>
}

export default class Environment extends TestEnvironment {
  // Blocks stores the current test suite hierarchy.
  // It's used to generate unique test run IDs.
  private blocks: string[] = []

  // TestRunID is the unique ID of the current test run.
  private testRunID: string = ""

  // TraceStd* streams capture recorded behavior logs.
  private traceStdout: WriteStream
  private traceStderr: WriteStream

  // Tracer is the client writer for the trace streams.
  private tracer: Console

  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context)

    this.testRunID = ""

    const streams = createTraceStreams(context.testPath)
    this.traceStdout = streams.stdout
    this.traceStderr = streams.stderr

    this.tracer = new Console(this.traceStdout, this.traceStderr)
  }

  async setup() {
    await super.setup()

    const logger = this.log.bind(this)

    this.global.__tsf = createSyncFunctionTracer(logger)
    this.global.__taf = createAsyncFunctionTracer(logger)
    this.global.__tsg = createSyncGeneratorTracer(logger)
    this.global.__tag = createAsyncGeneratorTracer(logger)
  }

  async teardown() {
    this.traceStdout.close()
    this.traceStderr.close()

    await super.teardown()
  }

  handleTestEvent(event: Circus.Event) {
    if (event.name === "start_describe_definition") {
      this.blocks.push(event.blockName)
      return
    }

    if (event.name === "finish_describe_definition") {
      this.blocks.pop()
      return
    }

    if (event.name === "test_start") {
      // TODO: Include the suite name in the test run ID.
      this.testRunID = event.test.name
      return
    }

    // Ignore other events.
    return
  }

  private log(
    msg: string,
    {
      name,
      path,
      ...data
    }: Record<string, unknown> & Pick<Log, "name" | "path">,
  ) {
    const log: Log = {
      rid: this.testRunID ?? "test",
      time: Date.now(),
      name,
      path,
      msg,
      data,
    }

    this.tracer.log(
      // TODO: Handle circular references, check `createSourceFile`.
      serialize(log)
    )
  }
}

function createTraceStreams(testPath: string): {
  stdout: WriteStream,
  stderr: WriteStream,
} {
  const file = basename(testPath, ".test.ts")
  const dir = dirname(testPath)

  const stdoutPath = joinPath(dir, `${file}.trace.log`)
  const stderrPath = joinPath(dir, `${file}.trace.err`)

  return {
    stdout: createWriteStream(stdoutPath, {
      flags: "a",
      encoding: "utf-8",
    }),
    stderr: createWriteStream(stderrPath, {
      flags: "a",
      encoding: "utf-8",
    }),
  }
}
