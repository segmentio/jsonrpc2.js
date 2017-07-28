/* eslint-env mocha */

'use strict'

const parseUrl = require('url').parse
const assert = require('assert')
const http = require('http')
const app = require('./app')
const Client = require('..')

describe('jsonrpc2 (http)', function () {
  let server = null
  let client = null
  let address = null

  before(function (done) {
    server = http.createServer(app.callback())
    server.listen(function (err) {
      if (err) return done(err)
      const port = server.address().port
      address = `http://localhost:${port}/rpc`
      client = new Client(address)
      done()
    })
  })

  after(function (done) {
    server.close(done)
  })

  it('should not explode', function * () {
    yield client.call('echo', [{ foo: 'bar' }])
  })

  it('should generate a unique id', function * () {
    const res = yield client.call('echo', [ true ])
    assert(res.id)
  })

  it('should call the correct method', function * () {
    const res = yield client.call('echo', [ true ])
    assert.equal(res.method, 'echo')
  })

  it('should pass `params`', function * () {
    const res = yield client.call('echo', [ true ])
    assert.deepEqual(res.params, [ true ])
  })

  it('should allow a non-array for a single param', function * () {
    const res = yield client.call('echo', true)
    assert.deepEqual(res.params, [ true ])
  })

  describe('when the request fails', function () {
    it('should throw', function * () {
      let err = null
      try {
        yield client.call('error', [])
      } catch (e) {
        err = e
      }
      assert(err)
    })
  })

  describe('when the request times out', function () {
    it('should error', function * () {
      const c = new Client(address, { timeout: 50 })
      let err = null
      try {
        yield c.call('sleep', [{ time: 100 }])
      } catch (e) {
        err = e
      }
      assert(err)
      assert.equal(err.code, 'ESOCKETTIMEDOUT')
    })

    it('should support per-request timeout', function * () {
      const c = new Client(address)
      let err = null
      try {
        yield c.call('sleep', [{ time: 100 }], { timeout: 50 })
      } catch (e) {
        err = e
      }
      assert(err)
      assert.equal(err.code, 'ESOCKETTIMEDOUT')
    })
  })

  describe('async requests', function () {
    it('should send a null id', function * () {
      const c = new Client(address)
      const res = yield c.call('echo', [], { async: true })
      assert.strictEqual(res.id, null)
    })
  })

  describe('when given `options.forceArray`', function () {
    it('should not transform params to array if false', function * () {
      const c = new Client(address)
      const res = yield c.call('echo', { hello: 'world' }, { forceArray: false })
      assert.deepEqual(res.params, { hello: 'world' })
    })
  })

  it('should log', function * () {
    let called = false
    const logger = options => {
      called = true
      assert.equal(options.method, 'echo')
      assert.deepEqual(options.params, { hello: 'world' })
      assert(options.duration > 0)
      assert.deepEqual(options.result.params, [{ hello: 'world' }])
      assert.equal(options.result.method, 'echo')
      assert.equal(options.result.jsonrpc, '2.0')
      assert(options.result.id.length > 0)
      assert.equal(options.error, null)
      assert.deepEqual(options.addr, parseUrl(address))
    }

    const c = new Client(address, { logger })
    yield c.call('echo', { hello: 'world' })
    assert.equal(called, true)
  })
})
