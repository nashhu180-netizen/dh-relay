export const inject = ['relayPilot', 'webServer']

function sendJson(res, statusCode, body, headOnly = false) {
  const encoded = Buffer.from(JSON.stringify(body), 'utf8')
  res.statusCode = statusCode
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.setHeader('content-length', String(encoded.length))
  res.end(headOnly ? undefined : encoded)
}

/**
 * Node half of the Client package: a read-only same-origin Pilot transport.
 * Production Relay RPC is intentionally out of scope; this route carries only
 * frozen fake Read Model JSON and is disposed with the plugin effect.
 */
export function apply(ctx, config = {}) {
  const path = typeof config.routePath === 'string' && config.routePath.startsWith('/')
    ? config.routePath
    : '/relay-pilot/snapshot'
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path,
    handler(req, res) {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.statusCode = 405
        res.setHeader('allow', 'GET, HEAD')
        res.end()
        return
      }
      sendJson(res, 200, ctx.relayPilot.snapshot(), req.method === 'HEAD')
    },
  }), 'relay-pilot-client: snapshot route')
}

export default apply
