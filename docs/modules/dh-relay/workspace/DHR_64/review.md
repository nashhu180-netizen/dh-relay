<!-- dh:v1 -->
# DHR_64 · Review

## 独立复核区

| 路径 | 复核者 | 结论 | 原始记录 |
|---|---|---|---|
| 代码轮 1 | fresh Herdr reviewer `dhr64_r1` + 独立最终复验 `dhr64_r1b` | PASS（P0=0，P1=0） | `review-code1-codex.md`、`review-code1-reverify.md`、`review-code1-final.md` |
| 代码轮 2 | fresh Herdr reviewer `dhr64_r2` | PASS（P0=0，P1=0） | `review-code2-herdr.md` |
| 需求方向 | Herdr reviewer `dhr64_r1b` + 整改复验 | PASS（P0=0，P1=0） | `review-req-herdr.md`、`review-req-reverify-herdr.md` |
| 教训 | Herdr reviewer `dhr64_r1b` + 整改复验 | PASS（P0=0，P1=0） | `review-lessons-herdr.md`、`review-lessons-reverify-herdr.md` |
| 一致性 | fresh Herdr reviewer `dhr64_r2` | PASS（P0=0，P1=0） | `review-consistency-herdr.md` |

## AI 提交区

### 需求对齐证据

| 需求 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| Host done 只等待 Receipt submission；提交后才成为 Result | done/idle 无 submission→Attention/零 Result；匹配 Receipt submission→Store committed Result | E-6406、E-6414、E-6418 | 已验证 |

## 完成条件逐条挂证据（验收靶子）

| # | 完成条件 | 事实证明方式 | 谁验 | 稳定 ID | 覆盖态 | 证据 | 达成? |
|---|---|---|---|---|---|---|---|
| 1 | 仅当前 Attempt Receipt 接受 submission；仅 committed 同 digest 重复可幂等；其余重复、冲突、旧/fenced/pause/终态/未认证/lease-lost/损坏/截断均不改账。 | RPC/CLI/Store 负例矩阵 | machine | P6-RI-A1A3 | 已验证 | E-6406、E-6413、E-6418 | 是 |
| 2 | Result file、事件与 Attempt 状态由同一 recovery journal 原子提交；prepared 强杀点恢复无孤儿/矛盾，Ack 在 committed 后返回。 | prepared 强杀恢复矩阵 | machine | DHR64-A2 | 已验证 | E-6418 | 是 |
| 3 | service ready 前恢复 receiver/actor/lease/driver gate；失败不得改账或新开 Receipt/Agent/fallback，service 不得绕过 driver gate 直写 Result。 | service ready 前恢复与拒绝测试 | machine | DHR64-A3 | 已验证 | E-6406、E-6418 | 是 |
| 4 | done、judge、capture、pane、host status、exit code 均不直写结果或触发 quota/fallback；Herdr completion instruction 仅承载 Receipt submission，缺失进入人工等待。 | Herdr done/judge/capture/pane/exit 负例 | machine | P6-RI-A2 | 已验证 | E-6414、E-6418 | 是 |
| 5 | v1 保持 Attention 语义，v2 不静默降级；失败 reason 固定 `E_EXECUTOR_REPORTED_FAILURE`。 | 兼容测试 | machine | DHR64-A5 | 已验证 | E-6403、E-6418 | 是 |

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_64 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| Receipt-bound Result 成功路径 | contracts、store、rpc、service、driver、Herdr completion 与 CLI | 待执行 | 待执行 | |

## 有效单测·变异点登记

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人 | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| `relay-core/store/store.mjs:708` | `executorKind !== 'herdr-agent'` → `executorKind !== 'process'` | Receipt→Result 的 Herdr identity 边界 | `DHR64 Store bridge: only a current receipt-bound submission commits a server result` | `cd relay-core; node --test --test-concurrency=1 test/dhr64-result-bridge.test.mjs` | `653F5C81A53A705114E3A0592F899E3FE54FECE4C3A5BBFD2076D12B0B0A226E` | `653F5C81A53A705114E3A0592F899E3FE54FECE4C3A5BBFD2076D12B0B0A226E` | fresh code round 2 reviewer | 红：目标 Store bridge 失败、套件共 6 fail；原样还原后绿：10 pass / 0 fail / exit 0。 |

## 人类签名区

本卡验收项均为机器证；收口时仍须展示 E10 证据并取得用户的本地收口授权，不得预填通过。
