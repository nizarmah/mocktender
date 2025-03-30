import URL from "url"

import { greet } from "./utils.ts"

/** @bridge bridges the server request handler with the greet function */
export function helloHandler(url: string): { status: number; body: string } {
  const parsed = URL.parse(url, true)

  const name = Array.isArray(parsed.query.name)
    ? parsed.query.name[0]
    : parsed.query.name

  return {
    status: 200,
    body: greet(name)
  }
}
