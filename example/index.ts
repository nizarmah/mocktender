import { createServer } from "./server.ts"

const server = createServer()

server.listen(3000)

console.log('server is running on port 3000')
