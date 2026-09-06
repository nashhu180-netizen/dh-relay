<!-- dh:v1 -->
# review — DHR_77

## 独立复核区（执行者 ≠ 复核者；heavy 五路，返工 ≤3 轮）

**第一轮·唯一功能批次小审**

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|
| | event/v0 + writer/recovery + hash + read-model/CLI 原子候选及证据 | | | |

**第二轮·增量复核**

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|------|
| | 全程 + 轮1记录 + 收口增量；选择有效单测生产变异点 | | | | |

**有效单测·变异点登记**

| 变异点锚点(生产代码 path:line) | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人(重核须=轮2实例) | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| <待收口填> | <待收口填> | <改条件/改返回值/改边界> | <待收口填> | <待收口填> | <待收口填> | <待收口填> | <待收口填> | <断言失败/未变红/构建错误> |

**返工收敛**

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|------|--------------|----------------------|---------|
| 1 | | | |

**需求复核结论**：<approved / 有漂移>｜证据(E-xxx)｜由 <复核者>｜派出=<e:E-xxx / log:路径>

**教训复核结论**：<过 / 跳过（库空）>｜命中条目｜由 <复核者>｜派出=<e:E-xxx / log:路径>

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_77 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|---------|-------------|------|---------|
| event/v2 `host_ref` | v0 host-observation mirror、capability baseline、golden/negative fixtures | | | |
| Herdr terminal identity | Codex/Claude launch、observe、reconcile、driver recovery | | | |
| read-model 安全投影 | RPC v1/v2、CLI JSON/text、legacy ledger/client fixtures | | | |

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：待施工与复核后填写。

**设计契约传导声明**：待收口按真实 diff 选择。

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| HC-HR-H1 | DSH 关闭；AI 在对话展示 CLI 默认安全投影与受控 Herdr API 现场派生的同一脱敏 ref，用户核状态措辞与零泄露 | E-7702 | 待人验 |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---------|------|-------------|------|
| 1 | 只接受非空 string `terminal_id`，逐字 UTF-8 按冻结公式生成完整 SHA-256 ref；空白/Unicode golden vectors、缺失/错类型/空串与全部 fallback 负例见红。 | AI | | |
| 2 | 轮询/recovery 相同 ID 保持 ref，不同 ID 换 ref；pane/agent 改名不影响；`working→working` replacement 仍写事件。 | AI | | |
| 3 | alive 必有 ref；lost 保留最后成功 ref 或如实缺省；recover/replace/初始失败回放正确，旧事件不回写。 | AI | | |
| 4 | event/v0、descriptor/hash、writer/recovery/read-model/CLI 原子闭合；旧 v1 hash 在分派/订阅前 `E_CAPABILITY_MISMATCH` 且零推送，新 hash 的 v1 与 bootstrap/v2 均工作；旧账本仅显示 legacy 缺省。 | AI | | |
| 5 | CLI 区分当前/历史/尚无标签；默认安全投影省略 `detail`；非观测事件拒绝非空 ref；既有 Result/Receipt/lease/fencing/状态全回归。 | AI | | |
| 6 | 独立展示 DSH-off 安全投影与受控 Herdr 对照面中的同一脱敏 ref，用户判断状态措辞可区分且证据未出现原始 `terminal_id`、`detail`、路径或敏感信息；不得消费为 DHR_35 真实闭环证据。 | 人 | | 待人验 |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|----------|--------|-------|---------|-------------|---------|-----------|-----------|----------------|------------------|---------------------|
| terminal_id 来源与固定 SHA-256 算法 | golden + schema/source 负例 | machine | HC-HR-A1 | 否 | 冻结谓词和字节算法逐项通过，全部 fallback 见红 | 未执行 | 待施工基线 | design/14 §1、contracts validator | 原始 ID 不进入证据 | v1 | node test + validator | DHR_77 D-start 后 |
| terminal 生命周期与 replacement | fake Herdr 时序账 + recovery 测试 | machine | HC-HR-A2 | 否 | same/replace/rename/recovery 与 `working→working` 触发逐项相符 | 未执行 | 待施工基线 | design/14 §2 | 冷重启只按返回 ID | v1 | node test | DHR_77 D-start 后 |
| alive/lost/recover 回放 | reducer/event ledger sequence | machine | HC-HR-A3 | 否 | 历史 ref 保留、初始失联缺省、旧事件不回写 | 未执行 | 待施工基线 | design/14 §3.1 | 单事件 schema 不证明历史 | v1 | node test | DHR_77 D-start 后 |
| 原子协议与 v1/v2 hash | baseline 对证 + RPC mismatch/zero-push + client fixtures | machine | HC-HR-A4 | 否 | 新 hash 双版本工作，旧 v1 hash 在分派前拒绝且零推送 | 未执行 | 待施工基线 | capability baseline + RPC server trace | 不废止 v1 信封 | v1 | node test + baseline tool | DHR_77 D-start 后 |
| CLI 安全投影与兄弟回归 | read-model/CLI/schema + Result/lease/fencing/profile 回归 | machine | HC-HR-A5 | 否 | 三态可分、默认无 detail、非观察事件禁 ref、既有合同不变 | 未执行 | 待施工基线 | design/14 §3.3 + frozen suites | 受控诊断面不属 H1 | v1 | node test + relay suite | DHR_77 D-start 后 |
| DSH-off 对照展示可理解且零泄露 | 对话中的终端渲染/截图与脱敏白名单扫描 | human | HC-HR-H1 | 否 | 两端同 ref，当前/历史/尚无可分，禁项零出现 | 未执行 | 待施工基线 | 用户判断 | 不替代 DHR_35 真实闭环 | v1 | human review | E11 用户确认 |

