import { readFileSync } from "node:fs"
import path from "node:path"

import { helloHandler } from "./handlers.ts"
import * as utils from "./utils.ts"

type TestCase = {
  desc: string
  steps: {
    args: string[]
    result: unknown
  }[]
}

// TODO: Automatically generate these test cases.
// For now, it's written manually for prototyping.
describe("handlers.replay", () => {
  const json = readFileSync(
    process.env.BEHAVIOR_CACHE ?? path.join(__dirname, "behaviors.json"),
    { encoding: "utf-8" }
  )

  const behaviors = eval(`(${json})`)[__filename.replace(/\.test\.ts$/, ".ts")][helloHandler.name]

  const tt = Object.entries<TestCase['steps']>(behaviors)
    .map(([desc, arr]) => ({
      desc,
      steps: arr.map(({ args, result }) => ({
        args,
        result
      }))
    }))

  it.each(tt)("$desc", (tc) => {
    expect(tc.steps.length).toBeGreaterThan(0)

    for (const step of tc.steps) {
      const got = helloHandler(...step.args as [string])

      expect(got).toStrictEqual(step.result)
    }
  })

  // Ensures that the bridge is not mocked during replay.
  // This is only for demo purposes.
  it('does call greet', () => {
    const greetSpy = jest.spyOn(utils, "greet")

    helloHandler("/hello?name=John")

    expect(greetSpy).toHaveBeenCalledWith("John")
  })
})