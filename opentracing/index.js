const opentracing = require("opentracing")

// tracing takes a config and returns a function with the signature
// for koa middleware: function(context, next)
function tracing (config) {
  const conf = config || {}
  const tracer = conf.tracer || opentracing.globalTracer()

  return async function trace(context, next) {
    var options = context.options || {}
    options.headers = options.headers || {}
    var spanOpts = {}
    if (options.span !== undefined) {
      spanOpts = {childOf: options.span.context()}
    }
    const span = tracer.startSpan(name, spanOpts)
    tracer.inject(span, opentracing.FORMAT_HTTP_HEADERS, options.headers)
    options.span = span
    context.options = options
    await next()
    span.finish()
  }
}

module.exports = tracing
