
var assert = require('assert')
var http = require('http')
var Client = require('./')

describe('jsonrpc2', function() {
  var app = null;
  var port = null;

  before(function(done) {
    app = http.createServer(function(req, res) {
      console.log('requests')
      res.writeHead(200, { 'content-type': 'text/plain' })
      res.end('yo')
    });
    app.listen(function() {
      port = app.address().port;
      done()
    })
  });

  after(function(done) {
    app.close(done)
  })

  it('should not explode', function*() {
    var client = new Client('http://localhost:' + port + '/rpc')
    yield client.call('something', [{ foo: 'bar' }]);
  });
})
