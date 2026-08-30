<!-- dh:v1 -->
# DHR_64 · Review

## 独立复核区

**第一轮（fresh Herdr）**

| 复核者 | 范围 | 结论 | 派出证据 | 原始记录 |
|---|---|---|---|---|
| `dhr64_r1`，最终独立复验 `dhr64_r1b` | 全程增量、恢复 gate、Store 原子提交与定向回归 | PASS（整改后 P0=0，P1=0） | log:review-code1-final.md | `review-code1-codex.md`、`review-code1-reverify.md`、`review-code1-final.md` |

**第二轮（fresh Herdr）**

| 复核者 | 范围 | 结论 | 派出证据 | 原始记录 |
|---|---|---|---|---|
| `dhr64_r2`（未参与施工或第一轮） | 全程与收口增量、Store identity 边界、有效 mutation | PASS（P0=0，P1=0；mutation 红 6 fail、还原后绿 10/10） | log:review-code2-herdr.md | `review-code2-herdr.md` |

**需求复核结论**：PASS（P0=0，P1=0）；拒绝矩阵、prepared recovery、Herdr observation 与 v1 Attention 兼容均由有终态的独立测试覆盖，冻结范围无漂移｜派出=log:review-req-reverify-herdr.md｜证据=`E-6413`、`E-6414`、`E-6415`

**教训复核结论**：PASS（P0=0，P1=0）；v2 close/error waiter 已统一 reject/cleanup，且拒绝矩阵、observation 与 mutation hash 经 fresh 复验｜派出=log:review-lessons-reverify-herdr.md｜证据=`E-6412`、`E-6413`、`E-6414`、`E-6417`

## AI 提交区

### 需求对齐证据

| 需求 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| Host done 只等待 Receipt submission；提交后才成为 Result | done/idle 无 submission→Attention/零 Result；匹配 Receipt submission→Store committed Result | E-6406、E-6414、E-6418 | 满足 |

## 完成条件逐条挂证据（验收靶子）

| # | 完成条件 | 事实证明方式 | 谁验 | 稳定 ID | 覆盖态 | 证据 | 达成? |
|---|---|---|---|---|---|---|---|
| 1 | 仅当前 Attempt Receipt 接受 submission；仅 committed 同 digest 重复可幂等；其余重复、冲突、旧/fenced/pause/终态/未认证/lease-lost/损坏/截断均不改账。 | RPC/CLI/Store 负例矩阵 | machine | P6-RI-A1A3 | 已验证 | E-6406、E-6413、E-6418 | 是 |
| 2 | Result file、事件与 Attempt 状态由同一 recovery journal 原子提交；prepared 强杀点恢复无孤儿/矛盾，Ack 在 committed 后返回。 | prepared 强杀恢复矩阵 | machine | DHR64-A2 | 已验证 | E-6418 | 是 |
| 3 | service ready 前恢复 receiver/actor/lease/driver gate；失败不得改账或新开 Receipt/Agent/fallback，service 不得绕过 driver gate 直写 Result。 | service ready 前恢复与拒绝测试 | machine | DHR64-A3 | 已验证 | E-6406、E-6418 | 是 |
| 4 | done、judge、capture、pane、host status、exit code 均不直写结果或触发 quota/fallback；Herdr completion instruction 仅承载 Receipt submission，缺失进入人工等待。 | Herdr done/judge/capture/pane/exit 负例 | machine | P6-RI-A2 | 已验证 | E-6414、E-6418 | 是 |
| 5 | v1 保持 Attention 语义，v2 不静默降级；失败 reason 固定 `E_EXECUTOR_REPORTED_FAILURE`。 | 兼容测试 | machine | DHR64-A5 | 已验证 | E-6403、E-6418 | 是 |

### 放行分类（H=0）

| 稳定 ID | 最终裁决者 | 实际执行结果 |
|---|---|---|
| P6-RI-A1A3 | machine | pass（E-6406、E-6413、E-6418） |
| DHR64-A2 | machine | pass（E-6418） |
| DHR64-A3 | machine | pass（E-6406、E-6418） |
| P6-RI-A2 | machine | pass（E-6414、E-6418） |
| DHR64-A5 | machine | pass（E-6403、E-6418） |

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_64 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| Receipt-bound Result 成功路径 | contracts、store、rpc、service、driver、Herdr completion 与 CLI | 一致：唯一提交入口、Receipt identity/fence、terminal/recovery 与 close/error waiter 语义一致 | PASS（P0=0，P1=0；未把 done/judge/capture 重新接回 Result） | log:review-consistency-herdr.md |

## 有效单测·变异点登记

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人 | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| `relay-core/store/store.mjs:708` | `executorKind !== 'herdr-agent'` → `executorKind !== 'process'` | Receipt→Result 的 Herdr identity 边界 | `DHR64 Store bridge: only a current receipt-bound submission commits a server result` | `cd relay-core; node --test --test-concurrency=1 test/dhr64-result-bridge.test.mjs` | `653F5C81A53A705114E3A0592F899E3FE54FECE4C3A5BBFD2076D12B0B0A226E` | `653F5C81A53A705114E3A0592F899E3FE54FECE4C3A5BBFD2076D12B0B0A226E` | fresh code round 2 reviewer | 红：目标 Store bridge 失败、套件共 6 fail；原样还原后绿：10 pass / 0 fail / exit 0。 |

## 人类签名区

本卡验收项均为机器证；E10 已展示本卡稳定回归、合同/能力检查与全量回归未得终态边界。

- [x] **E10/E11 本地收口授权**（2026-08-30，用户对话“确认”“继续 verify”）：认可 DHR_64 以 E-6418（15/15、全部 exit 0）和 E-6419（audit 0 违规、validator 57/57、capability 20、语法/diff clean）作为本卡绿色机器证；确认默认 `npm test` 的 Windows 无终态不被写为绿色。授权精确本地 squash、主干复验、`verify(dh-relay)`、DevPlan/workspace 回填；不含 push、部署、环境操作、DHR_65/DHR_35 或真实 Agent。
- 放行结论：`full`，Risk-Count=0；本卡无待人判结果、无 open P0/P1、无未验证项。
