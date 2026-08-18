/**
 * DHR_26 tree-out Host plugin source pack.
 *
 * The plugin registers `ctx.relayPilot` and exposes DHR_25 fake Read Models as
 * ordinary JSON. It deliberately avoids importing DSH private runtime types;
 * the only DSH-facing seam is Cordis service registration.
 */

import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { Buffer } from 'node:buffer'
import type { Context } from '@deepseek-ai/cordis'
import { Service } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'

export const name = 'dsh-relay-pilot-host'

const DEFAULT_MAX_BYTES = 1_000_000
const DEFAULT_SOURCE_LABEL = 'DHR_25 fake Read Model'

export interface Config {
  /** Absolute path to a `relay.pilot-read-model/v1` fixture. */
  detailFixturePath?: string
  /** Absolute path to a `relay.pilot-run-list/v1` fixture. */
  listFixturePath?: string
  /** Maximum UTF-8 bytes accepted for one fixture. */
  maxBytes?: number
  /** Human-readable evidence label returned by `snapshot()`. */
  sourceLabel?: string
}

export const Config: z<Config> = z.object({
  detailFixturePath: z.string().default(''),
  listFixturePath: z.string().default(''),
  maxBytes: z.number().default(DEFAULT_MAX_BYTES),
  sourceLabel: z.string().default(DEFAULT_SOURCE_LABEL),
})

type ResolvedConfig = Required<Config>

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

export interface RelayPilotFixtureMeta {
  path: string
  bytes: number
  sha256: string
  schemaVersion?: string
}

export interface RelayPilotSnapshot {
  service: 'ctx.relayPilot'
  protocol: 'relay.pilot-host/v1'
  dshBaseline: '0.1.0-rc.7'
  sourceLabel: string
  detail: RelayPilotFixtureMeta
  list: RelayPilotFixtureMeta
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    relayPilot: RelayPilot
  }
}

/** Host-side seam used by DHR_49 and smoke probes. */
export default class RelayPilot extends Service {
  static Config: z<Config> = Config

  private readonly config: ResolvedConfig

  constructor(ctx: Context, config: Config = {}) {
    super(ctx, 'relayPilot')
    this.config = resolveConfig(config)
  }

  /** Return the detail Read Model as plain JSON, with no host-side inference. */
  async detail(): Promise<JsonValue> {
    return (await this.readFixture(this.config.detailFixturePath)).json
  }

  /** Return the list Read Model as plain JSON, with no status-derived grouping. */
  async list(): Promise<JsonValue> {
    return (await this.readFixture(this.config.listFixturePath)).json
  }

  /** Return low-cost evidence for smoke transcripts and fixture hash matching. */
  async snapshot(): Promise<RelayPilotSnapshot> {
    const [detail, list] = await Promise.all([
      this.readFixture(this.config.detailFixturePath),
      this.readFixture(this.config.listFixturePath),
    ])
    return {
      service: 'ctx.relayPilot',
      protocol: 'relay.pilot-host/v1',
      dshBaseline: '0.1.0-rc.7',
      sourceLabel: this.config.sourceLabel,
      detail: detail.meta,
      list: list.meta,
    }
  }

  private async readFixture(path: string): Promise<{ json: JsonValue; meta: RelayPilotFixtureMeta }> {
    const text = await readFile(path, 'utf8')
    const bytes = Buffer.byteLength(text, 'utf8')
    if (bytes > this.config.maxBytes) {
      throw new Error(`relayPilot: fixture exceeds maxBytes (${bytes} > ${this.config.maxBytes}): ${redactPath(path)}`)
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`relayPilot: invalid JSON fixture ${redactPath(path)}: ${message}`)
    }

    const json = clonePlainJson(parsed, '$')
    const meta: RelayPilotFixtureMeta = {
      path: redactPath(path),
      bytes,
      sha256: createHash('sha256').update(text).digest('hex'),
    }
    const schemaVersion = schemaVersionOf(json)
    if (schemaVersion !== undefined) meta.schemaVersion = schemaVersion
    return { json, meta }
  }
}

/** Function-plugin entry point for loaders that call `apply(ctx, config)`. */
export function apply(ctx: Context, config: Config = {}): void {
  new RelayPilot(ctx, config)
}

function resolveConfig(config: Config): ResolvedConfig {
  const resolved: ResolvedConfig = {
    detailFixturePath: config.detailFixturePath ?? '',
    listFixturePath: config.listFixturePath ?? '',
    maxBytes: config.maxBytes ?? DEFAULT_MAX_BYTES,
    sourceLabel: config.sourceLabel ?? DEFAULT_SOURCE_LABEL,
  }
  assertNonEmptyPath('detailFixturePath', resolved.detailFixturePath)
  assertNonEmptyPath('listFixturePath', resolved.listFixturePath)
  if (!Number.isFinite(resolved.maxBytes) || resolved.maxBytes <= 0) {
    throw new Error('relayPilot: maxBytes must be a positive finite number')
  }
  return resolved
}

function assertNonEmptyPath(name: string, value: string): void {
  if (value.trim() === '') throw new Error(`relayPilot: ${name} is required`)
}

function clonePlainJson(value: unknown, path: string): JsonValue {
  if (value === null) return null
  const valueType = typeof value
  if (valueType === 'string' || valueType === 'boolean') return value as string | boolean
  if (valueType === 'number') {
    if (!Number.isFinite(value)) throw new Error(`relayPilot: non-finite number at ${path}`)
    return value
  }
  if (Array.isArray(value)) return value.map((item, index) => clonePlainJson(item, `${path}[${index}]`))
  if (valueType === 'object') {
    if (Object.getPrototypeOf(value) !== Object.prototype) {
      throw new Error(`relayPilot: non-plain object at ${path}`)
    }
    const result: { [key: string]: JsonValue } = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      result[key] = clonePlainJson(item, `${path}.${key}`)
    }
    return result
  }
  throw new Error(`relayPilot: non-json value at ${path}`)
}

function schemaVersionOf(value: JsonValue): string | undefined {
  if (value !== null && !Array.isArray(value) && typeof value === 'object') {
    const schemaVersion = value.schema_version
    return typeof schemaVersion === 'string' ? schemaVersion : undefined
  }
  return undefined
}

function redactPath(path: string): string {
  return path
    .replace(/^[A-Za-z]:\\MyFiles\\ai-workflow\\dh-relay-p4-pilot\\/i, '<experiment-root>\\')
    .replace(/^[A-Za-z]:\\Users\\[^\\]+\\/i, '<user-home>\\')
    .replace(/^\/home\/[^/]+\//, '<user-home>/')
}
