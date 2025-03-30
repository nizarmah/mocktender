// @ts-expect-error: jest-circus/runner is not typed.
import defaultRunner from "jest-circus/runner"

import type {JestEnvironment} from '@jest/environment'
import type {TestResult} from '@jest/test-result'
import type {Config} from '@jest/types'
import type Runtime from 'jest-runtime'

declare global {
  // TestPath is the test-file path.
  // eslint-disable-next-line no-var
  var __testPath: string
}

export default function testRunner(
  globalConfig: Config.GlobalConfig,
  config: Config.ProjectConfig,
  environment: JestEnvironment,
  runtime: typeof Runtime,
  testPath: string,
): Promise<TestResult> {
  // TODO: Use a custom Runtime class to control transformer.
  // For now, this is much cheaper than using a custom Runtime.
  global.__testPath = testPath

  // Use Jest's default runner.
  return defaultRunner(
    globalConfig,
    config,
    environment,
    runtime,
    testPath
  )
}
