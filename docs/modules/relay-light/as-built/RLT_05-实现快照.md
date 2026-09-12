# RLT_05 实现快照 — relay-light CLI / 账本 / 状态投影

> 本文是 RLT_05 收口的 as-built 快照，只记录已落进 `tools/relay-light/relay_log.py`（单文件，纯 stdlib，tomllib 需 Python 3.11+）与 `tools/relay-light/skill/*.toml` 的**现役事实**——即 RLT_03（解析/lint/账本/事件守门）+ RLT_05（阶段生命周期、status 投影、配置/Recipe、止损探针）两卡的并集。事实源是代码本身，不照抄 design；工作区 `reviews/` 各审件作旁证。RLT_07+ 的提示词/模板/实跑编排不在此文范围。
> 测试面：`tools/relay-light/test_relay_log.py` 108 例全绿（2026-09-12，本快照落盘时点）。

## 1. CLI 面

`relay_log.py` 以 `python3 relay_log.py <subcommand>` 直跑（`prog="relay_log.py"`，`main()` 返 int，`__main__` 转 `SystemExit`；`relay_log.py:1848-1883`）。参数解析器是 argparse 子类，参数错误被收进统一错误合同而非 argparse 自退（`relay_log.py:102-106`）。

| 子命令 | 必填 flag | 可选 flag | stdout | 成功 rc |
|---|---|---|---|---|
| `add` | `--plan --node --event --agent` | `--note`（默认 `""`）、`--config-dir` | 无输出；追加一行账本 | 0 |
| `status` | `--plan` | `--json`、`--config-dir` | §10.3 文本（默认）或 13 键 JSON 文档 | 0 |
| `lint` | `--plan` | `--config-dir` | `lint: ok` | 0 |

退出码与错误行（`relay_log.py:181-187,652-671,1848-1879`）：

| rc | 语义 | 触发面 | stderr 形状 |
|---:|---|---|---|
| 0 | 成功 | — | — |
| 2 | 合同违例 | `lint` 命中的 lint 规则、`add` 的事件/守门违例、参数错 | `lint: <code> <msg>`（仅 lint 子命令）或 `error: <code> <msg>` |
| 3 | 输入失效 | config 解析（A135）、TOML 装载（A92/A131）、plan 文件/标记（A18/A24）；`add`/`status` 下**所有** lint 违例统一折成 3（`_runtime_plan` 把 2 改判 3） | `error: <code> <msg>` |
| 4 | 账本完整性 | JSONL 读/解析/七字段/seq/换行终止、写盘失败 | `error: ledger <msg>` |

`HC-RL-Axx` 编号是 design 验收清单的**冻结条目号**，不是错误类别序号：同一编号可管多处相关检查（如 A89 同时管 `plan_loaded` 唯一性与 stage 生命周期顺序）。非编号 code 只有 `arguments`（参数层）与 `ledger`（账本层）两个。

## 2. 账本与状态机

### 2.1 账本形状

- `relay_log.jsonl` 在 `--plan` 目录下，append-only，每行一条紧凑 JSON（`ensure_ascii=False` + `separators=(",",":")`，`relay_log.py:1196-1209`）。
- 七字段闭集 `{seq,ts,node,event,agent,by,note}`，多一个少一个都拒；`seq` 必须等于 1 起始的行号；除 `seq` 外全为 string；`agent` 形如 `name#n`（n≥1）；`by ∈ {orchestrator,monitor}`；`event` 必须在 19 词表内；文件须 `\n` 结尾，按 `\n` 切分（不用 `splitlines`——防 U+0085/U+2028/U+2029 把一条 JSON 劈成两行）；文件不存在按空账本读（`read_ledger`，`relay_log.py:678-714`）。
- 首行必为 `plan_loaded`（A84），且全账唯一（A89，`_require_sole_plan_loaded`，`relay_log.py:1053-1056,1191-1192`）。

