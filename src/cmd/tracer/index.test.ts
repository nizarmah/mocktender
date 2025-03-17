import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

import { instrumentSource } from "./transformer.ts"

type TestCase = {
  desc: string
  in: string
  out: string
  logs: string
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
  const logQueue: string[][] = []
  const mockLog = (...args: string[]) => logQueue.push(args)

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

      const want = JSON.parse(readFileSync(tc.logs, "utf-8"))

      expect(logQueue).toStrictEqual(want)
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
