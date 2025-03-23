import { run as runJest } from "jest"
import { createInterface as createReadline } from "node:readline"
import path from "node:path"
import { createReadStream, readFileSync } from "node:fs"

import type { Log } from "../../pkg/instrumenter/types.ts"

type TestCase = {
  desc: string
  test: string
  logs: Omit<Log, "rid" | "time">[]
}

const tt: TestCase[] = [
  {
    desc: "dummy",
    test: "testdata/dummy/index.test.ts",
    logs: [
      {
        msg: "sync.func.instrumentSource.return",
        name: "instrumentSource",
        path: "/Users/nizarmah/Personal/mocktender/src/pkg/instrumenter/client.ts",
        data: {
          args: [
            "/Users/nizarmah/Personal/mocktender/src/cmd/tracer/testdata/dummy/index.test.ts",
            (
              "import { main } from \"./index.ts\"\n"
              + "\n"
              + "describe(\"dummy\", () => {\n"
              + "  it(\"should return a greeting\", () => {\n"
              + "    expect(main()).toStrictEqual(\"Hello, world!\")\n"
              + "  })\n"
              + "})\n"
            )
          ],
          result: (
            "import { main } from \"./index.ts\";\n"
            + "describe(\"dummy\", () => {\n"
            + "    it(\"should return a greeting\", () => {\n"
            + "        expect(main()).toStrictEqual(\"Hello, world!\");\n"
            + "    });\n"
            + "});\n"
          )
        }
      },
      {
        msg: "sync.func.instrumentSource.return",
        name: "instrumentSource",
        path: "/Users/nizarmah/Personal/mocktender/src/pkg/instrumenter/client.ts",
        data: {
          args: [
            "/Users/nizarmah/Personal/mocktender/src/cmd/tracer/testdata/dummy/index.ts",
            (
              "function greet(name: string) {\n"
              + "  return `Hello, ${name}!`\n"
              + "}\n"
              + "\n"
              + "export function main() {\n"
              + "  return greet(\"world\")\n"
              + "}\n"
            )
          ],
          result: (
            "function greet(name: string) {\n"
            + "    return `Hello, ${name}!`;\n"
            + "}\n"
            + "export function main() {\n"
            + "    return greet(\"world\");\n"
            + "}\n"
          )
        }
      }
    ]
  }
]

// Deserialize deserializes strings serialized with `serialize-javascript`.
// Ref: https://www.npmjs.com/package/serialize-javascript#deserializing.
function deserialize(str: string) {
  return eval(`(${str})`)
}

describe("tracer", () => {
  it.each(tt)("tracer behavior on: $desc", async (tc) => {
    // Programmatically runs Jest so the Tracer instruments itself.
    // Usually, when running the Tracer with Jest, we only get the tested code behavior.
    // With this workaround, we get the Tracer's behavior as well.
    await runJest([
      path.join(__dirname, tc.test),
    ])

    // Ensure there are no errors.
    const stderr = readFileSync(path.join(process.cwd(), "tracer.stderr.log"), "utf-8")
    expect(stderr).toBe("")

    // Prepare to read the output line by line.
    const stdout = createReadline({
      input: createReadStream(path.join(process.cwd(), "tracer.stdout.log"), "utf-8")
    })

    // Collect logs so we avoid conditionals for index.
    // More memory usage, but better readability for tests.
    const gotLogs: Log[] = []
    for await (const line of stdout) {
      gotLogs.push(deserialize(line))
    }

    const wantLogs = tc.logs

    // Check if the number of logs is the same.
    expect(gotLogs.length).toStrictEqual(wantLogs.length)

    // Compare each log.
    gotLogs.forEach(({ rid: gotRID, time: _gotTime, ...got }, i) => {
      const want = wantLogs[i]

      // RID should match across all logs of the same run.
      expect(gotRID).toStrictEqual(global.__rid)

      // Check if the log matches the expected log.
      expect(got).toMatchObject(want)
    })
  })
})
