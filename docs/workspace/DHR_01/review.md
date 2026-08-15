<!-- dh:v1 · review.md — 验收。🔴 收尾填。三区：独立复核区 → AI 提交区 → 人类签名区，物理隔离。 -->
# review — DHR_01 冻结接力权威、双维状态与异常契约

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

**第一轮·批次小审合集**（施工批次检查点前移；每批 fresh 小审只看本批 diff 与证据）

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|
| account9/deepseek headless（fresh·只读·非施工者） | 批A commit 525aa61 diff + 4 变异探针（在导出副本上做，仓库零改动） | changes-requested：P2 F-001 枚举大小写不敏感；P2 F-002 node 级校验零断言；P3 F-003 iso 放行纯日期；P3 F-004 fixture 与 A3 规格漂移/检查顺序未锁；范围/凭据/E-003 提交态复核通过；探针①②③各恰好红对应断言、探针④ 0 红（坐实 F-002） | log:review-logs/review-batchA.account9.log | E-004 |
| account4/glm-5.2 headless（fresh·只读·非施工者·会话≠批A 小审） | 批B b2884c9 / 批C 65dbeb5 / 批D 5a52845 / 窄修 b87e770 diff + 4 变异探针（全复原、tools/relay 干净） | approved：P2 F-011 穷举测试自证循环（删合法边仍全绿）；P3 F-012 dec→quota 留位缺；P3 F-013 ProbeVerdict 硬编码 from；P3 F-014 attempt_id>Current 被 accept；P3 F-015 断言名与体不符；专挑 7 点逐项核过（矩阵对 design §3.1、身份链顺序、FreezeSet、脱敏顺序探针真红、五类失败夹具、task_state 拒、无越界、亲跑 RELAY ALL PASS） | log:review-logs/review-batchBCD.account4.log | E-006 |

**第二轮·增量复核**（另派 fresh-context、未参与实施的独立 agent 实例；codex 为施工者不得参与）

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|------|
| claude-grok headless（CLAUDE_CONFIG_DIR=~/.claude-grok·fresh·只读·未参与实施与轮1·探针在独立 worktree DHR_01_r2probe 上做后 remove） | 全程 master..HEAD（重点 a834052/b87e770 增量）+ 核第一轮 F-001~F-015 + 4 组变异探针 + 亲跑 | 第一轮 15 条逐条核验：F-001~F-009/F-011~F-015 均「真修+锁住」，F-010 属主树 DevPlan 字面（81e546d）非本分支；**新发现 P2×2**：F-016 launch_id 绑定零断言（探针 4 去掉检查全绿）、F-017 FreezeSet 传递闭包只 1 跳钉住（探针 4b 改直接依赖仍绿）；P3×2 F-018/F-019；主控另立 F-020 系统性守卫；oracle 与 design §3.1 逐条一致；无越界/无 BOM/无非 FAKE 凭据 | changes-requested（→返工轮2 后复验） | log:review-logs/review-round2.grok.log | E-008 |
| codex exec fresh 会话（≠施工 codex 会话·不继承上下文·只读·grok 因额度停止后用户指定改派） | 轮2 返工复验：F-016~F-020 闭合核验 + 增量 36c9593 探针 + 亲跑 | F-016~F-019「真修+锁住」；F-020「修了未锁」→新 P2（主控裁 P3）F-021 守卫精度→返工轮3 a1846d3 收紧（非字面 reason 报错·只认 Assert 行），主控探针 a/b 真红闭合；无其它新发现 | approved（F-021 经返工轮3 + 主控探针闭合；0 open P0/P1） | log:review-logs/review-round2b.codex-fresh.log | E-011 / E-012 |

