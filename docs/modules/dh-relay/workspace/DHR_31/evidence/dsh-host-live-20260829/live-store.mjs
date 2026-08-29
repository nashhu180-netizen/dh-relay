// live-store.mjs — DHR_31 批 5：把 Relay v2 的活数据投影成 Pilot 面板吃的模型。
//
// 为什么是投影而不是「换个读法」：面板消费的是 P4 期的 `relay.pilot-run-list/v1` /
// `relay.pilot-read-model/v1`，而 Bridge 能给的只有冻结的 `relay.client-read-model/v1`，
// 两者字段集**不是子集关系**。缺的那些字段分两类，处理方式也必须分开：
//
//   · **P5 里根本不存在的**（Attention 族）—— `attentions: []` 是事实陈述：本期没有
//     Attention 这个概念，所以这个 Run 确实一条都没有。不是兜底，是真值。
//   · **存在于 `relay.run/v2` 运行文档、但冻结 RPC 不暴露的**（`workflow_name`、节点的
//     `title`/`role`/`depends_on`、`trigger_by` …）—— 一律**整个键省掉**，绝不填 null
//     更不拿 `node_id` 冒充 `title`：`relay.run/v2` 的 title 描述逐字写着「实现不得用
//     node_id 自动兜底填充——那等于把 P4 的有损降级写进协议」。
//
// 省键而不是填 null，还有个实际好处：面板的取值点全是 `"k" in run` / `Array.isArray(x)` /
// `kv()`（跳过 undefined）这类守卫，键不在就自然渲染成空或「—」，**面板一行都不用改**。
// 用户 2026-08-29 裁决里放宽的「允许改 dsh-client 校验」因此没有动用（见 F-018）。
//
// 用户裁决（2026-08-29 对话确认）：缩到 design/06 H3 本意——「附加客户端连接后看到**同一
// 状态**」。同一状态指 run_id / run_status / group / progress / updated_at 这些真值一致，
// 不指把 P4 那套富模型复原出来。

import { execFile, execFileSync } from 'node:child_process'
import { join } from 'node:path'

import {
  DETAIL_SCHEMA_VERSION,
  LIST_SCHEMA_VERSION,
  SNAPSHOT_SCHEMA_VERSION,
  cloneJson,
  sha256Canonical,
} from './fixture-store.mjs'

/** 活数据的来源标记，和 fixture 的 `source_kind: 'fake'` 并列，便于一眼分辨屏上是什么。 */
export const LIVE_SOURCE_KIND = 'relay-v2'

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value)

/** 只在确有其值时落键——省键即「未知」，与「已知为空」严格分开。 */
function put(target, key, value) {
  if (value === undefined || value === null) return target
  target[key] = value
  return target
}

/**
 * 列表项投影。输入是 `listRuns` 的 RunSummary（6 个字段）加上该 Run 的 detail（run-state/v1）。
 * detail 可以为 null（拿不到就不编），此时只落 summary 那几个真值。
 */
export function projectListRun(summary, detail = null) {
  const run = {}
  put(run, 'run_id', summary?.run_id)
  put(run, 'run_status', summary?.run_status)
  put(run, 'group', summary?.group)
  put(run, 'updated_at', summary?.updated_at ?? detail?.updated_at)
  // progress / elapsed_seconds 是 run-state/v1 的真字段，不是推出来的。
  if (isRecord(detail?.progress)) put(run, 'progress', cloneJson(detail.progress))
  if (Number.isInteger(detail?.elapsed_seconds)) put(run, 'elapsed_seconds', detail.elapsed_seconds)
  // 刻意不落：workflow_name / trigger / trigger_by / attempt / started_at /
  // current_node_id / current_node_title / log_locator / summary —— 活数据源里没有。
  // attention_count 同样不落：面板判的是 `run.attention_count > 0`，键不在即为假。
  return run
}

/** 详情投影。`nodes[]` 只带 v2 真有的三样：node_id、状态、attempt 计数。 */
export function projectDetail(detail) {
  if (!isRecord(detail)) return null
  const nodes = Array.isArray(detail.node_states) ? detail.node_states.map((node) => {
    const projected = {}
    put(projected, 'node_id', node?.node_id)
    put(projected, 'node_status', node?.status)
    // attempt_count 的 null 在 v2 里读作「源头没记」，不是 0——所以只在是整数时落键。
    if (Number.isInteger(node?.attempt_count)) projected.attempt = node.attempt_count
    // 刻意不落：title / role / depends_on —— 它们在 relay.run/v2 运行文档里，
    // 而冻结 RPC 方法集不暴露运行文档。面板对 depends_on 的取值点会渲染成「—」。
    return projected
  }) : []

  const model = {
    schema_version: DETAIL_SCHEMA_VERSION,
    run_id: detail.run_id,
    source_kind: LIVE_SOURCE_KIND,
  }
  put(model, 'run_status', detail.run_status)
  put(model, 'updated_at', detail.updated_at)
  model.nodes = nodes
  // P5 没有 Attention 这个概念 ⇒ 这个 Run 确实零条。空数组是真值，不是占位。
  model.attentions = []
  return model
}

