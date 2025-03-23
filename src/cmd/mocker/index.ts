import { main } from "./script.ts"

// Boots the mocker script.
main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
