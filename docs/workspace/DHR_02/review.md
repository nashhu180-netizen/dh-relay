<!-- dh:v1 · review.md — 验收。🔴 收尾填。三区：独立复核区 → AI 提交区 → 人类签名区，物理隔离。 -->
# review — DHR_02 实现最小 Runner 与确定性 fake replay

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

**第一轮·批次小审合集**（施工批次检查点前移；每批 fresh 小审只看本批 diff 与证据）

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|
| account4/glm-5.2 headless（fresh·只读·非施工者·CLAUDE_CONFIG_DIR=~/.claude-account4） | master..HEAD 全部 4 commit（55819a0）+ 11 角度 + 5 支独立变异探针（与主控 E-003 不重叠·全复原） | approved：P2 F-011 occurred_at 确定性零断言（探针 P-04 改 UtcNow 不红）；P3 F-009 resume_from.attempt_id 未校验、F-012 stop ok=false 静默；探针 P-01（K-5 同态跳过）/P-02（K-2 stale 分类）/P-03（replan_required）/P-05（事件序号）均真红；契约调用非复制、A1~A6、K-3、越界/凭据/BOM/守卫 47 码逐条通过；亲跑 11 套件 RELAY ALL PASS 368 PASS | log:review-logs/review-round1.account4.md | E-004 |

**第二轮·增量复核**（另派 fresh-context、未参与实施的独立 agent 实例；codex 施工会话不得参与）

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|------|
| account9/deepseek headless（CLAUDE_CONFIG_DIR=~/.claude-account9·fresh·只读·未参与施工与轮1·会话≠轮1） | master..HEAD 全程（重点返工轮1 39425b2）+ 核 F-003~F-013 + 9 个新角度对抗探针（B-1~B-9·临时目录）+ 亲跑 | 轮1 12 条：F-004~F-012 「真修+锁住」（P-A2/A3/A4 各真红）、**F-003「修了未锁」**（删「旧 depends_on 被删」分支 L40 仍全绿）、F-013 open 预期；**新发现 P1 F-014**（空文件 result/checkpoint 提交抛异常穿透 try/catch·无拒收事件）、**P2 F-015**（改坏 state 后 accept 路径先写 authority 再 Save 抛→部分写）、P2 F-016（事件/状态无事务边界·主控裁 P3）、P3 F-017/F-018；确定性（3 次回放逐字节同）/Open-RelayRun 等价/fresh A 绑新 gen+v2 hash/旧链 ckpt 拒/越界与凭据/BOM 全过；亲跑 11 套件 RELAY ALL PASS 393 PASS 行 | changes-requested（→返工轮2 后复验） | log:review-logs/review-round2.account9.md | E-007 |
| account9/deepseek headless **新实例**（会话≠轮2 首派·fresh·只读·未参与实施） | 返工轮2 ffbaf92 复验：F-003 残余/F-013~F-018 逐条 + 5 支探针（P2B-01~04）+ 回归对抗（F-016 顺序统一/`json-not-object` 波及面/深克隆）+ 亲跑 6 次 + ingest 15 连跑 | 七项全部「真修+锁住」；探针：删 json-not-object 守卫→ingest 崩溃红（原 P1 签名）、删 Open 校验→FAIL 1、删候选态校验→部分写复现红、删旧依赖被删检查→FAIL 1、改名子码→守卫红；无行为回归；**N-01** 首跑一次偶发崩溃（同 P1 签名·40+ 次未复现·静态不可达）→主控归因同树并发探针 F-020 | approved（0 open P0/P1） | log:review-logs/review-round2b.fresh.md | E-009 |

**返工收敛**（有 open P0/P1 → 修 → 重跑证据 → 复核者再过；最多 3 轮）

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|------|--------------|----------------------|---------|
| 1（轮1 account4 + E4/E5 → 返工轮1 39425b2） | 0（open 为 P2×4 F-003/F-004/F-005/F-011 + P3×6，无 P0/P1） | codex 修 F-003~F-012；主控亲跑 RELAY ALL PASS + 探针 A/B/C 真红（E-006）；探针 D 不红→F-013 | 是（P2 清零·F-013 P3 转轮2） |
| 2（轮2 account9 对抗 → 返工轮2 ffbaf92） | 1（**P1 F-014** 空文件抛异常）+ P2 F-015 + F-003 残余 | codex 修 F-014/F-015/F-003 残余/F-013/F-016~F-018；主控亲跑 + 探针 P1~P4 真红（E-008）；fresh 新实例复验 approved（E-009） | 是（0 open P0/P1/P2；F-016 主控裁 P3 顺序统一+对账 backlog；F-020 记录） |

