'use strict'

const parseUrl = require('url').parse
const net = require('net')
const request = require('request')
const compose = require('koa-compose')
const debug = require('debug')('jsonrpc2')
const split = require('split2')
const once = require('once')
const uid = require('uid2')

const noop = () => {}

class Client {
  constructor (url, options) {
    options = options || {}

    this.address = parseUrl(url)
    this.hostname = this.address.hostname
    this.url = url
    this.port = this.address.port || 80

    if (this.address.protocol === 'tcp:') {
      this.request = this.makeTCPRequest.bind(this)
    } else {
      this.request = this.makeHTTPRequest.bind(this)
    }

    this.timeout = options.timeout || 10000
    this.logger = options.logger || noop
    this.userAgent = options.userAgent || null
    this.middleware = []

    this.logMiddleware = this.logMiddleware.bind(this)
    this.callMiddleware = this.callMiddleware.bind(this)

    this.rebuildMiddleware()
  }

  makeHTTPRequest (body, options, fn) {
    const requestOptions = {
      json: true,
      timeout: options.timeout || this.timeout,
      body
    }
    if (this.userAgent) {
      requestOptions.headers = { 'user-agent': this.userAgent }
    }

    request.post(this.url, requestOptions, (err, res, body) => {
      body = body || {}

      if (err) {
        debug('error %s: %s', options.id, err.message)
        return fn(err)
      }

      if (typeof body.error === 'object') {
        const err = new Error(body.error.message)
        err.code = body.error.code
        err.data = body.error.data

        debug('error %s: %s', options.id, err.message)
        return fn(err)
      }

      debug('success %s: %j', options.id, body.result || {})
      fn(null, body.result)
    })
  }

  makeTCPRequest (body, options, fn) {
    fn = once(fn)

    let response = {}

    const socket = net.connect(this.port, this.hostname)
    socket.setTimeout(options.timeout || this.timeout)

    socket
      .on('error', fn)
      .pipe(split(JSON.parse))
      .on('data', data => {
        response = data
        socket.end()
      })
      .on('end', () => {
        fn(null, response.result)
      })

    socket.write(JSON.stringify(body))
  }

  use (middleware) {
    if (typeof middleware !== 'function') {
      throw new TypeError(`Expected middleware to be a function, got ${typeof middleware}`)
    }

    this.middleware.push(middleware)
    this.rebuildMiddleware()
  }

  rebuildMiddleware () {
    this.exec = compose([].concat(
      this.logMiddleware,
      this.middleware,
      this.callMiddleware
    ))
  }

  call (method, params, options) {
    options = Object.assign({
      forceArray: true
    }, options)

    const forceArray = options.forceArray && !Array.isArray(params)

    const context = {
      method,
      params: forceArray ? [params] : params,
      options,
      result: null
    }

    return this.exec(context).then(() => context.result)
  }

  callMiddleware (context) {
    const method = context.method
    const params = context.params
    const options = context.options

    const body = {
      jsonrpc: '2.0',
      id: options.async ? null : uid(16),
      params,
      method
    }

    return new Promise((resolve, reject) => {
      this.request(body, options, (err, result) => {
        if (err) {
          reject(err)
          return
        }

        context.result = result
        resolve()
      })
    })
  }

  logMiddleware (context, next) {
    const startTime = new Date()

    const log = err => {
      const duration = new Date() - startTime

      this.logger({
        method: context.method,
        params: context.params,
        duration,
        result: context.result,
        error: err || null,
        addr: this.address
      })

      if (err) {
        return Promise.reject(err)
      }
    }

    return next()
      .then(log)
      .catch(log)
  }
}

module.exports = Client
