import {post} from 'koa-route'
import json from 'koa-json-body'
import koa from 'koa'

const app = koa()
app.use(json())

const api = {
  echo: body => body,
  error: () => {
    throw new Error('boom!')
  },
  sleep: ({params}) => {
    return done => {
      setTimeout(done, params[0].time)
    }
  },
  headers: (_, headers) => headers
}

app.use(post('/rpc', function * () {
  const { body, headers } = this.request
  const {id, method} = body

  const res = {
    jsonrpc: '2.0',
    id
  }

  try {
    res.result = yield api[method](body, headers)
  } catch (e) {
    res.error = {
      message: e.toString(),
      code: e.code || 0,
      data: e.data || ''
    }
  }

  this.body = res
}))

export default app
