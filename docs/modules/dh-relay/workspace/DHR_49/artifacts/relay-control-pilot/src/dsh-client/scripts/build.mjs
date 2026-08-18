import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const id = '@personal/dsh-relay-client'
const readCanonical = path => readFileSync(path, 'utf8').replace(/\r\n?/g, '\n')

export function buildBundle() {
  const model = readCanonical(resolve(root, 'src/model.mjs')).replace(/^export\s+/gm, '')
  const panel = readCanonical(resolve(root, 'src/client/panel.cjs'))
  const body = [
    `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
    'var module = { exports: {} }; var exports = module.exports;',
    model,
    panel,
    'return module.exports;',
    '} });',
    '',
  ].join('\n')
  const out = resolve(root, 'lib/client.js')
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, body, 'utf8')
  return { path: out, sha256: createHash('sha256').update(body).digest('hex'), bytes: Buffer.byteLength(body) }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = buildBundle()
  process.stdout.write(`${JSON.stringify(result)}\n`)
}
