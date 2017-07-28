'use strict'

const parseUrl = require('url').parse
const net = require('net')
const request = require('request')
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
  }

  makeHTTPRequest (body, options, fn) {
    const requestOptions = {
      json: true,
      timeout: options.timeout || this.timeout,
      body
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

  call (method, params, options) {
    options = Object.assign({
      forceArray: true
    }, options)

    const forceArray = options.forceArray && !Array.isArray(params)

    const body = {
      params: forceArray ? [params] : params,
      jsonrpc: '2.0',
      id: options.async ? null : uid(16),
      method
    }

    return new Promise((resolve, reject) => {
      const startTime = new Date()

      this.request(body, options, (err, result) => {
        const duration = new Date() - startTime
        this.log(method, params, duration, result, err)

        if (err) {
          reject(err)
          return
        }

        resolve(result)
      })
    })
  }

  log (method, params, duration, result, error) {
    this.logger({
      method,
      params,
      duration,
      result,
      error,
      addr: this.address
    })
  }
}

module.exports = Client
