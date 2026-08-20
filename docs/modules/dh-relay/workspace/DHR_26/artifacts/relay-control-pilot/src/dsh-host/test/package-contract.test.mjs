import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const text = name => readFileSync(join(root, name), 'utf8')
const manifest = JSON.parse(text('package.json'))

/**
 * Runtime files come from the manifest, expanded to what is actually shipped.
 *
 * Round-2 review, P2: a hardcoded list means a new runtime file simply is not
 * covered by the import contract below. The recheck then pointed out that
 * filtering `files` for names ending in `.mjs` still misses anything reached
 * through a directory entry (`"lib"`) — so entries are expanded recursively and
 * a sibling test pins that no shipped-looking `.mjs` on disk escapes the set.
 *
 * `test/` and `scripts/` are neither shipped nor loaded by DSH: tests may import
 * whatever they like, and the operator-side collectors under `scripts/` import
 * the installed Cordis on purpose.
 */
// Only the two top-level directories that never ship are excluded, and only at
// the package root: an earlier version excluded any directory with those names
// at any depth, so `lib/test/x.mjs` would have slipped through (round-2
// recheck-2, P2). Extensions cover every form Node will load from a package
// with "type": "module".
const NOT_SHIPPED_AT_ROOT = ['test', 'scripts', 'node_modules']
const LOADABLE = ['.mjs', '.js', '.cjs']

const loadableUnder = relativeDir => {
  const out = []
  const walk = current => {
    for (const entry of readdirSync(join(root, current), { withFileTypes: true })) {
      const next = current ? `${current}/${entry.name}` : entry.name
      const atRoot = current === ''
      if (entry.isDirectory()) {
        if (!(atRoot && NOT_SHIPPED_AT_ROOT.includes(entry.name))) walk(next)
      } else if (LOADABLE.some(extension => entry.name.endsWith(extension))) {
        out.push(next)
      }
    }
  }
  walk(relativeDir)
  return out
}

const isDirectory = name => {
  try {
    return statSync(join(root, name)).isDirectory()
  } catch {
    return false
  }
}

const RUNTIME_FILES = manifest.files.flatMap(name => {
  if (isDirectory(name)) return loadableUnder(name)
  return LOADABLE.some(extension => name.endsWith(extension)) ? [name] : []
})

/**
 * Drop comments before asserting over source text.
 *
 * These contract tests are pattern matches, and the files deliberately explain
 * the traps they avoid — quoting the very imports and calls the patterns forbid.
 * Without this, documenting a rule breaks the test that enforces it.
 */
const code = name => text(name)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1')

test('package is an installable profile bundle without a second Cordis package identity', () => {
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(manifest.dependencies, undefined)
  assert.equal(manifest.peerDependencies, undefined)
  assert.equal(manifest.exports['./client'], undefined)
})

test('every runtime file and patch overlay is declared in files/exports', () => {
  // A file may be declared by name or covered by a declared directory entry.
  const declared = name => manifest.files.includes(name)
    || manifest.files.some(entry => isDirectory(entry) && name.startsWith(`${entry}/`))
  for (const name of RUNTIME_FILES) {
    assert.ok(declared(name), `files is missing ${name}`)
  }
  for (const name of ['cordis', 'probe', 'absence', 'disable', 'enable']) {
    assert.ok(manifest.files.includes(`${name}.patch.yml`), `files is missing ${name}.patch.yml`)
  }
  assert.equal(manifest.exports['./probe'], './probe.mjs')
  assert.equal(manifest.exports['./absence-probe'], './absence-probe.mjs')
})

test('the shipped runtime set covers every loadable file that could ship', () => {
  // Anything outside the root-level test/ and scripts/ is either shipped or a
  // file someone forgot to declare; either way the import contract must see it.
  const onDisk = loadableUnder('').sort()
  assert.deepEqual(RUNTIME_FILES.slice().sort(), onDisk)
})

