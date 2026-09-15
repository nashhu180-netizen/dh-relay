<!-- dh:v1 · task_plan.md -->
# task_plan — RLT_21 Linux 预演回流

## 要读的上下文 (Context Packet) ★前置

> **执行契约头（zero-context）**：你是 RLT_21 relay-light 流水的 worker，只完成派单指定的当前 Node；进 `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_21`（分支 `wt/RLT_21`）后第一个 Git 动作是 `git rebase master`，再读仓根 `AGENTS.md`、本文件、`brief.md`、`progress.md`、`findings.md` 与派单指定 oracle。三条硬约定：
>
> ① **两树分工**：接力计划 `relay_plan.md` 与账本 `relay_log.jsonl` 只在 **RLT_12 树**（`D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_12`，run=`rlt12-win-01`）；代码改动与本任务工作区只落在 **RLT_21 树**。worker 不越树写文件——不在 RLT_12 树写代码/工作区，也不在本树建 `relay/` 计划或账本；账本读写一律是监工在其树内的事，worker 不调 `relay_log.py` 写事件。
> ② **DR-W-008（rebase 撞 WIP 处置）**：`git rebase master` 被同一 worktree 的 WIP 拒绝时，用 `git merge-base HEAD master` 与 `git rev-parse master` 核查 **HEAD 是否已含 master 顶点**；成立则 rebase 视为 no-op、在 progress 记一行即可，**不强推、不清 WIP、不 `--autostash`**；不成立或判不出，发阻塞信号，不自行处置。
> ③ **批次**：C1 = A137 / A138 / A139 / A140；C2 = A141 / A142 / A143。每批验收编号与该批 `check.C<n>.md` **一一对应**——check.C1.md 只核 C1 四条、check.C2.md 只核 C2 三条，不跨批混审。
>
> 只在 RLT_21 allowed-paths 内修改；偏离路线只记 progress/findings，不改本计划、DevPlan、design 或越界文件，不自行复核、verify、push、PR、merge 或部署；卡住按 execution_strategy 的信号约定写 `status=BLOCKED` 落盘，不憋死；凭据/密钥值永不写入 note、progress、findings、decision 或任何工件与账本。

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | `AGENTS.md` | worker 铁律、allowed-path/复核/凭据边界、relay-light 协议段 |
| C-002 | DevPlan §RLT_21、§2.1/§2.2、§3.1、§4 | owner、交付物、非目标、七条验收、依赖 RLT_07/09/10、批次 1 与 GitHub-flow |
| C-003 | design/01 §11 HC-RL-A137～A143；§3.4（决策链/strategist 归属）、§3.5（status schema 与 lint 映射）、§6.2/§6.3（配置与角色） | 逐字 oracle、证法与事件归属语义 |
| C-004 | `workspace/RLT_12/evidence/linux-dry-run/README.md` DR-F-001～006；`workspace/RLT_07/findings.md` F-002/F-003 | 六条预演事实与两条挂账缺口的原始描述 |
| C-005 | `tools/relay-light/relay_log.py`（只读盘点） | `stage_result` 校验段、`agent_lost`/attempt 止损（A107/A113）、`_note_tokens`、`DECISION_EVENTS`（:59）、`status`/`status --json` 输出、配置加载；行号以现场为准，不凭记忆 |
| C-006 | `tools/relay-light/test_relay_log.py`（只读盘点） | 现有测试类/夹具/CLI runner 约定；RLT_07 钉住的两条 `@unittest.skip` 负例（`test_a114_consult_resume_without_user_decision_rejected`、`test_a114_auto_mode_rejects_user_decision_on_decider_chain`） |
| C-007 | `tools/relay-light/skill/` 五件（SKILL.md、两份 adapter、`dh-mapping.toml`、`roles.toml`） | 监工模板落点、plan-reviewer 模板、`[limits]` 节、adapter 三段原文落点 |
| C-008 | RLT_12 树 `relay/rlt12-win-01/relay_plan.md`（只读） | 本卡节点表/agent 表/现场约定（DR-W-001/004/007/008）；worker 只读不写 |

## 全程允许路径闭集与禁改项

只允许修改：

- `tools/relay-light/relay_log.py`
- `tools/relay-light/test_relay_log.py`
- `tools/relay-light/skill/**`
- `docs/modules/relay-light/workspace/RLT_21/**`

禁止修改：DevPlan、design、AGENTS、其他 workspace、`tools/tests/`（薄壳与 `$suites` 登记不动）、`tools/runner|host|contracts/`、dev-harness 仓、两侧用户级 skill 副本、**RLT_12 树任何文件**。预演分支 `dryrun/rlt12-linux` 不合入；其 `.gitignore` 若顺带承接（仓根新建忽略 `__pycache__/`）不在本卡 allowed-paths 内——不动，记 findings 交裁决。

## 批次与 durable signal

C1 → checker 小审（check.C1.md）PASS → C2 → checker 小审（check.C2.md）PASS → R1（requirement + lesson 双路 + scribe 体检汇总）→ F1，严格串行；任一 BLOCKED 由 decider 裁决、编排重派。每个角色的完成信号为 `docs/modules/relay-light/workspace/RLT_21/done.<role>.md` 独立文件（同名角色跨节点时用 `done.<role>.<node>.md` 避免覆盖；监工单节点派单另有指定时以派单为准），内容一行：

