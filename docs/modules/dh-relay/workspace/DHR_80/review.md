<!-- dh:v1 -->
# review — DHR_80

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

**第一轮·批次小审合集**

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|
| 待每批派出 | 批次 1/2/3 的各自增量 diff 与证据 | 待填 | 待填 | 待填 |

**第二轮·增量复核**

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|------|
| 待 fresh 实例 | 全程、批次小审和收口增量 diff | 待填 | 待填 | 待填 | 待填 |

**有效单测·变异点登记**

| 变异点锚点(生产代码 path:line) | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人(重核须=轮2实例) | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| 待轮 2 选取本卡生产 diff 内锚点 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 | 待 fresh 轮 2 | 待填 |

**返工收敛**

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|------|--------------|----------------------|----------|
| 1 | 待填 | 待填 | 待填 |

**需求复核结论**：待 fresh 需求复核｜证据待填｜由待派实例｜派出=待填

**教训复核结论**：待 fresh 教训复核｜命中条目待填｜由待派实例｜派出=待填

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_80 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|----------|--------------|------|----------|
| retry Receipt submission mode 与普通 Attempt Receipt | `attempt-retry.mjs`、`workflow-driver.mjs`、submission gate 恢复 | 待填 | 待填 | 待填 |
| retry 结果提交与普通 Receipt-bound Result bridge | `service.mjs`、DHR64 bridge、DHR70 gate | 待填 | 待填 | 待填 |
| done/idle 无 submission 行为 | workflow driver、Herdr adapter、DHR78 startup dispatch | 待填 | 待填 | 待填 |

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：待施工与独立复核后填写。

**设计契约传导声明**：待真实 diff 后裁决。

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| DHR_80 六条验收与本地收口确认 | 使用真 v2 retry-with-profile + submit-executor-result、重启与 fake adapter 场景展示机器事实；用户核对这些证据不替代 DHR_35 真实产品验收 | E-8090（待施工后生成） | 待人验 |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---------|------|---------------|------|
| 1 | 机器证（design/11 P6-IQ-A5；design/12 P6-RI-A1）：最小失败复现使用当前 v2 retry-with-profile 与 submit-executor-result 入口；修复后 fresh Receipt 持久带正确模式，成功与失败提交均由新 Receipt 派生身份，经 actor/gate 返回 committed Ack，Result/event/state 一致。不得用直接 appendResult 或 helper-only 测试代替入口集成。 | AI | 待填 | 待填 |
| 2 | 机器证（design/12 P6-RI-A1/A3）：服务重启后从同一新 Receipt 恢复 gate，不开第二个 Attempt、不启动 Agent；重复同结果仅在 committed 后幂等，冲突终态拒绝。既有缺 mode 的历史 Receipt 保持不可提交，不因修复原地升级。 | AI | 待填 | 待填 |
| 3 | 机器证（design/11 P6-IQ-A5；design/12 P6-RI-A3）：非冻结 profile、快照漂移、pause 已关闭/同键冲突拒绝且无新增重试事实；同键合法重放保持同一新 Receipt。旧 Attempt 始终 fenced，旧 Receipt 提交不污染新结果；失租/未认证/未知或非当前 Receipt 继续拒绝。 | AI | 待填 | 待填 |
| 4 | 机器证（design/12 P6-RI-A2）：done/idle 无正式提交仍不产生 Result 或自动 fallback；使用 fake adapter 验证本次重试结果修复不会新增 Agent 启动/指令发送。 | AI | 待填 | 待填 |
| 5 | 证据门槛：专项与受影响回归自然终态、退出码及版本落账；heavy 五路独立复核，轮2选点的变异红/恢复绿。未终态不记通过，既有全量回归债不靠定向绿抵扣。 | AI | 待填 | 待填 |
| 6 | 人判：无新增业务选择；收口仍展示上述机器证据并取得本地收口确认，不代替 DHR_35 真实产品验收。 | 人 | 待填 | 待人验 |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|-------------------------------|---------|-----------------------------------------------|----------|--------------|----------|-------------|--------------|-----------------|-------------------|----------------------|
| fresh retry Receipt 正式提交闭环 | 真 v2 retry RPC + submit RPC + actor/gate + committed Store mutation | machine | P6-RI-A1 | 否 | succeeded/failed Ack 与 Result/event/state 一致 | 待执行 | DHR_80 worktree | RPC/Store/lease fixture | 真实 Agent 属 DHR_35 | design/11+12 | test | automated |
| 重启恢复、幂等与历史兼容 | 服务重启、同 digest 重投、冲突与旧 Receipt 负例 | machine | P6-RI-A1-A3 | 否 | 恢复同 Receipt gate且不新建/launch，拒绝零 mutation | 待执行 | DHR_80 worktree | Store reopen + RPC | 真实跨机不在本卡 | design/12 | test | automated |
| retry 选择、fence 与身份负例 | frozen/profile drift/pause/key/lease/auth/current receipt 正反例 | machine | P6-IQ-A5-RI-A3 | 否 | 合法重放唯一；非法原因稳定且零推进 | 待执行 | DHR_80 worktree | RPC + durable projections | DHR_79 缺失负例独立 | design/11+12 | test | automated |
| done/idle 无提交不产 Result/fallback | fake adapter + injected timeout | machine | P6-RI-A2 | 否 | 仅既定 human input/waiting，启动/发送=0 | 待执行 | DHR_80 worktree | fake adapter + Store | 真实 Agent 属 DHR_35 | design/12 | test | automated |
| heavy 证据门槛 | 专项/受影响/完整回归终态 + 五路 + 变异 | machine | DHR80-QUALITY-GATE | 否 | 全字段证据闭合且本卡新增失败=0 | 待执行 | DHR_80 worktree | independent reviews | 既有全量债不抵扣 | dev-harness | gate | automated |
| 本地收口确认 | 对话展示 releasePacket 后由用户确认 | human | DHR80-E11 | 否 | 用户明文认可执行本地收口 | 待执行 | 展示版本待定 | user | 不替代 DHR_35 产品验收 | dev-harness | user review | user |

