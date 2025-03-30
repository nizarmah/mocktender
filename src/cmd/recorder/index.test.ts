import { run as runJest } from "jest"
import path from "node:path"
import { readFileSync } from "node:fs"

import { runScript as runBehaviorCacher } from "../behavior-cacher/runScript.ts"

type TestCase = {
  desc: string
  test: string
  want: string
}

// TODO: Add support for multiple test cases.
// Currently, writing the traces to a single file makes it not possible.
const tt: TestCase[] = [
  {
    desc: "behavior.trace.dummy",
    test: "testdata/dummy/index.test.ts",
    want: "testdata/dummy/behaviors.recorder.json"
  },
]

describe("recorder", () => {
  it.each(tt)("$desc", async (tc) => {
    // Programmatically runs Jest so the Recorder instruments itself.
    // Usually, when running the Recorder with Jest, we only get the tested code behavior.
    // With this workaround, we get the Recorder's behavior as well.
    await runJest([
        `--config=jest.recorder.config.js`,
        path.join(__dirname, tc.test)
    ])

    // Ensure there are no errors.
    const stderr = readFileSync(
      __filename.replace(/\.test\.ts$/, ".trace.err"),
      { encoding: "utf-8" }
    )
    expect(stderr).toBe("")

    // Cache the behaviors.
    await runBehaviorCacher([
      // TODO: Make this dynamic to support multiple test cases.
      path.join(process.cwd(), `behaviors.json`),
      __filename.replace(/\.test\.ts$/, ".trace.log"),
      path.join(__dirname, tc.test.replace(/\.test\.ts$/, ".trace.log"))
    ])

    // Compare behaviors.
    const got = readFileSync(
      path.join(process.cwd(), `behaviors.json`),
      { encoding: "utf-8" }
    )
    const want = readFileSync(
      path.join(__dirname, tc.want),
      { encoding: "utf-8" }
    )
    expect(got).toStrictEqual(want)
  })
})
