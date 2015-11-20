var debug = require('debug')('@segment/jsonrpc2');
var request = require('request');
var uid = require('uid2');

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
 * @return {Promise}
 */

Client.prototype.call = function(method, params) {
  var id = uid(16);

  var body = {
    method: method,
    params: params,
    id: id
  };

  debug('call %s(%s) :: %s', method, params, id);

  var opts = {
    json: true,
    method: 'POST',
    uri: this.addr,
    timeout: this.timeout,
    body: body
  };

  return new Promise(function(resolve, reject){
    request.post(opts, function(err, res, body){
      body = body || {}

      if (err) {
        debug('error for %s: %s', id, err.message)
        return reject(err);
      }
      if (body.error) {
        if (typeof body.error === 'object') {
          var err = new Error(body.error.message);
          err.code = body.error.code;
          err.data = body.error.data;
          debug('error for %s: %s', id, err.message)
          return reject(err);
        }

        if ('not found' != body.error) {
          debug('error for %s: %s', id, body.error)
          return reject(new Error(body.error));
        }
      }

      debug('success %s: %s', id, err.message)
      return resolve(body.result);
    });
  });
}
