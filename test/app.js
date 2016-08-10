
/* eslint-env mocha */

'use strict'

/**
 * Module dependencies.
 */

const koa = require('koa')
const post = require('koa-route').post
const json = require('koa-json-body')

/**
 * RPC methods.
 */

const api = {
  echo: function * (body) {
    return body
  },
  error: function * () {
    throw new Error('boom!')
  },
  sleep: function (body) {
    const params = body.params
    const time = params[0].time
    return function (done) {
      setTimeout(done, time)
    }
  }
}

/**
 * Create/export "app".
 */

const app = module.exports = koa()

app.use(json())
app.use(post('/rpc', rpc))

/**
 * Super lame RPC implementation.
 */

function * rpc () {
  const body = this.request.body
  const id = body.id
  const method = body.method

  const res = {
    jsonrpc: '2.0',
    id
  }

  // call
  try {
    res.result = yield api[method](body)
  } catch (e) {
    res.error = {
      message: e.toString(),
      code: e.code || 0,
      data: e.data || ''
    }
  }

  this.body = res
}
