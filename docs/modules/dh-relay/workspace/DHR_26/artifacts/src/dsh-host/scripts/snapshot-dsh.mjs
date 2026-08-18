import { createHash } from 'node:crypto'
import { readFile, readdir, realpath, stat, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'

function parseArgs(argv) {
  const result = {}
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]
    const value = argv[index + 1]
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error(
        'usage: --label <text> --out <file> --dsh-version <version> --npm-root <dir> --install-root <dir>',
      )
    }
    result[key.slice(2)] = value
  }
  return result
}

function packagePath(name) {
  return name.split('/')
}

async function fileExists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

async function findPackageJson(start) {
  let current = resolve(start)
  while (true) {
    const candidate = join(current, 'package.json')
    if (await fileExists(candidate)) return candidate
    const parent = dirname(current)
    if (parent === current) return undefined
    current = parent
  }
}

async function resolvePackageJson(name, fromPackageJson, npmRoot) {
  const require = createRequire(fromPackageJson)
  try {
    const resolved = require.resolve(`${name}/package.json`)
    return await realpath(resolved)
  } catch {
    try {
      const entry = require.resolve(name)
      return await findPackageJson(dirname(await realpath(entry)))
    } catch {
      const fallback = join(npmRoot, ...packagePath(name), 'package.json')
      return await fileExists(fallback) ? await realpath(fallback) : undefined
    }
  }
}

async function listDirectory(path) {
  const entries = await readdir(path, { withFileTypes: true })
  return entries
    .map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory'
        : entry.isSymbolicLink() ? 'symlink'
          : entry.isFile() ? 'file'
            : 'other',
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

async function collectInstallLayout(installRoot) {
  const rootEntries = await listDirectory(installRoot)
  const scopedModules = join(installRoot, 'node_modules', '@deepseek-ai')
  const scopedEntries = await fileExists(scopedModules) ? await listDirectory(scopedModules) : []
  return {
    install_root_realpath: await realpath(installRoot),
    root_entries: rootEntries,
    nested_deepseek_scope: {
      path: scopedModules,
      exists: await fileExists(scopedModules),
      entries: scopedEntries,
    },
  }
}

function dependencyNames(packageJson) {
  return Object.keys({
    ...packageJson.dependencies,
    ...packageJson.optionalDependencies,
    ...packageJson.peerDependencies,
  }).filter(name => name.startsWith('@deepseek-ai/'))
}

async function collectDshPackageClosure(dshPackageJson, npmRoot) {
  const queue = [await realpath(dshPackageJson)]
  const seen = new Set()
  const packages = []
  const unresolved = []

  while (queue.length > 0) {
    const packageJsonPath = queue.shift()
    if (seen.has(packageJsonPath)) continue
    seen.add(packageJsonPath)

    const text = await readFile(packageJsonPath, 'utf8')
    const parsed = JSON.parse(text)
    if (typeof parsed.name !== 'string' || !parsed.name.startsWith('@deepseek-ai/')) continue

    const rel = relative(npmRoot, packageJsonPath)
    packages.push({
      name: parsed.name,
      version: parsed.version ?? null,
      path: rel.startsWith('..') || isAbsolute(rel) ? packageJsonPath : rel,
      package_json_sha256: createHash('sha256').update(text).digest('hex'),
    })

    for (const dependency of dependencyNames(parsed)) {
      const resolved = await resolvePackageJson(dependency, packageJsonPath, npmRoot)
      if (resolved === undefined) {
        unresolved.push({ requested_by: parsed.name, dependency })
      } else if (!seen.has(resolved)) {
        queue.push(resolved)
      }
    }
  }

  packages.sort((a, b) => a.name.localeCompare(b.name) || a.path.localeCompare(b.path))
  unresolved.sort((a, b) => a.requested_by.localeCompare(b.requested_by)
    || a.dependency.localeCompare(b.dependency))
  return { packages, unresolved }
}

const args = parseArgs(process.argv.slice(2))
for (const required of ['label', 'out', 'dsh-version', 'npm-root', 'install-root']) {
  if (!args[required]) throw new Error(`missing --${required}`)
}

const npmRoot = resolve(args['npm-root'])
const installRoot = resolve(args['install-root'])
const dshPackageJson = join(installRoot, 'package.json')
const dshManifest = JSON.parse(await readFile(dshPackageJson, 'utf8'))
if (dshManifest.name !== '@deepseek-ai/dsh') {
  throw new Error(`expected @deepseek-ai/dsh at ${dshPackageJson}`)
}
if (dshManifest.version !== args['dsh-version']) {
  throw new Error(
    `CLI/package version mismatch: dsh=${args['dsh-version']} package=${String(dshManifest.version)}`,
  )
}

const { packages, unresolved } = await collectDshPackageClosure(dshPackageJson, npmRoot)
const installStat = await stat(installRoot)
const installLayout = await collectInstallLayout(installRoot)
const snapshot = {
  label: args.label,
  captured_at: new Date().toISOString(),
  dsh_version: args['dsh-version'],
  node_version: process.version,
  platform: process.platform,
  arch: process.arch,
  npm_root_global: npmRoot,
  install_root: installRoot,
  install_mtime: installStat.mtime.toISOString(),
  install_layout: installLayout,
  package_count: packages.length,
  unresolved_dependency_count: unresolved.length,
  packages,
  unresolved_dependencies: unresolved,
}

const out = resolve(args.out)
await writeFile(out, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
const textPath = out.replace(/\.json$/i, '.txt')
const lines = [
  `label=${snapshot.label}`,
  `captured_at=${snapshot.captured_at}`,
  `dsh_version=${snapshot.dsh_version}`,
  `node_version=${snapshot.node_version}`,
  `platform=${snapshot.platform}`,
  `arch=${snapshot.arch}`,
  `npm_root_global=${snapshot.npm_root_global}`,
  `install_root=${snapshot.install_root}`,
  `package_count=${snapshot.package_count}`,
  `unresolved_dependency_count=${snapshot.unresolved_dependency_count}`,
  `install_root_realpath=${snapshot.install_layout.install_root_realpath}`,
  ...snapshot.install_layout.root_entries.map(item => `INSTALL_ROOT_ENTRY\t${item.type}\t${item.name}`),
  ...snapshot.install_layout.nested_deepseek_scope.entries.map(item => `INSTALL_NESTED_DEEPSEEK_ENTRY\t${item.type}\t${item.name}`),
  ...snapshot.packages.map(item => `${item.name}@${item.version ?? 'unknown'}\t${item.path}\t${item.package_json_sha256}`),
  ...snapshot.unresolved_dependencies.map(item => `UNRESOLVED\t${item.requested_by}\t${item.dependency}`),
]
await writeFile(textPath, `${lines.join('\n')}\n`, 'utf8')
process.stdout.write(`${JSON.stringify({
  text_path: textPath,
  package_count: snapshot.package_count,
  unresolved_dependency_count: snapshot.unresolved_dependency_count,
})}\n`)