### 2.2 事件词表（19 = 9 控制 + 10 agent，`relay_log.py:26-54`）

| 族 | 成员 |
|---|---|
| 控制（9） | `plan_loaded`、`stage_start`、`monitor_launch`、`node_start`、`node_close`、`stage_result`、`stage_close`、`monitor_restart`、`plan_amend` |
| agent（10） | `agent_launch`、`checkpoint`、`blocked`、`escalate`、`decision`、`user_decision`、`resume`、`done`、`agent_lost`、`cancelled` |

agent 终态 = `{done, agent_lost, cancelled}`；终态后同 `(node, agent)` 实例禁止再写（A60）。

### 2.3 writer 与写者交接守门

- **A85 写者表**（`WRITER_BY_EVENT`，`relay_log.py:70-84,1009-1014`）：`orchestrator` 写 `plan_loaded/stage_start/monitor_launch/stage_close`；`monitor` 写 `node_start/node_close/monitor_restart/stage_result/plan_amend` 及全部 agent 事件。`by` 由 agent 名前缀推出（`orchestrator#*` → orchestrator，其余 → monitor，`relay_log.py:724-725`）。
- **A93 写者交接窗口**（`_validate_writer_handoff`，`relay_log.py:1136-1164`）：monitor 名下事件必须落在所属实例的 `stage_start..stage_close` 窗口内；实例 `stage_close` 之后任何该实例行一律拒；非 stage 事件的 note 若带 `stage_id=` 且与 `--node` 所属实例不一致即拒。
- **阶段寻址**（`_stage_of`，`relay_log.py:1313-1325`）：`stage_start/monitor_launch/stage_result/stage_close` 四件按 note `stage_id=` 归属实例；其余行一律按 `node` 归属——非 stage 事件的 `stage_id=` token 不能把行改挂到别的实例。

### 2.4 阶段生命周期守门（`_validate_stage_event`，`relay_log.py:1069-1133`）

| 事件 | 顺序与内容约束 |
|---|---|
| `stage_start` | 该实例未 start/close 过；必须先于本实例 `monitor_launch`（A89） |
| `monitor_launch` | 必须随本实例 `stage_start` 之后（A89） |
| `stage_result` | note 必带 `stage_id=` 且指向已知实例（A105）；`outcome ∈ {done,blocked,failed,cancelled}`（A105）；`cancelled` 须在 note 引 `user_decision`（A118）；实例全部节点已 `node_close`（A112） |
| `stage_close` | 实例已 `stage_start` 且未关（A89）；已有 `monitor_launch`（A89）；全部节点已关（A89）；最新 `stage_result` 存在且 `outcome ∈ {done,cancelled}`（A112）——`blocked` 直接走 A118 |

`monitor_restart` 与 `plan_amend` 不带阶段顺序规则（竞态由 A93 窗口管）。`stage_result` 可多次写，投影取最新（A105）。

### 2.5 agent 状态机与节点关闭

- 转移表（A60，`relay_log.py:937-949`）：`checkpoint/blocked/done` ← `{agent_launch,checkpoint,resume}`；`escalate` ← `{agent_launch,checkpoint,blocked,resume}`；`decision` ← `{escalate}`；`user_decision` ← `{decision}`；`resume` ← `{decision,user_decision}`；`agent_lost/cancelled` ← `{agent_launch,checkpoint,blocked,escalate,decision,user_decision,resume}`。
- `agent_launch` 前置：节点已 `node_start`（A78）；trigger 满足——`on:done:<name>` 要求目标最新为 `done`（A70）、`on:blocked` 要求当前确有 blocked/escalate 悬挂（A77）；attempt 编号首为 `#1`、逐次 +1（A58）；重拉资格 = 前一实例终态 `agent_lost/cancelled`，或其后同实例出现 `stage_result outcome=failed`（A49，`relay_log.py:904-929`）。
- 决策链归属（A69/A97，`relay_log.py:815-897`）：decider/strategist 名不直接承载 `escalate/decision/user_decision/resume`；`escalate` note 必带唯一 `decider=<name>#<n>` 或 `strategist=<name>#<n>` 且 kind 与实例名一致；链内后续事件只能由发起 agent 承载；`decision` note 须回引 escalate 声明的 helper；**strategist 链的 `resume/cancelled` 必须先有 `user_decision`**（A97，auto 档也不例外）。
- `node_close` 双判据（`_validate_node_close`，`relay_log.py:952-968`）：全部已 launch agent 达终态（A17）；若节点 `close=agent:<name>` 则该 agent 必须 `done`（A74）；不可关两次（A68）。
- `node_start`：未 start/launch 过（A68）；全部 `depends_on` 已关（A78）。

