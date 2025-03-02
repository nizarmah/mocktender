import { main } from "./index.ts"

describe("index", () => {
  it("logs hello world", () => {
    jest.spyOn(console, "log")

    main()

    expect(console.log).toHaveBeenCalledWith("Hello world!")
  })
})
