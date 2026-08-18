import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, extname, isAbsolute, join, relative, resolve } from 'node:path'

export const DETAIL_SCHEMA_VERSION = 'relay.pilot-read-model/v1'
export const LIST_SCHEMA_VERSION = 'relay.pilot-run-list/v1'
export const SNAPSHOT_SCHEMA_VERSION = 'relay.pilot-snapshot/v1'

export class RelayPilotFixtureError extends Error {
  constructor(code, message, details = undefined) {
    super(`${code}: ${message}`)
    this.name = 'RelayPilotFixtureError'
    this.code = code
    if (details !== undefined) this.details = details
  }
}

function fail(code, message, details = undefined) {
  throw new RelayPilotFixtureError(code, message, details)
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assertRecord(value, label) {
  if (!isRecord(value)) fail('invalid-fixture', `${label} must be a JSON object`)
}

function assertArray(value, label) {
  if (!Array.isArray(value)) fail('invalid-fixture', `${label} must be an array`)
}

function assertString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    fail('invalid-fixture', `${label} must be a non-empty string`)
  }
}

export function isPlainJson(value, seen = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value !== 'object' || seen.has(value)) return false
  seen.add(value)
  if (Array.isArray(value)) return value.every(item => isPlainJson(item, seen))
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) return false
  return Object.values(value).every(item => isPlainJson(item, seen))
}

export function cloneJson(value) {
  return JSON.parse(JSON.stringify(value))
}

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue)
  if (!isRecord(value)) return value
  const output = Object.create(null)
  for (const key of Object.keys(value).sort()) output[key] = canonicalValue(value[key])
  return output
}

export function canonicalJson(value) {
  if (!isPlainJson(value)) fail('non-json-value', 'value is not plain JSON')
  return JSON.stringify(canonicalValue(value))
}

export function sha256Canonical(value) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex')
}

function deepFreeze(value) {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const child of Object.values(value)) deepFreeze(child)
  return value
}

function readJsonFile(path) {
  let text
  try {
    text = readFileSync(path, 'utf8')
  } catch (error) {
    fail('fixture-read-failed', `cannot read ${path}`, { cause: String(error) })
  }
  try {
    const parsed = JSON.parse(text)
    if (!isPlainJson(parsed)) fail('non-json-value', `${path} is not plain JSON`)
    return parsed
  } catch (error) {
    if (error instanceof RelayPilotFixtureError) throw error
    fail('bad-json', `cannot parse ${path}`, { cause: String(error) })
  }
}

function walkJsonFiles(root) {
  const entries = readdirSync(root, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) files.push(...walkJsonFiles(path))
    else if (entry.isFile() && extname(entry.name).toLowerCase() === '.json') files.push(path)
  }
  return files.sort((a, b) => relative(root, a).localeCompare(relative(root, b), 'en'))
}

function validateDetail(model, path) {
  assertRecord(model, path)
  if (model.schema_version !== DETAIL_SCHEMA_VERSION) return false
  assertString(model.run_id, `${path}.run_id`)
  assertString(model.workflow_name, `${path}.workflow_name`)
  assertString(model.run_status, `${path}.run_status`)
  assertArray(model.nodes, `${path}.nodes`)
  assertArray(model.attentions, `${path}.attentions`)
  assertArray(model.source_refs, `${path}.source_refs`)
  return true
}

function validateList(model, path) {
  assertRecord(model, path)
  if (model.schema_version !== LIST_SCHEMA_VERSION) return false
  assertArray(model.runs, `${path}.runs`)
  assertArray(model.source_refs, `${path}.source_refs`)
  for (const [index, run] of model.runs.entries()) {
    assertRecord(run, `${path}.runs[${index}]`)
    assertString(run.run_id, `${path}.runs[${index}].run_id`)
    assertString(run.group, `${path}.runs[${index}].group`)
    assertString(run.workflow_name, `${path}.runs[${index}].workflow_name`)
    assertString(run.run_status, `${path}.runs[${index}].run_status`)
    assertRecord(run.progress, `${path}.runs[${index}].progress`)
    if (!Number.isInteger(run.progress.done) || !Number.isInteger(run.progress.total)) {
      fail('invalid-fixture', `${path}.runs[${index}].progress must carry integer done/total`)
    }
  }
  return true
}

