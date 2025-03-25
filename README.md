# mocktender

> _Serves mocks._

Mocktender is a test tracer that automatically records code behavior and replays it later, simplifying tests and mocks.

For example, testing a create post resolver, traditionally I would:
1. Test the resolver with a DB stub.
1. Test the DB integration with fake input.
1. Test server integration with a resolver mock.

Using mocktender, I would only need to test the entrypoint (the server route). Then:
1. Mocktender records the behavior across the server, resolver, and DB.
1. Mocktender automatically isolates each to match traditional tests.

Check [`example`](./example#mocktenderexample).

## Early development

Only a proof of concept right now, but actively being developed.

If you need it, let me know — [nizar.mah99@gmail.com](mailto:nizar.mah99@gmail.com).
It can be reproduced in different languages.

## Objectives

1. Test a codebase through its entrypoints.
1. Eventually, only run codebase through tests.
1. One day, simulate e2e tests with unit tests.

## Technical guide

Check [`src`](./src#mocktendersrc).
