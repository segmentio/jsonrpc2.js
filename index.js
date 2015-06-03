var request = require('superagent');
var co = require('co');
var uid = require('uid2');

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
    request('POST', self.addr)
      .send(req)
      .set({ 'Content-Type': 'application/json'})
      .end(function(err, res){
        if (err) return reject(err);
        resolve(res.body.result);
      });
  })
}
