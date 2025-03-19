import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

import { instrumentSource } from "./transformer.ts"

type TestCase = {
  desc: string
  in: string
  out: string
  logs: string
}

type Log = {
  msg: string
  rid: string
  time: number
  data: Record<string, unknown>
}

const tt: TestCase[] = [
  {
    desc: "async functions",
    in: "./src/cmd/tracer/testdata/instrumentedCode/asyncFn/input.ts",
    out: "./src/cmd/tracer/testdata/instrumentedCode/asyncFn/output.js",
    logs: "./src/cmd/tracer/testdata/instrumentedCode/asyncFn/logs.json",
  },
  {
    desc: "sync functions",
    in: "./src/cmd/tracer/testdata/instrumentedCode/syncFn/input.ts",
    out: "./src/cmd/tracer/testdata/instrumentedCode/syncFn/output.js",
    logs: "./src/cmd/tracer/testdata/instrumentedCode/syncFn/logs.json",
  },
  {
    desc: "sync generators",
    in: "./src/cmd/tracer/testdata/instrumentedCode/syncGn/input.ts",
    out: "./src/cmd/tracer/testdata/instrumentedCode/syncGn/output.js",
    logs: "./src/cmd/tracer/testdata/instrumentedCode/syncGn/logs.json",
  },
  {
    desc: "edge cases",
    in: "./src/cmd/tracer/testdata/instrumentedCode/edgeCases/input.ts",
    out: "./src/cmd/tracer/testdata/instrumentedCode/edgeCases/output.js",
    logs: "./src/cmd/tracer/testdata/instrumentedCode/edgeCases/logs.json",
  },
]

describe("tracer", () => {
  const logQueue: Log[] = []
  const mockLog = (log: Log) => logQueue.push(log)

  beforeEach(() => {
    logQueue.length = 0
    jest.spyOn(console, "log").mockImplementation(mockLog)
  })

  describe("tracer/validate", () => {
    it.each(tt)("instruments $desc", async (tc) => {
      const input = readFileSync(tc.in, "utf-8")

      const got = instrumentSource(tc.in, input)
      const want = readFileSync(tc.out, "utf-8")

      expect(got).toStrictEqual(want)
    })

    it.each(tt)("records $desc io", async (tc) => {
      const { main } = await import(path.join(process.cwd(), tc.in))
      await main()

      const logCache: Log[] = JSON.parse(readFileSync(tc.logs, "utf-8"))

      expect(logQueue.length).toStrictEqual(logCache.length)

      logQueue.forEach((log, i) => {
        const { rid: gotRID, time: gotTime, ...got } = log
        const { rid: _rid, time: _time, ...want } = logCache[i]

        expect(gotRID).toStrictEqual(global.__rid)
        expect(gotTime).toStrictEqual(expect.any(Number))

        expect(got).toStrictEqual(want)
      })
    })
  })

  describe.skip("tracer/generate", () => {
    it.each(tt)("instruments $desc", async (tc) => {
      const input = readFileSync(tc.in, "utf-8")

      const got = instrumentSource(tc.in, input)

      writeFileSync(tc.out, got)
    })

    it.each(tt)("records $desc io", async (tc) => {
      const { main } = await import(path.join(process.cwd(), tc.in))
      await main()

      writeFileSync(tc.logs, JSON.stringify(logQueue, null, 2))
    })
  })
})
