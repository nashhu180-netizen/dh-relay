<!-- dh:v1 -->
# DHR_67 · Review

## 独立复核区

本卡任务类型为 **heavy**。施工者不得复核自己的卡；代码轮 1、代码轮 2、需求、教训、一致性五路均由未参与施工的独立实例完成，第二轮选择有效 mutation。

**第一轮（fresh 独立复核）**

| 复核者 | 范围 | 发现 | 结论 | 派出证据 |
|---|---|---|---|---|
| `codex-review-dhr67-code1-reverify` | Claude 分支、Codex 不变、failure cleanup、真实对象形状与 fake 断言 | 初轮 F-6701；修正后复验 P0–P3=0；P2 修复另由 fresh code 复验 | PASS | 派出=e:E-6708；e:E-6713；e:E-6719 |

**第二轮（fresh-context 独立复核，未继承第一轮会话）**

| 复核者 | 范围 | 发现 | 结论 | 派出证据 |
|---|---|---|---|---|
| `codex-review-dhr67-code2-reverify` | 全程与修复增量、有效 mutation | 初轮 F-6701；修正后 P0–P3=0；mutation 有效 | PASS | 派出=e:E-6709；e:E-6714；e:E-6719 |

**需求复核结论**：PASS（F-6702 经 B-30 收窄并补 driver 回归后 resolved；P0/P1/P2/P3=0）｜派出=e:E-6710｜证据=`E-6722`

**教训复核结论**：PASS（P0/P1/P2/P3=0；Herdr 生命周期、关闭纪律和零凭据要求未重蹈）｜派出=e:E-6711｜证据=`E-6716`、`E-6721`

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_67 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| Herdr Claude 候选、rename target 与失败 cleanup | `herdr-cli.mjs`、`herdr-executor.mjs`、evidence/03、knowledge/herdr-派活操作.md | 一致：先按新 pane 判唯一，再验证 Claude 类型；rename 使用 pane ID；失败仅关闭同一新 pane；Codex 保持 `agent start` | PASS（F-6703 修复后 P0/P1/P2/P3=0；F-6702 已由 B-30 resolved） | 派出=e:E-6715；e:E-6720 |

## 有效单测·变异点登记

| 变异点 | 语义破坏 | 指定者 | 红测证据 | 还原绿测 | 结论 |
|---|---|---|---|---|---|
| `herdr-executor.mjs` 唯一候选判断 | `=== 1` 改为 `>= 1` | `codex-review-dhr67-code2-reverify` | E-6717：multiple 场景断言失败 | E-6716：DHR67/CLI 5/5 | PASS |

## AI 提交区

### 需求对齐证据

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| P6-RI-A4 的 Windows Claude 启动前置 | fake Herdr 运行 Claude 成功及零/多/非 Claude/延迟识别/rename 失败；driver 回归核对既有 Attempt、人工处理与零 Result。 | E-6716、E-6717、E-6722 | 满足：adapter 前置成立；真实 Claude 仍属 DHR35。 |

### 完成条件逐条挂证据

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | fake Herdr 证明 Claude 调用顺序、唯一命名与返回 handle 是 `pane run → 唯一 Claude 识别 → rename(pane ID)`，Codex `agent start` 调用不变。 | machine | E-6716、E-6717 | 是 |
| 2 | 识别到零/多个对象、识别超时或 rename 失败时，adapter 不额外创建 Attempt/Result；已创建 pane 时只关闭同一新 pane，既有 Attempt 进入人工处理。 | machine | E-6716、E-6722 | 是 |
| 3 | 工件、测试夹具与日志不泄露配置正文或凭据；Herdr observation 不生成 Result。 | machine | E-6706；E-6718 | 是 |

### 验收项元数据表

| 命题 | 事实证明方式 | 最终裁决者 | 稳定 ID | 覆盖态 | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Claude Windows 受支持启动且失败不串 pane/Attempt/Result | fake Herdr 命令序列、handle、cleanup、真实形状 fixture、driver 回归和第二轮指定 mutation | machine | P6-RI-A4 | 等价覆盖 | 成功与失败均有终态；已创建 pane 的失败 close ID=创建 ID；Codex argv 不变；adapter 不额外创建 Attempt/Result；既有 Attempt 进入人工处理 | E-6716、E-6717、E-6722 | 本地 Node | fake CLI 调用账本 + driver 状态/Result 清单 + 既有 Codex regression | 不启动真实 Claude；Receipt-bound 实录仍由 DHR35 承担 | design/12 | adapter tests | 自动化 |

- 设计契约无变化：仅将 Claude 的宿主启动改为已支持的 CLI 原语；不改 Receipt、Result、Store、RPC 或 contracts。
- 文档无需改：现有 `as-built/relay-core.md` 已描述 Herdr adapter 与 Result 观测边界；本卡只修 Windows Claude 启动接线。

→ 当前状态：**待人验（E10 证据包已备妥；未 verify、未合并）**

## 人类签名区

本卡完成条件均为机器证。E10 证据包：E-6716 定向/CLI 5/5、E-6717 mutation 红后还原、E-6718 Result bridge 10/10、E-6722 driver 回归 6/6、E-6723 miner/gate；gate 仅缺未授权的 `verify(...)`。不勾选任何人类结果，也不执行 verify、合并、推送或部署。
