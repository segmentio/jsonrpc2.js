
'use strict'

/**
 * Module dependencies.
 */

const debug = require('debug')('jsonrpc2')
const request = require('request')
const uid = require('uid2')

/**
 * Exports.
 */

module.exports = Client

/**
 * Client.
 *
 * @param {String} addr
 * @param {Object} opts
 * @param {Number} [opts.timeout]
 * @param {Function} [opts.logger]
 */

function Client (addr, opts) {
  opts = opts || {}
  this.addr = addr
  this.timeout = opts.timeout || 10000
  this.logger = opts.logger || function () {}
}

/**
 * Call rpc method with params.
 *
 * @param {String} method
 * @param {String} params
 * @return {Promise}
 */

Client.prototype.call = function (method, params, options) {
  if (!options) options = {}
  const self = this
  const id = options.async ? null : uid(16)
  const body = {
    method: method,
    params: Array.isArray(params) ? params : [ params ],
    id: id,
    jsonrpc: '2.0' // http://www.jsonrpc.org/specification
  }

  const opts = {
    json: true,
    method: 'POST',
    uri: this.addr,
    timeout: options.timeout || this.timeout,
    body: body
  }

  const startTime = new Date()
  return new Promise(function (resolve, reject) {
    self.request(opts, function (err, res) {
      const endTime = new Date()
      const duration = endTime - startTime
      self.log(method, params, duration, res, err)

      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

/**
 * Make the request.
 *
 * @param {Object} opts
 * @param {Function} fn
 * @api private
 */

Client.prototype.request = function (opts, fn) {
  const id = opts.id
  debug('request %j', opts.body)
  request.post(opts, function (err, res, body) {
    body = body || {}

    if (err) {
      debug('error for %s: %s', id, err.message)
      return fn(err)
    }

    if (body.error) {
      if (typeof body.error === 'object') {
        const e = new Error(body.error.message)
        e.code = body.error.code
        e.data = body.error.data
        debug('error for %s: %s', id, e.message)
        return fn(e)
      }

      // XXX: why do we do this?
      if (body.error !== 'not found') {
        debug('error for %s: %s', id, body.error)
        return fn(new Error(body.error))
      }
    }

    debug('success %s: %j', id, body.result || {})
    fn(null, body.result)
  })
}

/**
 * Log the request via `this.logger`
 *
 * @param {String} method
 * @param {Mixed} params
 * @param {Number} duration
 * @param {Mixed} result
 * @param {Error|null} error
 * @api private
 */

Client.prototype.log = function (method, params, duration, result, error) {
  this.logger({ method, params, duration, result, error, addr: this.addr })
}
