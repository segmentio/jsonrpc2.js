var request = require('superagent');
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
    request
      .post(self.addr)
      .send(req)
      .set({ 'Content-Type': 'application/json'})
      .end(function(err, res){
        if (err) return reject(err);
        resolve(res.body.result);
      });
  })
}
