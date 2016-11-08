'use strict'

const url = require('url')
const net = require('net')
const request = require('request')
const debug = require('debug')('jsonrpc2')
const split = require('split2')
const once = require('once')
const uid = require('uid2')

const noop = () => {}

class Client {
  constructor(address, options) {
    options = options || {}

    this.timeout = options.timeout || 10000

    this.address = url.parse(address)
    this.address.port = this.address.port || 80
    
    if (this.address.protocol === 'tcp:') {
      this.request = this.makeTCPRequest.bind(this)
    } else {
      this.request = this.makeHTTPRequest.bind(this)
    }

    this.logger = options.logger || noop
  }

  makeHTTPRequest(body, options, fn) {
    const requestOptions = {
      json: true,
      method: 'POST',
      timeout: options.timeout || this.timeout,
      uri: url.format(this.address),
      body
    }

    request.post(requestOptions, function (err, res, body) {
      body = body || {}

      if (err) {
        debug('error for %s: %s', options.id, err.message)
        return fn(err)
      }

      if (body.error) {
        if (typeof body.error === 'object') {
          const e = new Error(body.error.message)
          e.code = body.error.code
          e.data = body.error.data
          debug('error for %s: %s', options.id, e.message)
          return fn(e)
        }

        // XXX: why do we do this?
        if (body.error !== 'not found') {
          debug('error for %s: %s', options.id, body.error)
          return fn(new Error(body.error))
        }
      }

      debug('success %s: %j', options.id, body.result || {})
      fn(null, body.result)
    })
  }

  makeTCPRequest(body, options, fn) {
    fn = once(fn)
    
    let response = null
    
    const socket = net.connect(this.address.port, this.address.hostname)
    socket.setTimeout(options.timeout || this.timeout)

    socket
      .on('error', fn)
      .pipe(split(JSON.parse))
      .on('data', data => {
        response = data
      })
      .on('end', () => {
        fn(null, response.result)
      })

    socket.write(JSON.stringify(body))
  }

  call(method, params, options) {
    options = options || {}
    
    const body = {
      params: Array.isArray(params) ? params : [params],
      jsonrpc: '2.0',
      id: options.async ? null : uid(16),
      method
    }
    
    return new Promise((resolve, reject) => {
      this.request(body, options, (err, result) => {
        if (err) {
          reject(err)
          return
        }
        
        resolve(result)
      })
    })
  }
}

module.exports = Client