### 2.6 plan lint（`lint_plan`，`relay_log.py:488-615`）

标记行 `<!-- relay-light:plan v1 ... -->` 必填 `skill/session/recipe/cards=`（A18）；`decision_mode ∈ {auto,consult}`（A130，缺省 auto）。节点表：`stage_id` 形如 `<card>:<stage>#<k>` 且 card 一致（A104）；`stage ∈ {W,C,R,X,F}`（A129）；`card` 须在 marker cards（A87）；`type ∈ {build,construction,review,rework,handoff}`（A126）；同实例节点连续分组（A129）；依赖可解析、不指 superseded（A48/A72）、无环（A48）、同卡内不指向更晚阶段（A89）、同卡相邻实例不得并行脱链（A109）；`X#k ≤ rework_max_rounds`（A97）。agent 表：节点存在、同节点不重名（A24）；每活跃节点至少一个活跃 agent（A75）；`close=agent:<name>` 必须是本节点 agent（A47）；`on:done:` 目标须存在且同节点（A35/A71）。superseded 行（note `superseded-by:<目标>` / agent note=`superseded`）须指向已知未废弃节点，且全部行在 lint 与投影中被跳过（A128/A73 口径）。

## 3. status 派生投影

`derive_status(plan, entries, now=None)` 纯只读投影，`now` 可注入以定死时钟与静默（`relay_log.py:1458-1625`）；`status_document` 输出 §3.5 冻结的 **13 顶层键**（`relay_log.py:1728-1779`）：

| 顶层键 | 形状 |
|---|---|
| `plan` | `{marker, cards, decision_mode}` |
| `open_stages` / `current_stage` / `current_node` | 实例 id / 可空 |
| `last_stage_result` | `null` 或 **三键** `{stage_id, outcome, note}` |
| `suggested_action` | `SUGGESTED_ACTIONS` 五值之一 |
| `monitor_relaunch_count` / `pending_nodes` / `superseded_ignored` / `errors` | int / 节点名表 / int / 报警串表 |
| `stages[]` | `{stage_id, stage, card, k, state, nodes, result}`；`result` 为 `null` 或**五键** `{stage_id, outcome, note, amend, nodes}` |
| `nodes[]` | `{node, card, stage, type, state, closable, reasons}` |
| `agents[]` | `{node, agent, last_event, last_ts, idle_seconds}` |

键面分域：`amend`/`nodes` 只出现在 `stages[].result` 五键域；顶层 `last_stage_result` 恒只三键。`Status.last_writer/last_writer_stage`（最新行 `by` + 其归属实例）是 text-only 字段，不进 JSON 键面（`relay_log.py:1272,1605,1798-1803`）。

派生规则要点：

