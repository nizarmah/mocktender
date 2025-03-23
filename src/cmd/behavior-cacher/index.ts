import { runScript } from "./runScript.ts"

runScript(process.argv.slice(2))
  .then((outputPath) => {
    console.log("behavior cached at:", outputPath)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