**需求复核结论**：approved（P0/P1=0；P2×3 F-003 replan 谓词零断言 / F-004 schema 拒收分支零断言+守卫前缀盲区 / F-005 已交棒 blocked 节点 probe 连败被 pause 且 replan 无法复位；P3×5 F-006~F-010；口径漂移无、非目标未做；5 条完成条件逐条有断言对应）｜证据(E-005)｜由 Claude subagent（fresh·只读·需求视角）｜派出=log:review-logs/e4e5.subagent.log

**教训复核结论**：候选-1/L-002「分支无断言钉住+守卫兜底」**部分命中**（F-003/F-004：守卫粒度<分支粒度）；oneshot seam / 自证循环 oracle / L-010 自报不符 / 大小写 / 悬空引用 / 原子写 均未命中；新候选 3 条入 lesson_candidates｜由 Claude subagent（同上·扫 dh-crew/dh-relay 教训库）｜派出=log:review-logs/e4e5.subagent.log

## 第 4 路·一致性复核（横向：本次动的口径 vs 同类路径既有定义）

<!-- dh:consistency-review:v1 task=DHR_02 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|---------|-------------|------|---------|
| Runner 事件落账/状态快照字段（relay-store.ps1 / relay-state.json） | DHR_01 冻结契约（relay-schema.ps1 event/receipt/authority/active-plan schema） | 一致 | 无需处置（事件/receipt/authority/active-plan 全部先过 `Test-Relay*` 再落盘；relay-state 是 Runner 私有快照、白名单独立 fail-closed·非 v1 冻结对象；params 追加一键=扩展非改写，DHR_01 六套件全绿） | e:E-010 |
| fake adapter 六动词 | design/01 §3.4 控制事件边界 + DevPlan DHR_02「fake adapter 行为契约」 | 一致 | 无需处置（恰好 9 键、无输入 API、Runner 不调 suspend/resume；轮1/轮2 均核过） | e:E-004/E-007 |
| `tools/relay/runner` 对 dh-crew 引用 | `tools/protocol/**`、`.dh-runtime`、`tools/tests/run-all.ps1` | 一致 | 无需处置（轮2 B-9：`tools/relay` 内 `.dh-runtime` 零引用；不进 run-all；`Get-Date/UtcNow` 零命中） | e:E-007 |

> `定义是否一致` 二选一：`一致` / `不一致`。`裁决` 三选一：`无需处置` / `有意差异` / `遗漏待修`。

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：对实现有没有 100% 信心？没有就逐条列 gap。
- 本卡证的是「fake adapter 上的确定性状态机」：CAS/receipt/身份/转换/冻结/fail-closed 全部有断言 + 三方探针；**真实终端**（psmux 句柄 1:1、visible/interactive、真进程退出）归 DHR_03。
- Runner 自身 IO 故障下事件/状态双写不原子（F-016）：P1 只统一落账顺序（state 先于 event）+ README 说明，对账归目标形态 backlog。
- F-020 偶发崩溃归因编排并发（同树探针），非代码；若干净树复现即回升 P1。
- 测试代码为压缩单行风格（可读性 P3），断言真实（三方探针均验证）。

**设计契约传导声明**（收口时只保留一条）：

- 契约有变化（**扩展**·非改写）：`relay-params.psd1` 追加 `LaunchDeadlineSeconds=120`（DevPlan DHR_02 卡「有界启动期限」的唯一冻结点落位）→ 已传导到 `as-built/relay-contracts.md`（参数行）+ `as-built/relay-runner.md`；design/01 §3～§4 语义未动；K-1（事件 kind 不扩枚举）保持 v1 冻结，`plan_rejected` 候选记 F-001 backlog。

**需求对齐证据**：

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| A1/A2/A3/A4/A5/A6 + fake adapter 行为契约（本卡 H=0·全机器证） | 在任务树根一键复跑 `pwsh tools/relay/tests/run-relay-tests.ps1` → 11 套件 SUITE PASS + `RELAY ALL PASS` exit 0（405 PASS 行）；两条回放事件签名 `review-logs/replay-signatures.txt` 逐行全等断言；主控三轮变异探针（E-003 5 支/E-006 4 支/E-008 4 支）+ 轮1/轮2/轮2b 复核者各自探针证明断言真有牙 | E-010 | 满足 |

