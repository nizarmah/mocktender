import { readFileSync } from "node:fs"
import { helloHandler, handleHello } from "./handlers.ts"
import path from "node:path"

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
    global.__rid = tc.desc

    expect(tc.steps.length).toBeGreaterThan(0)

    for (const step of tc.steps) {
      // FIXME: Refer to `handlers.ts`.
      // const got = helloHandler(tc.url)
      const got = handleHello(...step.args as [string])

      expect(got).toStrictEqual(step.result)
    }
  })
})