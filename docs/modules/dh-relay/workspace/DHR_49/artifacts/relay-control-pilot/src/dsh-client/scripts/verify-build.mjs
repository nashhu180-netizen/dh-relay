import { createHash } from 'node:crypto'
import { readFileSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildBundle } from './build.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const output = resolve(root, 'lib/client.js')
const digest = () => createHash('sha256').update(readFileSync(output)).digest('hex')

rmSync(resolve(root, 'lib'), { recursive: true, force: true })
buildBundle()
const first = digest()
rmSync(resolve(root, 'lib'), { recursive: true, force: true })
buildBundle()
const second = digest()
if (first !== second) throw new Error(`non-deterministic bundle: ${first} != ${second}`)
process.stdout.write(`CLEAN REBUILD IDENTICAL ${first}\n`)
