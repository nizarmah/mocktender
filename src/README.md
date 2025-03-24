# mocktender/src

Guide for developers.

## Architecture

### Code transformation

For recording and replaying, we hijack file imports and transform them based on our needs.

Recorder wraps function definitions with a proxy that records the arguments and result.

Replayer replaces function implementations with stubs that replay the recorded behavior.

### Behavior caching

Recorder streams behavior logs into a file to avoid slowing down the tests.

The logs can then be transformed into data structures that match our needs.

At the moment, we only record:
1. Bridges: the code that connects integrations and units (eg. route handlers).

Other important behaviors that aren't supported yet:
1. Statefuls: the code that stores data (eg. repository)
1. Entrypoints: the code that starts the execution (eg. main)
1. TODO: add more

## Known issues

Search the codebase for `FIXME` and `TODO` to find known issues.

## Development

### Setup

1. Setup container.

    ```bash
    dc up mocktender
    dc run --rm mocktender sh
    ```

### Test

1. Test recorder.

    ```bash
    yarn test:record
    ```

1. Test replayer.

    ```bash
    yarn test:replay
    ```