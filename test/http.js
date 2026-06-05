const http = require('http')
const test = require('ava')
const Client = require('..')
const app = require('./_app')

let server
let address

test.before(t => {
  return new Promise(resolve => {
    server = http.createServer(app)
    server.listen(() => {
      const port = server.address().port
      address = `http://localhost:${port}/rpc`

      resolve()
    })
  })
})

test.after(t => {
  return new Promise(resolve => {
    server.close(resolve)
  })
})

test('generate a unique id', async t => {
  const client = new Client(address)
  const resA = await client.call('echo', true)
  const resB = await client.call('echo', true)

  t.is(typeof resA.id, 'string')
  t.is(typeof resB.id, 'string')
  t.true(resA.id.length > 0)
  t.true(resB.id.length > 0)
  t.not(resA.id, resB.id)
})

test('call the correct method', async t => {
  const client = new Client(address)
  const res = await client.call('echo', true)
  t.is(res.method, 'echo')
})

test('send params', async t => {
  const client = new Client(address)
  const res = await client.call('echo', [true])
  t.deepEqual(res.params, [true])
})

test('send params and wrap in an array', async t => {
  const client = new Client(address)
  const res = await client.call('echo', true)
  t.deepEqual(res.params, [true])
})

test('send params without wrapping in an array', async t => {
  const client = new Client(address)
  const res = await client.call('echo', true, { forceArray: false })
  t.true(res.params)
})

test('send userAgent in request header', async t => {
  const client = new Client(address, { userAgent: 'test/1.0' })
  const res = await client.call('headers', true)
  t.is(res['user-agent'], 'test/1.0')
})

test('throw when request fails', async t => {
  const client = new Client(address)
  await t.throwsAsync(client.call('error', []))
})

test('timeout', async t => {
  const client = new Client(address, { timeout: 50 })
  const err = await t.throwsAsync(client.call('sleep', { time: 100 }))
  t.is(err.code, 'ESOCKETTIMEDOUT')
})

test('per-request timeout', async t => {
  const client = new Client(address)
  const err = await t.throwsAsync(client.call('sleep', { time: 100 }, { timeout: 50 }))
  t.is(err.code, 'ESOCKETTIMEDOUT')
})

test('send empty id on async request', async t => {
  const client = new Client(address)
  const res = await client.call('echo', [], { async: true })
  t.is(res.id, null)
})
