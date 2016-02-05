
'use strict';

/**
 * Module dependencies.
 */

const debug = require('debug')('jsonrpc2');
const request = require('request');
const uid = require('uid2');

/**
 * Exports.
 */

module.exports = Client;

/**
 * Client.
 *
 * @param {String} addr
 * @param {Object} opts
 * @param {Number} [opts.timeout]
 */

function Client(addr, opts) {
  opts = opts || {};
  this.addr = addr;
  this.timeout = opts.timeout || 30000;
}

/**
 * Call rpc method with params.
 *
 * @param {String} method
 * @param {String} params
 * @return {Function} thunk
 */

Client.prototype.call = function(method, params) {
  const id = uid(16);
  const body = {
    method: method,
    params: params,
    id: id,
    jsonrpc: '2.0' // http://www.jsonrpc.org/specification
  };

  const opts = {
    json: true,
    method: 'POST',
    uri: this.addr,
    timeout: this.timeout,
    body: body
  };

  return new Promise(function(resolve, reject) {
    debug('request %j', body);
    request.post(opts, function(err, res, body) {
      body = body || {};

      if (err) {
        debug('error for %s: %s', id, err.message);
        return reject(err);
      }

      if (body.error) {
        if (typeof body.error === 'object') {
          const e = new Error(body.error.message);
          e.code = body.error.code;
          e.data = body.error.data;
          debug('error for %s: %s', id, e.message);
          return reject(e);
        }

        // XXX: why do we do this?
        if (body.error != 'not found') {
          debug('error for %s: %s', id, body.error);
          return reject(new Error(body.error));
        }
      }

      debug('success %s: %j', id, body.result || {});
      return resolve(body.result);
    });
  });
};
