# round2-lifecycle — 第二轮复核后的补证（2026-08-20）

环境：Windows 11 · Node v24.12.0 · `dsh 0.1.0-rc.7`
`DSH_HOME`：`D:\MyFiles\ai-workflow\dh-relay-p4-pilot\dsh-home`（DevPlan 指定的独立 Home）
Profile：**`web`**；Host 为**目录（`link:`）安装**——即改造后才可能成立的那种装法
Fixture：`relay-control-pilot\testdata\fake`（DHR_25 冻结件）

第二轮换人复核（codex-ninth / gpt-5.6-sol，`--sandbox read-only`）提了两条 P1，本批是机器答复。

## P1-A：卸载清理没有动态证据

**复核指出**：此前 `absence-*` 的 `present:false` 都是 Host **以 `disabled: true` 启动**时取的——那时 `apply()` 根本没执行，只能证明「没注册过」，证明不了「注册了再卸载会清干净」；而 removed 态只有 `--dump-config` 的行数，那只能说明配置树里没这一行。

**补的两条独立证据**：

| 文件 | 步骤 | 结论 |
|---|---|---|
| `absence-external-host-installed.txt` | Host 装着，跑**包外**探针 | `present:true`，退出码 **1**（正控：探针不是恒假） |
| `absence-external-host-removed.txt` | `dsh plugin remove @personal/dsh-relay-host` 后跑同一探针 | `present:false`，退出码 **0** —— 探针活过了 remove，**直接对 removed 态发言** |
| `absence-external-host-reinstalled.txt` | 目录安装装回 Host 后再跑 | `present:true`，退出码 **1**（回到正控） |
| `service-lifecycle.json` | 用本机 rc.7 的**真 Cordis** 建 Context → `ctx.plugin(host)` → 读活服务 → `fiber.dispose()` → 再读 | `absent_before_apply` / `present_after_apply` / `absent_after_dispose` 三项皆真，判 `CLEANED`；活服务期间 `fixtureHash` = `67fb18b3…`（与四轮转录同）、`run_count` = 5 |

包外探针是个新包 `@personal/dsh-relay-absence-probe`（`src/dsh-absence-probe/`），只声明依赖不声明 `dsh.bundle`，所以装了也不会自动进 profile 的 bundle 列表，只有 `--patch` 点名时才加载。

## P1-B：转录校验器能自证一致

**复核指出**：`verify-transcript.mjs` 的待核清单取自转录自己的 `snapshot.detail_fixtures`，数组为空时 `every(...)` 空真、`degrade_honoured` 也空真——于是一份「只带正确 list、把 details 和 diagnostics 全删掉」的转录也能得到 `IDENTICAL`。

**改法**：期望清单改由调用方给（`--expect-list` / `--expect-details`），并新增四道检查：转录自称读的文件集必须等于期望集、`details` 的 key 集不得多出、缺 detail 的 run 集由**磁盘**算出后对上、`fixture_hash` 从**磁盘重算**再比；`detail_missing_returns_null` 必须严格为 `true`。

**变异对照**（证明断言真的会咬）：`transcript-mutations.txt` 是可复跑的 harness 输出，**1 条正控 + 12 条变异**：

| 变异 | 被哪条检查咬住 |
|---|---|
| `details` / `detail_fixtures` / `diagnostics` 全掏空（**旧校验器会判 IDENTICAL**） | `snapshot.details` / `snapshot.detail_fixtures` / `snapshot.diagnostics` |
| `fixture_hash` 替换 | `snapshot.fixture_hash` |
| 篡改某条 detail 的字段 | `snapshot.details` |
| 删掉 `detail-unlisted` 诊断 | `snapshot.diagnostics` |
| `detail_missing_run_id` 指向一条其实有 detail 的 run | `missing_run_is_really_missing` |
| 改 `snapshot.schema_version` | `snapshot.schema_version` |
| 改信封 `service` | `service` |
| 篡改 `list_sha256` | `list_sha256` |
| 往 `details` 里塞一条计划外的 run | `snapshot.details` |
| 把 `detail_missing_returns_null` 翻成 false | `missing_returns_null` |
| 往信封里加一个计划外的键 | `no_unexpected_payload_keys` |
| 重排 `detail_fixtures` 顺序 | `snapshot.detail_fixtures` |

真转录（`transcript-report.json`）仍判 `IDENTICAL`。

`contract-mutations.txt` 是另一套 harness（`contract-mutation-check.mjs`），针对包契约断言的 **9 条变异**：动态 import / `createRequire` / `require()` / 未登记的根 `.mjs` / default 导出 / 子目录 `lib/sneaky.mjs`（声明与未声明两种）/ 深层 `lib/test/` / 根目录 `.cjs`，**全部见红**。

## 怎么复跑

```powershell
$env:DSH_HOME = 'D:\MyFiles\ai-workflow\dh-relay-p4-pilot\dsh-home'
$env:RELAY_PILOT_FIXTURE_ROOT = 'D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\testdata\fake'
Set-Location 'D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot'

# 生命周期探针（不需要起 DSH）
node .\src\dsh-host\scripts\service-lifecycle-probe.mjs `
  --cordis "$env:APPDATA\npm\node_modules\@deepseek-ai\dsh\node_modules\@deepseek-ai\cordis\lib\index.js" `
  --fixture-root .\testdata\fake --list-fixture runs-active.json `
  --detail-fixtures "run-basic.json,run-blocked.json,run-chinese.json,run-empty.json,run-status-matrix.json" `
  --out service-lifecycle.json

# 包外探针三态
dsh plugin --profile web add .\src\dsh-absence-probe
dsh --profile web --patch .\src\dsh-absence-probe\absence.patch.yml          # present:true  exit 1
dsh plugin --profile web remove @personal/dsh-relay-host
dsh --profile web --patch .\src\dsh-absence-probe\absence.patch.yml          # present:false exit 0
dsh plugin --profile web add .\src\dsh-host
dsh --profile web --patch .\src\dsh-absence-probe\absence.patch.yml          # present:true  exit 1

# probe 转录 + 严格校验
dsh --profile web --patch .\src\dsh-host\probe.patch.yml > probe-transcript.txt
node .\src\dsh-host\scripts\verify-transcript.mjs --transcript probe-transcript.txt `
  --fixture-root .\testdata\fake --expect-list runs-active.json `
  --expect-details "run-basic.json,run-blocked.json,run-chinese.json,run-empty.json,run-status-matrix.json" `
  --out transcript-report.json
```

## 这批证据**不**覆盖什么

verify 收口与用户签收。DSH 桌面控制面轨的三态裁定不在本卡（归 DHR_27 人判）。
