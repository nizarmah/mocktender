# mocktender/example

Example usage of mocktender.

## Usage

The changes needed to use mocktender are minimal.

1. Add to your Jest config.
    * [`jest.recorder.config.js`](../jest.recorder.config.js)
    * [`jest.replayer.config.js`](../jest.replayer.config.js)

1. Tag your bridges. (see [`./handlers.ts`](./handlers.ts))

1. Test your entrypoint's behavior (see [`./server.test.ts`](./server.test.ts)).

## Run

You can run the example in a container.

1. Setup container.
    ```bash
    dc up mocktender
    ```

1. Run container.
    ```bash
    dc run --rm mocktender sh
    ```

1. Record behavior (inside container).
    ```bash
    yarn example:record
    ```
1. Replay behavior (inside container).
    ```bash
    yarn example:replay
    ```
