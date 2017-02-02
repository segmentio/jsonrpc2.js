
'use strict'

/**
 * Module dependencies.
 */

var debug = require('debug')('jsonrpc2')
var request = require('request')
var uid = require('uid2')

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
  var self = this
  var id = options.async ? null : uid(16)
  var body = {
    method: method,
    params: Array.isArray(params) ? params : [ params ],
    id: id,
    jsonrpc: '2.0' // http://www.jsonrpc.org/specification
  }

  var opts = {
    json: true,
    method: 'POST',
    uri: this.addr,
    timeout: options.timeout || this.timeout,
    body: body
  }

  var startTime = new Date()
  return new Promise(function (resolve, reject) {
    self.request(opts, function (err, res) {
      var endTime = new Date()
      var duration = endTime - startTime
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
  var id = opts.id
  debug('request %j', opts.body)
  request.post(opts, function (err, res, body) {
    body = body || {}

    if (err) {
      debug('error for %s: %s', id, err.message)
      return fn(err)
    }

    if (body.error) {
      if (typeof body.error === 'object') {
        var e = new Error(body.error.message)
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
  this.logger({
    method: method,
    params: params,
    duration: duration,
    result: result,
    error: error,
    addr: this.addr
  })
}