test('no runtime file reaches outside this package, by any import form', () => {
  // The install-topology contract. A single bare import of '@deepseek-ai/cordis'
  // was enough to make `dsh plugin add <source-dir>` (a `link:` install) fail
  // with ERR_MODULE_NOT_FOUND, because Node resolves bare specifiers from a
  // module's real path — which, for a linked package, is outside the profile
  // tree that carries the fallback farm. Zero bare imports keeps both install
  // shapes working; see index.mjs for the full note.
  //
  // Round-2 review, P2: matching only literal static imports left `import(expr)`,
  // `createRequire()` and `require()` as open doors. A bare specifier reached by
  // any of them fails exactly the same way at boot, so all of them are closed —
  // and a computed dynamic specifier is rejected outright, since its target
  // cannot be checked by reading the source.
  const local = specifier => specifier.startsWith('.') || specifier.startsWith('node:')
  for (const name of RUNTIME_FILES) {
    const source = code(name)
    const literal = [
      ...source.matchAll(/(?:from|import)\s+['"]([^'"]+)['"]/g),
      ...source.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g),
    ].map(match => match[1])
    for (const specifier of literal) {
      assert.ok(local(specifier), `${name} must not import the bare specifier ${specifier}`)
    }
    assert.doesNotMatch(source, /import\s*\(\s*(?!['"])/, `${name} must not use a computed dynamic import`)
    assert.doesNotMatch(source, /\bcreateRequire\b/, `${name} must not use createRequire`)
    assert.doesNotMatch(source, /(^|[^.\w])require\s*\(/, `${name} must not use require()`)
  }
})

test('the Host publishes ctx.relayPilot through the public provide API', () => {
  const source = code('index.mjs')
  assert.match(source, /ctx\.provide\('relayPilot'/)
  // ctx.provide is mixed onto the context (mixin('reflect', [... 'provide' ...]))
  // and is what DSH itself uses for appExit; ctx.reflect.provide is the internal
  // form that Cordis' own Service constructor calls.
  assert.doesNotMatch(source, /ctx\.reflect\./)
  assert.doesNotMatch(source, /extends\s+Service/)
})

test('service has no route/event/timer/process registration side channel', () => {
  const source = code('index.mjs')
  assert.doesNotMatch(source, /\.on\(|\.effect\(|setInterval|setTimeout|webServer|process\.on|loader\.create/)
})

test('the store reads only the fixtures config names, with no directory walk', () => {
  const source = text('fixture-store.mjs')
  assert.doesNotMatch(source, /\b(readdir|readdirSync|opendir|opendirSync|glob|globSync)\s*\(/)
  assert.match(source, /listFixture/)
  assert.match(source, /detailFixtures/)
})

test('no runtime file exports a default, which is what preserves inject and name', () => {
  // Cordis' loader runs `exports = exports.default ?? exports` before applying a
  // plugin, so any default export replaces the module namespace and drops the
  // named `inject`/`name` alongside it.
  for (const name of RUNTIME_FILES) {
    assert.doesNotMatch(code(name), /^export default/m, `${name} must not export a default`)
  }
  assert.match(text('probe.mjs'), /export const inject = \['relayPilot'\]/)
  assert.match(text('probe.mjs'), /appExit/)
  assert.match(text('absence-probe.mjs'), /appExit/)
})

test('the bundle patch names its fixtures explicitly instead of discovering them', () => {
  const patch = text('cordis.patch.yml')
  assert.match(patch, /id: relay-pilot-host/)
  assert.match(patch, /RELAY_PILOT_FIXTURE_ROOT/)
  assert.match(patch, /listFixture: runs-active\.json/)
  assert.match(patch, /detailFixtures:/)
  assert.match(patch, /- run-basic\.json/)
})

test('overlays stay explicit and separate from the persistent bundle row', () => {
  assert.match(text('probe.patch.yml'), /@personal\/dsh-relay-host\/probe/)
  assert.match(text('absence.patch.yml'), /@personal\/dsh-relay-host\/absence-probe/)
  assert.match(text('disable.patch.yml'), /disabled: true/)
  assert.match(text('enable.patch.yml'), /disabled: false/)
})