```text
task=RLT_21 role=<role> node=<W1|C1|C2|R1|F1> status=<DONE|PASS|FAIL|BLOCKED|...> evidence=<commit SHA 或文件名> next=monitor
```

写完信号立即停止，不等 `node_closed`，不启动下一角色或阶段。阻塞写 `status=BLOCKED`，并在 progress/decision 素材里写明阻塞点、已试路径与需要的裁决。

## 施工共通约束

- 每批先写/解钉行为断言取 RED，再最小实现转 GREEN；导入/路径/fixture/权限/解释器错误都不是有效 RED。RLT_07 两条 skip 负例在 A142 实现到位后**去 skip 即绿**，不许改断言本体伪造绿。
- `ref=`、`launch_fix=` 均走 `_note_tokens` 解析，**不新增账本字段**；`launch_fix` 只在 `status --json` agent 条目暴露（无则 null），不进计划 lint。
- 证据先登记 `progress.md` 证据账本再被信号 `evidence=` 引用；coder 写 findings/lesson 行，scribe 是 progress.md 单一写入者（A66/A67 分工）。
- 每批跑目标测试 + `test_relay_log.py` 全量回归 + `git diff --check` + 四集合 allowed-paths 检查（`git diff --name-only master...HEAD`、working tree、index、untracked）；只暂存点名文件，禁 `git add -A`/`git add .`；commit scope 用英文 `relay-light`。
- Windows 环境命令名 `python`；ledger/状态类命令若需现场直跑，显式带 `--config-dir ~/.claude/skills/relay-light/`（五情形解析，防双侧歧义退 3）。
- checker 只核「是否偏离 task_plan / 越界 / 证据缺口」，不替代 normal 复核；decider 不改任何文件，只写 `decision.<n>.md`（n 全卡递增）。

## 施工步骤 (Steps)

### C1 — A137 / A138 / A139 / A140

**改动文件**：`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、`tools/relay-light/skill/dh-mapping.toml`、`tools/relay-light/skill/SKILL.md`、`tools/relay-light/skill/references/adapter-claude-code.md`、`tools/relay-light/skill/references/adapter-codex.md`，及本工作区施工账。

| # | 改动 | 怎么验（命令 → 预期） |
|---|---|---|
| 1 | Test · `test_relay_log.py` 新增 A137 组：节点未关时 `stage_result outcome=blocked ref=<agent>#<n>:blocked`（或 `:agent_lost`）接受；同场景 `done` 仍拒 A112；缺 `ref=` / ref 不存在 / ref 已被 `resume` 或终态覆盖三例各退 2 报 A137；`stage_close` 对 `blocked` 仍拒 A118 | `python -m unittest -v <A137 组>` → FAIL（现实现不分 outcome 校验/无 ref 合同），stderr/退出码精确落断言 |
| 2 | Modify · `relay_log.py` `stage_result` 校验段：按 outcome 分路——`done`/`cancelled` 保 A112 全节点 closed；`blocked`/`failed` 免节点关闭但强制 `ref=<agent>#<n>:(blocked|agent_lost)`，引用须在本阶段实例内存在且为该 agent 最新事件 | 同命令 → A137 组全绿 |
| 3 | Test · A138 组：同一 `(node,agent)` 连续 `attempt_max` 条 `note` 含 `NOT_RUN` 的 `agent_lost` 后，第 `attempt_max+1` 条 `agent_launch` 退 2（A107）；此刻 `stage_result blocked ref=<agent>#<attempt_max>:agent_lost` 接受；该 agent 名下 `user_decision`（`note` 含 `launch_fix=<token>`）后，同 token `agent_launch` 接受且 attempt 续增、该 token 组止损重新计 `attempt_max`；无授权 / token 不一致 / 第二个 `launch_fix` 组各退 2；`status` 不可关原因含 NOT_RUN 计数与 fix 组 | → FAIL |
| 4 | Modify · `relay_log.py`：`agent_lost`+`NOT_RUN` 计数与 A107 止损出口、A138 的 `user_decision`/`launch_fix` 授权链（每 `(node,agent)` 至多一组、每条 `user_decision` 授权一个 token）、`status` 不可关原因输出 | → A138 组全绿 |
| 5 | Test · A139 组：`agent_launch` note 带/不带 `launch_fix=` 各一例，断言 `status --json` 该 agent 条目 `launch_fix` 字段（有值/null）；lint 对 launch 列与账本不一致零告警 | → FAIL（`status --json` 无该字段） |
| 6 | Modify · `relay_log.py`：`agent_launch` 接受 `launch_fix=` note token（不校验与计划 launch 列关系、不触发 plan_amend）；`status --json` agent 条目输出 `launch_fix` | → A139 组全绿 |
| 7 | Test · A140 组：配置加载 `limits.silence_timeout_min`（缺省=30；`dh-mapping.toml` 写值后可加载）；打桩时钟下 `status` 对超阈 agent 行出现/不出现 `ledger_silent` 提示（仅提示，不判死）；结构检查三处模板命中「三者均无变化」与「不得中断」 | → FAIL |
| 8 | Modify · `dh-mapping.toml` 加 `limits.silence_timeout_min`（默认 30 语义写进注释/文档）；`relay_log.py` 配置加载 + `status` 按账本最近事件计算静默并输出 `ledger_silent` 提示；SKILL.md 与两份 adapter 监工模板各加入原文：「`ledger_silent` → 核 Herdr 状态 + pane 末行 + 允许路径产出三者是否也无变化 → 三者均无变化才中断并记 `agent_lost silent_timeout` → 同 pane 重拉 `#n+1`；任一仍在变化不得中断」 | → A140 组全绿；三处模板 grep 命中 |
| 9 | Record · scribe 记 progress 证据账、本批 commit；发 C1 信号 | `git diff --check` → clean；四集合无越界 |

