/* eslint-env mocha */

'use strict'

const mitm = require('mitm')
const assert = require('assert')
const Client = require('..')

describe('jsonrpc2 (tcp)', function () {
  let mock = null

  beforeEach(function () {
    mock = mitm()
  })

  afterEach(function () {
    mock.disable()
  })

  it('should work', function * () {
    let called = false

    mock.on('connection', function (socket) {
      socket.on('data', function (buf) {
        const json = JSON.parse(buf)

        assert.equal(json.method, 'Foo.Bar')
        called = true

        socket.write(JSON.stringify({
          id: json.id,
          jsonrpc: '2.0',
          result: 42
        }))

        socket.destroy()
      })
    })

    const client = new Client('tcp://localhost:4003/rpc')
    const result = yield client.call('Foo.Bar', { foo: 'bar' })
    assert(called, 'called the method')
    assert.equal(result, 42)
  })

  it('should handle connection errors', function * () {
    mock.disable()

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
