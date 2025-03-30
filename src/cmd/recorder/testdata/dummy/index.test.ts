import { createServer } from "./index.ts"

type TestCase = {
  desc: string
  url: string
  want: {
    status: number
    body: string
  }
}

const tt: TestCase[] = [
  {
    desc: "greeting.default",
    url: "/hello",
    want: {
      status: 200,
      body: "Hello, world!"
    }
  },
  {
    desc: "greeting.withName",
    url: "/hello?name=John",
    want: {
      status: 200,
      body: "Hello, John!"
    }
  },
  {
    desc: "greeting.notFound",
    url: "/not-found",
    want: {
      status: 404,
      body: "Not Found"
    }
  }
]

describe("dummy", () => {
  const server = createServer()

  beforeAll(() => {
    server.listen(8080)
  })

  afterAll(() => {
    server.close()
  })

  it.each(tt)("$desc", async (tc) => {
    const res = await fetch(`http://localhost:8080${tc.url}`)

    const gotStatus = res.status
    expect(gotStatus).toBe(tc.want.status)

    const gotBody = await res.text()
    expect(gotBody).toBe(tc.want.body)
  })
})
