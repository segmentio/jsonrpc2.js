import {post} from 'koa-route'
import json from 'koa-json-body'
import Koa from 'koa'

const app = new Koa()
app.use(json())

const api = {
  echo: body => body,
  error: () => {
    throw new Error('boom!')
  },
  sleep: ({params}) => {
    return new Promise((resolve) => {
      setTimeout(resolve, params[0].time)
    })
  },
  headers: (_, headers) => headers
}

app.use(post('/rpc', async function (ctx, next) {
  const { request: { body }, headers } = ctx
  const {id, method} = body

  const res = {
    jsonrpc: '2.0',
    id,
    error: null
  }

  try {
    res.result = await api[method](body, headers)
  } catch (e) {
    res.error = {
      message: e.toString(),
      code: e.code || 0,
      data: e.data || ''
    }
  }

  ctx.body = res
}))

export default app
