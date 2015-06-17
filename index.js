var request = require('request');
var uid = require('uid2');

/**
 * Exports.
 */

module.exports = Client;

/**
 * Client.
 */

function Client(addr) {
  this.addr = addr;
}

/**
 * Call rpc method with params.
 *
 * @param {String} method
 * @param {String} params
 * @return {Promise}
 */

Client.prototype.call = function(method, params) {
  var self = this;

  var req = {
    method: method,
    params: params,
    id: uid(16)
  };

  return new Promise(function(resolve, reject){
    request.post({
      uri: self.addr,
      method: 'POST',
      json: true,
      body: req
    }, function(err, res, body){
      err = err || body.error;
      if (err) return reject(err);
      resolve(body.result);
    });
  })
}
