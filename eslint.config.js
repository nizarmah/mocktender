import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"


/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,ts}"]},
  // Ignore dist and node_modules.
  {ignores: ["dist/**", "node_modules/**"]},
  {languageOptions: { globals: globals.node }},
  pluginJs.configs.recommended,
  // TS support.
  ...tseslint.configs.recommended,
  {
    rules: {
      // No semicolons.
      semi: ["error", "never"]
    },
  }
]
