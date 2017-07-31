import {spy} from 'sinon'
import test from 'ava'
import Client from '..'

const createClient = options => new Client(`tcp://localhost`, options)

test('throw when middleware isn\'t a function', t => {
  const client = createClient()

  t.throws(() => client.use(), 'Expected middleware to be a function, got undefined')
})

test('pass context to the middleware and return result', async t => {
  const client = createClient()
  client.request = spy((body, options, callback) => callback(null, 'world'))

  const middleware = spy((context, next) => next())
  client.use(middleware)

  const res = await client.call('test', 'hello', { async: true })

  t.is(res, 'world')
  t.true(client.request.calledOnce)
  t.deepEqual(client.request.firstCall.args[0], {
    params: ['hello'],
    jsonrpc: '2.0',
    id: null,
    method: 'test'
  })

  t.deepEqual(client.request.firstCall.args[1], {
    async: true,
    forceArray: true
  })

  t.true(middleware.calledOnce)
  t.deepEqual(middleware.firstCall.args[0], {
    method: 'test',
    params: ['hello'],
    options: {
      async: true,
      forceArray: true
    },
    result: 'world'
  })
})

test('modify context', async t => {
  const client = createClient()
  client.request = spy((body, options, callback) => callback(null, body.params[0].message))

  const middleware = (context, next) => {
    context.params[0].message = 'bye'
    return next()
  }

  client.use(middleware)

  const res = await client.call('echo', { message: 'hello' }, { async: true })

  t.is(res, 'bye')
  t.true(client.request.calledOnce)
  t.deepEqual(client.request.firstCall.args[0], {
    params: [{ message: 'bye' }],
    jsonrpc: '2.0',
    id: null,
    method: 'echo'
  })
})

test('modify response', async t => {
  const client = createClient()
  client.request = spy((body, options, callback) => callback(null, body.params[0]))

  const middleware = async (context, next) => {
    await next()
    context.result = 'bye'
  }

  client.use(middleware)

  const res = await client.call('echo', 'hello')

  t.is(res, 'bye')
})

test('abort call', async t => {
  const client = createClient()
  client.request = spy()

  const middleware = async context => {
    context.result = 'bye'
  }

  client.use(middleware)

  const res = await client.call('echo', 'hello')

  t.is(res, 'bye')
  t.false(client.request.called)
})

test('error from call', async t => {
  const client = createClient()
  client.request = spy((body, options, callback) => callback(new Error('Oops')))

  const middleware = async (context, next) => {
    try {
      await next()
    } catch (err) {
      err.intercepted = true
      throw err
    }
  }

  client.use(middleware)

  const err = await t.throws(client.call('echo', 'hello'))

  t.is(err.message, 'Oops')
  t.true(err.intercepted)
})

test('error from middleware', async t => {
  const client = createClient()
  client.request = spy()

  const goodMiddleware = async (context, next) => {
    try {
      await next()
    } catch (err) {
      err.intercepted = true
      throw err
    }
  }

  const badMiddleware = async () => {
    throw new Error('Oops')
  }

  client.use(goodMiddleware)
  client.use(badMiddleware)

  const err = await t.throws(client.call('echo', 'hello'))

  t.is(err.message, 'Oops')
  t.true(err.intercepted)
  t.false(client.request.called)
})

test('log on success', async t => {
  const client = createClient()
  client.request = (body, options, callback) => callback(null, 'success')
  client.logger = spy()

  await client.call('test', { key: 'value' })

  t.true(client.logger.calledOnce)

  const data = client.logger.firstCall.args[0]

  t.is(typeof data.duration, 'number')
  t.true(data.duration > 0)
  t.deepEqual(data, {
    method: 'test',
    params: [{ key: 'value' }],
    duration: data.duration,
    result: 'success',
    error: null,
    addr: client.address
  })
})

test('log on error', async t => {
  const client = createClient()
  client.request = (body, options, callback) => callback(new Error('Oops'), null)
  client.logger = spy()

  const err = await t.throws(client.call('test', { key: 'value' }))

  t.is(err.message, 'Oops')
  t.true(client.logger.calledOnce)

  const data = client.logger.firstCall.args[0]

  t.is(typeof data.duration, 'number')
  t.true(data.duration > 0)
  t.deepEqual(data, {
    method: 'test',
    params: [{ key: 'value' }],
    duration: data.duration,
    result: null,
    error: new Error('Oops'),
    addr: client.address
  })
})
