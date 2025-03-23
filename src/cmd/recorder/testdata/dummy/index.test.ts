import { main } from "./index.ts"

describe("dummy", () => {
  it("should return a greeting", () => {
    expect(main()).toStrictEqual("Hello, world!")
  })
})