**业务化五段展示区**

- 要证明啥：DSH 关闭时，Relay 展示的 terminal 标签与受控 Herdr 对照一致，且三态清楚、零敏感原值。
- 期望值：两端只出现相同 `herdr-terminal/sha256-…`；CLI 明示当前/历史/尚无；不出现原始 `terminal_id`、`detail`、路径或敏感信息。
- 实际值：待 E10 真实展示。
- 差没差：待 E10 对照。
- 证据局限：仅验 DHR_77 协议/展示，不证明 DHR_35 Codex/Claude Receipt→Result 闭环。

**风险放行账表**

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|-------|---------|------|------|------------|---------|---------|
| 无 | — | — | — | — | — | — |

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [ ]
**as-built 更新了没**：`as-built/relay-core.md` 已按真实实现覆盖更新？ [ ]

→ 当前状态：**施工已授权，尚未收口**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

### 目的：证明 DSH-off 下 terminal 标签可核对、可区分且不泄密（HC-HR-H1）

本工作区交付：待 E10 挂 DSH-off CLI 安全投影、受控 Herdr 对照与白名单扫描证据。

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| 独立展示 DSH-off 安全投影与受控 Herdr 对照面中的同一脱敏 ref，用户判断状态措辞可区分且证据未出现原始 `terminal_id`、`detail`、路径或敏感信息；不得消费为 DHR_35 真实闭环证据。 | 查看 AI 在对话展示的 CLI 当前/历史/尚无三态、受控 Herdr 对照与白名单扫描摘要 | 两端 `host_ref` 逐字相同；三态可明确区分；禁项零出现；明确不替代 DHR_35 | [ ] |

---

- 确认记录：<待 E11 用户对话确认后由 AI 回填>
- verify 提交 SHA：<待 E12>
- 签名：hyf（<chat-confirm 代签 / 本人敲 git>）　　时间：

→ 解锁状态：**未验收**

### 确认记录（append-only）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---------|--------|----------------------|----------------------|-------------------------------|---------------|--------------------------------|
