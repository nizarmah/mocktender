import http from "http"

import { helloHandler } from "./handlers.ts"

const requestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => {
  if (req.url?.startsWith("/hello")) {
    const { status, body } = helloHandler(req.url)
    res.writeHead(status, { 'Content-Type': 'text/plain' })
    res.end(body)
    return
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('Not Found')
}

export function createServer(): http.Server {
  return http.createServer(requestHandler)
}
