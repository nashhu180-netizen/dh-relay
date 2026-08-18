import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import test from 'node:test'
import { apply as applyHost } from '../index.mjs'
import { buildBundle } from '../scripts/build.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const text = path => readFileSync(resolve(root, path), 'utf8')

function responseRecorder() {
  return {
    headers: {}, statusCode: 0, body: undefined,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value },
    end(body) { this.body = body },
  }
}

test('node half registers one disposable GET/HEAD route and no write method', () => {
  let route
  let disposed = false
  const snapshot = { schema_version: 'relay.pilot-snapshot/v1', list: {}, details: {} }
  const ctx = {
    relayPilot: { snapshot: () => snapshot },
    webServer: { register(value) { route = value; return () => { disposed = true } } },
    effect(factory) { this.dispose = factory() },
  }
  applyHost(ctx)
  assert.equal(route.kind, 'exact')
  assert.equal(route.path, '/relay-pilot/snapshot')
  const get = responseRecorder()
  route.handler({ method: 'GET' }, get)
  assert.equal(get.statusCode, 200)
  assert.deepEqual(JSON.parse(Buffer.from(get.body).toString('utf8')), snapshot)
  assert.equal(get.headers['cache-control'], 'no-store')
  const head = responseRecorder()
  route.handler({ method: 'HEAD' }, head)
  assert.equal(head.body, undefined)
  const post = responseRecorder()
  route.handler({ method: 'POST' }, post)
  assert.equal(post.statusCode, 405)
  ctx.dispose()
  assert.equal(disposed, true)
})

test('client grouping implementation has no run_status dependency', () => {
  const source = text('src/model.mjs')
  const body = source.slice(source.indexOf('export function groupRuns'), source.indexOf('export function groupingSignature'))
  assert.doesNotMatch(body, /run_status/)
})

test('package declares the rc.7 client discovery contract', () => {
  const manifest = JSON.parse(text('package.json'))
  assert.equal(manifest.exports['./client'], './lib/client.js')
  assert.equal(manifest.dsh.client.platform, 'web')
  assert.deepEqual(manifest.dsh.client.inject, ['@deepseek-ai/dsh-client-ui-sidebar'])
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(manifest.dependencies, undefined)
})

test('clean build is deterministic and produces a loadable module factory', () => {
  rmSync(resolve(root, 'lib'), { recursive: true, force: true })
  const first = buildBundle()
  const firstBody = text('lib/client.js')
  rmSync(resolve(root, 'lib'), { recursive: true, force: true })
  const second = buildBundle()
  const secondBody = text('lib/client.js')
  assert.equal(first.sha256, second.sha256)
  assert.equal(createHash('sha256').update(firstBody).digest('hex'), createHash('sha256').update(secondBody).digest('hex'))

  let registration
  const context = {
    window: { __ModuleLoader__: { load(value) { registration = value } } },
  }
  vm.runInNewContext(secondBody, context)
  assert.equal(registration.id, '@personal/dsh-relay-client')
  const React = {
    Fragment: Symbol('Fragment'), createElement() {}, useCallback: value => value,
    useEffect() {}, useMemo: value => value(), useRef: value => ({ current: value }),
    useState: value => [value, () => undefined],
  }
  const plugin = registration.factory(id => {
    if (id === 'react') return React
    throw new Error(`unexpected require ${id}`)
  })
  let registered
  plugin.apply({ slots: {
    inject(name, factory) { assert.equal(name, 'sidebar.footer.action'); factory() },
    register(options, component) { registered = { options, component }; return () => undefined },
  } })
  assert.equal(registered.options.id, 'relay-pilot')
  assert.equal(typeof registered.component, 'function')
})
