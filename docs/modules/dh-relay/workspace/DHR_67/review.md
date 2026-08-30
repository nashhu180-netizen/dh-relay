<!-- dh:v1 -->
# DHR_67 · Review

## 独立复核区

本卡任务类型为 **heavy**。施工者不得复核自己的卡；代码轮 1、代码轮 2、需求、教训、一致性五路均须由未参与施工的独立实例完成，第二轮复核者选择 mutation 点。

| 路径 | 复核者 | 范围 | 结论 | 派出证据 |
|---|---|---|---|---|
| 代码轮 1 | 待派 | Claude 分支、Codex 不变、failure cleanup 与 fake 断言 | 待执行 | — |
| 代码轮 2 | 待派 fresh-context | 全程与收口增量；选择 production mutation 点 | 待执行 | — |
| 需求 | 待派 | P6-RI-A4 启动前置、DHR35 边界与 Result 禁推导 | 待执行 | — |
| 教训 | 待派 | Herdr 生命周期/关闭纪律/零凭据要求 | 待执行 | — |
| 一致性 | 待派 | 与既有 `agentStart`、`paneKill` 和错误返回形态比对 | 待执行 | — |

## AI 提交区

### 需求对齐证据

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| P6-RI-A4 的 Windows Claude 启动前置 | fake Herdr 运行 Claude 成功及零/多/超时/rename 失败；逐项核对 pane ID、调用顺序、Attempt/Result 零副作用与 Codex 既有路径。 | E-6700 | 不满足 |

### 完成条件逐条挂证据

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | fake Herdr 证明 Claude 调用顺序、唯一命名与返回 handle 是 `pane run → 唯一识别 → rename`，Codex `agent start` 调用不变。 | machine | 待执行 | 待执行 |
| 2 | 识别到零/多个对象、识别超时或 rename 失败时，仅关闭本卡创建的同一新 pane，不绑定 Attempt、不创建 Result。 | machine | 待执行 | 待执行 |
| 3 | 工件、测试夹具与日志不泄露配置正文或凭据；Herdr observation 不生成 Result。 | machine | 待执行 | 待执行 |

### 验收项元数据表

| 命题 | 事实证明方式 | 最终裁决者 | 稳定 ID | 覆盖态 | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Claude Windows 受支持启动且失败不串 pane/Attempt/Result | fake Herdr 命令序列、handle、零副作用和 cleanup 断言；第二轮指定 mutation | machine | P6-RI-A4 | 待执行 | 成功与四类失败均有终态；失败 close ID=创建 ID；Codex argv 不变 | 待执行 | 本地 Node | fake CLI 调用账本 + 既有 Codex regression | 不启动真实 Claude；Receipt-bound 实录仍由 DHR35 承担 | design/12 | adapter tests | 自动化 |

- 设计契约无变化：仅将 Claude 的宿主启动改为已支持的 CLI 原语；不改 Receipt、Result、Store、RPC 或 contracts。
- 文档无需改：现有 `as-built/relay-core.md` 已描述 Herdr adapter 与 Result 观测边界；本卡只修 Windows Claude 启动接线。

→ 当前状态：**施工中**

## 人类签名区

本卡完成条件均为机器证。E10 将展示 fake Herdr 成功/失败序列、Codex 回归、mutation、卫生和完整日志落点；在此之前不勾选任何人类结果，也不执行 verify、合并、推送或部署。
