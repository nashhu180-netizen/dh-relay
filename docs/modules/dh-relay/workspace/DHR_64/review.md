<!-- dh:v1 -->
# DHR_64 · Review

## 独立复核区

| 路径 | 复核者 | 结论 | 原始记录 |
|---|---|---|---|
| 代码轮 1 | 待派 fresh 复核者 | 待执行 | `review-code1-*.md` |
| 代码轮 2 | 待派另一 fresh 复核者 | 待执行 | `review-code2-*.md` |
| 需求方向 | 待派 fresh 复核者 | 待执行 | `review-req-*.md` |
| 教训 | 待派复核者 | 待执行 | `review-lessons-*.md` |
| 一致性 | 待派 fresh 复核者 | 待执行 | `review-consistency-*.md` |

## AI 提交区

### 需求对齐证据

| 需求 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| Host done 只等待 Receipt submission；提交后才成为 Result | 受控 completion→无 submission；再以匹配 Receipt v2 submission 提交 | E-6400（仅开工现场） | 待人验 |

## 完成条件逐条挂证据（验收靶子）

| # | 完成条件 | 事实证明方式 | 谁验 | 稳定 ID | 覆盖态 | 证据 | 达成? |
|---|---|---|---|---|---|---|---|
| 1 | 仅当前 Attempt Receipt 接受 submission；仅 committed 同 digest 重复可幂等；其余重复、冲突、旧/fenced/pause/终态/未认证/lease-lost/损坏/截断均不改账。 | RPC/CLI/Store 负例矩阵 | machine | P6-RI-A1A3 | 待验证 | | |
| 2 | Result file、事件与 Attempt 状态由同一 recovery journal 原子提交；prepared 强杀点恢复无孤儿/矛盾，Ack 在 committed 后返回。 | prepared 强杀恢复矩阵 | machine | DHR64-A2 | 待验证 | | |
| 3 | service ready 前恢复 receiver/actor/lease/driver gate；失败不得改账或新开 Receipt/Agent/fallback，service 不得绕过 driver gate 直写 Result。 | service ready 前恢复与拒绝测试 | machine | DHR64-A3 | 待验证 | | |
| 4 | done、judge、capture、pane、host status、exit code 均不直写结果或触发 quota/fallback；Herdr completion instruction 仅承载 Receipt submission，缺失进入人工等待。 | Herdr done/judge/capture/pane/exit 负例 | machine | P6-RI-A2 | 待验证 | | |
| 5 | v1 保持 Attention 语义，v2 不静默降级；失败 reason 固定 `E_EXECUTOR_REPORTED_FAILURE`。 | 兼容测试 | machine | DHR64-A5 | 待验证 | | |

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_64 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| Receipt-bound Result 成功路径 | contracts、store、rpc、service、driver、Herdr completion 与 CLI | 待执行 | 待执行 | |

## 有效单测·变异点登记

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人 | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| 待独立代码轮 2 选定 | | | | | | | | |

## 人类签名区

本卡验收项均为机器证；收口时仍须展示 E10 证据并取得用户的本地收口授权，不得预填通过。
