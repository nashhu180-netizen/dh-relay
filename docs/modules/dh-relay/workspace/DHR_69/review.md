<!-- dh:v1 -->
# DHR_69 · Review

## 独立复核区

本卡任务类型为 **heavy**。施工者不得复核自己的卡；代码轮 1、代码轮 2、需求、教训、一致性五路均由未参与施工的独立实例完成。第二轮复核实例负责选择并登记有效变异点。

**第一轮·批次小审合集**（本卡不分批，收口时跑完整轮 1）

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|
| `dhr69rev1`（pane `w1:p46` · codex `--sandbox read-only` · gpt-5.6-terra high · fresh） | 全 diff `3b147d7..140f21f`、A–F、越界、recovery 发送时机 | **F-69-R1-01 (P1)** unknown/观测失败未清 mismatch 计时 | e:E-6904 | log:docs/modules/dh-relay/workspace/DHR_69/review-code1-codex.md |
| `dhr69rev1b`（pane `w1:p47` · 同上 · 未继承轮 1 会话） | F-69-R1-01 整改复验 | 生产修复正确；**F-69-R1-02 (P1)** 负例未钉死 `mismatchAt` 已启动 | e:E-6906 | log:docs/modules/dh-relay/workspace/DHR_69/review-code1-reverify-codex.md |
| `dhr69rev1c`（pane `w1:p48` · 同上 · 未继承前轮会话） | F-69-R1-02 测试收紧复验 | **PASS**；P1 两条均闭合、无新发现 | e:E-6907 | log:docs/modules/dh-relay/workspace/DHR_69/review-code1-reverify2-codex.md |

**第二轮·增量复核**（另派 fresh-context，不继承轮 1 会话）

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|------|
| `dhr69rev2`（pane `w1:p49` · codex `--sandbox read-only` · gpt-5.6-terra high · fresh，未继承轮 1） | 全程 + 轮 1 记录 + 增量 diff + 变异点选点 | 轮 1 的 F-69-R1-01/02 仍在；**F-69-R2-01 (P1)** 观测失败落入 else 发指令 | changes-requested | e:E-6908 | log:docs/modules/dh-relay/workspace/DHR_69/review-code2-codex.md |
| `dhr69rev2b`（pane `w1:p4D` · 同上 · 未继承 `dhr69rev2`） | F-69-R2-01 整改复验（`2d9ace6..c9fcaa6`） | **PASS**；P1 闭合、无新发现；观测成功非 blocked 仍发 | approved | e:E-6912 | log:docs/modules/dh-relay/workspace/DHR_69/review-code2-reverify-codex.md |

**有效单测·变异点登记**（重核卡：必须由轮 2 实例选点，施工方自报即红）

| 变异点锚点(生产代码 path:line) | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人(重核须=轮2实例) | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| `relay-core/runtime/executors/herdr/herdr-executor.mjs:131` | `if (paneGet === 'blocked') herdrStatus = 'blocked';` → `if (paneGet === '__mutated_never__') herdrStatus = 'blocked';` | 改条件（idle∧blocked 覆盖不再派生 blocked） | `DHR_69/A adapter：假就绪 idle+pane blocked → launch_blocked，保留 handle，不关 pane` | `node --test --test-concurrency=1 --test-name-pattern "DHR_69/A adapter：假就绪" test/dhr69-false-ready.test.mjs` | `af5f3c0002dc63a6b82c28d1ddc43a352e27cf70` | `e97819a590306381cbeef80b0b165d43da8926d7` | `dhr69rev2` 选点；施工会话按指定施加/还原（e:E-6913） | 施加后 `launch_blocked` `false !== true`、exit 1；还原 hash 与施加前相同，隔离用例 exit 0 |

**返工收敛**

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|------|--------------|----------------------|---------|
| 1 | 1（F-69-R1-01） | 观测丢失分支清零 mismatch 计时 + 负例；定向 9/9 | 否（复验抓到测试洞） |
| 1b | 1（F-69-R1-02） | 负例先等 poll paneGets 与 observation_lost；定向 9/9 | 是（`dhr69rev1c` PASS） |
| 2 | 1（F-69-R2-01） | recovery 观测失败扣住不发 + 负例；定向 10/10 | 是（`dhr69rev2b` PASS） |

**需求复核结论**：主控裁决 **PASS**（复核者 P1 驳回：E-1 取样对象冻结为普通 shell pane，不得采成功 `agent get`）｜证据(E-6909)｜由 `dhr69req`｜派出=log:docs/modules/dh-relay/workspace/DHR_69/review-req-codex.md
**教训复核结论**：**N/A（可核查）**｜正册 `教训库.md` 不存在，不拉 Pair｜候选-11 / 候选-36 / L-6805 未重蹈；候选-6 由本卡轮 2 变异点闭合｜由 `dhr69les`｜派出=log:docs/modules/dh-relay/workspace/DHR_69/review-lessons-codex.md


## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_69 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|---------|-------------|------|---------|
| 假就绪判定（idle∧blocked → 派生 blocked） | DevPlan §3.2、brief、`observeHerdrAgent`、driver 轮询/recovery | 是（三时点共用派生 `herdr_status`） | 一致 | e:E-6911 |
| `detail` 三键 + `conflict_escalation` | `observationDetail`、host_observation_changed、升级 Attention、task_plan 冻结键 | 是（键名与追加顺序与 D-start 冻结一致） | 一致 | e:E-6911 |
| 「恰补发一次」届内限制 | F-6807 并入口径、`instructionPending`、一致性文字登记 | 是（内存变量；跨 driver 重启重复发送是已知限制） | 一致 | e:E-6911 |
| Codex `agent_not_ready` 负例不变 | DHR_68/C 测试、本卡 A 负例 | 是（argv 与 `launch_blocked` 行为不变，该支 paneGets=0） | 一致 | e:E-6911 |
| 允许路径 vs 实际 diff | DevPlan `dh:allowed-paths:v1 task=DHR_69` vs `git diff --name-only 3b147d7..HEAD` | 是（仅允许的 6 个代码路径 + `workspace/DHR_69/**`） | 一致 | e:E-6916 |
| unknown 时 reconcile 仍 `paneGet` | `observeHerdrAgent`（仅 idle 读 pane）vs `reconcileHerdrAgent`（DHR_33 存活探测） | 字面不完全一致 | **有意差异**（F-69-CON-01）：D 约束交叉核对；reconcile 的 paneGet 不是假就绪 overlay，本卡不改 | e:E-6911 |

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：
- 观测层 overlay 已接到启动 / 轮询 / recovery 三时点；轮 1 两处 P1 与轮 2 一处 P1 均闭合。信心来自定向套件与轮 2 指定变异点红绿，不来自真实 Claude。全文件串行偶发 `A driver` `waiting_human` 超时（隔离绿），归因 F-6804 同类负载竞态，不回退 overlay 结论。

**设计契约传导声明**：
- 契约无变化：本卡修实现以兑现 design/06 H1/H5 与 B-33 已确认语义，不改 Receipt/Result/Store/RPC/contracts，不新增协议 reason code。

