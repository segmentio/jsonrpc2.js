# @segment/jsonrpc2.js

> A [JSON-RPCv2](http://www.jsonrpc.org/specification) client.

## API

### Client(addr, [opts])

Sets up a new JSON-RPC client for the given `addr`. (example: `http://localhost:3000/rpc`)
Available `opts`:
 - `timeout` the default timeout for requests (default: 10s)

### Client#call(method, params, [options])

Calls the given `method` with the given `params`. (make sure you set `params` as an array
of arguments)

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
