/** @type {import('jest').Config} */
const commonConfig = {
  // Disable caching, so transformer updates are reflected.
  cache: false,

  // Detect open handles in tests.
  detectOpenHandles: true,
}

export default commonConfig
