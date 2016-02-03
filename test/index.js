
'use strict';

const assert = require('assert');
const http = require('http');
const app = require('./app');
const Client = require('..');

describe('jsonrpc2', function() {
  let server = null;
  let client = null;

  before(function(done) {
    server = http.createServer(app.callback());
    server.listen(function(err) {
      if (err) return done(err);
      const port = server.address().port;
      client = new Client(`http://localhost:${port}/rpc`);
      done();
    });
  });

  after(function(done) {
    server.close(done);
  });

  it('should not explode', function*() {
    yield client.call('echo', [{ foo: 'bar' }]);
  });

  it('should generate a unique id', function*() {
    const res = yield client.call('echo', [ true ]);
    assert(res.id);
  });

  it('should call the correct method', function*() {
    const res = yield client.call('echo', [ true ]);
    assert.equal(res.method, 'echo');
  });

  it('should pass `params`', function*() {
    const res = yield client.call('echo', [ true ]);
    assert.deepEqual(res.params, [ true ]);
  });

  describe('when the request fails', function() {
    it('should throw', function*() {
      let err = null;
      try {
        yield client.call('error', []);
      } catch (e) {
        err = e;
      }
      assert(err);
    });
  });

  describe('when the request times out', function() {
    it('should error', function*() {
      const c = new Client(client.addr, { timeout: 50 });
      let err = null;
      try {
        yield c.call('sleep', [{ time: 100 }]);
      } catch (e) {
        err = e;
      }
      assert(err);
      assert.equal(err.code, 'ETIMEDOUT');
    });
  });
});
