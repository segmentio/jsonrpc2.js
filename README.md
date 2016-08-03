# @segment/jsonrpc2.js

> A [JSON-RPCv2](http://www.jsonrpc.org/specification) client.

[![Circle CI](https://circleci.com/gh/segmentio/jsonrpc2.js.svg?style=svg&circle-token=2f500aa32b45326a85290a0b005412a1b283f813)](https://circleci.com/gh/segmentio/jsonrpc2.js)

## API

### Client(addr, [opts])

Sets up a new JSON-RPC client for the given `addr`. (example: `http://localhost:3000/rpc`)
Available `opts`:
 - `timeout` the default timeout for requests (default: 10s)
 - `logger` optional logger for capturing request metrics

### Client#call(method, params, [options])

Calls the given `method` with the given `params`. (if not an array, it will be converted)

Available `options`:
 - `timeout` override the default client timeout
 - `async` use this when you don't need the answer back from the server (ie: it will set `id: null`)

## Developers

Run tests locally using `make test`.

Deploys happen automatically in CircleCI, so you only need to take the following steps when
making new releasees:

 - bump `version` in `package.json`
 - `git-changelog -t <version>`
 - `git-release <version>`
