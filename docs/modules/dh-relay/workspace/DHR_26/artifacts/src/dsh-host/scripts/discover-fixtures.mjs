import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, join, basename } from 'node:path'
import { DETAIL_SCHEMA, LIST_SCHEMA } from '../fixture-store.js'

function parseArgs(argv) {
  const result = {}
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]
    const value = argv[index + 1]
    if (!key?.startsWith('--') || value === undefined) throw new Error('usage: --root <dir> --out <file>')
    result[key.slice(2)] = value
  }
  return result
}

const args = parseArgs(process.argv.slice(2))
if (!args.root || !args.out) throw new Error('usage: --root <dir> --out <file>')
const root = resolve(args.root)
const entries = (await readdir(root, { withFileTypes: true }))
  .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
  .map(entry => join(root, entry.name))
  .sort()

const candidates = { detail: [], list: [] }
for (const path of entries) {
  try {
    const value = JSON.parse(await readFile(path, 'utf8'))
    if (value?.schema_version === DETAIL_SCHEMA) candidates.detail.push(path)
    if (value?.schema_version === LIST_SCHEMA) candidates.list.push(path)
  } catch {
    // Bad fixtures are expected in other directories; ignore unreadable files here.
  }
}

function choose(paths, preferredNames, label) {
  for (const preferred of preferredNames) {
    const hit = paths.find(path => basename(path).toLowerCase() === preferred)
    if (hit) return hit
  }
  if (paths.length === 0) throw new Error(`no ${label} fixture found under ${root}`)
  return paths[0]
}

const selection = {
  fixture_root: root,
  detail_fixture: choose(candidates.detail, ['run-basic.json', 'run-chinese.json'], 'detail'),
  list_fixture: choose(candidates.list, ['runs-active.json'], 'list'),
  candidates,
}
await writeFile(resolve(args.out), `${JSON.stringify(selection, null, 2)}\n`, 'utf8')
process.stdout.write(`${JSON.stringify(selection)}\n`)
