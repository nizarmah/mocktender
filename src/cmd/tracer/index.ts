import { TracerFactory } from "./factory.ts"

// Jest requires the factory to be a default export.
export default TracerFactory

// Export the config type for use in Jest config.
export type { Config } from "./types.ts"

// Export the default config for re-use in Jest config.
export { defaultConfig } from "./factory.ts"
