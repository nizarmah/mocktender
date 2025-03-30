import { createServer } from "./server.ts"

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

// This test runs as both: end to end, and isolated integration test.
// Test the behavior, record it, and then replay it.
// Replaying the test is great for CI and isolating fixtures.
describe("example", () => {
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