**返工收敛**（有 open P0/P1 → 修 → 重跑证据 → 复核者再过；最多 3 轮）

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|------|--------------|----------------------|---------|
| 1（轮1 小审+E4 汇总→返工轮1 a834052） | 0（open 为 P2×3+P3×6，无 P0/P1） | codex 修 F-005~F-008/F-011~F-015；主控亲跑 RELAY ALL PASS 41/20/89/19/16 + 变异探针（删矩阵合法边→2 红·复原）E-009 | 是（P2 清零） |
| 2（轮2 grok 对抗→返工轮2 36c9593） | 0 | codex 修 F-016~F-020（含 reason 覆盖静态守卫）；主控亲跑 41/29/89/19/16/1 + 探针（去 launch_id 检查→2 红；注入未覆盖码→守卫红点名·均复原）；复验=codex fresh 会话 E-011：F-016~F-019 真修+锁住、F-020 修了未锁→F-021 | 是（P2 清零；F-021 主控裁 P3） |
| 3（F-021 守卫精度→返工轮3 a1846d3·窄） | 0 | codex 收紧守卫（非字面 reason 报错 + 只认 Assert 行）；主控亲跑 + 探针 a/b 真红 E-012 | 是（0 open P0/P1/P2） |

**需求复核结论**：approved（无 P0/P1、无范围漂移、非目标未做、P1 三处降级留位齐全；4 条补证项登记 F-005~F-008、F-010，返工后复验）｜证据(E-005)｜由 Claude subagent（fresh·只读·需求视角）｜派出=log:review-logs/e4e5.subagent.log

**教训复核结论**：命中 2 条均已被流程当场兜住（L-013 主控 task_plan 悬空引用→worker 正确 blocked、主控补表；L-010 类 DONE 自报断言数 85 实为 84·以亲跑为准）+ F-002 同类"分支无断言"在批B 复发（F-005）；未命中 L-001/L-016/L-007 等；新教训候选 3 条已入 lesson_candidates｜由 Claude subagent（同上·扫 dh-crew/knowledge/教训库.md）｜派出=log:review-logs/e4e5.subagent.log

## 第 4 路·一致性复核（横向：本次动的口径 vs 同类路径既有定义）

<!-- dh:consistency-review:v1 task=DHR_01 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|---------|-------------|------|---------|
| dh-relay 双维状态枚举/身份链/事件 kind（relay-schema.ps1、transition-matrix.json） | dh-crew 协议层 `tools/protocol/*`（controller-DONE/inbox 状态机/health 枚举）与 `docs/modules/dh-crew/protocol/00-协作协议规范.md` | 不一致 | 有意差异→docs/modules/dh-relay/design/01-产品设计与验收.md#12-为什么另建模块 | e:E-013 |
| session tail 脱敏 detector（relay-redaction.ps1 三类） | dh-crew 侧凭据红线（AGENTS.md 宪章 6·无代码 detector） | 一致 | 无需处置 | e:E-013 |
| `tools/relay/` 对 dh-crew 引用 | `tools/protocol/**`、`.dh-runtime`、`tools/tests/run-all.ps1` | 一致 | 无需处置 | e:E-013 |

> `定义是否一致` 二选一：`一致` / `不一致`。`裁决` 三选一：`无需处置` / `有意差异` / `遗漏待修`。

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：对实现有没有 100% 信心？没有就逐条列 gap。
- 契约层是纯函数 + 静态夹具，能证的是「规则被钉住」；**行为面**（Runner 真不调 resume、真只冻依赖节点、真按 receipt 拒无单 agent）本卡只有契约缺席证明 + 矩阵 guard 断言，行为验证归 DHR_02（fake replay A3/A4）与 DHR_03（真 psmux）。
- reason 码覆盖守卫是静态启发式（字面 + Assert 行扫描），能防「分支零断言」复发，不等价于分支行为覆盖。
- 脱敏 detector 三类正则是 P1 代表性覆盖，jwt/env_secret/bearer_token 明确留目标形态。

**设计契约传导声明**（收口时只保留一条）：

- 契约无变化：本卡是 design/01 §3～§4 的**落地**（把已定稿的枚举/边/身份链变成机器可读矩阵与校验器），未新增或修改设计层规则；P1 降级三项（quota/nonce/jwt）与变更范围字面（F-010→master 81e546d）均已先行登记于设计/DevPlan，无需再传导。

**需求对齐证据**：

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| A1/A2/A4/A5/A6/A8 契约面（本卡 H=0·全机器证） | 在任务树根一键复跑 `pwsh tools/relay/tests/run-relay-tests.ps1` → 6 套件 SUITE PASS + `RELAY ALL PASS` exit 0；主控另做 4 组变异探针证明断言真有牙 | E-012 | 满足 |