- 节点态 `closed/pending/open/ready`（依赖未闭→pending；依赖闭而未 start→ready；已 start→open；有 `node_close`→closed）；空账全 pending。阶段态 `pending/open/closed` 三态，由 `stage_start/stage_close` 行派生。
- `current_stage`：首个未闭节点所属实例已 start（或无 open 实例）时取该实例；否则在「全部节点已关、等 `stage_close`」的实例池里取 `stage_start` 最晚者，再退到最晚 open 实例——保证其 `last_stage_result/suggested_action` 始终可路由（A106，`relay_log.py:1549-1566`）。
- `stage_result` 行：`stage_id=` 缺失记 errors、实例未知/已废弃则跳过投影（A73）、`outcome` 非法记 errors；同实例多条取最新（A105，`latest_stage_result`）。
- `monitor_relaunch_count`：只统计「实例最新 outcome=`failed` 之后」的 `monitor_launch`；崩溃恢复式重拉不计（A106/§7.3，`relay_log.py:1513-1517`）。
- `suggested_action` 路由表（`_suggested_action`，`relay_log.py:1447-1455`）：无 result → `none`；`done/cancelled` → `open_next_stage`；`blocked` → `wait_user`；`failed` → 首次 `relaunch_monitor`、已重拉过 `notify_user`。
- `superseded_ignored` = 计划中 superseded 节点行 + agent 行计数。
- `agents[]`：`idle_seconds` 由注入的 `now` 减最新 `ts`；`ts` 解析失败或时区一边有一边无时记 errors 并按 0 计（`relay_log.py:1435-1444`）。
- `errors` 是**只读**异常报告（`_ledger_warnings`，`relay_log.py:1365-1432`）：status 不改写不拒收，只列出——A85 写者不符、A93 窗口越界（note 跨实例/close 后写/start 前写）、A89 `stage_close` 无 `monitor_launch`、A111 同卡多开实例、以及上述 `stage_result`/`plan_amend`（缺 `nodes=`）/ts 类行级问题。
- 文本渲染（`render_status_text`，`relay_log.py:1795-1831`）：计划/卡/当班写入者三行头；pending 实例不打 result token；节点明细只在 open 实例下展开，含不可关原因（`无终态事件`/`无 done 终态`）、`可关` 与在场 agent 行（最近事件 @ HH:MM:SS、静默 HH:MM:SS）。

## 4. 配置与 Recipe

- **目录解析**（`resolve_config_dir`，`relay_log.py:202-218`）：`--config-dir` 显式优先（须存在，否则 A135 rc3）；未给时 `$HOME` 下 `.claude/skills/relay-light` 与 `.codex/skills/relay-light` 必须**恰好一个**存在，0 或 2 都报 A135；支持 `~`/`~/...` 以 HOME 展开。
- **装载**（`load_config`，`relay_log.py:221-295`）：同一目录读 `roles.toml` + `dh-mapping.toml`；文件不可读/非 UTF-8/TOML 语法错按各自 code（A131/A92）rc3。
- **`skill/roles.toml`**：每角色一表 `{model, launch}` 皆非空（A131）；随仓 11 角色 = `planner/orchestrator/monitor/builder/plan-reviewer/coder/scribe/checker/decider/reviewer/strategist`。
- **`skill/dh-mapping.toml`**：`[stages]` 每阶段 `{dh_nodes=[...]}`（W→S0,S1,S2；C→S3；R→E0,E1,E2,E4,E5,E14,E6,E3；X→E2,E3；F→E7,E8,E9,E10）；`[recipes.<tier>]` 每档 `{reviewers=[...]}`；`[limits]` `rework_max_rounds=2`、`attempt_max=3`（须 int，bool 拒）；`[limits.on_exceed]` `action="strategist-then-user"`（非空 string，附 note 说明串）。各段非空/类型校验全部走 A92。
- **Recipe 校验**（lint 侧，`_lint_recipe_reviewers`，`relay_log.py:618-649`）：marker `recipe` 必须是三值闭集 `{heavy,normal,light}`（A116）；该档须已配 reviewers（A116）；每个活跃 R 实例下 `role=reviewer` 的 agent 名集合必须与配置集合**相等**（顺序无关），实例无 reviewer 则跳过。配置侧三档冻结路集合本身即 A115 口径：heavy=`code-round2,requirement,lesson,consistency`、normal=`requirement,lesson`、light=`lesson,consistency`。
- **`plan_loaded` 来源重建**（`_plan_loaded_note`，`relay_log.py:1171-1182`）：写入时剥掉调用方自报的 `config_dir=/plan=` token（`PROVENANCE_KEYS`，不信自证），追加 percent 编码后的真实 config 目录与 plan 目录绝对路径（`_encode_path`，`safe="/:~-._"`，§6.2.1/A135）。

