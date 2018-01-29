'use strict'

const parseUrl = require('url').parse
const net = require('net')
const request = require('request')
const compose = require('koa-compose')
const debug = require('debug')('jsonrpc2')
const split = require('split2')
const once = require('once')
const uid = require('uid2')
const opentracing = require('opentracing')

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

    if (options.tracer) {
      this.annotateTrace = tracing({
        tracer: options.tracer
      })
    }

    this.logMiddleware = this.logMiddleware.bind(this)
    this.callMiddleware = this.callMiddleware.bind(this)

    this.rebuildMiddleware()
  }

  makeHTTPRequest (body, options, fn) {
    var requestOptions = {
      json: true,
      timeout: options.timeout || this.timeout,
      body
    }
    if (this.userAgent) {
      requestOptions.headers = { 'user-agent': this.userAgent }
    }

    requestOptions.uri = this.url
    var callback = function (err, res, body) {
      body = body || {}

      if (err) {
        debug('error %s: %s', options.id, err.message)
        return fn(err)
      }

      if (body.error && typeof body.error === 'object') {
        const err = new Error(body.error.message)
        err.code = body.error.code
        err.data = body.error.data

        debug('error %s: %s', options.id, err.message)
        return fn(err)
      }

      debug('success %s: %j', options.id, body.result || {})
      fn(null, body.result)
    }

    if (this.annotateTrace) {
      // TODO: is body.method valid in this scope?
      var annotated = this.annotateTrace('remote_rpc', requestOptions, callback)
      requestOptions = annotated.options
      callback = annotated.callback
    }
    request.post(requestOptions, callback)
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

// tracing takes a config and returns a function with the signature
// function(name, options, [callback]) result where the result has two
// attributes: the options and wrapped callback.  You must pass the
// callback into the next function.
function tracing (config) {
  const conf = config || {}
  const tracer = conf.tracer || opentracing.globalTracer()

  return function (name, options, func) {
    options.headers = options.headers || {}
    var spanOpts = {}
    if (options.span !== undefined) {
      spanOpts = {childOf: options.span.context()}
    }
    var span = tracer.startSpan(name, spanOpts)
    tracer.inject(span, opentracing.FORMAT_HTTP_HEADERS, options.headers)
    options.span = span
    return {
      options: options,
      callback: function () {
        span.finish()
        if (typeof func !== 'undefined') {
          func.apply(null, arguments)
        }
      }
    }
  }
}

module.exports = Client
