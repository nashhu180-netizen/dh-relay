import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

function parseArgs(argv) {
  const result = {}
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]
    const value = argv[index + 1]
    if (!key?.startsWith('--') || value === undefined) throw new Error('invalid arguments')
    result[key.slice(2)] = value
  }
  return result
}

const args = parseArgs(process.argv.slice(2))
for (const required of ['before', 'after', 'out']) if (!args[required]) throw new Error(`missing --${required}`)
const before = JSON.parse(await readFile(resolve(args.before), 'utf8'))
const after = JSON.parse(await readFile(resolve(args.after), 'utf8'))
const toMap = snapshot => new Map(snapshot.packages.map(item => [`${item.name}\u0000${item.path}`, item]))
const beforeMap = toMap(before)
const afterMap = toMap(after)
const added = []
const removed = []
const changed = []
for (const [key, item] of afterMap) {
  if (!beforeMap.has(key)) added.push(item)
  else if (beforeMap.get(key).version !== item.version) changed.push({ before: beforeMap.get(key), after: item })
}
for (const [key, item] of beforeMap) if (!afterMap.has(key)) removed.push(item)
const report = {
  before_version: before.dsh_version,
  after_version: after.dsh_version,
  before_install_root: before.install_root,
  after_install_root: after.install_root,
  install_root_changed: before.install_root !== after.install_root,
  before_package_count: before.package_count ?? before.packages.length,
  after_package_count: after.package_count ?? after.packages.length,
  before_unresolved_dependency_count: before.unresolved_dependency_count ?? 0,
  after_unresolved_dependency_count: after.unresolved_dependency_count ?? 0,
  added,
  removed,
  changed,
}
await writeFile(resolve(args.out), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
process.stdout.write(`DSH ${report.before_version} -> ${report.after_version}; packages=${report.before_package_count}->${report.after_package_count}; added=${added.length}; removed=${removed.length}; changed=${changed.length}; install_root_changed=${report.install_root_changed}\n`)
