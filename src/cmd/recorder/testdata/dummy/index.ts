import http from 'http'
import URL from 'url'

function greet(name: string = "world") {
  return `Hello, ${name}!`
}

/** @bridge bridges the server request handler with the greet function */
export function helloHandler(url: string): { status: number; body: string } {
  const parsed = URL.parse(url, true);

  const name = Array.isArray(parsed.query.name)
    ? parsed.query.name[0]
    : parsed.query.name

  return {
    status: 200,
    body: greet(name)
  }
}

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
