import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { isPlainJson } from '../plain-json.js'

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
for (const required of ['transcript', 'list', 'detail', 'out']) {
  if (!args[required]) throw new Error(`missing --${required}`)
}

const transcript = await readFile(resolve(args.transcript), 'utf8')
const prefix = '[relay-pilot-probe] '
const line = transcript.split(/\r?\n/).find(item => item.startsWith(prefix))
if (!line) throw new Error('probe transcript line not found')
const payload = JSON.parse(line.slice(prefix.length))
const expectedList = JSON.parse(await readFile(resolve(args.list), 'utf8'))
const expectedDetail = JSON.parse(await readFile(resolve(args.detail), 'utf8'))
const listIdentical = JSON.stringify(payload.list) === JSON.stringify(expectedList)
const detailIdentical = JSON.stringify(payload.detail) === JSON.stringify(expectedDetail)
const report = {
  result: listIdentical && detailIdentical && payload.plain_json === true ? 'IDENTICAL' : 'DIFF',
  service: payload.service,
  plain_json: payload.plain_json === true && isPlainJson(payload.list) && isPlainJson(payload.detail),
  list_identical: listIdentical,
  detail_identical: detailIdentical,
  list_schema: payload.list_schema,
  detail_schema: payload.detail_schema,
  list_sha256: payload.list_sha256,
  detail_sha256: payload.detail_sha256,
}
await writeFile(resolve(args.out), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
process.stdout.write(`RESULT: ${report.result}\n`)
if (report.result !== 'IDENTICAL' || !report.plain_json) process.exitCode = 1