function chooseListFixture(candidates, root, requested) {
  if (requested !== undefined && requested !== null && requested !== '') {
    const path = isAbsolute(requested) ? resolve(requested) : resolve(root, requested)
    const found = candidates.find(candidate => candidate.path === path)
    if (found === undefined) {
      fail('list-fixture-not-found', `requested list fixture is not a ${LIST_SCHEMA_VERSION} document`, {
        requested: path,
      })
    }
    return found
  }
  if (candidates.length === 0) fail('list-fixture-not-found', `no ${LIST_SCHEMA_VERSION} fixture found under ${root}`)
  return [...candidates].sort((left, right) => {
    const cardinality = right.model.runs.length - left.model.runs.length
    return cardinality !== 0 ? cardinality : left.path.localeCompare(right.path, 'en')
  })[0]
}

const CORRELATED_FIELDS = [
  'workflow_name', 'run_status', 'started_at', 'trigger', 'trigger_by', 'attempt', 'log_locator',
]

function verifyCorrelation(listRun, detail, sourcePath) {
  for (const field of CORRELATED_FIELDS) {
    if (!(field in listRun) || !(field in detail)) continue
    if (canonicalJson(listRun[field]) !== canonicalJson(detail[field])) {
      fail('fixture-correlation-mismatch', `${sourcePath}: ${field} differs between list and detail`, {
        run_id: listRun.run_id,
        field,
      })
    }
  }
  if ('attention_count' in listRun && listRun.attention_count !== detail.attentions.length) {
    fail('fixture-correlation-mismatch', `${sourcePath}: attention_count differs from detail attentions length`, {
      run_id: listRun.run_id,
    })
  }
  if (isRecord(listRun.progress) && listRun.progress.total !== detail.nodes.length) {
    fail('fixture-correlation-mismatch', `${sourcePath}: progress.total differs from detail nodes length`, {
      run_id: listRun.run_id,
    })
  }
}

export function loadPilotSnapshot({ fixtureRoot, listFixture = undefined }) {
  if (typeof fixtureRoot !== 'string' || fixtureRoot.length === 0) {
    fail('fixture-root-required', 'fixtureRoot is required')
  }
  const root = resolve(fixtureRoot)
  try {
    if (!statSync(root).isDirectory()) fail('fixture-root-invalid', `${root} is not a directory`)
  } catch (error) {
    if (error instanceof RelayPilotFixtureError) throw error
    fail('fixture-root-invalid', `cannot inspect ${root}`, { cause: String(error) })
  }

  const listCandidates = []
  const detailByRunId = new Map()
  for (const path of walkJsonFiles(root)) {
    const model = readJsonFile(path)
    if (model.schema_version === LIST_SCHEMA_VERSION) {
      validateList(model, path)
      listCandidates.push({ path, model })
      continue
    }
    if (model.schema_version === DETAIL_SCHEMA_VERSION) {
      validateDetail(model, path)
      if (detailByRunId.has(model.run_id)) {
        fail('duplicate-run-id', `multiple detail fixtures use run_id ${model.run_id}`, {
          first: detailByRunId.get(model.run_id).path,
          second: path,
        })
      }
      detailByRunId.set(model.run_id, { path, model })
    }
  }

  const selectedList = chooseListFixture(listCandidates, root, listFixture)
  const details = Object.create(null)
  for (const listRun of selectedList.model.runs) {
    const detail = detailByRunId.get(listRun.run_id)
    if (detail === undefined) {
      fail('detail-fixture-not-found', `no ${DETAIL_SCHEMA_VERSION} detail for ${listRun.run_id}`, {
        list_fixture: selectedList.path,
      })
    }
    verifyCorrelation(listRun, detail.model, detail.path)
    details[listRun.run_id] = cloneJson(detail.model)
  }

  const payload = { list: cloneJson(selectedList.model), details }
  const snapshot = {
    schema_version: SNAPSHOT_SCHEMA_VERSION,
    fixture_hash: sha256Canonical(payload),
    list_fixture: basename(selectedList.path),
    list: payload.list,
    details: payload.details,
  }
  return deepFreeze(snapshot)
}

export class RelayPilotRepository {
  constructor(options) {
    this._snapshot = loadPilotSnapshot(options)
  }

  fixtureHash() { return this._snapshot.fixture_hash }
  listRuns() { return cloneJson(this._snapshot.list) }
  getRun(runId) {
    if (typeof runId !== 'string' || runId.length === 0) return null
    if (!Object.hasOwn(this._snapshot.details, runId)) return null
    return cloneJson(this._snapshot.details[runId])
  }
  snapshot() { return cloneJson(this._snapshot) }
}
