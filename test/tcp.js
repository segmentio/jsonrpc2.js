const { spy } = require('sinon')
const test = require('ava')
const net = require('net')
const Client = require('..')

test('call', async t => {
  const handleCall = spy((socket, data) => {
    data = JSON.parse(data)

    t.is(data.method, 'Foo.Bar')

    socket.write(JSON.stringify({
      id: data.id,
      jsonrpc: '2.0',
      result: 42
    }) + '\n')
  })

  const server = net.createServer(socket => {
    socket.on('data', handleCall.bind(null, socket))
  })

  server.listen(4003)

  const client = new Client('tcp://localhost:4003')
  const result = await client.call('Foo.Bar', { foo: 'bar' })

  t.true(handleCall.calledOnce)
  t.is(result, 42)

  await new Promise(resolve => server.close(resolve))
})

test('connection error', async t => {
  const client = new Client('tcp://not-found:23424')
  await t.throwsAsync(client.call('Foo.Bar', 12))
})
