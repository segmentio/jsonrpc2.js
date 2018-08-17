import express from 'express'

function asyncMiddleware (fn) {
  return (req, res, next) => {
    return fn(req, res, next).catch(next)
  }
}

const app = express()
app.use(express.json())

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

app.post('/rpc', asyncMiddleware(async function (req, res) {
  const { body, headers } = req
  const {id, method} = body

  const responseBody = {
    jsonrpc: '2.0',
    id,
    error: null
  }

  try {
    responseBody.result = await api[method](body, headers)
  } catch (e) {
    responseBody.error = {
      message: e.toString(),
      code: e.code || 0,
      data: e.data || ''
    }
  }

  res.json(responseBody)
}))

export default app
