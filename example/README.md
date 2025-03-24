# mocktender/example

Example usage of `mocktender`.

## Setup

1. Start container.
    ```bash
    dc up mocktender
    dc run --rm mocktender sh
    ```

## Usage

1. Jest config.
    * [`jest.common.config.js`](../jest.common.config.js)
    * [`jest.recorder.config.js`](../jest.recorder.config.js)
    * [`jest.replayer.config.js`](../jest.replayer.config.js)

1. Tag your bridges.
    * [`./handlers.ts`](./handlers.ts)

1. Record behavior.
    ```bash
    yarn example:record
    ```

1. Replay behavior.
    ```bash
    yarn example:replay
    ```