**完成条件逐条挂证据**（创建期预填自 brief；收口时补 Evidence ID 和结论）：

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---------|------|-------------|------|
| 1 | 【机器证·A1/A2】Runner 只接受合法 active generation 和绑定结果，CAS 冲突/迟到/重复事件不推进。 | AI | E-010（authority 59：CAS 冲突三文件字节不变/版本连续/提案人/replan 六谓词各夹具/schema 拒收/proposal-immutable/state-invalid；ingest 45：stale-generation→result_stale 字节不变/wrong-session/duplicate final-immutable/no-attempt/半写/坏枚举/空文件；replay-blocked：迟到 A1→result_stale 不关当前 session） | 达成 |
| 2 | 【机器证·A3/A4】fake replay 跑通 blocked→replan proposal→B→fresh A，以及 decision checkpoint→依赖冻结/无依赖继续→同 session 后续 checkpoint/final result；断言 Runner 未调用输入或 resume 动作。 | AI | E-010（replay-blocked 18：11 行签名逐行全等/A1 stop 先于 v2/receipt×3 session 互异/fresh A resume_from/迟到 stale；replay-decision 23：C frozen_by=[A]、B 继续、错 session 拒、idle→running 靠磁带、零 suspend/resume 调用 + 源码静态扫描 0 命中、11 行签名全等）；轮2 B-1 三次回放逐字节同、B-2 重开等价 | 达成 |
| 3 | 【机器证·A5】`succeeded + next_action=review` 后任务仍 active。 | AI | E-010（ingest：task_state='active'、next_action 保留、节点恰好 14 键；authority：state 白名单拒 completed 键/done 枚举；两回放终态全 active） | 达成 |
| 4 | 【机器证·A6】错版本、半写、坏结果、进程活但无进展、无可信 stop/quota 原因均 fail-closed。 | AI | E-010（failures 65：launch 期限/probe 连败/停滞 31 tick 与心跳反例/exited 无结果/host 通道 exited/非法跳转/自报 interrupted/quota 兜底/decision 挂起不停滞/挂起期 probe 连败/paused 依赖者 waiting/已交棒 blocked 节点 probe 连败只记账+replan 复位，每组 paused 不变量+不再 probe+authority 字节不变；ingest：错版本→stale、半写/坏枚举/空文件→rejected） | 达成 |
| 5 | 【机器证·fake adapter 行为契约】实现 `launch/probe/suspend/resume/stop/emit_observation` 六个终端动词；消费 DHR_01 的 fixture/观测流，不修改 fixture、不持有业务状态、不判断代码质量。decision fixture 由同一 session 依次发出 `decision_required` 与后续 checkpoint/final result，adapter 不提供人工输入 API；测试断言 Runner 在两者之间没有调用 `resume`，并覆盖依赖节点冻结、无依赖并行节点继续、错身份后续结果拒绝。launch receipt 写入后进入 `launching`；在有界启动期限内未获得绑定 `running` 观测则转 `unknown`、追加 `launch_failed` 事件并停住。 | AI | E-010（authority：adapter 恰好 9 键/suspend、resume 返 not-used/receipt_present=true 先于 spawn/launching 投影/句柄不等→launch_failed；failures：期限超时→unknown+launch_failed+paused；replay-decision：零 resume 调用+错身份拒+冻结/继续；stop 后不吐 host 事件） | 达成 |

