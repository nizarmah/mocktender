# mocktender

Serves mocks.

## Development

1. Use NodeJS LTS.

    ```bash
    nvm use --lts
    ```

2. Install dependencies.

    ```bash
    yarn install
    ```

3. Record tests.

    ```bash
    yarn test:record
    # yarn test:record:dry-run
    ```

4. Replay tests.

    ```bash
    yarn test:replay
    ```
