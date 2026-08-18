export const SNAPSHOT_SCHEMA_VERSION = 'relay.pilot-snapshot/v1'
export const LIST_SCHEMA_VERSION = 'relay.pilot-run-list/v1'
export const DETAIL_SCHEMA_VERSION = 'relay.pilot-read-model/v1'

export class RelayPilotClientError extends Error {
  constructor(code, message) {
    super(`${code}: ${message}`)
    this.name = 'RelayPilotClientError'
    this.code = code
  }
}

function fail(code, message) {
  throw new RelayPilotClientError(code, message)
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assertString(value, label) {
  if (typeof value !== 'string' || value.length === 0) fail('invalid-snapshot', `${label} must be a non-empty string`)
}

function isPlainJson(value, seen = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value !== 'object' || seen.has(value)) return false
  seen.add(value)
  if (Array.isArray(value)) return value.every(item => isPlainJson(item, seen))
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) return false
  return Object.values(value).every(item => isPlainJson(item, seen))
}

export function validateSnapshot(snapshot) {
  if (!isPlainJson(snapshot) || !isRecord(snapshot)) fail('invalid-snapshot', 'snapshot must be plain JSON')
  if (snapshot.schema_version !== SNAPSHOT_SCHEMA_VERSION) fail('unsupported-snapshot', `expected ${SNAPSHOT_SCHEMA_VERSION}`)
  if (!isRecord(snapshot.list) || snapshot.list.schema_version !== LIST_SCHEMA_VERSION || !Array.isArray(snapshot.list.runs)) {
    fail('invalid-snapshot', `list must be ${LIST_SCHEMA_VERSION}`)
  }
  if (!isRecord(snapshot.details)) fail('invalid-snapshot', 'details must be an object')
  for (const [index, run] of snapshot.list.runs.entries()) {
    if (!isRecord(run)) fail('invalid-snapshot', `runs[${index}] must be an object`)
    assertString(run.run_id, `runs[${index}].run_id`)
    assertString(run.group, `runs[${index}].group`)
    assertString(run.workflow_name, `runs[${index}].workflow_name`)
    assertString(run.run_status, `runs[${index}].run_status`)
    if (!isRecord(run.progress) || !Number.isInteger(run.progress.done) || !Number.isInteger(run.progress.total)) {
      fail('invalid-snapshot', `runs[${index}].progress must carry integer done/total`)
    }
    if (!Object.hasOwn(snapshot.details, run.run_id)) fail('invalid-snapshot', `missing detail for ${run.run_id}`)
    const detail = snapshot.details[run.run_id]
    if (!isRecord(detail) || detail.schema_version !== DETAIL_SCHEMA_VERSION || detail.run_id !== run.run_id) {
      fail('invalid-snapshot', `detail for ${run.run_id} must be ${DETAIL_SCHEMA_VERSION}`)
    }
  }
  return snapshot
}

/** Preserve source group and run order exactly; no status vocabulary or sorting exists here. */
export function groupRuns(listModel) {
  if (!isRecord(listModel) || listModel.schema_version !== LIST_SCHEMA_VERSION || !Array.isArray(listModel.runs)) {
    fail('invalid-list', `list must be ${LIST_SCHEMA_VERSION}`)
  }
  const groups = []
  const byName = new Map()
  for (const run of listModel.runs) {
    assertString(run.group, 'run.group')
    let section = byName.get(run.group)
    if (section === undefined) {
      section = { group: run.group, runs: [] }
      byName.set(run.group, section)
      groups.push(section)
    }
    section.runs.push(run)
  }
  return groups
}

export function groupingSignature(listModel) {
  return groupRuns(listModel).map(section => ({
    group: section.group,
    run_ids: section.runs.map(run => run.run_id),
  }))
}

export function selectDetail(snapshot, runId) {
  validateSnapshot(snapshot)
  if (typeof runId !== 'string' || !Object.hasOwn(snapshot.details, runId)) return null
  return snapshot.details[runId]
}
