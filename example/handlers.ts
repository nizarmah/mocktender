import URL from "url"

function greet(name: string = "world") {
  return `Hello, ${name}!`
}

// FIXME: This is a hacky implementation and will be removed asap.
// Right now, helloHandler gets mocked in both situations:
// - when running the server tests (integration tests) — which is great
// - when running its own tests (unit tests) — which is bad
// So, to avoid the second case, we duplicate the bridge function.
/** @bridge bridges the server request handler with the greet function */
export function helloHandler(url: string): { status: number; body: string } {
  return handleHello(url)
}

// TODO: Remove this function once bridge mocking is fixed.
export function handleHello(url: string): { status: number; body: string } {
  const parsed = URL.parse(url, true)

  const name = Array.isArray(parsed.query.name)
    ? parsed.query.name[0]
    : parsed.query.name

  return {
    status: 200,
    body: greet(name)
  }
}
