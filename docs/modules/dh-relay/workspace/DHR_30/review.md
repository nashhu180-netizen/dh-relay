<!-- dh:v1 -->
# review — DHR_30 Relay CLI 与可选 DSH/Pi Bridge

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

**第一轮·批次小审合集**

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|
| 尚未派出 | 施工中 | — | — | — |

**第二轮·增量复核**

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|------|
| 尚未派出 | 施工中 | — | 需人裁决 | — | — |

**返工收敛**

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|------|--------------|----------------------|---------|
| 1 | | | |

需求复核与教训复核尚未派出；施工完成后按标准档独立登记。

## 第 4 路·一致性复核（横向：本次动的口径 vs 同类路径既有定义）

<!-- dh:consistency-review:v1 task=DHR_30 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|---------|-------------|------|---------|
| CLI/Bridge Read Model | 待施工后列出同类 RPC/renderer 路径 | 一致 | 无需处置 | 待复核 |

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：待施工与独立复核后填写。

**设计契约传导声明**：待施工后填写。

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| CLI 独立控制面与可选 Bridge | 真实 RPC Runtime；DSH 未安装 CLI 运行；Bridge 真正渲染时截图 | E-001（仅开工授权） | 待人验 |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---------|------|-------------|------|
| 1 | DSH 未安装时，`relay list/status/inspect/events --follow/start/stop/resume` 均可经 RPC 使用，CLI 不依赖 DSH。 | AI | | |
| 2 | CLI 文本与 JSON 同源于 Runtime Read Model；字段定义以两份 P4 pilot schema 和 v1-gap 处置表为起点，`group` 两条镜像断言成立，P4 白名单例外按指定标记关闭。 | AI | | |
| 3 | 客户端断开、退出或 SSH 断链不取消 Run；重连从 Runtime 重建状态。重复 control request 以 request id 幂等，Receipt 唯一。 | AI | | |
| 4 | DSH Bridge 经 RPC 做查询、订阅、重连与窄控制；Pi/其他客户端 fixture 与 RPC 示例可解析；Bridge 不直接写 Store。 | AI | | |
| 5 | Bridge 若执行，有真实 DSH 渲染截图作为需求境证据；目标机 UI/H-e2e 未验证边界如实保留。 | AI | | |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|----------|--------|-------|---------|-------------|---------|-----------|-----------|----------------|------------------|---------------------|
| CLI 七命令无 DSH 可用 | 真实 RPC 端到端测试 | machine | DHR30-M1 | 无法取证 | 每个命令经同一 Runtime/RPC 成功 | | | RPC server + test | DHR_31 闭环不在本卡 | relay.rpc/v1 | node test | 自动 |
| Read Model 同源与字段定义 | text/json 对照、镜像断言、design 双端标记 | machine | DHR30-M2 | 无法取证 | 共享 Read Model，断言均通过 | | | frozen schemas | 后续客户端未接入 | relay.run-state/v1 | node test/rg | 自动 |
| 断连与 control 幂等 | 真实 socket 回归 | machine | DHR30-M3 | 无法取证 | Store 零 cancel、重连同态、Receipt 唯一 | | | Store event/state | 完整 workflow 留 DHR_31 | relay.rpc/v1 | node test | 自动 |
| 条件 Bridge/Pi 接缝 | RPC adapter、fixture 解析、真实渲染截图 | machine | DHR30-M4 | 无法取证 | 无 Store 直写且 DSH/Pi 消费同一对象 | | | RPC protocol | 目标机 UI/H-e2e 未证 | relay.rpc/v1 | tests/screenshot | 自动 |

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [ ]

**as-built 更新了没**：`as-built/relay-core.md` 已覆盖更新？ [ ]

→ 当前状态：**施工中**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

本卡没有独立人判验收项；若后续证据显示必须由用户裁决 Bridge 实用性或 DHR_50 约束解释，先停下补入该项，不得预填通过。
