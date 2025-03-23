import { run as runJest } from "jest"
import path from "node:path"

import * as instrumenter from "../../pkg/instrumenter/monkeypatch.ts"

describe("replayer", () => {
  it("uses mocked recorder-dummy behaviors", async () => {
    global.__rid = "recorder-dummy"

    const spyInstrument = jest.spyOn(instrumenter, "instrument")

    // The replayer transformer from the parent context mocks
    // the recorder transformer's behavior spawned below.
    await runJest([
      "--config=jest.recorder.config.js",
      path.join(process.cwd(), "src/cmd/recorder/testdata/dummy/index.test.ts")
    ])

    // So, we expect the bridge `instrumentSource` to be mocked
    // and the internal implementation `instrument` not to be called.
    expect(spyInstrument).toHaveBeenCalledTimes(0)
  })

  // TODO: Add tests for valid/invalid behaviors.
})