**完成条件逐条挂证据**（创建期预填自 brief；收口时补 Evidence ID 和结论）：

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---------|------|-------------|------|
| 1 | 【机器证·A1】schema、固定枚举和机器可读穷举转换矩阵通过；每个合法边有正例、每个未列举边均失败，终端/业务两维任一非法时整体不推进。 | AI | E-012（schema 41 + transitions 89：72 穷举以 design §3.1 独立 oracle 为期望、边集合==oracle、双维 fail-closed 断言） | 达成 |
| 2 | 【机器证·A2】plan/generation/attempt/launch/session 完整绑定，旧/重复/错版本结果夹具被拒。 | AI | E-012（identity 29：stale-plan/wrong-hash/stale-generation/wrong-node/stale-attempt/wrong-launch/wrong-session/final-immutable 各有夹具+断言） | 达成 |
| 3 | 【机器证·A4/A6】冻结 `decision_required` 非终态 checkpoint 与 final result 的边界；checkpoint 后只冻结依赖节点、无依赖并行节点继续，同一 authority/launch/session/attempt 的后续 checkpoint/final result 可更新投影，错 session/generation 与旧 attempt 均拒绝；Runner 不读取、转发人工回答，也不调用 resume；quota P1 降级为 `interrupted_unknown` 兜底，不实现独立可信恢复事件通道（目标形态再补）。 | AI | E-012（identity：ckpt-decision accept/同链 working 覆盖/错 session/旧 attempt 拒/final 后 ckpt attempt-closed/FreezeSet 三跳链+独立节点；schema：decision_required 不得为 final、checkpoint 带 answer 拒、kind=user_answered 拒；transitions：idle→running guard=host-observed-new-turn 无 resume、quota 三边 reserved-target-form；failures：decision_required 挂起 probe-lost）。行为面归 DHR_02/03 | 达成（契约面） |
| 4 | 【机器证·A5/A6】`succeeded` 不等于完成；final result 不可改写；半写、坏 JSON、probe error、无进展和无结果退出均有反例夹具。 | AI | E-012（failures 16：halfwritten→unparseable-result、badjson→unknown-enum、probe 阈值→unknown/interrupted_unknown、no-progress→stalled、exit-no-result→interrupted_unknown、task_state 拒；identity final-immutable） | 达成 |
| 5 | 【机器证·A8】交接自足；credential-shaped detector 至少覆盖 `api_key/private_key/password` 三类代表性凭据（jwt/env_secret/bearer_token 等其余类别随目标形态补齐），命中值完整替换、不保留前缀，handoff/result/event/session-tail 任一 final 工件残留即失败；PII/内部主机名不纳入本卡 detector。 | AI | E-012（relay-contract-redaction 19 断言：三类零残留/标记/hits、sk- 整串、PEM 整块、先脱敏后限长边界夹具、四类工件各自夹具） | 达成 |

**验收项元数据表**：

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|----------|--------|-------|---------|-------------|---------|-----------|-----------|----------------|------------------|---------------------|
| A1 契约与矩阵穷举 | relay-contract-schema/transitions 套件 | machine | DHR01-A1 | 等价覆盖 | 6 套件 SUITE PASS + 探针真红 | RELAY ALL PASS（E-012） | pwsh 7 / Windows 11 / wt/DHR_01 | 测试内独立硬编码 design §3.1 边 oracle（非矩阵自身） | 行为面（Runner 真跑）归 DHR_02/03 | relay/v1 | machine-suite | controller-run |
| A2 身份链拒旧 | relay-contract-identity 套件 | machine | DHR01-A2 | 等价覆盖 | 每个 reason 分支有夹具+断言 + reason 覆盖守卫 | PASS（E-012） | 同上 | 静态 fixtures（每类身份变异一份） | receipt→spawn 的运行时接线归 DHR_02 | relay/v1 | machine-suite | controller-run |
| A4/A6 checkpoint 边界+降级（**契约面**：本卡 brief 条件 3 承诺的是冻结边界/枚举/guard，非 Runner 行为） | relay-contract-identity/transitions/failures 套件 | machine | DHR01-A4 | 等价覆盖 | 断言 + guard 值锁定 | PASS（E-012） | 同上 | 矩阵 oracle / 三跳链夹具 | "不读回答/不 resume"行为验证=DHR_02 A3/A4 fake replay + DHR_03 真跑 | relay/v1 | machine-suite | controller-run |
| A5/A6 final 不可改写+失败夹具 | relay-contract-identity/failures 套件 | machine | DHR01-A5 | 等价覆盖 | 五类静态失败夹具各一断言 + final-immutable 探针真红 | PASS（E-012） | 同上 | 半写夹具=真实截断文件 | 宿主原子晋级动作本身归 DHR_02 | relay/v1 | machine-suite | controller-run |
| A8 脱敏 | relay-contract-redaction 套件 | machine | DHR01-A8 | 等价覆盖（三类代表性·P1 口径） | 零残留反查 + 顺序边界夹具探针真红 | PASS（E-012） | 同上 | oversize 边界夹具（先截后脱必红） | jwt/env_secret/bearer_token 留目标形态 | relay/v1 | machine-suite | controller-run |

