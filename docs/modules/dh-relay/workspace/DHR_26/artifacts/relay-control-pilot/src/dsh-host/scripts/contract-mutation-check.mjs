import { cpSync, mkdtempSync, mkdirSync, appendFileSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

/**
 * Prove the package contract assertions actually bite.
 *
 * "Tests are green" is not the same claim as "the assertions would catch it":
 * the first version of the strengthened import contract had `\b` written as a
 * literal backspace byte, so the createRequire rule matched nothing and the
 * suite stayed green through a violating file. This harness copies the package
 * to a temp dir, introduces one violation at a time, and reports whether the
 * suite turns red. Every mutant must fail; a mutant that passes is a hole.
 *
 * Read-only against the real package — all mutation happens in the copy.
 *
 * usage: node scripts/contract-mutation-check.mjs [--out <file>]
 */
const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)
const outIndex = args.indexOf('--out')
const outFile = outIndex >= 0 ? args[outIndex + 1] : undefined

const MUTANTS = [
  {
    name: 'computed dynamic import',
    apply: dir => appendFileSync(join(dir, 'index.mjs'), '\nexport const evil = spec => import(spec)\n'),
  },
  {
    name: 'createRequire escape hatch',
    apply: dir => appendFileSync(join(dir, 'index.mjs'),
      "\nimport { createRequire } from 'node:module'\nexport const evil = createRequire(import.meta.url)\n"),
  },
  {
    name: 'CommonJS require of a bare specifier',
    apply: dir => appendFileSync(join(dir, 'index.mjs'),
      "\nexport const evil = () => require('@deepseek-ai/cordis')\n"),
  },
  {
    name: 'runtime file not declared in package.files',
    apply: dir => writeFileSync(join(dir, 'sneaky.mjs'), 'export const x = 1\n'),
  },
  {
    name: 'default export that would drop inject',
    apply: dir => appendFileSync(join(dir, 'probe.mjs'), '\nexport default apply\n'),
  },
  {
    // Round-2 recheck, P2: `files` may name a directory, and everything under it
    // ships too. Both the declared and the undeclared shape must be caught.
    name: 'bare import hidden in a shipped subdirectory',
    apply: dir => {
      mkdirSync(join(dir, 'lib'), { recursive: true })
      writeFileSync(join(dir, 'lib', 'sneaky.mjs'), "import { Service } from '@deepseek-ai/cordis'\nexport { Service }\n")
      const manifestPath = join(dir, 'package.json')
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
      manifest.files.push('lib')
      writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    },
  },
  {
    name: 'runtime file in an undeclared subdirectory',
    apply: dir => {
      mkdirSync(join(dir, 'lib'), { recursive: true })
      writeFileSync(join(dir, 'lib', 'sneaky.mjs'), 'export const x = 1\n')
    },
  },
  {
    // Round-2 recheck-2, P2: excluding "test"/"scripts" at any depth would let a
    // shipped lib/test/ hide a runtime file.
    name: 'bare import hidden in a shipped lib/test/ directory',
    apply: dir => {
      mkdirSync(join(dir, 'lib', 'test'), { recursive: true })
      writeFileSync(join(dir, 'lib', 'test', 'sneaky.mjs'), "import { Service } from '@deepseek-ai/cordis'\nexport { Service }\n")
      const manifestPath = join(dir, 'package.json')
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
      manifest.files.push('lib')
      writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    },
  },
  {
    name: 'bare import in a .cjs file at the package root',
    apply: dir => {
      writeFileSync(join(dir, 'sneaky.cjs'), "const { Service } = require('@deepseek-ai/cordis')\nmodule.exports = { Service }\n")
      const manifestPath = join(dir, 'package.json')
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
      manifest.files.push('sneaky.cjs')
      writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    },
  },
]

const lines = [`# package contract mutation check — ${MUTANTS.length} mutants`, '']
let holes = 0

for (const mutant of MUTANTS) {
  const dir = mkdtempSync(join(tmpdir(), 'relay-contract-'))
  try {
    cpSync(packageRoot, dir, { recursive: true })
    mutant.apply(dir)
    const run = spawnSync(process.execPath, ['--test', join(dir, 'test', 'package-contract.test.mjs')], {
      encoding: 'utf8',
      cwd: dir,
    })
    const red = run.status !== 0
    if (!red) holes += 1
    const reason = (run.stdout.match(/AssertionError.*?: (.+)/) ?? [])[1] ?? (red ? 'suite failed' : '—')
    lines.push(`${red ? 'BITES  ' : 'HOLE   '} ${mutant.name}`)
    lines.push(`         exit=${run.status}  ${reason}`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

lines.push('', holes === 0
  ? `RESULT: ALL ${MUTANTS.length} MUTANTS CAUGHT`
  : `RESULT: ${holes} MUTANT(S) NOT CAUGHT — the contract has a hole`)

const text = `${lines.join('\n')}\n`
process.stdout.write(text)
if (outFile) writeFileSync(outFile, text, 'utf8')
if (holes > 0) process.exitCode = 1