**需求对齐证据**（本卡无人判项；机器证用 fake 夹具跑真实 driver）：

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| design/06 H1/H5：假就绪仍形成一次人工暂停 | fake：agent idle + pane blocked → 事件序列、节点 waiting_human、指令扣住 | E-6902、E-6913、E-6914 | 满足 |
| B-33 轮询期错误归因 | 中途假 idle 不得写 `E_EXECUTOR_RESULT_MISSING` | E-6902、E-6914 | 满足 |
| F-6807 recovery 先观测 | 恢复届 blocked 或观测失败时不先发指令 | E-6908、E-6912、E-6914 | 满足 |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---|---|---|---|
| A | 夹具令 `agent start` 返回 exit 0、`agent get`=`idle`、`pane get`=`blocked` → adapter 返回 `launch_blocked=true` 且保留 handle、不关 pane、不额外创建 Attempt/Result；driver **不发**提交指令、**恰写一次**带 blocked 观测的 `human_input_requested`、不写 `E_EXECUTOR_HOST_LOST`。Codex 既有 `agent_not_ready` 路径的 argv 与行为**逐字不变**（负例断言）。承接 design/06 H1/H5。 | machine | E-6902、E-6913、E-6914 | 是 |
| B | 启动正常、中途转为假 `idle`（`pane get`=`blocked`）→ **不得**落进 `done\|\|idle` 分支、**不得**写 `E_EXECUTOR_RESULT_MISSING`、**不得**结束 Attempt；须走 blocked 分支并恰写一条 `human_input_requested`。 | machine | E-6902、E-6914 | 是 |
| C | 恢复到假 `idle` / 真 `blocked` 的 agent → 发提交指令**之前**先做一次观测；观测为 blocked 时扣住指令走人工暂停，离开 blocked 后**在同一 driver 届内恰补发一次**。口径显式收窄到"届内"。 | machine | E-6902、E-6912、E-6914 | 是 |
| D | `host_observation_changed` 同时留下 `agent get` 原始值、`pane get` 原始值与派生结论三者；仅在 `agent get`=`idle` 时才发起 `pane get`（`working`/`done`/`unknown` 三态下 `pane get` 调用次数断言为 0）。三者编码进 `detail` 受控键。 | machine | E-6902、E-6914 | 是 |
| E | E-1 可复跑只读 shape probe（普通 shell pane，不启动产品 Agent）+ E-2 fake `paneGet` 按 E-1 实测形态返回。`blocked` 取值以 evidence/32 §2 为事实基准。 | machine | E-6901、E-6902 | 是 |
| F | `idle`∧`blocked` 持续超过 T=60_000 ms → 指令始终未发；初始 Attention 恰一条；超时后恰一条可区分升级 Attention（`conflict_escalation=idle_blocked`，reason 留空）；两信号恢复一致后恰补发一次；不得改信 `agent get` 放行、不得自动判节点失败。 | machine | E-6902、E-6905、E-6914 | 是 |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|----------|--------|-------|---------|-------------|---------|-----------|-----------|----------------|------------------|---------------------|
| 启动期假就绪仍 launch_blocked 并人工暂停；Codex agent_not_ready 不变 | fake Claude idle+pane blocked 的 launch/driver 事件序列 + Codex 负例 | machine | DHR_69-A | 等价覆盖 | launch_blocked=true、handle 保留、paneKills=0、Attention 恰 1 且三键正确、sent=0、无 HOST_LOST；Codex 负例 argv/行为不变且 paneGets=0 | E-6913 mutant 红、还原绿；E-6914 定向 pass | 本地 Node · Windows | fake 调用账本 + Store 事件 | 不跑真实 Claude；blocked 取值不由 E-1 取 | design/06 H1/H5 | adapter+driver tests | 自动化 |
| 轮询期假 idle 不得误判 RESULT_MISSING | fake 中途切换 idle+blocked | machine | DHR_69-B | 等价覆盖 | 无 E_EXECUTOR_RESULT_MISSING、Attempt 未结束、走 blocked Attention | E-6914 pass | 本地 Node | Store 事件清单 | 真实中途信任框 | B-33 | driver tests | 自动化 |
| recovery 先观测再决定发送；届内恰补发一次 | recoveryFixture 假就绪 | machine | DHR_69-C | 等价覆盖 | blocked 期间 sent=0；离开 blocked 后 sent=1；观测失败 sent=0 | E-6912、E-6914 pass | 本地 Node | fake.sent + 事件 | 跨 driver 重启重复发送是已知限制 | F-6807 | driver tests | 自动化 |
| 观测留痕三键且非 idle 不读 pane | 解析 detail + paneGets 计数 | machine | DHR_69-D | 等价覆盖 | 三键可解析；working/done/unknown 的 paneGets=0 | E-6914 pass | 本地 Node | fake.paneGets | 无 | B-33 | adapter tests | 自动化 |
| fake paneGet 形态对齐真实普通 pane | E-1 JSON oracle + fake 字段路径 | machine | DHR_69-E | 等价覆盖 | probe 可复跑；fake 含相同 agent_status 路径 | E-6901、E-6902 pass | 本地 Node · herdr | E-1 JSON | blocked 取值不由 probe 取 | DHR_68/D | shape probe | 自动化 |
| 持续不一致可见升级，不自动放行/失败 | 短 T 的粘性 mismatch 夹具 | machine | DHR_69-F | 等价覆盖 | 初始 Attention=1、升级=1 且键为 idle_blocked、reason 空、sent=0、非 failed；恢复后 sent=1 | E-6905、E-6914 pass | 本地 Node | 事件+sent+node status | T 生产默认 60s，测试用入参缩短 | B-33 | driver tests | 自动化 |

**风险放行账表**

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|-------|---------|------|------|------------|---------|---------|
| 无 | | | | | | |

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [x]
**as-built 更新了没**：本批触及的子系统，其 `as-built/<子系统>.md` 已覆盖更新到最新现状？（没动子系统现状可 N/A） [N/A · F-69-E7：允许路径不含 as-built，现役 §6.4a 未写 idle∧blocked overlay；不静默跳过]

→ 当前状态：**已完成（E13；release_mode=full）**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

本卡六条完成条件**均为机器证**，无人判结果项（H=0）。收口按 G14 走双谓词，E11 仍需对话确认本地收口授权包。没有对话确认，AI 不得碰本区。

### 目的一：证明假就绪会停下来等你按，按完接着干（覆盖机器证 A/B/C/F）

本工作区交付：观测层交叉核对 + 三时点人工暂停（待挂证据）。

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| （无人判项）查看机器证包 | 看 E10 展示的定向测试与事件序列 | 六条机器证均有等价 pass | [x] |

- 确认记录：2026-09-01 对话点选「已查看证据，认可执行本地收口」；尾巴「整批留给后续卡」。
- verify 提交 SHA：本提交（squash `28b9a7d`）
- 签名：hyf（chat-confirm 代签）　　时间：2026-09-01

### 确认记录（append-only）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---------|--------|----------------------|----------------------|-------------------------------|---------------|--------------------------------|
| 2026-09-01 | hyf | DHR_69 H=0 机器证包 A–F；不含 push/deploy | E-6914 `dhr69-false-ready` 10/10 + E-6913 mutation 红绿 | E-6901..E-6916 | DHR_69-A, DHR_69-B, DHR_69-C, DHR_69-D, DHR_69-E, DHR_69-F | 通过 |