**业务化五段展示区**：

- 要证明啥：dh-relay v1 契约（枚举 / 字段白名单 / 身份链 / 穷举转换矩阵 / 脱敏）已被冻结且每条规则有断言钉住，可作 DHR_02 Runner 的地基。
- 期望值：`run-relay-tests.ps1` 6 套件全 SUITE PASS、末行 RELAY ALL PASS、exit 0；变异探针（删合法边 / 去 launch_id 检查 / 先截后脱 / 注入未覆盖 reason 码 / 非字面 reason / 码只在注释）各自使对应断言变红。
- 实际值：E-012 亲跑 41/29/89/19/16/25 码全绿；E-009/E-011/E-012 探针全部按预期变红并复原；轮1/轮2 复核者独立探针结论一致。
- 差没差：无差；三轮返工共关闭 P2×8（F-001/002/005/006/011/016/017/020）+ P3×12，0 open P0/P1/P2。
- 证据局限：本卡 H=0、纯契约层；"Runner 行为"（不介入回答、按 receipt 拒无单 agent、原子晋级）不在本卡取证范围，明确归 DHR_02 / DHR_03。

**风险放行账表**：

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|-------|---------|------|------|------------|---------|---------|
| 无 | — | — | — | — | — | — |

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [x]
**as-built 更新了没**：`as-built/relay-contracts.md` 首份快照已建？ [x]

→ 当前状态：**待验收**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

### 目的一：确认接力契约层 v1 可作为 DHR_02 Runner 的地基（本卡 H=0，仅 E11 本地收口授权）

本工作区交付：dh-relay v1 契约（schema/身份链/穷举转换矩阵/脱敏）+ 失败路径 fixtures + 一键复跑 runner。

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| 机器证全绿 + 两轮复核收敛（E10 证据展示） | 查看 AI 在对话展示的 `run-relay-tests.ps1` 输出、探针记录与两轮复核结论 | RELAY ALL PASS + 0 open P0/P1 + 轮1/轮2 均已落账 | [x] 用户 2026-08-15 对话 AskUserQuestion 点选「认可，执行本地收口」 |

---

- 确认记录：2026-08-15 用户在对话 AskUserQuestion 点选「认可，执行本地收口（推荐）」——授权包=squash 合入/复跑/verify/销户/删任务树；包外 push/DHR_02 未授权
- verify 提交 SHA：见 `git log --grep="^verify(dh-relay): DHR_01"`（squash 合入=0c0cc42）
- 签名：hyf（chat-confirm 代签）　　时间：2026-08-15 14:34

→ 解锁状态：**已验收**

### 确认记录（append-only，每次人验确认追加一行）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---------|--------|----------------------|----------------------|-------------------------------|---------------|--------------------------------|
| 2026-08-15 14:34 | hyf | releasePacket-DHR_01 | shown-v1（E9 七段+E10 证据展示·对话） | E-012/E-014 亲跑 RELAY ALL PASS + 三轮复核落账 | DHR01-A1/A2/A4/A5/A8 | 通过 |
