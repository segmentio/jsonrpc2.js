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
  var body = { 
    method: method,
    params: params,
    id: uid(16)
  };

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
        return reject(err);
      }
      if (body.error && 'not found' != body.error) {
        return reject(new Error(body.error));
      }

      return resolve(body.result);
    });
  });
}
