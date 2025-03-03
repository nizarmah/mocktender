import { readFileSync } from "node:fs"
import type { LoadFnOutput, LoadHookContext } from "node:module"
import { pathToFileURL } from "node:url"

type TestCase = {
  desc: string
  url: URL
  expected: LoadFnOutput
}

// Test.
describe("tracer", () => {
  const tt: TestCase[] = [
    {
      desc: "default",
      url: pathToFileURL("./src/cmd/tracer/hooks.ts"),
      expected: {
        shortCircuit: true,
        format: "module",
        source: readFileSync(
          "./src/cmd/tracer/testdata/default.output",
          "utf-8"
        ),
      }
    },
    {
      desc: "early_return_not_local_file",
      url: new URL("https://example.com/sum.ts"),
      expected: {
        shortCircuit: true,
        format: "module",
        source: "next_load",
      }
    },
    {
      desc: "early_return_not_ts_file",
      url: pathToFileURL("./missing.json"),
      expected: {
        shortCircuit: true,
        format: "module",
        source: "next_load",
      }
    }
  ]

  it.each(tt)("$desc", async (tc) => {
    const { load } = await import("./hooks.ts")

    const ctx: LoadHookContext = {
      conditions: [],
      format: "module",
      importAttributes: {},
    }

    const result = await load(tc.url.toString(), ctx, () => {
      return {
        shortCircuit: true,
        format: "module",
        source: "next_load",
      }
    })

    expect(result).toEqual(tc.expected)
  })
})
