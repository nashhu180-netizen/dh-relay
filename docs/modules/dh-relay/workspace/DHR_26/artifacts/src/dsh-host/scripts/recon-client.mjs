import { readFile, stat, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'

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

async function exists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

async function resolveManifest(name, dshManifestPath, npmRoot) {
  const require = createRequire(dshManifestPath)
  try {
    return require.resolve(`${name}/package.json`)
  } catch {
    const fallbacks = [
      join(dirname(dshManifestPath), 'node_modules', ...name.split('/'), 'package.json'),
      join(npmRoot, ...name.split('/'), 'package.json'),
    ]
    for (const fallback of fallbacks) {
      if (await exists(fallback)) return fallback
    }
    throw new Error(`${name} is not resolvable from the installed DSH package`)
  }
}

const args = parseArgs(process.argv.slice(2))
for (const required of ['npm-root', 'install-root', 'dsh-home', 'profile', 'out']) {
  if (!args[required]) throw new Error(`missing --${required}`)
}

const npmRoot = resolve(args['npm-root'])
const installRoot = resolve(args['install-root'])
const dshManifestPath = join(installRoot, 'package.json')
const dshManifest = JSON.parse(await readFile(dshManifestPath, 'utf8'))
const clientManifestPath = await resolveManifest(
  '@deepseek-ai/dsh-client-modules',
  dshManifestPath,
  npmRoot,
)
const clientManifest = JSON.parse(await readFile(clientManifestPath, 'utf8'))
const clientRoot = dirname(clientManifestPath)
const declaration = clientManifest.dsh?.client
const clientExport = clientManifest.exports?.['./client']
if (declaration?.platform !== 'web') {
  throw new Error('@deepseek-ai/dsh-client-modules lacks dsh.client platform=web')
}
if (typeof clientExport?.default !== 'string' || typeof clientExport?.types !== 'string') {
  throw new Error('@deepseek-ai/dsh-client-modules lacks exports["./client"] default/types')
}

const nodeTypes = resolve(clientRoot, clientManifest.types)
const clientTypes = resolve(clientRoot, clientExport.types)
const clientBundle = resolve(clientRoot, clientExport.default)
const profileCordis = resolve(args['dsh-home'], 'profiles', args.profile, 'cordis.yml')
const report = {
  observed_dsh_version: dshManifest.version,
  observed_client_modules_version: clientManifest.version,
  client_package_manifest: clientManifestPath,
  dsh_client_declaration: declaration,
  client_export: clientExport,
  local_type_definitions: {
    node: { path: nodeTypes, exists: await exists(nodeTypes) },
    client: { path: clientTypes, exists: await exists(clientTypes) },
  },
  client_bundle: { path: clientBundle, exists: await exists(clientBundle) },
  profile_scan_anchor: {
    rule: 'ctx.baseUrl is the directory containing the active profile cordis.yml',
    cordis_yml: profileCordis,
    directory: dirname(profileCordis),
    exists: await exists(profileCordis),
  },
  metadata_cache_rule: 'client package metadata, including negative results, takes effect after DSH restart',
  installation_boundaries: {
    patch: 'an invocation-scoped config overlay; local plugin module paths must be absolute and package resolution still anchors at the profile',
    profile: 'a persistent profile dependency plus dsh.bundle.patch layer; dsh plugin remove removes the dependency and layer',
  },
  source_baseline: {
    repository: 'deepseek-ai/deepseek-harness',
    commit: '99f6f02fecdb7dff40c3fbc9470f5907c29f74ca',
    docs: [
      'docs/subsystems/client-modules.zh.md',
      'docs/user/develop/basic/publish.zh.md',
      'apps/cli/reference/README.zh.md',
    ],
  },
  feasibility_judgement: null,
}

for (const [label, item] of Object.entries({
  nodeTypes: report.local_type_definitions.node,
  clientTypes: report.local_type_definitions.client,
  clientBundle: report.client_bundle,
})) {
  if (!item.exists) throw new Error(`${label} missing at ${item.path}`)
}
if (!report.profile_scan_anchor.exists) {
  throw new Error(`profile scan anchor missing at ${profileCordis}`)
}

await writeFile(resolve(args.out), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
process.stdout.write(`CLIENT_RECON_COMPLETE ${clientManifest.name}@${clientManifest.version}\n`)
