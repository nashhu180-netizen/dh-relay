import { readFile } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'
import { isPlainJson } from './plain-json.js'

export const DETAIL_SCHEMA = 'relay.pilot-read-model/v1'
export const LIST_SCHEMA = 'relay.pilot-run-list/v1'

function requireFixturePath(value, field, envName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(
      `relay-pilot-host: ${field} is required; set config.${field} or ${envName}`,
    )
  }
  return isAbsolute(value) ? value : resolve(value)
}

async function readFixture(path, expectedSchema, label) {
  let text
  try {
    text = await readFile(path, 'utf8')
  } catch (error) {
    throw new Error(`relay-pilot-host: cannot read ${label} fixture`, { cause: error })
  }

  let value
  try {
    value = JSON.parse(text)
  } catch (error) {
    throw new Error(`relay-pilot-host: ${label} fixture is not valid JSON`, { cause: error })
  }

  if (!isPlainJson(value) || value === null || Array.isArray(value)) {
    throw new TypeError(`relay-pilot-host: ${label} fixture must be a plain JSON object`)
  }
  if (value.schema_version !== expectedSchema) {
    throw new TypeError(
      `relay-pilot-host: ${label} fixture schema_version must be ${expectedSchema}`,
    )
  }

  // JSON.parse creates a fresh ordinary object for every call. No field is
  // added, removed, sorted, renamed, or derived here.
  return value
}

export class FixtureStore {
  constructor(config = {}) {
    this.detailFixture = requireFixturePath(
      config.detailFixture ?? process.env.RELAY_PILOT_DETAIL_FIXTURE,
      'detailFixture',
      'RELAY_PILOT_DETAIL_FIXTURE',
    )
    this.listFixture = requireFixturePath(
      config.listFixture ?? process.env.RELAY_PILOT_LIST_FIXTURE,
      'listFixture',
      'RELAY_PILOT_LIST_FIXTURE',
    )
  }

  readDetail() {
    return readFixture(this.detailFixture, DETAIL_SCHEMA, 'detail')
  }

  readList() {
    return readFixture(this.listFixture, LIST_SCHEMA, 'list')
  }
}
