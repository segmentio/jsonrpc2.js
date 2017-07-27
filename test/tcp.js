/* eslint-env mocha */

'use strict'

const net = require('net')
const assert = require('assert')
const Client = require('..')

describe('jsonrpc2 (tcp)', function () {
  it.only('should work', function * () {
    let called = false

    const server = net.createServer(socket => {
      socket.on('data', function (buf) {
        const json = JSON.parse(buf)

        assert.equal(json.method, 'Foo.Bar')
        called = true

        socket.write(JSON.stringify({
          id: json.id,
          jsonrpc: '2.0',
          result: 42
        }) + '\n')
      })
    })

    server.listen(4003)

    const client = new Client('tcp://localhost:4003/rpc')
    const result = yield client.call('Foo.Bar', { foo: 'bar' })
    assert(called, 'called the method')
    assert.equal(result, 42)
  })

  it('should handle connection errors', function * () {
    let error = null
    const client = new Client('tcp://sldkfjsdflksdfjsdklfjssdlfj:23423')
    try {
      yield client.call('Foo.Bar', 12)
    } catch (e) {
      error = e
    }
    assert(error)
  })
})
