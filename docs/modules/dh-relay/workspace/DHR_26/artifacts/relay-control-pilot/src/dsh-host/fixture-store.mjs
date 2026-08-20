import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { basename, delimiter, isAbsolute, resolve } from 'node:path'

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
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    fail('bad-json', `cannot parse ${path}`, { cause: String(error) })
  }
  if (!isPlainJson(parsed)) fail('non-json-value', `${path} is not plain JSON`)
  return parsed
}

/**
 * Resolve one configured fixture path against the optional root.
 *
 * Every fixture this Host reads is named explicitly by config. There is no
 * directory walk and no "pick the best-looking file" rule, so which files get
 * read is a property of the config, never of the directory contents.
 */
function resolveFixturePath(value, root, label) {
  if (typeof value !== 'string' || value.length === 0) {
    fail('fixture-path-invalid', `${label} must be a non-empty string`)
  }
  if (isAbsolute(value)) return resolve(value)
  return root === undefined ? resolve(value) : resolve(root, value)
}

const LIST_SEPARATORS = new RegExp(`[\\r\\n${delimiter}]+`)

/** Accept a YAML/JS array, a JSON array string, or a path-delimiter/newline separated string. */
function normalizeFixtureList(value, label) {
  if (value === undefined || value === null || value === '') return []
  if (Array.isArray(value)) return value
  if (typeof value !== 'string') {
    fail('fixture-path-invalid', `${label} must be a string or an array`)
  }
  const trimmed = value.trim()
  if (trimmed.startsWith('[')) {
    let parsed
    try {
      parsed = JSON.parse(trimmed)
    } catch (error) {
      fail('fixture-path-invalid', `${label} is not a valid JSON array`, { cause: String(error) })
    }
    if (!Array.isArray(parsed)) fail('fixture-path-invalid', `${label} must be an array`)
    return parsed
  }
  return trimmed.split(LIST_SEPARATORS).map(item => item.trim()).filter(item => item.length > 0)
}

function readListFixture(path) {
  const model = readJsonFile(path)
  if (!isRecord(model)) fail('list-fixture-invalid', `${path} must be a JSON object`)
  if (model.schema_version !== LIST_SCHEMA_VERSION) {
    fail('list-fixture-invalid', `${path} is not a ${LIST_SCHEMA_VERSION} document`, {
      schema_version: model.schema_version ?? null,
    })
  }
  if (!Array.isArray(model.runs)) fail('list-fixture-invalid', `${path}.runs must be an array`)
  for (const [index, run] of model.runs.entries()) {
    if (!isRecord(run) || typeof run.run_id !== 'string' || run.run_id.length === 0) {
      fail('list-fixture-invalid', `${path}.runs[${index}] must carry a non-empty run_id`)
    }
  }
  return model
}

function readDetailFixture(path) {
  const model = readJsonFile(path)
  if (!isRecord(model)) fail('detail-fixture-invalid', `${path} must be a JSON object`)
  if (model.schema_version !== DETAIL_SCHEMA_VERSION) {
    fail('detail-fixture-invalid', `${path} is not a ${DETAIL_SCHEMA_VERSION} document`, {
      schema_version: model.schema_version ?? null,
    })
  }
  if (typeof model.run_id !== 'string' || model.run_id.length === 0) {
    fail('detail-fixture-invalid', `${path}.run_id must be a non-empty string`)
  }
  return model
}

/**
 * Load the frozen DHR_25 fixtures named by config into one immutable snapshot.
 *
 * List and details are independent sample sets upstream: a listed run may have
 * no detail fixture, and a detail fixture may describe a run the list does not
 * carry. Neither is an error here — both are reported through
 * `snapshot.diagnostics` so the Client degrades instead of the whole plugin
 * tree failing to load. Values pass through verbatim; no field is derived, and
 * nothing is cross-checked between the two models.
 */
export function loadPilotSnapshot({ fixtureRoot, listFixture, detailFixtures } = {}) {
  const root = typeof fixtureRoot === 'string' && fixtureRoot.length > 0
    ? resolve(fixtureRoot)
    : undefined

  const listPath = resolveFixturePath(listFixture, root, 'listFixture')
  const list = readListFixture(listPath)

  const detailPaths = normalizeFixtureList(detailFixtures, 'detailFixtures')
    .map((item, index) => resolveFixturePath(item, root, `detailFixtures[${index}]`))

  const details = Object.create(null)
  const detailPathByRunId = new Map()
  for (const path of detailPaths) {
    const model = readDetailFixture(path)
    if (detailPathByRunId.has(model.run_id)) {
      fail('duplicate-run-id', `multiple detail fixtures use run_id ${model.run_id}`, {
        first: detailPathByRunId.get(model.run_id),
        second: path,
      })
    }
    detailPathByRunId.set(model.run_id, path)
    details[model.run_id] = cloneJson(model)
  }

  const listedRunIds = new Set(list.runs.map(run => run.run_id))
  const diagnostics = []
  for (const run of list.runs) {
    if (!detailPathByRunId.has(run.run_id)) {
      diagnostics.push({ code: 'detail-missing', run_id: run.run_id })
    }
  }
  for (const runId of detailPathByRunId.keys()) {
    if (!listedRunIds.has(runId)) diagnostics.push({ code: 'detail-unlisted', run_id: runId })
  }

  const payload = { list: cloneJson(list), details }
  const snapshot = {
    schema_version: SNAPSHOT_SCHEMA_VERSION,
    fixture_hash: sha256Canonical(payload),
    list_fixture: basename(listPath),
    detail_fixtures: detailPaths.map(path => basename(path)),
    diagnostics,
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
  diagnostics() { return cloneJson(this._snapshot.diagnostics) }
  listRuns() { return cloneJson(this._snapshot.list) }

  /** Return the detail model, or `null` when this run has no detail fixture. */
  getRun(runId) {
    if (typeof runId !== 'string' || runId.length === 0) return null
    if (!Object.hasOwn(this._snapshot.details, runId)) return null
    return cloneJson(this._snapshot.details[runId])
  }

  snapshot() { return cloneJson(this._snapshot) }
}