## 5. 止损

- `loss_stop(plan, entries, config)` → `LossStop{attempts, x_rounds, attempt_exhausted, x_exhausted, .triggered}`（`relay_log.py:1628-1701`）。只读探针：**无子命令、不进 status schema（13 键无止损字段）、不写文件**。
- **attempts**：按 `(node, agent 名)` 计 `agent_launch` 行数；耗尽 = 计数 ≥ `limits.attempt_max` 且最新行仍要求重拉——终态 `agent_lost/cancelled`，或其后同实例有 `stage_result outcome=failed`（与 A49 放行重拉同因）。
- **x_rounds**：按卡记最高已 `stage_start` 的 `X#k`；耗尽 = `k ≥ limits.rework_max_rounds` 且该实例最新 `stage_result outcome=failed`。
- 两套计数**独立、不叠加、不互相重置**；任一耗尽即 `triggered`。出口由 `limits.on_exceed.action="strategist-then-user"` 钉死：monitor 拉 strategist → 全局方案或建议停卡 → 永远交用户裁决（账本侧由 A97 强制：strategist 链 `resume/cancelled` 前必有 `user_decision`）。
- `plan_x_rounds(card, config)`（`relay_log.py:308-320`）同理是内部件：按计划生成 `X#1..X#rework_max_rounds` 序列，不写文件、不加子命令，上限与 lint A97 共享同一 `rework_max_rounds`。

## 6. 边界与已知沉默区

**本卡未交付**（设计愿景，非现役事实）：无 watch/常驻 monitor 驱动循环，无 herdr/终端 adapter，无计划模板生成；`plan_amend` 只在账本层收事件行（读侧校验 `nodes=` 存在），计划文本改写、白名单与 planner-amend 流程未实现（归 RLT_09）；公共 CLI 仅 `add/status/lint` 三件。

**已知沉默区**（E-097 裁 accept-as-is，`workspace/RLT_05/findings.md` 登记 F-HR1-02 + F-HRQ-02 + F-HRQ-04）：

| 沉默点 | 事实 |
|---|---|
| stage 事件 node 归属（F-HR1-02） | 四个 stage 级事件按 note `stage_id=` 寻址，`--node` 不与目标实例的节点集核对——可静默接受且 `status.errors` 不留条（写者仍受 A85 管） |
| `plan_loaded` 首节点（F-HRQ-02） | `plan_loaded` 的 `node` 不校验「首个非 superseded 节点」，任一活跃节点可填；仅影响该行自身的 stage 归属 |
| 未知 stage 实例（F-HRQ-04） | 指向计划外 stage 实例的 `stage_result` 在投影中被静默跳过、errors 不留条；superseded 实例的同处理是 A73 明文要求，未知实例属合同沉默区 |

收紧归属或 errors 增补属合同修订，须先走 design，不在实现侧自扩。

## 结论

RLT_03+RLT_05 交付的现役面 = 一个 fail-closed 的三子命令 CLI、一份七字段 append-only 账本及其事件/写者/生命周期守门、一张 13 键只读 status 投影（含文本渲染）、一套 config 目录解析 + roles/recipe/limits 装载与 lint、以及两个内部止损探针。以上条目均以 `relay_log.py` 行号与 `skill/*.toml` 为证；未交付项与沉默区已按登记口径单列，不在本快照泛化。