/** 把一批 (summary, detail) 投影成完整快照，形状与 fixture 快照一致（面板不关心来源）。 */
export function projectSnapshot(entries, { updatedAt } = {}) {
  const runs = entries.map(entry => projectListRun(entry.summary, entry.detail))
  const details = Object.create(null)
  for (const entry of entries) {
    const model = projectDetail(entry.detail)
    if (model && typeof model.run_id === 'string') details[model.run_id] = model
  }
  const list = { schema_version: LIST_SCHEMA_VERSION, source_kind: LIVE_SOURCE_KIND, runs }
  put(list, 'updated_at', updatedAt)

  const payload = { list, details }
  return {
    schema_version: SNAPSHOT_SCHEMA_VERSION,
    // 名字沿用 fixture_hash（五方法签名冻结），语义仍是「这份内容的指纹」——
    // 活数据下它每次刷新都可能变，面板只用它判「内容变没变」。
    fixture_hash: sha256Canonical(payload),
    source_kind: LIVE_SOURCE_KIND,
    diagnostics: [],
    list,
    details,
  }
}

/**
 * 取数有两条路，都不越过本包的安装拓扑契约。
 *
 * ① **spawn sidecar（DSH 里走的这条，F-019 用户 2026-08-29 裁决）**：按 `relayCoreRoot`
 *    绝对路径起 `adapters/dsh-bridge/snapshot-main.mjs`，读它 stdout 的 JSON。
 *    为什么不是在本进程里 import Bridge——`test/package-contract.test.mjs` 禁止裸说明符、
 *    `require`、以及**计算出来的动态 `import()`**（「光读源码核不出它指向哪」），那条契约
 *    是一次 `ERR_MODULE_NOT_FOUND` 启动失败逼出来的。`spawn` 不经过模块解析，两边契约
 *    都不必让步。`node:child_process` / `node:path` 是字面 `node:` 说明符，契约允许。
 *
 * ② **注入 connect（测试与探针走这条）**：调用方直接把 `connectDshBridge` 交进来，
 *    省掉一次进程启动。DSH profile 只能传数据不能传函数，所以它在 DSH 里用不上。
 *
 * 两条路产出**同一个形状** `{ list, details }`，投影那半段因此完全共用。
 */
function runSidecar(relayCoreRoot, repoRoot, credentialRoot) {
  const script = join(relayCoreRoot, 'adapters', 'dsh-bridge', 'snapshot-main.mjs')
  const args = [script, '--repo', repoRoot]
  if (credentialRoot) args.push('--credential-root', credentialRoot)
  return new Promise((resolve, reject) => {
    execFile(process.execPath, args, { maxBuffer: 32 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`snapshot-main failed: ${String(stderr || error.message).trim()}`))
        return
      }
      try {
        resolve(JSON.parse(stdout))
      } catch (parseError) {
        reject(new Error(`snapshot-main returned non-JSON: ${parseError.message}`))
      }
    })
  })
}

/** 把 `{ list, details }` 摊成投影用的 (summary, detail) 对。 */
export function entriesFromReadModel(readModel) {
  const items = Array.isArray(readModel?.list?.items) ? readModel.list.items : []
  return items.map(summary => ({ summary, detail: readModel?.details?.[summary?.run_id] ?? null }))
}

/**
 * 活数据仓：对外五个方法保持**同步**（签名冻结），内部靠后台刷新维护一份最新快照。
 *
 * 同步这一点是硬要求——`ctx.provide` 出去的 `relayPilot` 五方法在 P4 就是同步的，面板按
 * 同步调用写死了。所以这里不能把方法改成 async，只能让它们读缓存。
 */
