# review.workflow-final.code-round1.review-round-1 — RLT_29 workflow-final 代码轮1

- 复核者：reviewer#code-round1-r1（Devin SWE-2 Max，w41:tC/pC，实例 r29-wf-code1-r1）；phase=workflow-final；path=code-round1；review_round=1；remediation_count=0。
- 日期：2026-09-23。fresh reviewer，未参与 RLT_29 施工/规划/批次复核。本文件与 `DONE.workflow-final.code-round1.review-round-1.md` 是本棒唯二业务写入；未改代码、合同、证据或其它工件。
- 输入基线：`git diff 93d65cb`（tracked 7 件，+462/-26）+ untracked 清单（workspace/RLT_29/** 116 件、`as-built/single-task-实现快照.md`、`design/evidence/13`）。

## 0. RELAY_RECEIPT preflight

- `env | grep -E '^RELAY_'` → 无输出，未命中；走正常复核路径。未清除任何 `RELAY_*`。

## 1. 复核自跑（cwd=/home/nash/work/dh-relay/.dh-worktrees/RLT_29，均本 reviewer 独立执行，非引用 coder 证据）

| 命令 | exit | 结果 |
|---|---:|---|
| `PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=tools/relay-light python3 -m unittest tools/relay-light/test_install_skill.py` | 0 | `Ran 19 tests / OK`（8 install + 11 SingleTaskStructureTests） |
| `PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=tools/relay-light python3 -m unittest discover -s tools/relay-light -p 'test*.py'` | 0 | `Ran 240 tests / OK` |
| `PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=tools/relay-light pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | 0 | `RELAY ALL PASS (SKIPPED: 1)` |
| plan/log 扫描（task_plan §7 Python 块） | 0 | `plan/log audit: PASS`，workspace 内无 `relay_plan.md`/`relay_log.jsonl` |
| `git diff --exit-code 93d65cb -- tools/relay-light/relay_log.py docs/modules/relay-light/relay` | 0 | 禁改路径零 diff |
| `git diff --exit-code 93d65cb -- tools/relay-light/skill/roles.toml` | 0 | roles.toml 零 diff |
| `git diff --check` | 0 | 无输出 |
| §6 allowed-path audit（verbatim，`-c core.quotepath=false`） | 0 | `allowed-path audit: PASS`，changed=125 全在闭集 |
| `dh relay-light`（fresh，写到 /tmp 不落证据） | 1 | `59 失败, 35 警告`；与 `post-b04-rerun-1/B-04.txt` 失败区多重集逐字相等（declared=59 parsed=59，missing/new 均空），0 条 RLT_29-owned；exit=1 由 classified inherited 解释，未当作 PASS |
| `sha256sum DONE.plan-review.round-2.md` | — | `9f6cf3a3…ed62f` 与 §4 冻结值逐字一致 |

## 2. 逐项审查结论

### 2.1 生产/工具改动正确性（diff 93d65cb）

- 唯一可执行改动是 `test_install_skill.py`（+201/-1）：新增 `test_roles_toml_replica_bytes_identical_to_source`（InstallSkillTests）+ `SingleTaskStructureTests` 11 条纯文本断言；`install_skill.py` 本体零改动，五文件闭集测试沿用既有 API。其余全部为文档合同（AGENTS +6、SKILL +45、双 adapter 各 +40、design/01 +67/-11、DevPlan +89/-15），均为纯插入段或簿记滚动。
- AGENTS.md：新增 `### single-task 单卡接力段` 插在 relay-light 编排协议段尾与 worker 铁律段之间；full relay 标头段、`[relay-light] worker · node=` 判定、worker 铁律、密钥红线零字节改动。标头字段 `phase/agent/batch/round/workspace` 与本棒实际派单首行逐字吻合；与 full 标头双向互斥明写。
- SKILL.md `## single-task 单卡接力模式`：六个子节齐备——标头/phase 9 值闭集、RELAY_RECEIPT 分角色 fail-closed、model-allocation gate（启动前硬闸）、生命周期与计数（含两证据层与 heavy 完成谓词）、batch PASS 清理闸、durable signal/sole writer、monitor 120s 节拍+安全 Enter、恢复四类权威。不改写上方任何完整模式合同（diff 为纯插入）。
- 双 adapter：各 +40 纯插入 single-task 节，声明「协议语义以 SKILL.md 为准」；claude 侧 `tab create`+root_pane、codex 侧 `pane split`+claude-kind shim——平台差异是既有惯例延续，语义一致。
- design/01 §7.5 新增与 §11 A159～A168/H19 行、计数 133+15=148→143+16=159 算术正确；DevPlan RLT_29 卡、任务表、批次 8、§6 映射（11 ID 全映到 RLT_29）一致。**满足。**

### 2.2 合同一致性逐项核对（派单指定面）

- **model-allocation 未确认零启动**：三文档 gate 节均含「未获明确确认不得启动任何 agent」+「推荐默认仅是提案/不写死模型/逐角色修改/快照复用/变更重问/超时静默最大权限不推定确认/不扩张授权」；双 adapter 另列四项明文反例（缺询问/先启动后补/未确认默认拉起/变更免确认均属违规）；gate 节先于拉起节（结构断言钉住顺序）。**满足。**
- **实例变化重问**：「新增/更换角色或实例、换模型或推理档必须再次询问确认」三文档同文。**满足。**
- **monitor 零写/不决策**：三文档「完全只读」行枚举不写 signal/progress/execution_strategy/轮询日志/通知日志/任何文档、不路由、不分派、不启动 agent；通知非 durable；RELAY_RECEIPT 命中时 repo 零写、只 Herdr prompt 通知、不写 BLOCKED、不清 RELAY_*。**满足。**
- **Devin queued Enter 三条件单次**：①派单文本仍停输入框（含 Devin queued 排队未发出）②`state_change_seq` 未推进 ③非审批/确认 UI——同时成立才发一次并复验，失败通知 orchestrator 换 fresh、禁止连按；三文档一致，codex 侧补 TUI enter 可能被吃成换行、以 `agent read` 输入框清空为终极复验——平台特化不削弱合同。**满足。**
- **durable signal/sole writer/恢复权威**：单行九字段 schema（BLOCKED 含 reason）三文档与 task_plan §4 一致；`progress.md` 仅当前 batch coder 一条里程碑；恢复四类权威且不依赖终端存活。**满足。**
- **batch clear**：SKILL「batch PASS 后会话清理闸」= durable PASS + 工件齐全 → orchestrator 对 coder/reviewer 各一次 `/clear` → 复验 → 下一批；FAIL/整改禁止、monitor 常驻不 clear、decider 按需；与 task_plan §1.1、execution_strategy 已发生记录（b1/b2/b3 均 confirmed-observed-cleared，revision=5）一致。**满足。**
- **workflow-final 与 E2 两层隔离**：SKILL/design/task_plan/review.md 四处一致——final 每轮 fresh reviewer vs E2 仅 open P0/P1 后同 `reviewer_session_id` targeted attempt 2；条件相斥不得合并；heavy 五路一条不少。当前无 `DONE.workflow-final.*`/`DONE.e2-code-review.*` 文件预造（实测 ls 为空）。**满足。**

### 2.3 test_install_skill.py 12 项新测试有效性（重点：是否真挡负例）

- 红绿证据核验：`red/B-structure-RED.txt` 含 11 条 `FAIL:` 全部属 `SingleTaskStructureTests`（AssertionError，非导入/路径错误），exit=1；`green/` 19 tests OK exit=0。快照 `red/baseline-skill-93d65cb/` 五件齐备。
- **本 reviewer 独立构造只读负例**（改动落在 /tmp/rlt29-neg/* 副本，repo 零写入；`RELAY_LIGHT_SKILL_DIR=<mutated>`）：

| 变异 | 实测 |
|---|---|
| neg1：SKILL gate 删「未获明确确认不得启动任何 agent」 | FAILED failures=2（gate contract + negative examples） |
| neg2：codex adapter monitor 行删「不路由、不分派、不启动 agent」 | FAILED failures=1（`test_monitor_repo_workspace_zero_write`） |
| neg3：SKILL receipt 行弱化产出型 BLOCKED 措辞 | FAILED failures=1（`test_relay_receipt_fail_closed_split…`） |
| neg4：claude adapter 注入旧 5 值 `plan|batch|final|decision|monitor` | FAILED failures=1（`test_phase_closed_set_is_nine_phases_not_legacy_five`） |

- 断言落点核验：三文档中「完全只读」/「RELAY_RECEIPT` fail closed 分流」/「model-allocation gate」标题各仅一次出现，`line_with`/`section` 首个匹配语义落在预期行；`NINE_PHASE_SET`、signal schema、恢复权威等关键串逐字命中。
- 结论：12 项新测试对删除/弱化/旧枚举回渗均实际咬人，**不是脆弱字符串假绿**。残留盲区见 P2-4。**满足。**

### 2.4 历史 blocker/rerun 最终状态（不得把旧 BLOCKED 当已修）

- B-04 链实测完整且方向正确：`BLOCKED.batch-3.coder.md`（b04_rlt29_owned_review_md_and_inherited_drift）原样保留 → `decision.batch-3-b04.md` RESOLVED → `BLOCKED.builder.batch-3-b04-contract.md`（r12 缺登记 ID）保留 → `decision.batch-3-b04-evidence-id.md` → ledger READY → builder attempt-2 READY → `DONE.plan-review.batch-3-b04.md` targeted PASS → `DONE.batch-3.coder.b04-rerun-1.md` READY → `DONE.batch-3.review.md` PASS。无历史文件被覆盖。
- `post-b04-rerun-1/comparison.json` 守卫逐项 ok：parse 数=声明数、baseline 多重集 59+7 与 summary 一致、R30 P/S 逐字、baseline L=设计单路径、post L 六路径 ⊆ D 且全在稳定 tracked 名单（tracked-before==after，实测逐字相同 7 件）、canonical inherited Counter=59、owned=0、无未登记 ID 的 R8 warning。本 reviewer fresh `dh` 复算与 captured 多重集逐字相等。
- `post/comparison.json`（verdict=fail）与旧 post 原件保留未刷——历史失败如实留痕，未伪装已修。
- review.md 五路 pending、E2 pending/not-dispatched、Recipe 未勾、人验 `[ ]`、verify SHA 待回填——**没有任何未来状态被冒充完成**。**满足。**

### 2.5 密钥红线与证据卫生

- diff 与 herdr/ 捕获、各 txt 证据中无凭据值；grep 命中项均为 relay 测试套件自身的 redaction 测试名（如 `password leaves no residue`）或文档红线条文，非密钥。
- Evidence Ledger SHA-256 抽查全中：E-301 `e5fb50b1…`/`9a271f2a…`、E-302 `50d91639…`/`0167aadc…`、E-303 `b10e4b80…`、E-304 `9cdee4d4…`/`ae89bd3a…` 与原件实算逐字一致。

## 3. findings

- **P0：无。P1：无。**
- **P2-1（沿用 batch-1/2/3 已登记，归 plan/decider 层）**：design/01 §7.5.5 标头示例枚举旧 5 值 `phase=<plan|batch|final|decision|monitor>`，与运行期 9 值闭集（task_plan §1、SKILL、双 adapter、结构测试均一致）字面不齐。`test_phase_closed_set_is_nine_phases_not_legacy_five` 已把该串挡在 skill 三文档之外，风险受控；建议收口由 decider/orchestrator 同步 design 该处为泛指或 9 值。
- **P2-2（新登记）**：DevPlan §5「§14 开发方案同步项对照」表缺第 8 项行——design §14 有第 8 项「Linux 预演回流（RLT-A-08）」（实质由 RLT_21 承接，DevPlan RLT_21 卡可证），对照表 baseline 起就只有 1–7 行，本次新增第 9 行使「§14 九个同步项均有 owner」的文字与 8 行的表不齐。建议收口补 `8. Linux 预演回流 | RLT_21 | …` 行或调文字。非阻断，traceability-only。
- **P2-3（沿用 check.batch-3 P2-2）**：as-built §4 表记 B-04=66 未过，如实对应 `post/` 原始运行；rerun PASS 证据在 `post-b04-rerun-1/`。受裁决写范围限制未回刷，收口/E10 备料须并读两处，避免快照被误读为 B-04 仍失败。
- **P2-4（新登记，测试局限如实记录）**：12 项结构断言本质是 presence-based 文本断言，能挡删除/弱化/旧枚举（§2.3 实测），但挡不了「追加型违反」（文档保留要求句同时新增矛盾许可句，如另起一行「monitor 也可写日志」）；`line_with`/`section` 首个匹配与单行集中断言对重排版脆弱——方向是 fail-loud 非假绿，可接受；如需更强可后续补 negative-string 断言。不构成放行阻断。
- **P2-5（沿用 batch-1 P2-3，已裁决历史）**：user-adjust 轮次 signal `review_round=user-adjust[-N]` 非纯数字取值；plan-review 历史 signal `evidence=task_plan.md`/`review.plan.md` 为 workspace 相对路径——均系新 schema 冻结前产生、经 decision.plan-round-3 裁决保留的历史事实，非本次施工引入。
- **P2-6（新登记，观察项）**：`design/evidence/13` §二.6 保留被 §七「用户更正」取代的旧 monitor 合同原文（monitor 单写 progress 作恢复真相）；§七明确 supersede 且正文说「这些未提交记录不继续作为形成史」，但 §二.6 无回链指针。形成史文件、已过多轮 plan-review，仅登记备查。

## 4. 结论

P0=0、P1=0 → **PASS**。RLT_29 的代码轮1审查面全部成立：AGENTS/SKILL/双 adapter single-task 合同一致且与 full relay 双向互斥、零回归；12 项新结构测试经独立变异实测确实咬负例；安装五文件双副本一致、roles.toml 字节零变化；relay_log.py、`docs/modules/relay-light/relay/**`、dev-harness、旧卡全部禁改区零 diff；model-allocation 闸、monitor 零写、安全 Enter、durable signal/sole writer/恢复权威、batch 清理闸、workflow-final 与 E2 两层隔离均实现一致；历史 BLOCKED 与 rerun 链真实闭合、无伪绿。本 PASS 仅为 workflow-final `code-round1` 一路初审结论，不代表其余四路、E2、人验或任务收口。