**audit 小审输入**：C1 增量 diff；A137~A140 四条逐条 RED/GREEN 原始摘要与退出码；四集合边界；commit SHA。→ `check.C1.md` 只覆盖这四条。

### C2 — A141 / A142 / A143

**前置**：check.C1.md PASS。

**改动文件**：`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、`tools/relay-light/skill/SKILL.md`、两份 adapter，及本工作区施工账。

| # | 改动 | 怎么验（命令 → 预期） |
|---|---|---|
| 1 | Modify · 两份 adapter 各写入三段原文：① `agent start` 后 `wait --until idle` 再 `prompt`，prompt 后读 pane 末行确认已提交（未提交 `send-keys Enter` 一次并复核）；② 编排等待优先账本文件事件监听 +「监工连续空闲 ≥2 分钟且无新账本行」告警；③ 沙箱型只读启动不可用时的环境预检替代（bypass 沙箱 + 提示词只读约束 + `launch_fix=`） | 结构检查：两份 adapter 各命中三段原文 → PASS（A141） |
| 2 | Test · A142 组：去掉 RLT_07 两条 `@unittest.skip` 负例装饰器（`test_a114_consult_resume_without_user_decision_rejected`、`test_a114_auto_mode_rejects_user_decision_on_decider_chain`）；新增 `cancelled` 归属正反各一例——触发 agent 名下 `cancelled` 接受、非触发 agent 名下退 2 | `python -m unittest -v <两条去 skip 用例>` → FAIL（现状两腿 rc=0，F-002/F-003 实证） |
| 3 | Modify · `relay_log.py` `add` 路径：`decision_mode` 模式门——consult 下 `decision` 后无 `user_decision` 即 `resume` 退 2；auto 下 decider 链出现 `user_decision` 退 2；`cancelled` 加入决策类归属校验（A69，`DECISION_EVENTS` 含 `cancelled`），非触发 agent 名下 `cancelled` 退 2 | → 去 skip 两腿 + cancelled 正反例全绿；A96/A114 既有正例不回归 |
| 4 | Modify · SKILL.md plan-reviewer 模板写 light 分级原文：纯措辞/格式/引用陈旧项一律 P2 不阻断 PASS；allowed-paths、写入者边界（谁写 progress/findings/lesson）、节点/阶段边界、验收命令与完成信号缺失或矛盾仍为 P1；附「light 只按此分级，heavy/normal 不变」 | 结构检查命中「P2 不阻断」+四类 P1 原文；用预演 `workspace/RLT_12/evidence/linux-dry-run/` 对应 `review.plan.md` 两轮 P1 按新分级复算 = 1 P1 + 4 P2（A143） |
| 5 | Record · scribe 记 progress 证据账、本批 commit；发 C2 信号 | `git diff --check` → clean；四集合无越界；`test_relay_log.py` 全量回归绿 |

**audit 小审输入**：C2 增量 diff；A141~A143 逐条证据；RLT_07 两负例去 skip 绿截图/输出；四集合边界；commit SHA。→ `check.C2.md` 只覆盖这三条。

## 整卡收束（R1/F1 由编排另行派单，本计划不预演）

- R1：normal Recipe——requirement、lesson 两路独立复核（产出 `review.requirement.md`/`review.lesson.md`），scribe 先做机器体检与四道闸脚本、汇总 miner 进 `review.md`；有效单测变异点由复核侧选点登记。
- F1：scribe 收口备料（as-built、AI 提交区、交付汇报、证据展示区）；skill 改动两侧重同步须先展示解析后两个绝对目标并取得**用户当次明确授权**再 `install_skill.py --all`，未授权停在仓内验证；收口前 `verify(relay-light):` 属后续闸，不在本计划自证。

## 关键决策（一句话各一行）

- Worktree：是，分支 = `wt/RLT_21`（本树只放代码与工作区；计划/账本在 RLT_12 树）。
- 派子 agent：是（relay-light 流水自身：coder/checker/scribe/decider/reviewer 由监工按节点表逐棒拉起）。
- Review：normal Recipe 三路（代码轮 1、需求方向、教训），由编排/监工按冻结计划派独立复核实例；施工者不复核自己的卡。