export class LiveRelayPilotRepository {
  constructor({ repoRoot, relayCoreRoot, connect, credentialRoot, refreshIntervalMs = 2000 } = {}) {
    this._repoRoot = repoRoot
    this._relayCoreRoot = relayCoreRoot
    this._connect = connect
    this._credentialRoot = credentialRoot
    this._refreshIntervalMs = refreshIntervalMs
    this._bridge = null
    this._timer = null
    this._closed = false
    // 起手是一份空快照 + 一条 connecting 诊断：面板拿到的永远是合法模型，
    // 不会因为「还没连上」而看到 undefined。
    this._snapshot = {
      schema_version: SNAPSHOT_SCHEMA_VERSION,
      fixture_hash: sha256Canonical({ list: { runs: [] }, details: {} }),
      source_kind: LIVE_SOURCE_KIND,
      diagnostics: [{ code: 'live-connecting' }],
      list: { schema_version: LIST_SCHEMA_VERSION, source_kind: LIVE_SOURCE_KIND, runs: [] },
      details: Object.create(null),
    }
    // spawn 模式**同步预热一次**。理由：`apply()` 是同步的，Cordis 一挂上服务就可能有人读
    // ——一次性 probe 正是这样，它在 boot 当场读完就退出。异步预热会让第一个读者拿到
    // 那份 `live-connecting` 空快照（实测如此），面板首屏也会空一拍。这里用有界的
    // `execFileSync` 把第一帧堵齐；失败只写 diagnostics，绝不把宿主拖垮。
    if (this._relayCoreRoot && typeof this._connect !== 'function') this._primeSync()
  }

  /** 有界同步预热。超时/失败都降级成一条 diagnostics，让面板显示原因而不是崩。 */
  _primeSync() {
    try {
      const script = join(this._relayCoreRoot, 'adapters', 'dsh-bridge', 'snapshot-main.mjs')
      const args = [script, '--repo', this._repoRoot]
      if (this._credentialRoot) args.push('--credential-root', this._credentialRoot)
      const stdout = execFileSync(process.execPath, args, {
        timeout: 20000, maxBuffer: 32 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
      })
      this._snapshot = projectSnapshot(entriesFromReadModel(JSON.parse(stdout)), {
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      this._degrade('live-prime-failed', error)
    }
  }

  /** 就绪并做第一次拉取。失败不抛给宿主——写进 diagnostics，让面板显示而不是崩。 */
  async start() {
    try {
      if (typeof this._connect === 'function') {
        this._bridge = await this._connect({
          repoRoot: this._repoRoot,
          credentialRoot: this._credentialRoot,
        })
      } else if (!this._relayCoreRoot) {
        throw new Error('relay-pilot-config: live mode needs relayCoreRoot (or RELAY_PILOT_RELAY_CORE),'
          + ' or an injected `connect`')
      }
      await this.refresh()
    } catch (error) {
      this._degrade('live-connect-failed', error)
      return this
    }
    if (this._refreshIntervalMs > 0 && !this._closed) {
      this._timer = setInterval(() => { void this.refresh() }, this._refreshIntervalMs)
      this._timer.unref?.() // 绝不因为一个只读面板的轮询而拖住宿主进程退出
    }
    return this
  }

  /** 拉一轮活数据并整体换掉快照。**整体替换**：不做增量合并，免得半新半旧。 */
  async refresh() {
    if (this._closed) return this._snapshot
    try {
      const readModel = this._bridge
        ? await this._readViaBridge()
        : await runSidecar(this._relayCoreRoot, this._repoRoot, this._credentialRoot)
      this._snapshot = projectSnapshot(entriesFromReadModel(readModel), { updatedAt: new Date().toISOString() })
    } catch (error) {
      this._degrade('live-refresh-failed', error)
    }
    return this._snapshot
  }

  /** 注入模式：在本进程内用 Bridge 拼出与 sidecar 相同的 `{ list, details }`。 */
  async _readViaBridge() {
    const list = await this._bridge.listRuns({ includeLegacy: false })
    const details = {}
    for (const item of (Array.isArray(list?.items) ? list.items : [])) {
      try {
        const view = await this._bridge.inspect(item.run_id)
        details[item.run_id] = isRecord(view?.detail) ? view.detail : null
      } catch {
        // 单条读不到不该让整屏空掉——它仍以 summary 的真值出现在列表里。
        details[item.run_id] = null
      }
    }
    return { list, details }
  }

  _degrade(code, error) {
    this._snapshot = {
      ...this._snapshot,
      diagnostics: [{ code, message: String(error?.message ?? error) }],
    }
  }

  close() {
    this._closed = true
    if (this._timer) clearInterval(this._timer)
    this._timer = null
    this._bridge?.close?.()
    this._bridge = null
  }

  // ── 冻结的五方法（与 RelayPilotRepository 逐字同签名、同返回形状）────────────
  fixtureHash() { return this._snapshot.fixture_hash }
  diagnostics() { return cloneJson(this._snapshot.diagnostics) }
  listRuns() { return cloneJson(this._snapshot.list) }
  getRun(runId) {
    if (typeof runId !== 'string' || runId.length === 0) return null
    if (!Object.hasOwn(this._snapshot.details, runId)) return null
    return cloneJson(this._snapshot.details[runId])
  }
  snapshot() { return cloneJson(this._snapshot) }
}
