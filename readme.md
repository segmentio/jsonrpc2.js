# @segment/jsonrpc2.js [![Circle CI](https://circleci.com/gh/segmentio/jsonrpc2.js.svg?style=svg&circle-token=2f500aa32b45326a85290a0b005412a1b283f813)](https://circleci.com/gh/segmentio/jsonrpc2.js)

> A [JSON-RPCv2](http://www.jsonrpc.org/specification) client.

## Install

```sh
yarn add @segment/jsonrpc2
```

## API

### new Client(address, [options])

Sets up a new JSON-RPC client for the given `addr`. (example: `http://localhost:3000/rpc`)

#### options

##### timeout

Type: `number`<br>
Default: `10000`

Request timeout (in milliseconds).

##### logger

Type: `function`

Optional logger for capturing request metrics.

### Instance

#### call(method, [params], [options])

Calls the given `method` with the given `params`. (if not an array, it will be converted)

##### method

Type: `string`

Method to call on the server.

##### params

Type: `object`

Params to pass to the method.

##### options

###### timeout

Type: `number`

Override the default client timeout.

###### async

Type: `boolean`<br>
Default: `false`

Enable when you don't need the answer back from the server (ie: it will set `id: null`).

###### forceArray

Type: `boolean`<br>
Default: `true`

Enable when you want the request params to be converted to an array.

#### use(middleware)

Adds a custom middleware to the stack, allowing to customize input and even result, intercept calls or abort them completely.

##### middleware

Type: `function`

Middleware is a function that accepts these arguments:

- `context` object which contains all data related to the current call
  - `method` method to call
  - `params` params (input) of the call
  - `options` options passed to `call()`
  - `result` response from the server (equals to `null` before server answers)
- `next` call next middleware in the stack, returns a promise

Here's an example middleware to measure call time:

```js
client.use(async (context, next) => {
  const startTime = new Date()
  await next()
  const duration = new Date() - startTime

  console.log(`${context.method} spent ${duration}ms`)
})

await client.call('echo', 'Hello World')
//=> "echo spent 2ms"
```


## License

MIT &copy; 2017 Segment Inc. \<friends@segment.com\>