**业务化五段展示区**

- 要证明啥：人工 retry 的 fresh Receipt 能接收、恢复并安全拒绝结果提交，且不启动 Agent。
- 期望值：正式入口产生唯一 committed Result；非法/无提交路径零错误推进。
- 实际值：待施工与测试。
- 差没差：待比较。
- 证据局限：fixture 不替代 DHR_35 的真实 Agent 产品闭环。

**风险放行账表**

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|-------|---------|------|------|------------|---------|---------|
| 无 | — | — | — | — | — | — |

**材料齐没齐**：待收口检查。

**as-built 更新了没**：待收口检查。

→ 当前状态：**施工中**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

### 目的一：确认 DHR_80 本地收口证据边界（覆盖 DHR80-E11）

本工作区将展示正式入口、重启恢复、负例、done/idle 无提交、回归和独立复核证据；这些证据不替代 DHR_35 真实产品验收。

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| 人判：无新增业务选择；收口仍展示上述机器证据并取得本地收口确认，不代替 DHR_35 真实产品验收。 | 查看 E10 展示的命令终态、关键 Ack/拒绝摘要、零启动计数、五路复核和变异结果 | 证据足以支持本地收口，且未声称已跑真实 Agent/DHR_35 | [ ] |

- 确认记录：待用户在 E10 后明文确认。
- verify 提交 SHA：待 E11 授权后。
- 签名：hyf（待确认）　　时间：

→ 解锁状态：**未验收**

### 确认记录（append-only）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---------|--------|----------------------|----------------------|-------------------------------|---------------|--------------------------------|
| 待确认 | 待用户 | releasePacket-DHR80-v1 | 待展示 | 待生成 | P6-RI-A1、P6-RI-A2、P6-RI-A3、P6-IQ-A5、DHR80-QUALITY-GATE、DHR80-E11 | 待确认 |