**验收项元数据表**：

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|----------|--------|-------|---------|-------------|---------|-----------|-----------|----------------|------------------|---------------------|
| A1/A2 CAS + 身份绑定不推进 | relay-runner-authority + relay-runner-ingest 套件 | machine | DHR02-A1A2 | 等价覆盖 | 文件字节比对 + 事件 kind/reason 断言 | RELAY ALL PASS（E-010）·探针 CAS/schema/replan 谓词真红 | pwsh 7 / Windows 11 / wt/DHR_02 | 契约函数（DHR_01 已独立 oracle）+ 文件哈希 | 真实终端接线归 DHR_03 | relay/v1 | machine-suite | controller-run |
| A3 blocked→replan→B→fresh A | relay-runner-replay-blocked 套件 | machine | DHR02-A3 | 等价覆盖 | 事件签名逐行全等 + receipt/session 唯一性 + 迟到结果 stale | PASS（E-010）·三次回放逐字节同 | 同上 | 剧本夹具（静态）+ 事件签名 | 真实 psmux 归 DHR_03 | relay/v1 | machine-suite | controller-run |
| A4 decision 冻结依赖/无依赖继续/不 resume | relay-runner-replay-decision 套件 | machine | DHR02-A4 | 等价覆盖 | 逐 tick 快照 + adapter 调用日志零 resume + 源码静态扫描 | PASS（E-010）·删 frozen_by 写入探针红 | 同上 | 调用日志 + 静态扫描双 oracle | 真人回答归 DHR_03 H1 | relay/v1 | machine-suite | controller-run |
| A5 succeeded 仍 active | relay-runner-ingest 套件 | machine | DHR02-A5 | 等价覆盖 | 节点键集合恰好白名单 + task_state='active' | PASS（E-010） | 同上 | 键集合白名单 | — | relay/v1 | machine-suite | controller-run |
| A6 fail-closed 矩阵 | relay-runner-failures 套件 | machine | DHR02-A6 | 等价覆盖 | 每用例 paused 不变量 + 不再 probe + authority/active-plan 字节不变 | PASS（E-010）·心跳=进展/final_committed 守卫/json-not-object 探针红 | 同上 | 文件哈希 + 调用计数 | quota 识别通道留目标形态 | relay/v1 | machine-suite | controller-run |
| fake adapter 六动词契约 | relay-runner-authority + 回放套件 | machine | DHR02-FAKE | 等价覆盖 | 键集合恰好 9 个 + receipt_present + 期限 launch_failed | PASS（E-010）·不写 receipt 文件探针红 | 同上 | 键集合白名单 | psmux adapter 归 DHR_03 | relay/v1 | machine-suite | controller-run |

**业务化五段展示区**：

- 要证明啥：没有常驻主控，一个确定性 Runner 靠文件状态就能把最难的接力边界走通——CAS 晋级、receipt 先于 spawn、旧结果拒收、blocked→重编排→fresh 恢复、decision 挂起只冻依赖节点且不介入回答、各类异常统一 fail-closed。
- 期望值：`run-relay-tests.ps1` 11 套件全 SUITE PASS + RELAY ALL PASS；两条回放签名与落盘工件逐行全等；三方变异探针（主控 13 支 + 三轮复核者 15 支）各自使对应断言变红。
- 实际值：E-010 405 PASS/0 FAIL；签名 24 行全等；探针 27/28 真红（唯一不红的 D 探针→守卫盲区 F-013 已修并再探红）。
- 差没差：无差；两轮返工共关闭 P1×1（F-014）+ P2×6（F-003/004/005/011/015 + F-016 裁 P3）+ P3×10；0 open P0/P1/P2；F-001/F-002 为 backlog/as-built 记录、F-016 对账留目标形态、F-019/F-020 记录。
- 证据局限：全在 fake adapter 上（H=0）；真实 psmux 句柄/可见交互/真进程退出、真人回答（H1/H2）归 DHR_03；Runner 自身 IO 故障事务性属目标形态。

**风险放行账表**：

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|-------|---------|------|------|------------|---------|---------|
| 无 | — | — | — | — | — | — |

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [x]
**as-built 更新了没**：`as-built/relay-runner.md` 首份快照 + `relay-contracts.md` 补参数？ [x]

→ 当前状态：**待验收**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

### 目的一：确认最小 Runner + fake replay 已把接力状态机走通（本卡 H=0，仅 E11 本地收口授权）

本工作区交付：Runner core + fake adapter + 两条端到端确定性回放 + 异常 fail-closed 矩阵 + 一键复跑 runner。

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| 机器证全绿 + 两轮复核收敛（E10 证据展示） | 查看 AI 在对话展示的 `run-relay-tests.ps1` 输出、两条回放事件签名、探针记录与两轮复核结论 | RELAY ALL PASS（11 套件）+ 0 open P0/P1 + 轮1/轮2 均已落账 | [ ] |

---

- 确认记录：
- verify 提交 SHA：
- 签名：　　时间：

→ 解锁状态：**待人验**

### 确认记录（append-only，每次人验确认追加一行）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---------|--------|----------------------|----------------------|-------------------------------|---------------|--------------------------------|
