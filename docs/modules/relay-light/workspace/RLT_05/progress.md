<!-- dh:v1 -->
# progress — RLT_05

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-10 | W builder | 读取 AGENTS、DevPlan RLT_05、design owner 合同、RLT_03 七件套与当前两份 Python；仅创建 RLT_05 标准档 v2 七件套，冻结四批施工顺序与 heavy 复核靶子 | master 基线由派单给定 `1bea79fe18271f9d5dc6cc8993bfbf57d`；`relay_log.py::_status_command` 明示 RLT_05 placeholder；本工作区七文件 | `W_READY`；等待主控裁决 findings 并另行建立 worktree/派 construction，不改 DevPlan“未开始” |
| 2026-09-11 | W planner rework | 读取两份独立报告后按主控 A–K 裁决定向返工七件套：重排四批 owner 能力，冻结 per-R A116、三 CLI 配置接线、A89 精确 lint、手动 DONE、双域 mutation、A99 内部接口与跨卡守恒；独立报告保持原样 | `reviews/task-plan-review-opus.md`、`reviews/task-plan-decisions-fable.md`；findings 裁决登记；未运行施工/复核/验证 | `W_REWORK_READY`；H1–H4 均须用户确认正式 A/B-adjust，确认前禁止 D-start |
| 2026-09-11 | main controller · B-adjust | 基于已晋级 A06 的正式输入与 fresh Opus 正式 B-review，吸收 v5 窄核 `APPROVE`，原子同步 DevPlan 与 workspace 六件；H1–H4 闭合，owner/count 更新但未启动施工、测试或 review。GitHub Issue #8、`wt/RLT_05` 与专用 worktree 已就绪；主树保持干净 | E-001；`design/evidence/07#review-rlt-b06`、`#understanding-rlt-b06`；B06 v5；用户确认“后者，继续”中的 B06 落盘部分 | B06 落盘瞬间状态=`blocked-by-D-start-authorization`；本行不是 D-start |
| 2026-09-11 | main controller · D-start | 用户明确回答“后者，继续”：确认 B06 落盘后仍需独立 D-start，并在同一答复中授权继续启动原施工。DevPlan 机械回填 RLT_05 为进行中、工作区链接与 Issue #8；只开放 Batch 1 | E-002；对话授权；worktree=`/home/nash/work/dh-relay/.dh-worktrees/RLT_05`，branch=`wt/RLT_05`，client=`omp`，worker=`rlt05-build-deepseek` | `D_START_AUTHORIZED batch=1`；待 Herdr 真提交并登记 session-run |
| 2026-09-11 | rlt05-build-deepseek · Batch 1 construction | 进场 `git rebase --autostash master`（master=HEAD=`1bea79f`，无重放）。先写 14 条配置/Recipe 行为断言取红，再最小实现 `resolve_config_dir`/`load_config`/三 CLI `--config-dir` 接线/per-R A116，并建两份 TOML；旧 fixture 逐条对齐；未改 task_plan/review/DevPlan/design/AGENTS/其他卡，未 commit/push/PR/verify | E-004～E-013；红 `python3 -m unittest tools/relay-light/test_relay_log.py -k RelayConfigTests -v` → `FAILED (failures=18, errors=5)`；绿同命令 → `OK (14)`；全量 `python3 -m unittest tools/relay-light/test_relay_log.py` → `Ran 68 tests ... OK`；`git diff --check` exit 0 | `DONE task=RLT_05 batch=1 status=READY_FOR_REVIEW evidence=E-004,E-005,E-006,E-007,E-008,E-009,E-010,E-011,E-012,E-013 next=main-controller` |
| 2026-09-11 | main controller · Batch 1 fresh 小审回收 | 回收 `rlt05-b1-check-sol` 的机器只读检查；reviewer 未写仓。结论 `CHANGES_REQUIRED`：P1=2（Recipe 三值闭集可被替换配置扩张；`plan_loaded` 可保留伪造来源 token），P2=1（A92 stage mapping 测试未精确锁死） | E-014～E-015；`reviews/batch1-review-sol.md`；fresh unittest/help/diff-check 因 `bwrap RTM_NEWADDR` 为 `NOT_RUN`，未冒充通过 | `REWORK task=RLT_05 batch=1 round=1 status=CHANGES_REQUIRED next=construction-worker` |
| 2026-09-11 | rlt05-build-deepseek · Batch 1 rework round 1 | 按 E-015 只闭合 P1×2 + P2：先写 5 条新增判别断言取红（3 条 provenance/相对路径 + 1 条 recipe 枚举 + A92 精确等值属覆盖补强），再最小实现 ①`RECIPE_TIERS` 冻结 `heavy/normal/light` 并在 A116 先验枚举、②`plan_loaded` note 无条件重建 `config_dir=`/`plan=`（丢弃调用方同名 token，其余 token 保序，`plan` 规范化为绝对路径）。未改 TOML（两 hash 与 Batch 1 相同）、未改 review/reviews、未 commit/push/PR/verify、未进入 Batch 2～4 | E-017～E-023；红 `-k RelayConfigTests` → `Ran 18 tests ... FAILED (failures=5)`（4 条新判别断言 + 1 条相对路径；A92 精确等值补强为 pass-before）；绿同命令 → `OK (18)`；全量 `python3 -m unittest tools/relay-light/test_relay_log.py` → `Ran 72 tests ... OK` | `DONE task=RLT_05 batch=1 rework=1 status=READY_FOR_RE_REVIEW evidence=E-017,E-018,E-019,E-020,E-021,E-022,E-023 next=main-controller` |
| 2026-09-11 | rlt05-build-deepseek · Batch 2 construction | 进场 `git rebase --autostash master`（master=HEAD=`1bea79f`，无重放、无冲突）。先写 12 条 status 投影断言取红（含 §10.3 逐行样张、§10.1+§10.2 完整文档、A61 三态、A81 双判据、A73 规范化差分、A65、A134、A44 只读），再最小实现 `derive_status`/`status_document`/`render_status_text`/`parse_stage_result_note`/`derive_last_writer` 替换 `_status_command` placeholder；两处旧 fixture 对齐（A128 的 superseded 差分、close 列等价化）。未改 TOML（两 hash 与 Batch 1 相同）、未改 task_plan/review/reviews/DevPlan/design/AGENTS、未 commit/push/PR/verify、未进入 Batch 3/4 | E-028～E-036；红 `-k RelayStatusProjectionTests` → `Ran 12 tests ... FAILED (failures=14)`（11 条 CLI 侧 `status document is missing [...]`，3 条 API 侧显式 guard；无 import/setup/TypeError/FileNotFoundError）；绿 focused → `OK (12)`；全量 → `Ran 84 tests ... OK`；真实 CLI `status --json` 13 键 + `json.loads` 成功、文本样张逐行、两 TOML 解析、三 CLI help、`git diff --check` exit 0 | `DONE task=RLT_05 batch=2 status=READY_FOR_REVIEW evidence=E-028,E-029,E-030,E-031,E-032,E-033,E-034,E-035,E-036 next=main-controller` |
| 2026-09-11 | main controller · Batch 2 fresh 小审回收 | E-037 reviewer 因 `bwrap RTM_NEWADDR` 全项 NOT_RUN；E-038 hash-matched 隔离快照 reviewer 定位顶层 `last_stage_result` 正向 schema 缺口，主控对 design 与源码复算后确认是实际 P1 | E-037～E-039；`reviews/batch2-review-sol.md`；主控复跑 focused 12/12、全量 84/84 只证明错误 oracle 自洽 | `REWORK task=RLT_05 batch=2 round=1 status=CHANGES_REQUIRED finding=F-B2-LAST-RESULT-SCHEMA next=construction-worker` |
| 2026-09-11 | rlt05-build-deepseek · Batch 3 construction | 进场按 AGENTS 自 `git rebase --autostash master`（HEAD=master=`1bea79f`，无冲突、WIP 经 autostash 完整保留）。先写 `RelayLifecycleTests` 10 条行为断言取红，再最小实现：①常量 `WRITER_BY_EVENT`/`STAGE_ORDER`/`TERMINAL_RESULT_OUTCOMES` 与 `_validate_writer`（A85）②`_validate_stage_event`（A89/A105/A112/A118）③`latest_stage_result`、`_require_sole_plan_loaded`、`_validate_writer_handoff`（A93）④plan 层 A89 反向跨阶段依赖 lint（先于 A109）⑤status 侧 `_ledger_warnings` 只读报警（A85/A93/A111）与 `current_stage` 兜底。未改 TOML（两 hash 与 Batch 1 相同）、未改 task_plan/review/reviews/DevPlan/design/AGENTS、未 commit/push/PR/verify、未进入 Batch 4 | E-052～E-060；红 `-k RelayLifecycleTests` → `Ran 10 tests ... FAILED (failures=11, errors=4)`；绿同命令 `OK (10)`；全量 `Ran 94 tests ... OK`；真实 CLI 顺序 11 步全 0、10 条拒绝全部 rc2+精确 ID+账本字节不增、A89 lint rc2 精确编号 | `DONE task=RLT_05 batch=3 status=READY_FOR_REVIEW evidence=E-052,E-053,E-054,E-055,E-056,E-057,E-058,E-059,E-060 next=main-controller` |
| 2026-09-11 | main controller · Batch 2 定向复审闭合 | E-047 同一独立 reviewer 在刷新后的 hash-matched snapshot 核对三键/五键分离与边界，结论 PASS、new P0/P1=0、open=0；reviewer 动态仍 NOT_RUN，主控在源 worktree 独立复跑 | E-041～E-048；smallest 1/1、focused 12/12、full 84/84；diff-check PASS、pycache absent | `BATCH_REVIEW_CLOSED task=RLT_05 batch=2 status=APPROVE open=0 next=await-Batch-3-authorization` |
| 2026-09-11 | rlt05-build-deepseek · Batch 2 rework round 1 | 按 E-039 只闭合 `F-B2-LAST-RESULT-SCHEMA`：先改正向 fixture 的顶层断言（`STATUS_LAST_RESULT_KEYS = {stage_id,outcome,note}` + 精确取值，`stages[].result` 五键断言原样保留）取红，再做最小序列化拆分——新增 `_last_result_document`（三键）供顶层使用，`_result_document`（五键）仅供 `stages[].result`；未触碰派生/生命周期语义（`derive_status` 未改）。未改 TOML（两 hash 与 Batch 1 相同）、未改 task_plan/review/reviews/DevPlan/design/AGENTS、未 commit/push/PR/verify、未进入 Batch 3/4 | E-041～E-046；红 smallest → `Ran 1 test ... FAILED (failures=1)`，diff 显式显示当前多出 `amend`/`nodes`；绿 smallest → `OK (1)`；`-k RelayStatusProjectionTests` → `OK (12)`；全量 → `Ran 84 tests ... OK` | `DONE task=RLT_05 batch=2 rework=1 status=READY_FOR_RE_REVIEW evidence=E-041,E-042,E-043,E-044,E-045,E-046 next=main-controller` |
| 2026-09-11 | main controller · Batch 1 定向复审闭合 | 同一机器只读 reviewer 定向复核 E-015 的 P1×2/P2：三项均 PASS、open findings=0、边界 PASS；fresh 动态命令仍因 `bwrap RTM_NEWADDR` 为 NOT_RUN。主控随后在正常 worktree 用 `PYTHONDONTWRITEBYTECODE=1` 独立复跑 focused 与全量，并核 `git diff --check`/无 pycache | E-024～E-026；`reviews/batch1-review-sol.md#定向复审-r1e-024`；主控复跑 `Ran 18 ... OK`、`Ran 72 ... OK`、exit 0 | `BATCH_REVIEW_CLOSED task=RLT_05 batch=1 status=APPROVE open=0 next=await-Batch-2-authorization` |
| 2026-09-11 | main controller · Batch 3 authorization | 用户在 Batch 2 最终 `APPROVE`、open=0 的状态汇报后明确回复“不用等授权，继续”；按当前唯一等待点只开放 Batch 3 construction，沿用既有 `rlt05-build-deepseek`，由 `rlt05-monitor-deepseek` 监督 | E-049；对话授权；Batch 3 合同=`task_plan.md` 第 112～128 行；worktree=`/home/nash/work/dh-relay/.dh-worktrees/RLT_05` | `BATCH_AUTHORIZED task=RLT_05 batch=3 next=construction-worker`；不含 Batch 4、review、commit、push、PR、verify、merge 或 deploy |
| 2026-09-11 | main controller · Batch 3 dispatch | 向既有施工实例 `rlt05-build-deepseek`（`w15:pX`）提交 Batch 3 ticket；输入框已清空，状态由 done 转 working；既有 `rlt05-monitor-deepseek`（`w15:pT`）继续监督，本会话不主动轮询 | E-050；`state_change_seq 2209→2307`；Herdr status=`working` | `CONSTRUCTION_RUNNING task=RLT_05 batch=3 next=monitor-handoff` |
| 2026-09-11 | main controller · Batch 3 approval-mode switch | 用户明确回复“允许免审批”；仅将 `rlt05-build-deepseek` 的原 OMP session 在原 pane/worktree 以 `--approval-mode yolo` 恢复，Herdr 名称重新绑定，随后重投同一 Batch 3 ticket | E-051；session=`01a08e86-5404-7125-87bb-ac3673b526c0`；pane=`w15:pX`；resume 后模型状态栏仍为 `deepseek-flash`；`state_change_seq 2501→2502`、status=`working` | 免审批只改变工具确认方式，不扩大任务授权；仍禁止 Batch 4、review、commit、push、PR、verify、merge、deploy |
| 2026-09-12 | main controller · roster 重排 + Batch 4 授权/派单 | 控制器由 codex 切为 devin（w15:p1）。用户消息「继续 Rtl 05 多agent 协作进行」并指定新分工：编排=devin swe-2 max 只分发；施工=devin swe-2 max；批小审=claude opus high；决策=claude fable low 或 codex astra low（小决策代执行、方向级问用户）；heavy 复核=devin swe-2 max；监工=devin swe-2 medium 两分钟轮询、材料变化通知编排、可对卡壳 pane 发 bare Enter。按唯一等待点开放 Batch 4 | E-072～E-074；旧监工 w15:p12 关闭；新监工 `rlt05-monitor-devin`@swe-2-medium=w15:p16；decider `rlt05-decide-fable`=w15:p17；worker `rlt05-b4-build-devin`@swe-2-max=w15:p15 status=working | `BATCH_AUTHORIZED task=RLT_05 batch=4` + `CONSTRUCTION_RUNNING task=RLT_05 batch=4 next=monitor-handoff`；review/commit/push/PR/verify/merge/deploy 均未授权 |

## 施工批次状态（预填，不代表已执行）

| Batch | 功能单元 | 红 | 绿 | 小审 | 状态 |
|---|---|---|---|---|---|
| 1 | config/resolver/three CLI + Recipe lint | E-004（18 failed + 5 error；红锚点=CLI 拒收 `--config-dir` 的 exit 2 与五情形/编码断言）· E-017（rework R1：5 failed，红锚点=recipe 枚举可被配置扩张 + 伪造/重复/冲突来源 token 被保留 + 相对 plan 未规范化） | E-005（focused 14 OK）· E-006（全文件 68 OK）· E-018/E-019（focused 18 OK、全文件 72 OK）· E-026（主控复跑 18/72 OK） | E-014/E-015：R1 `CHANGES_REQUIRED`；E-024/E-025：定向复审 `APPROVE`，open=0 | REVIEW_CLOSED |
| 2 | complete status projection | E-029（14 failed：11 CLI `status document is missing [...]` + 3 API guard）· E-041（rework R1：1 failed，红锚点=顶层 `last_stage_result` 多出 `amend`/`nodes`） | E-030（focused 12 OK）· E-031（全文件 84 OK）· E-042/E-043（rework：smallest 1 OK、focused 12 OK）· E-044/E-048（全文件 84 OK） | E-039：`CHANGES_REQUIRED` P1=1；E-047/E-048：定向复审 `PASS`，open=0 | REVIEW_CLOSED |
| 3 | add lifecycle + A89 + routing | E-053（11 failed + 4 error；红锚点=A89 lint 接受了反向跨阶段依赖、A85 无写者守门、A105/A112/A118 非法 stage_result/close 被接受、A93 关后可续写） | E-054（focused 10 OK）· E-055（全文件 94 OK） | 待主控另派 | READY_FOR_REVIEW |
| 4 | limits + internal X planner | E-076（8 failed：5 有效行为红——A97 lint `2!=0`、strategist 终局 auto/consult × resume/cancelled 4×`2!=0`；3 显式 guard `unexpectedly None`；3 late-added 判别器 pass-before） | E-078（focused 8 OK）· E-079（全文件 108 OK） | 待主控另派 | CONSTRUCTION_DONE |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令/路径 | 结果 | 支撑结论 |
|---|---|---|---|---|
| W-001 | read-only baseline | `AGENTS.md`；DevPlan RLT_05；design/01；RLT_03 七件套；两 Python | observed | W 工件基于指定权威输入构建，未执行施工/复核/验证 |
| W-002 | current handoff | `tools/relay-light/relay_log.py::_status_command` | observed placeholder | RLT_05 的首个显式代码交接点是完整非空账本 status 生命周期 |
| W-003 | scope | `docs/modules/relay-light/workspace/RLT_05/**` | seven files created | 本 Node 只写 RLT_05 workspace |
| W-004 | W rework inputs | 两份 `reviews/task-plan-*.md` + 主控 A–K 裁决 | read-only reports; directed decisions applied only to seven-set | reviewer/decider 报告未自动生效、未被覆盖；本轮是计划返工，未施工 |
| E-001 | B-adjust promotion | `design/evidence/07#review-rlt-b06` + B06 v5 + DevPlan/workspace 六件同步 | Opus narrow review `APPROVE`; owner 25/20; global 111+15=126 | RLT-B-06 正式落盘只闭合合同，不冒充 D-start 或施工证据 |
| E-002 | D-start authorization | 用户对话“后者，继续”；Issue #8；`wt/RLT_05` / 专用 worktree | authorized, exact scope=Batch 1 construction | B06 落盘后的独立 D-start 闸已满足；commit/push/PR/verify/merge/deploy 均不在授权内 |
| E-003 | session-run | Herdr agent `rlt05-build-deepseek`，pane `w15:pX`，OMP `opencode-go/deepseek-flash` thinking=medium | prompt 真提交；state_change_seq `1821→1822`，status=`working`，标题=`Execute RLT_05 Batch 1 construction` | Batch 1 worker 已启动；只读指定合同后按 TDD 施工，完成/阻塞须 durable DONE 并停止 |
| E-004 | Batch 1 focused red（有效行为红） | `python3 -m unittest tools/relay-light/test_relay_log.py -k RelayConfigTests -v`，实现前（`relay_log.py` 未改、`skill/*.toml` 未建） | `Ran 14 tests ... FAILED (failures=18, errors=5)`；18 条失败全部命中行为断言，典型 `AssertionError: Regex didn't match: '^lint: HC-RL-A116 ' not found in 'error: arguments unrecognized arguments: --config-dir ...'`；5 条 error 为两份 TOML 尚不存在的 FileNotFoundError（非判别性红，只作 fixture 缺失登记） | A131/A92/A115/A116/A135 五条在实现前均可判别为红；红锚点是 CLI 拒收 flag 的 exit 2、help 无 `--config-dir`、五情形/编码断言失败，非 import/语法错误 |
| E-005 | Batch 1 focused green | 同上命令，实现后 | `Ran 14 tests ... OK` | 14 条配置/Recipe 断言全部转绿 |
| E-006 | Batch 1 全文件回归（含 RLT_03） | `python3 -m unittest tools/relay-light/test_relay_log.py` | `Ran 68 tests in 44.988s ... OK` | 旧 54 条 RLT_03 回归与 14 条新断言同批全绿，无回归 |
| E-007 | 两份 TOML 可加载 | `tomllib.loads()` 逐份解析 + `sha256sum` | `roles.toml ok ['builder','checker','coder','decider','monitor','orchestrator','plan-reviewer','planner','reviewer','scribe','strategist']`；`dh-mapping.toml ok ['limits','recipes','stages']`；sha256 `roles.toml=466c88d9ee55705e191454a4b9f543a4f0978fb846b209b8925cdb266ada6790`、`dh-mapping.toml=cbbfe236bc2ca39a551770e7659c98da4c3f8e39e1ed27f81560a8164b417fe0` | 两 TOML 逐字取自 design §6.3 样例；A131 的 11 角色键与 A92 四类内容由此文件承载 |
| E-008 | A135 三 CLI 签名面 | `relay_log.py --help` / `lint --help` / `status --help` / `add --help` | 顶层仍为 `{add,status,lint}`；三个子命令 usage 分别含 `[--config-dir CONFIG_DIR]` | 子命令集合未扩张；三命令均有同名可选 flag（A135 前半） |
| E-009 | A135 显式值展开/规范化/编码 + 账本落地 | 真实 CLI：`add --event plan_loaded --config-dir '~/.claude/skills/relay-light'`（HOME=`…/hôme dir`）与 `--config-dir <相对路径>` | 账本行 `note=skill=0.1.0 config_dir=/tmp/…/h%C3%B4me%20dir/.claude/skills/relay-light plan=/tmp/…/my%20plan`；`unquote(config_dir)` 精确等于规范化绝对路径；相对路径同理等于 `SKILL_DIR` | `~` 展开、abspath/normpath、`os.sep`→`/`、百分号编码后记入 `plan_loaded.note` 均可复算（A135 后半） |
| E-010 | A135 §6.2.1 五情形 resolver 与 fail closed | 合成 HOME 的 CLI 矩阵；显式目录不存在 | 仅 Claude 侧存在→lint rc0 且账本记录该侧；仅 Codex 侧存在→rc0；双侧存在→三命令 rc3 `error: HC-RL-A135` 且账本字节不增；零侧→三命令 rc3；显式目录不存在→三命令 rc3 且无账本 | 单侧自动、双侧/零侧 fail closed、显式优先，三命令共用同一 resolver+load_config |
| E-011 | A131/A92 加载与配置损坏 fail closed | 交付 TOML 内容断言（A131 的 11 角色/`model`+`launch`、A92 四类内容与 E11–E13 缺席、A115 三档集合）+ 四份损坏配置矩阵（缺 roles.toml、角色缺 launch、mapping 语法错、缺 `[limits.on_exceed]`） | 内容断言全部相等；四份损坏配置在 add/status/lint 上均 rc3，规则号分别为 `HC-RL-A131`/`HC-RL-A131`/`HC-RL-A92`/`HC-RL-A92`，stdout 空、账本不增 | 配置失败不降级、不静默跳过 A116；A92 覆盖 on_exceed 与 limits 结构 |
| E-012 | A116 per-R reviewer 集合矩阵 | CLI `lint`/`add`/`status` + `--config-dir` | 三档各自匹配集合（行序无关）→rc0；normal 多挂 code-round2→lint rc2 `lint: HC-RL-A116 DHR_90:R#1 reviewer set ['code-round2','requirement'] does not match recipe normal [...]`，add/status rc3 同编号且无账本；跨卡两实例仅第二个错配→仍拒且消息只点名 `DHR_91:R#1`；R 实例零 reviewer→rc0 豁免；`recipe=strict` 未配置→rc2/rc3 A116；同 fixture 下 A129 分组违规先于 A116 报出 | 每活跃 R 实例独立校验、集合精确相等、零 reviewer/无 R 不触发集合检查，而 recipe 值本身始终必须已配置；结构 lint 优先 |
| E-013 | §6.2 静态核对 + diff 边界 | `sed -n '688,733p' design/01 … §6.2` 内匹配 `code-round2|requirement|consistency`；`git status --short`/`git diff --name-only`/`git diff --check`；sha256 两 Python | §6.2 命中数 0（未复述路数）；改动仅 `tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`（M）与新建 `tools/relay-light/skill/{roles.toml,dh-mapping.toml}`（??）；`git diff --check` exit 0；sha256 `relay_log.py=cb56d5383b2ddded655fe4c8235ff050d266edc20a61cdc00580670f7a63be8f`、`test_relay_log.py=53f632fc8c4b7baaeee7d876015f7227d6148fb4e72a96c9cb62e307bdfa82d6` | A115 后半（§6.2 不复述取值）由小审据此核对；本批未触碰 status 投影/add 偏序/X planner/模板/watch/plan-amend，也未触碰其他卡的 M 项 WIP |
| E-014 | review-dispatch | dh dispatch | observed | 复核派出：rlt05-b1-check-sol（codex gpt-5.6-sol --sandbox read-only, fresh Batch 1 checker）｜Batch 1 only: diff + E-004..E-013 + fixture alignment + CLI/resolver/Recipe/TOML + design §6.2; no code changes, no Batch 2/heavy review |
| E-015 | Batch 1 fresh 小审 R1 | `reviews/batch1-review-sol.md`；reviewer=`rlt05-b1-check-sol`，Codex gpt-5.6-sol，sandbox read-only，fresh | `CHANGES_REQUIRED`；P0=0、P1=2、P2=1；边界 PASS；fresh 动态复跑因 `bwrap RTM_NEWADDR` 为 NOT_RUN | Batch 2 不开放；Batch 1 先闭合 Recipe 三值闭集与 plan_loaded 来源真实性，P2 建议同轮补强 |
| E-016 | session-run | dh dispatch | observed | 复核派出：rlt05-build-deepseek（Batch 1 rework round 1）｜Close E-015 P1x2 and low-cost P2 only; TDD red->green; no Batch 2/review/commit/push/PR/verify |
| E-017 | Batch 1 rework R1 有效行为红 | `python3 -m unittest tools/relay-light/test_relay_log.py -k RelayConfigTests -v`，实现前（`relay_log.py` 未改；两份 TOML 未改） | `Ran 18 tests in 5.865s ... FAILED (failures=5)`：①`test_recipe_tiers_stay_within_the_frozen_three_value_enum` → `AssertionError: 2 != 0`（扩展配置新增 `[recipes.strict]` 后 `recipe=strict` 的 lint 返回 0，未被拒）；②③④`test_plan_loaded_provenance_is_rebuilt_from_the_real_resolver` 三例 → `AssertionError: Lists differ: ['/tmp/…/resolved'] != ['/tmp/…/forged']`（伪造 token 被原样保留；重复例实收两个伪造值；冲突例实收伪造+真值各一）；⑤`test_plan_loaded_records_the_normalized_absolute_plan_dir` → `AssertionError: Lists differ: ['/tmp/tmp…'] != ['.']`（相对 `--plan` 原样记录） | 五条失败全为新增行为断言失败，无 import/setup/TypeError/FileNotFoundError；`test_a_config_without_one_frozen_tier_rejects_plans_using_it` 与 A92 精确等值在该时刻已通过（分别属既有 None 分支行为与覆盖补强），不冒充红 |
| E-018 | Batch 1 rework R1 focused green | `python3 -m unittest tools/relay-light/test_relay_log.py -k RelayConfigTests`（实现后） | `Ran 18 tests in 6.216s ... OK` | recipe 枚举 + provenance 重建 + A92 精确等值全部转绿 |
| E-019 | Batch 1 rework R1 全文件回归 | `python3 -m unittest tools/relay-light/test_relay_log.py` | `Ran 72 tests in 42.781s ... OK` | 原 68 条（含 RLT_03 回归与 Batch 1 既有断言）+ 4 条新断言同批全绿，无回归 |
| E-020 | P1 F-B1-RECIPE-ENUM 闭合（行为矩阵） | 真实 CLI + 变体配置（新增 `[recipes.strict]`／删除 `[recipes.normal]`）；`lint`/`add`/`status` | 变体配置定义 `strict` 后：`lint` rc2 `lint: HC-RL-A116 recipe strict must be one of ['heavy', 'light', 'normal']`、`add`/`status` rc3 同编号且 **账本不增**；同一变体下 `recipe=heavy` + heavy 集合仍 `rc0`（证明拒绝来自枚举而非配置加载失败）；删除 `normal` 的配置下 `recipe=normal` 亦 rc2/rc3 A116 | 冻结闭集 `heavy/normal/light` 不可由替换配置扩张或收缩而获得合法化；豁免仅限「R 实例 reviewer 集合」这一检查，不覆盖 recipe 取值 |
| E-021 | P1 F-B1-PLAN-LOADED-PROVENANCE 闭合（行为矩阵） | 真实 CLI：`add --event plan_loaded --note '<伪造/重复/冲突/缺省>' --config-dir <resolved>`（forged 值指向另一份可加载配置与不存在的 plan） | 四例 add 均 rc0，写入后 note 各恰好 1 个 `config_dir=` 与 1 个 `plan=`；`config_dir` 解码后精确等于 resolver 实际目录、`plan` 解码后精确等于 plan 规范绝对路径；伪造/重复/冲突值全部不出现；`skill=`/`session=`/`cards=` 等其它 token 保序保留 | `plan_loaded` 来源以 resolver 事实为准、无条件重建，调用方同名 token 一律不作真源（§6.2.1） |
| E-022 | P1 provenance 的路径规范化 | 真实 CLI：`add --plan . --config-dir <仓内 skill>`（cwd=含空格的 plan 目录） | rc0；note=`skill=0.1.0 config_dir=/home/nash/…/tools/relay-light/skill plan=/tmp/tmp3sudj3fl/my%20plan`；`unquote(plan)` 为绝对路径且等于 plan 目录 | 记录的 `plan` 是规范化绝对路径的百分号编码，相对路径/含空格路径均可解码复算 |
| E-023 | P2 F-A92-COVERAGE 补强 + 边界复查 | `test_shipped_dh_mapping_carries_the_four_frozen_content_classes` 改为对 `mapping["stages"]` 精确等值（W/C/R/X/F 全键与全值，含 R 的 `E0,E1,E2,E4,E5,E14,E6,E3` 顺序）；三 CLI help；`tomllib` 解析两 TOML；`git status --short`/`git diff --check`；sha256 | 精确等值断言通过（该断言为**覆盖补强**，实现前即绿，非红）；顶层仍 `{add,status,lint}`，三子命令 usage 各含 `--config-dir`；两 TOML 可解析且 sha256 与 Batch 1 完全相同（`roles.toml=466c88d9…6790`、`dh-mapping.toml=cbbfe236…7fe0`）——本轮未改 TOML；改动仅两 Python（`relay_log.py=4ba2611b7796c7606d28a8db5f74025d57bf332a123cc94862ccbe77ca9e0171`、`test_relay_log.py=bd9f24458df5b3b7bba4b2af0a4a1a2214654028f9ab6777beb7336ba6988078`）+ workspace 记录；`git diff --check` exit 0；测试产生的 `tools/relay-light/__pycache__/`（确认仅含两 pyc）已删除 | A92 的 `stages` 漂移（额外 R 节点、缺/多阶段、顺序变动）现在会被断言直接拦下；边界仍收敛在 allowed-paths |
| E-024 | review-dispatch | dh dispatch | observed | 复核派出：rlt05-b1-check-sol（codex gpt-5.6-sol --sandbox read-only, Batch 1 targeted re-review）｜Re-review E-015 P1x2/P2 closure only against E-017..E-023; verify no new P0/P1 and boundary; no Batch 2/heavy review |
| E-025 | Batch 1 定向复审 R1 | `reviews/batch1-review-sol.md#定向复审-r1e-024`；reviewer=`rlt05-b1-check-sol` | `APPROVE`；F-B1-RECIPE-ENUM、F-B1-PLAN-LOADED-PROVENANCE、F-A92-COVERAGE 均 PASS；open=0；边界 PASS；fresh 动态复跑因 bwrap 为 NOT_RUN | Batch 1 小审闭合；reviewer 无权自动启动 Batch 2 |
| E-026 | 主控动态复验 | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tools/relay-light/test_relay_log.py -k RelayConfigTests`；同环境全文件 unittest；`git diff --check`；无 `__pycache__` | `Ran 18 tests ... OK`；`Ran 72 tests ... OK`；命令总 exit 0；pycache absent | 补足 reviewer 只读沙盒的 fresh 动态 NOT_RUN 缺口，不替代独立静态复审身份 |
| E-027 | session-run | dh dispatch | observed | 复核派出：rlt05-build-deepseek（Batch 2 construction）｜User authorized 继续开发; Batch 2 only: complete read-only status projection; no Batch 3/4, review, commit, push, PR, verify, merge, or deploy |
| E-028 | Batch 2 基线核对 | `git rev-parse HEAD master`（rebase 前）；`git rebase --autostash master`；rebase 后 `git rev-parse` | HEAD=master=`1bea79fe18271b3b0b45c8d5dc6cc8993bfbf57d`（与派单期望一致）；rebase `已应用自动贮藏`、无冲突、无重放；rebase 后两者仍等于该 SHA | 进场闸满足；未发生冲突或基线漂移，无需 BLOCKED |
| E-029 | Batch 2 focused 有效行为红 | `python3 -m unittest tools/relay-light/test_relay_log.py -k RelayStatusProjectionTests`，实现前（`_status_command` 仍为 placeholder） | `Ran 12 tests in 2.226s ... FAILED (failures=14)`；**0 error**。11 条 CLI 侧失败消息形如 `AssertionError: set() != {...} : status document is missing ['agents', 'errors', 'last_stage_result', 'monitor_relaunch_count', 'nodes', 'open_stages', 'pending_nodes', 'plan', 'stages', 'suggested_action', 'superseded_ignored']`（placeholder 仅返回 `current_stage`/`current_node`/`pending_nodes` 三键）；3 条 API 侧失败消息为显式 guard `AssertionError: unexpectedly None : relay_log.derive_status is not implemented` | 红为新增行为断言失败；无 import/setup/TypeError/FileNotFoundError。API 侧 3 条（§10.3 逐行样张、完整文档、last-writer 静默）在 placeholder 下无法求值，其 guard 失败**不计入**有效行为红，仅作交接登记 |
| E-030 | Batch 2 focused green | 同命令，实现后 | `Ran 12 tests ... OK`（12/12） | A43/A44/A61/A62/A65/A73/A81/A134 断言全部转绿 |
| E-031 | Batch 2 全文件回归（含 RLT_03 与 Batch 1） | `python3 -m unittest tools/relay-light/test_relay_log.py` | `Ran 84 tests in 69.744s ... OK` | 原 72 条（Batch 1 18 + RLT_03 54）与 12 条新断言同批全绿；唯一曾红的旧用例是 A128/A73 差分（见 E-035），按 A73 对齐后通过 |
| E-032 | §10.3 逐行样张（固定 now） | `derive_status(..., now=2026-09-09T10:43:52+08:00)` + `render_status_text(status, "docs/modules/dh-relay/relay/wave-2026-09/")`，fixture=design §10.1 逐字 + §10.2 前 12 行逐字 + 3 行最小续写（C1 node_start / coder#1 launch / checkpoint@10:31:12） | 输出与 design 第 1106–1117 行**逐字节相等**（测试内 `STATUS_10_3_TEXT` 与 design 行区间经 `==` 校验为 True）；含 `计划：…wave-2026-09/   skill=0.1.0   session=app`、`卡：DHR_90, DHR_91      decision_mode=consult`、`当班写入者：monitor（DHR_90:C#1）`、`closed/open/pending` 三态、`不可关：coder#1 无终态事件`、`在场 agent：coder#1  最近 checkpoint @ 10:31:12（静默 00:12:40）` | A43/A44 文本面；固定 now 使静默与时钟可复算 |
| E-033 | §10.1+§10.2 完整 JSON 文档 | 同 fixture，`status_document(derive_status(...))` 全量等值断言 | 13 键全量相等：`stages` 顺序 `W#1/C#1/R#1/F#1`、state `closed/open/pending/pending`；`nodes` 顺序 `W1/C1/C2/R1/F1`、state `closed/open/pending/pending/pending`、`W1.closable=True`、`C1.reasons=["coder#1 无终态事件"]`；`agents`=`[W1/builder#1/done/3821s, W1/plan-reviewer#1/done/2497s, C1/coder#1/checkpoint/760s]`；`open_stages=["DHR_90:C#1"]`、`current_stage=DHR_90:C#1`、`current_node=C1`、`last_stage_result=None`、`suggested_action="none"`、`monitor_relaunch_count=0`、`pending_nodes=["C2","R1","F1"]`、`superseded_ignored=0`、`errors=[]` | A62 全量 oracle；A65 由 agents 列表（未触发 checker/scribe/decider 缺席）直接证明 |
| E-034 | A61/A81/A73/A134 判别矩阵 | 真实 CLI `status --json --config-dir <仓内 skill>` 的合成 plan/ledger 矩阵 | **A61**：空账本→当前阶段/节点 null 且三节点全 `pending`；仅 `plan_loaded`→`W1=ready`、当前节点 `W1`、`pending_nodes=["C1","C2"]`；加 `node_start`→`W1=open`；`node_close W1`→`["closed","ready","pending"]`、当前节点移动到 `C1`、`pending_nodes=["C2"]`。**A81**：start+launch+done 无 `node_close`→`state=open, closable=true`；加 `node_close`→`state=closed, closable=true`（独立计算）；无 `node_start` 直接 `node_close` 且 agent 未终态→`state=closed` 但 `closable=false, reasons=["builder#1 无终态事件"]`。**A73**：superseded 变体（W0 行 + `builder-old` 行）`superseded_ignored=2`、其余字段与删去该行的投影完全相等，且 `W0`/`builder-old` 不出现在三个列表。**A134**：含 checker（`close=agent:checker`）× 无 checker（`close` 空 / `close=agent:scribe`）三 fixture 均 `lint rc0`，无 checker 的 payload 全文不含 `checker` | 四条 ID 各有独立判别档；A134 的 `close` 空/指 scribe 两种合法形态均覆盖 |
| E-035 | 旧 fixture 对齐（A128/A73 差分 + A129 分组） | `RelayPlanLintTests.test_status_and_lint_match_with_and_without_superseded_rows` 的 superseded 变体；`RelayPlanLintTests.test_stage_must_be_known_and_grouped_contiguously`（Batch 1 已改至 `requirement`） | 发现并修正：原 superseded 变体的 `W1` 行 `close` 列为空、`C1` 行 `close`/`depends_on` 也与 plain 不同，故两 plan 并非「仅差 superseded 行」——placeholder 三键 payload 掩盖了该差异，完整投影立即暴露（`closable False/reasons ['builder 无 done 终态']` vs `True/[]`）。对齐后两 plan 仅差一行 superseded，并改为显式断言 `superseded_ignored` 0/1 后其余字段相等（比原「整体相等」更强）；未放宽任何既有断言 | A73 的规范化差分要求两投影仅差该计数；属 fixture 修正而非降级，已在下方 fixture 对齐明细逐条登记 |
| E-036 | 真实 CLI + 边界 + 清理 | `status --json --config-dir <skill>`（plan 目录含空格）；`status` 文本（真实时钟）；`lint`；`--help`×4；`tomllib`；`git diff --check`；`git status --short`；sha256；`ls`/`find` 后 `rm -rf tools/relay-light/__pycache__` | `--json` rc0、`json.loads` 成功、顶层恰 13 键、`suggested_action="none"`、agents 三条含 `idle_seconds` 整数；两次 status 前后账本字节**完全相同**（只读）；文本样张含全部 A43 六项；`lint` rc0；顶层仍 `{add,status,lint}`、三子命令各含 `--config-dir`；两 TOML 可解析且 sha256 与 Batch 1 **完全相同**（`roles.toml=466c88d9…6790`、`dh-mapping.toml=cbbfe236…7fe0`）——本轮未改 TOML；`git diff --check` exit 0；改动仅两 Python（`relay_log.py=81927251c2824d8532828278a65c70e5f602836617f6025e1be71dd950d01f73`、`test_relay_log.py=e24c2bfbd4bc251f9003a3c8d89cdebad4f57b0d4db819100f6a65bbbc3642ec`）+ workspace 记录；`tools/relay-light/__pycache__/` 确认仅含 `relay_log.cpython-312.pyc`、`test_relay_log.cpython-312.pyc` 后删除，仓库内已无 `__pycache__` | 只读性、CLI 面、配置未动与边界闭集均已复算 |
| E-037 | review-dispatch | dh dispatch | observed | 复核派出：rlt05-b2-check-sol（Codex gpt-5.6-sol, fresh read-only Batch 2 checker）｜Batch 2 only: incremental status projection + E-028..E-036 + exact JSON/text/read-only/last-writer/superseded/checker oracles; no code changes, no Batch 3/heavy review |
| E-038 | review-dispatch | dh dispatch | observed | 复核派出：rlt05-b2-check2-sol（Codex gpt-5.6-sol, fresh isolated snapshot reviewer）｜E-037 reviewer environment NOT_RUN due bwrap RTM_NEWADDR; re-dispatch Batch 2 review against hash-matched isolated snapshot /tmp/rlt05-b2-review2.eT0wmw/repo; workspace-write confined to disposable snapshot, source worktree remains read-only; no Batch 3/heavy review |
| E-039 | Batch 2 fresh 小审 R1 | `reviews/batch2-review-sol.md`；design §3.5；`relay_log.py::_result_document/status_document`；`test_stage_result_projection_carries_five_keys_with_and_without_amend` | `CHANGES_REQUIRED`；P0=0、P1=1、P2=0；E-037/E-038 动态均因 bwrap 为 NOT_RUN；主控另跑 focused 12/12、全量 84/84、diff-check PASS | 顶层 `last_stage_result` 合同为三键，但实现/测试错误复用 `stages[].result` 五键；Batch 3 不开放，先定向整改与复审 |
| E-040 | session-run | dh dispatch | observed | 复核派出：rlt05-build-deepseek（Batch 2 rework round 1）｜Close only F-B2-LAST-RESULT-SCHEMA from E-039: top-level last_stage_result exact 3 keys while stages[].result stays 5; valid red then green; no Batch 3/review/commit/push/PR/verify |
| E-041 | Batch 2 rework R1 基线核对 | `git rev-parse HEAD master`（本轮进场，**未再 rebase**） | HEAD=master=`1bea79fe18271b3b0b45c8d5dc6cc8993bfbf57d`，与派单期望一致；master 未变化，故按派单不重复 rebase | 同一 Batch 2 节点内基线稳定；无需 BLOCKED |
| E-042 | Batch 2 rework R1 有效行为红（smallest） | `python3 -m unittest tools/relay-light/test_relay_log.py -k test_stage_result_projection_carries_five_keys_with_and_without_amend -v`，**实现前**（`_result_document` 仍被顶层复用） | `Ran 1 test ... FAILED (failures=1)`；diff 明确显示实收多两键：`!={'stage_id,outcome,note'}` vs 期望三键，`+ 'amend': 'decision.2.md'`、`+ 'nodes': ['C3','C4']`；同一测试中 `stages[].result` 五键断言当时**已通过** | 红精确锚定「顶层 `last_stage_result` 多出 `amend`/`nodes`」这一 A62 精确键违约；无 import/setup/TypeError/FileNotFoundError。`stages[].result` 五键未被误改 |
| E-043 | Batch 2 rework R1 green（smallest + focused） | 同 smallest 命令；`-k RelayStatusProjectionTests` | smallest → `Ran 1 test ... OK`；focused → `Ran 12 tests ... OK` | 三键/五键分离到位，且 Batch 2 全部投影断言无回归 |
| E-044 | Batch 2 rework R1 全文件回归 | `python3 -m unittest tools/relay-light/test_relay_log.py` | `Ran 84 tests in 63.560s ... OK` | 与 Batch 2 施工后同规模（84 条）全绿；`derive_status`/生命周期语义未改动，无回归 |
| E-045 | 真实 CLI 非空 result 键集探针 | `status --json --config-dir <仓内 skill>`（合成 plan + 含 `plan_amend` 的账本，plan 目录含空格） | rc0、stderr 空；**顶层** `last_stage_result` 恰 3 键 `['note','outcome','stage_id']` 且取值精确等于 `{stage_id:DHR_90:C#1, outcome:done, note:<原文>}`；**`stages[].result`** 恰 5 键且保留 `amend="decision.2.md"`、`nodes=["C3","C4"]`；两者是不同对象、顶层不含 `amend`/`nodes`；顶层仍 13 键；空账本 `last_stage_result` 为 `null`；`suggested_action="open_next_stage"`、`current_node="C2"`、`errors=[]`；运行前后账本字节相同（只读） | 公开 JSON 与 §3.5 逐键一致：顶层三键、阶段结果五键，且 A106 的 `suggested_action` 派生未受影响 |
| E-046 | 边界与清理审计 | `git diff --check`；`find . -name __pycache__`；`git status --short`；`sha256sum` | `git diff --check` exit 0；改动仅 `tools/relay-light/relay_log.py`（`2e45163dbff22d89d3ed22e8d2a23a35ff601ee284e94b36107378f85678ef8a`）与 `tools/relay-light/test_relay_log.py`（`4a7975c9be2927dc1d33be22b47e4b91cd7faca24bf0d5a7d27b176f71ba18bc`）+ workspace 记录；两 TOML sha256 与 Batch 1 **完全相同**（`roles.toml=466c88d9…6790`、`dh-mapping.toml=cbbfe236…7fe0`）——本轮未触碰；`_last_result_document` 为新增私有函数，顶层仍 `{add,status,lint}`，未新增公共子命令；`tools/relay-light/__pycache__/` 移除前确认仅含 `relay_log.cpython-312.pyc`、`test_relay_log.cpython-312.pyc`，移除后全仓无 `__pycache__`/`*.pyc` | 边界闭集、配置未动、无缓存残留，均已复算 |
| E-047 | review-dispatch | dh dispatch | observed | 复核派出：rlt05-b2-check2-sol（Batch 2 targeted re-review R1）｜Re-review only F-B2-LAST-RESULT-SCHEMA closure against E-041..E-046 in refreshed hash-matched snapshot; verify top-level 3 keys/stages result 5 keys and no new P0/P1; dynamic may be NOT_RUN; no Batch 3/heavy review |
| E-048 | Batch 2 定向复审 R1 + 主控动态复验 | `reviews/batch2-review-sol.md#定向复审-r1e-047-e-048`；`PYTHONDONTWRITEBYTECODE=1` smallest/focused/full；`git diff --check`；无 pycache | reviewer `PASS`：原 P1 resolved，new P0/P1=0，open=0，边界 PASS，动态 NOT_RUN；主控源 worktree 复跑 `Ran 1 ... OK`、`Ran 12 ... OK`、`Ran 84 ... OK`，exit 0 | Batch 2 小审闭合为 `APPROVE`；Batch 3 不自动开放，等待独立授权 |
| E-049 | Batch 3 authorization | 用户对话“不用等授权，继续”；当前 durable handoff=`BATCH_REVIEW_CLOSED ... batch=2 ... next=await-Batch-3-authorization` | authorized, exact scope=Batch 3 construction | 只开放 `task_plan.md` Batch 3（add 生命周期/偏序/写者、status 联动、A89）；Batch 4 与 review/commit/push/PR/verify/merge/deploy 均未授权 |
| E-050 | session-run | herdr agent prompt rlt05-build-deepseek <Batch-3-ticket> | observed | 复核派出：rlt05-build-deepseek｜Batch 3 construction only; user authorization E-049; pane w15:pX; prompt submission verified state_change_seq 2209->2307 and status=working; supervised by rlt05-monitor-deepseek; no Batch 4/review/commit/push/PR/verify/merge/deploy |
| E-051 | Batch 3 approval-mode switch | 原 pane `w15:pX` 退出旧 OMP 进程后运行 `omp --resume 01a08e86-5404-7125-87bb-ac3673b526c0 --approval-mode yolo`；重新命名并提交续作 ticket | resumed same session; cwd 仍为 RLT_05 worktree；状态栏自报 `deepseek-flash`；Herdr status=`working` | 用户已明确授权本施工 pane 免审批；未授权范围保持原样，切换时取消的 focused 测试由恢复 ticket 要求首先重跑 |
| E-052 | Batch 3 基线核对与进场 rebase | 进场 `git rev-parse HEAD master`；`git rebase --autostash master`；rebase 后复算两者 | HEAD=master=`1bea79fe18271b3b0b45c8d5dc6cc8993bfbf57d`（与派单期望一致）；rebase 输出 `创建了自动贮藏 … 已应用自动贮藏`、分支已是最新、无冲突；11 项 M/?? WIP 完整保留 | 进场闸满足：基线未漂移、WIP 未丢，无需 BLOCKED |
| E-053 | Batch 3 focused 有效行为红 | `python3 -m unittest tools/relay-light/test_relay_log.py -k RelayLifecycleTests`，实现前（add 无任何 stage 级守门） | `Ran 10 tests in 28.770s ... FAILED (failures=11, errors=4)`。11 条**断言级**失败为有效红，锚点：`test_a89_lint_rejects_a_backward_cross_stage_dependency` → `AssertionError: 2 != 0`（lint 接受了 `W#1 depends_on C#1` 反向依赖）；`test_writer_consistency_exits_two_for_every_frozen_owner` / `test_writer_handoff_forbids_writes_after_the_instance_closed` / `test_stage_result_and_close_preconditions_exit_two` → 期望 rc2 处实得 rc0；`test_status_alerts_writer_and_handoff_violations_read_only` → `errors=[]`（无 A85/A93 报警）。另 4 条 `TypeError: 'NoneType' object is not subscriptable` 出自 `test_four_outcomes_*`：实现前 `last_stage_result` 恒为 null，读 `.outcome` 崩，属**同一缺失行为的后果，不计入有效红** | 红为新增行为断言失败，非 import/setup/FileNotFoundError；A89/A85/A93/A105/A112/A118 六条在实现前均可判别为红 |
| E-054 | Batch 3 focused green | 同命令，实现后 | `Ran 10 tests in 40.069s ... OK`（10/10） | A110/A111/A112/A105/A118/A106/A85/A93/A89 九条断言全部转绿 |
| E-055 | Batch 3 全文件回归 | `python3 -m unittest tools/relay-light/test_relay_log.py` | `Ran 94 tests in 94.893s ... OK` | 原 84 条 + 新 10 条同批全绿；首轮全量曾 3 条旧 fixture 变红（见 E-058），按新合同对齐后通过 |
| E-056 | 真实 CLI §10.2 顺序 + 拒绝矩阵（含账本字节不增） | 真 CLI `add`/`status --json --config-dir <skill>`，合成 W#1+C#1 双节点 plan | 顺序 11 步（plan_loaded→stage_start→monitor_launch→node_start→agent_launch→done→node_close→stage_result→stage_close→stage_start→monitor_launch）**全 rc0**；`by` 实测 `[orchestrator×3, monitor×6, orchestrator×2]`；拒绝 10 例**全部 rc2、stdout 空、账本字节不增**且编号精确：A112（result 早于末节点 node_close）、A89（未全 closed 的 stage_close、重复 stage_start）、A85×4（monitor 写 stage_start；orchestrator 写 stage_result/plan_amend/node_start）、A105×2（缺 stage_id、非法 outcome）、A118（cancelled 未引用 user_decision）。随后完整驱动 C#1：首条 failed → `relaunch_monitor` + `monitor_relaunch_count=0`；补 `monitor_launch` 后第二条 failed → `notify_user` + count=1；再写 blocked→done，status 取 `done` + `open_next_stage`；`stage_close` rc0 → `open_stages=[]`、实例 `closed`；关后 `monitor_restart`/`stage_result` 均 rc2 `HC-RL-A93`。账本终态 25 行，与写入步骤数一致 | A106 五分路与「failed 最多重拉一次」在真实 CLI 可复算；A93 关窗在 add 与 status 两侧一致 |
| E-057 | A89 精确编号 + 只读报警复算 | 真 CLI `lint`/`status`/`add`（唯一违规=反向跨阶段依赖）；手写 legacy 账本跑 `status --json` | A89 fixture：`lint` rc2、`lint: HC-RL-A89 line 8: W1 depends on C1 of later stage DHR_90:C#1`——**精确 A89、不含 A109**；`status`/`add` 对同 plan 均 rc3 同编号且不落账本。legacy 账本（监工写 stage_start、编排写 node_start、stage_close 后又 monitor_restart）：`status` rc0，`errors` 逐条给出 `seq 2: HC-RL-A85 …`、`seq 4: HC-RL-A85 …`、`seq 10: HC-RL-A93 …`，账本字节**未变** | A89 不被 A109 冒充；A85/A93 在 status 侧是只读报警而非拒绝（§8.2 验一致性不验真伪） |
| E-058 | RLT_03 旧 fixture 对齐（3 条，因新合同失效） | `test_by_is_derived_from_agent_prefix_without_event_ownership_validation`、`test_attempts_are_per_node_and_only_relaunch_after_authorized_causes`（后半）、`test_agent_authorization_has_four_exempt_prefixes_and_active_nodes` | 首轮全量暴露 3 条旧 fixture 依赖「旧实现错误接受」：①原测试显式断言 `by` 派生**不经**写入者校验（monitor 写 plan_loaded、orchestrator 写 agent_launch 均 rc0）——正是 A85 要禁的前提，已按合法写者重写并保留「前缀→`by`」断言；②A49 后半用「未关节点即写 stage_result failed」造阶段失败，现被 A112 拒，改为 `done→node_close→stage_result failed` 后重拉，A49/A58 未放宽；③A59 豁免名原含 `agent_launch orchestrator#1`，现被 A85 拒，改为在监控方事件验 `monitor#1`/`planner-amend#1`/`strategist#1`、orchestrator 豁免由其自有 `stage_start` 证明，并新增 `agent_launch orchestrator#1` → rc2 `HC-RL-A85` 判别断言 | 三条均为「旧实现错误接受、新合同正确拒绝」，属 task_plan 允许的判别红；未删除任何仍有效的合同断言，明细见 fixture 对齐表 #11–#13 |
| E-059 | Batch 3 施工期测试侧自我更正（如实登记） | E-053 取红后、E-054 转绿前的 3 类改动 | ①`drive_open_c_instance(close_nodes=)` 拆为 `drive_open_c_instance()` + `close_node()`，避免驱动序列自身触发新守门；②A118「blocked→done」原断言 `stages[].result.outcome == "blocked"` **是我期望写错**，按 §3.5/A105「只认最新一条」改为 `done` 并断言 note 为最新原文；③stage_close 之后的 `last_stage_result`/`suggested_action` 断言随实现新增 `current_stage` 兜底由「仍读旧实例」改为「无当前实例 → null/none」 | 均为测试侧修正，**未放宽任何合同断言**；②③的合同解释登记为 findings B3-F2，供复核裁决 |
| E-060 | 边界、缓存与哈希审计 | `git diff --check`；`git status --short`；`sha256sum`；`find . -name __pycache__` 后 `rm -rf tools/relay-light/__pycache__` | `git diff --check` exit 0；改动仅 `tools/relay-light/relay_log.py`（`dcb15223906fa3fba7313920bb9f154867e88df5f1c367f8ca9ea09883def0da`）与 `tools/relay-light/test_relay_log.py`（`6f8669d847c5f337d77a98b51eb79c8632a80828c9d3589ddeb0449f8f5a8e2c`）+ workspace 记录；两 TOML sha256 与 Batch 1 **完全相同**（`roles.toml=466c88d9…6790`、`dh-mapping.toml=cbbfe236…7fe0`）——本批未改 TOML；顶层 CLI 仍 `{add,status,lint}`；`tools/relay-light/__pycache__/` 移除前确认仅含两个 pyc 且全仓无第二处 pycache，移除后无 `__pycache__`/`*.pyc` | 边界闭集、配置未动、无缓存残留 |
| E-061 | review-dispatch | /home/nash/.local/bin/devin --model swe-2-max --permission-mode normal; /mode plan | observed | 复核派出：rlt05-b3-review-devin｜Batch 3 fresh small review in chmod read-only isolated snapshot; runtime UI confirmed Plan and SWE-2 Max; scope A110/A111/A112/A105/A118/A106/A85/A93/A89 and B3-F2; no Batch 4/final review |
| E-062 | Batch 3 fresh 小审 R1 | `reviews/batch3-review-devin.md`；Devin SWE-2 Max；hash-matched 只读隔离副本；静态审查 + `/tmp` 真实 CLI 反例 | `CHANGES_REQUIRED`：P0=0、P1=1、P2=3、open=4。P1 实证 A93 缺 `stage_start` 前置下界且 status 不报警；B3-F2、E-058、E-059 接受。全文件 90/94，4 个 ERROR 均为只读权限复制导致的 `PermissionError` 环境假红；Batch 3 focused 10/10、status 12/12、RLT_03 绿 | 进入 Batch 3 定向返工；Batch 4/heavy review 仍锁定 |
| E-063 | session-run | /home/nash/.local/bin/devin --model swe-2-max --permission-mode dangerous | observed | 复核派出：rlt05-b3-rework-devin｜Batch 3 rework R1 only for E-062 four findings; fresh construction session w15:p13; prior user authorization permits no-approval construction; no Batch 4/review/commit/push/PR/verify/merge/deploy |
| E-070 | review-dispatch | /home/nash/.local/bin/devin --model swe-2-max --permission-mode normal; /mode plan | observed | 复核派出：rlt05-b3-r1-rereview-devin｜Batch 3 targeted re-review R1 only for E-062 four findings against E-064..E-069; fresh chmod read-only hash-matched snapshot /tmp/rlt05-b3-r1-review.cURGnS/repo; no Batch 4/heavy review |

> 后续 E-ID 从 `E-001` 起由 construction/scribe 追加；不得覆盖 W 期记录，不得把 W 期只读观察写成测试通过。

### Batch 3 变更摘要（供小审对照）

| 位置 | 变更 | owner |
|---|---|---|
| `relay_log.py` | 常量 `STAGE_ORDER`、`TERMINAL_RESULT_OUTCOMES`、`CONTROL_WRITERS`、`WRITER_BY_EVENT`（9 控制事件 + 全部 10 agent 事件逐条列出，无「等」省略） | A85/A89/A112 |
| `relay_log.py` | `_validate_writer(event, agent)`：按 §3.4 表判 `by` 与法定写入者一致；在 `_authorize_agent` 之后、事件语义校验之前 | A85 |
| `relay_log.py` | `latest_stage_result()`（公开只读）、`_stage_instances()`、`_active_node_map()`、`_stage_entries()`、`_stage_id_from_note()`、`_open_stage_ids()`、`_require_sole_plan_loaded()` | A105/A89 |
| `relay_log.py` | `_validate_stage_event()`：stage_start 一次性且先于 monitor_launch；monitor_launch 必须晚于本实例 stage_start；stage_result 校验 `stage_id=`/四 outcome/`cancelled` 引用 `user_decision`，并要求该实例全部节点已 `node_close`；stage_close 要求已 start、未 close、全部节点 closed、最新 outcome ∈ {done,cancelled} | A89/A105/A112/A118 |
| `relay_log.py` | `_validate_writer_handoff()`：本实例 `stage_close` 之后的任何 add 退出 2（按 stage_id 或节点归属定位实例） | A93 |
| `relay_log.py` | `_validate_runtime_event` 重排为 `_authorize_agent → _validate_writer → _validate_event_semantics → _validate_writer_handoff`，使审计标记优先于技术细节 | A85/A93 |
| `relay_log.py::lint_plan` | 新增 plan 层 A89：同卡 `depends_on` 只能指向 STAGE_ORDER 中相同或更早的阶段；**置于 A109 之前**，避免反向依赖被报成并行 | A89 |
| `relay_log.py::derive_status` | 新增 `_ledger_warnings()`：A85 写入者不符、A93 `stage_close` 后续写、A111 同卡多实例 open，逐条以 `HC-RL-*` 前缀写入 `errors`；只读，不拒绝、不改账本 | A85/A93/A111 |
| `relay_log.py::derive_status` | `current_stage` 兜底：无未 `node_close` 节点但仍有已 start 未 close 的实例时，取其中 `stage_start` seq 最大者（使 A106 分路在实例等待 `stage_close` 期间仍可判定）；无则 `null` | A106（解释见 B3-F2） |
| `test_relay_log.py` | 新增 `RelayLifecycleTests`（10 条）+ helper `write_design_plan`/`write_stage_plan`/`add_ok`/`assert_rejected`/`ledger_rows`/`drive_closed_w_stage`/`close_node`/`drive_open_c_instance`/`status_payload`；常量 `DESIGN_10_2_ADDS`/`DESIGN_10_2_WRITERS` | A85/A89/A93/A105/A106/A110/A111/A112/A118 |
| 未触碰 | `task_plan.md`、`review.md`、`reviews/**`、DevPlan、design、AGENTS、其他卡、两 TOML（sha256 不变） | 边界 |

### Batch 3 fixture 对齐明细（逐条登记，续 Batch 1/2 编号）

| # | fixture / helper | 旧用途 | 改动 | 预期原 HC-ID |
|---|---|---|---|---|
| 11 | `test_by_is_derived_from_agent_prefix_without_event_ownership_validation` | 断言 `by` 仅由 `agent` 前缀派生、**不做**写入者校验（monitor 写 plan_loaded、orchestrator 写 agent_launch 均 rc0） | 该前提被 A85 正式废除：改名 `…_under_the_frozen_writer_contract`，改用合法写入者序列（orchestrator 写 plan_loaded/stage_start/monitor_launch，monitor 写 node_start/agent_launch），仍断言 `agent` 前缀 → `by` 的映射 | 原测试无独立 HC-ID（RLT_03 的 §8.2 一致性说明）；现由 A85 覆盖，映射方向未变 |
| 12 | `test_attempts_are_per_node_and_only_relaunch_after_authorized_causes`（后半段） | 用「节点未 closed 即写 `stage_result outcome=failed`」制造阶段失败，再重拉 `coder#2` | 该序列现被 A112 拒：改为 `coder#1 done → node_close → stage_result failed → agent_launch coder#2`，末条重复 attempt 仍断言 A58 | 不变（A49/A58/A113），未放宽 |
| 13 | `test_agent_authorization_has_four_exempt_prefixes_and_active_nodes` | 用 `agent_launch` 一次性验证四个豁免名（含 `orchestrator#1`） | `agent_launch orchestrator#1` 现被 A85 拒：豁免名改在监控方事件上验 `monitor#1`/`planner-amend#1`/`strategist#1`，orchestrator 豁免由其自有 `stage_start` 证明；并新增 `agent_launch orchestrator#1` → rc2 `HC-RL-A85` 判别断言 | 不变（A59），另叠加 A85 判别 |

（Batch 3 的 durable signal 见本文件末尾。）


### Batch 2 变更摘要（供小审对照）

| 位置 | 变更 | owner |
|---|---|---|
| `relay_log.py` | 新增 `StageResultNote`/`StageResult`/`StageState`/`NodeState`/`AgentState`/`Status` 与常量 `STAGE_RESULT_OUTCOMES`/`SUGGESTED_ACTIONS` | A62/A43/A61/A81 |
| `relay_log.py` | `_note_tokens`、`parse_stage_result_note`、`_stage_of`、`derive_last_writer`、`_unclosable_reasons`、`_idle_seconds`、`_suggested_action` | A43/A62/A81 与只读派生 |
| `relay_log.py` | `derive_status(plan, entries, now=None)`：全量只读投影；空账本全 `pending` 且当前态为 null；节点状态三态；`closed` 只读 `node_close`；`closable` 按 §5.3 双判据独立算；superseded 不进三列表 | A43/A61/A62/A65/A73/A81 |
| `relay_log.py` | `status_document`（§3.5 精确 13 键 + 嵌套精确键）、`render_status_text`（§10.3 文本形）；`_status_command` 删除 placeholder 注释与旧三键输出，改为调用两者 | A43/A44/A62 |
| `test_relay_log.py` | 新增 `RelayStatusProjectionTests`（12 条）+ 基类 helper `write_ledger_rows()`；常量 `PLAN_10_1_*`/`LEDGER_10_2_ROWS`/`FIXED_NOW`/`STATUS_10_3_TEXT`/各层键集合/`JUDGEMENT_WORDS` | A43/A44/A61/A62/A65/A73/A81/A134 |
| 未触碰 | `task_plan.md`、`review.md`、`reviews/**`、DevPlan、design、AGENTS、其他卡、两 TOML（sha256 不变） | 边界 |

### Batch 2 fixture 对齐明细（逐条登记，续 Batch 1 编号）

| # | fixture / helper | 旧用途 | 改动 | 预期原 HC-ID |
|---|---|---|---|---|
| 7 | 新增 `write_ledger_rows()` | 无 | 新 helper：直接写精确七字段 JSONL，用于 §10.2 逐字 fixture 与需固定 `ts` 的只读矩阵（不借 `add`，以免把 Batch 3 的写者守门当作本批前提） | 新增 |
| 8 | `RelayPlanLintTests.test_status_and_lint_match_with_and_without_superseded_rows` 的 superseded 变体 | 证明 superseded 行不改变 lint/status 观测 | superseded 变体的 `W1.close`/`C1.close`/`C1.depends_on` 对齐 plain 变体（原为 `close` 空），并把断言从「整包相等」改为「取出 `superseded_ignored` 断言 0/1 后整包相等」 | 不变（A128/A73），断言更强而非放宽 |
| 9 | A61/A81/A134 合成 plan + ledger | 无 | 新 fixtures：三态推进矩阵、`node_close` 直读矩阵、checker 有/无三形态；均经真实 CLI `status --json` 断言 | 新增 |
| 10 | `test_stage_result_projection_carries_five_keys_with_and_without_amend` 的顶层断言（rework R1） | 原断言 `set(amended["last_stage_result"]) == STATUS_RESULT_KEYS`（五键），把**错误行为锁成 oracle** | 顶层改为新增常量 `STATUS_LAST_RESULT_KEYS = {stage_id,outcome,note}` 并断言精确三键与精确取值（有/无 `plan_amend` 两例各一条）；`stages[].result` 的五键集合与精确取值断言**原样保留**；函数名保留（其 `stages[].result` 五键语义未变） | 不变（A62），顶层与阶段层分工按 design §3.5 拆正 |

### Batch 2 rework round 1 变更摘要（供定向复审对照）

| 位置 | 变更 | 对应 finding |
|---|---|---|
| `relay_log.py::_result_document` | 补文档串，语义收紧为**仅供** `stages[].result` 的五键（键集与实现未变） | F-B2-LAST-RESULT-SCHEMA |
| `relay_log.py::_last_result_document`（新增） | 顶层专用三键序列化 `{stage_id, outcome, note}`；`None` 时返回 `None` | F-B2-LAST-RESULT-SCHEMA |
| `relay_log.py::status_document` | 顶层 `last_stage_result` 改调 `_last_result_document`；`stages[].result` 仍调 `_result_document` | F-B2-LAST-RESULT-SCHEMA |
| `relay_log.py::derive_status` 及其余派生 | **未改动**——`Status.last_stage_result` 仍持完整 `StageResult`，三键/五键差异只在序列化层 | 语义不变 |
| `test_relay_log.py` | 新增 `STATUS_LAST_RESULT_KEYS`；`test_stage_result_projection_carries_five_keys_with_and_without_amend` 的顶层断言改为精确三键 + 精确取值（原五键顶层断言删除，五键断言下移到 `stages[].result`） | F-B2-LAST-RESULT-SCHEMA |

### Batch 1 rework round 1 结构化 DONE

```text
DONE task=RLT_05 batch=1 rework=1 status=READY_FOR_RE_REVIEW evidence=E-017,E-018,E-019,E-020,E-021,E-022,E-023 next=main-controller
```

### Batch 1 rework round 1 变更摘要（供 re-review 对照）

| 位置 | 变更 | 对应 finding |
|---|---|---|
| `relay_log.py` | 新增常量 `RECIPE_TIERS = frozenset({"heavy","normal","light"})` 与 `PROVENANCE_KEYS = ("config_dir","plan")` | F-B1-RECIPE-ENUM |
| `relay_log.py::_lint_recipe_reviewers` | 在查配置前先断言 `plan.recipe in RECIPE_TIERS`，违规报 `HC-RL-A116`；保留「配置缺该档 → A116 not configured」分支 | F-B1-RECIPE-ENUM（B1-F1 裁决） |
| `relay_log.py::_plan_loaded_note` | 由「缺则补」改为**无条件重建**：丢弃调用方所有 `config_dir=`/`plan=` token，追加 `config_dir=<resolver 目录编码>` 与 `plan=<规范绝对路径编码>`，其余 token 保序 | F-B1-PLAN-LOADED-PROVENANCE（B1-F2 裁决） |
| `relay_log.py::append_event` | 调用点不变（仍在 `plan_loaded` 校验通过后规范化写入） | — |
| `test_relay_log.py` | 新增 `config_with_recipes()`、`note_values()`、`run_cli(cwd=)`、`command_argv(note=)`；新增 `test_recipe_tiers_stay_within_the_frozen_three_value_enum`、`test_a_config_without_one_frozen_tier_rejects_plans_using_it`、`test_plan_loaded_provenance_is_rebuilt_from_the_real_resolver`、`test_plan_loaded_records_the_normalized_absolute_plan_dir`；强化 A92 stage 精确等值 | P1×2 + P2 |

### Batch 1 fixture 对齐明细（逐条登记）

| # | fixture / helper | 旧用途 | 改动 | 预期原 HC-ID |
|---|---|---|---|---|
| 1 | `RelayCliTestCase.run_cli`（原 `RelayPlanLintTests.run_cli`） | 直接 `subprocess` 跑 CLI，无配置概念 | 三子命令调用时自动补受控 `--config-dir <仓内 skill 目录>`；`--help` 与显式传入 `--config-dir` 时不补 | 不变（原 54 条 CLI 断言的 exit code/stderr 全部保持） |
| 2 | `run_add` / `run_lint_cli` / `start_ledger` | 组合 CLI 参数 | 经 #1 间接获得受控配置目录 | 不变（A2/A18/A55/A56/A84 等） |
| 3 | `assert_rule` 与 9 处直接 `lint_plan(self.plan_path)` | lint 无 config 入参 | 改为 `lint_plan(self.plan_path, repo_config())`（加载仓内交付 TOML） | 不变（A24/A35/A46/A47/A48/A71/A72/A87/A104/A126/A128/A129/A130） |
| 4 | `test_stage_must_be_known_and_grouped_contiguously` 两处 `\| reviewer \| R1 \| reviewer \| …` | R1 上挂 1 个 reviewer 角色行，仅用于制造 A129 分组违规 | agent 列改名 `reviewer`→`requirement`（reviewer 路径名取 agent 列的新约定）。该 fixture 的 reviewer 集合仍不等于 normal 的 `{requirement, lesson}`，因此它同时成为“结构违规先于 A116”的判别样例 | 不变，仍断言 `HC-RL-A129` |
| 5 | `test_add_reports_genuine_append_failure_as_exit_four` | 直接调 `main([...])` 且全量 patch `builtins.open`，断言追加失败→exit 4 且不落账本 | 参数补 `--config-dir <SKILL_DIR>`。实现处配置读取走 `Path.read_text`，故 `builtins.open` 的 patch 仍只命中账本写入，原语义不变 | 不变，仍断言 exit 4 + `error: ledger` + 无账本文件 |
| 6 | 新增 `RelayCliTestCase` 基类（原 `RelayPlanLintTests` 的 helper 上移） | 单类内含全部 helper | 拆基类以复用 CLI helper；测试方法与其断言零改动 | 不变 |

### Batch 1 结构化 DONE

```text
DONE task=RLT_05 batch=1 status=READY_FOR_REVIEW evidence=E-004,E-005,E-006,E-007,E-008,E-009,E-010,E-011,E-012,E-013 next=main-controller
```

### Batch 2 结构化 DONE（durable signal · 施工轮）

```text
DONE task=RLT_05 batch=2 status=READY_FOR_REVIEW evidence=E-028,E-029,E-030,E-031,E-032,E-033,E-034,E-035,E-036 next=main-controller
```

### Batch 2 小审 R1 结构化回收

```text
REWORK task=RLT_05 batch=2 round=1 status=CHANGES_REQUIRED finding=F-B2-LAST-RESULT-SCHEMA evidence=E-037,E-038,E-039 next=construction-worker
```

### Batch 2 rework round 1 结构化 DONE（durable signal · 本节点收口）

```text
DONE task=RLT_05 batch=2 rework=1 status=READY_FOR_RE_REVIEW evidence=E-041,E-042,E-043,E-044,E-045,E-046 next=main-controller
```

### Batch 2 定向复审 R1 闭合

```text
BATCH_REVIEW_CLOSED task=RLT_05 batch=2 status=APPROVE evidence=E-047,E-048 open=0 next=await-Batch-3-authorization
```

### Batch 3 结构化 DONE（durable signal · 本节点收口）

```text
DONE task=RLT_05 batch=3 status=READY_FOR_REVIEW evidence=E-052,E-053,E-054,E-055,E-056,E-057,E-058,E-059,E-060 next=main-controller
```

### Batch 3 小审 R1 结构化回收

```text
REWORK task=RLT_05 batch=3 round=1 status=CHANGES_REQUIRED findings=F-B3-PRESTART-INTERVAL,F-B3-CURRENT-STAGE-MIDPLAN,F-B3-RELAUNCH-COUNT,F-B3-A89-BRANCH-EVIDENCE evidence=E-061,E-062 next=construction-worker
```

## Batch 3 rework R1 施工记录（2026-09-11 · rlt05-b3-r1-devin / SWE-2 Max）

范围：仅 E-062 的四个 open finding（F-B3-PRESTART-INTERVAL / F-B3-CURRENT-STAGE-MIDPLAN / F-B3-RELAUNCH-COUNT / F-B3-A89-BRANCH-EVIDENCE）。改动只落 `tools/relay-light/relay_log.py` 与 `tools/relay-light/test_relay_log.py`；未改 task_plan、review、design、DevPlan、TOML、AGENTS 或其他卡。

### 证据登记

| ID | 内容 | 结论 |
|---|---|---|
| E-064 | 入场：`git rebase --autostash master` 干净完成（autostash 创建并复贴，无冲突）；基线 `1bea79fe18271b3b0b45c8d5dc6cc8993bfbf57d`；全部存量 WIP（AGENTS/design/DevPlan/workspace/skill/两 .py）原样保留 | 环境合规 |
| E-065 | 有效红（旧实现 `relay_log.py` sha256 `dcb15223…` 未动、仅改测试侧）：`-k RelayLifecycleTests` → `Ran 16 tests ... FAILED (failures=11, errors=5)`。断言级红逐条对应：① pre-start 事件 4 条 `2 != 0`（node_start/monitor_restart/plan_amend 在无任何 stage_start 时被接受，W#1 关闭后 monitor_restart/node_start/plan_amend 写入未 start 的 C#1 亦被接受）；② `stage_close` 零 `monitor_launch` 被接受 `2 != 0`；③ `monitor_restart` on W1 携带 `stage_id=DHR_90:C#1` 伪标被接受 `2 != 0`（A93 绕过实证）；④ legacy 账本 `status.errors` 为空 `False is not true : []`；⑤ mid-plan `current_stage` 实收 `R#1` 而非 `C#1`；⑥ 崩溃恢复重拉实收 `count=1` 而非 `0`；⑦ `write_stage_plan` 扩入 `R#1` 后 `test_four_outcomes`/`test_blocked_and_cancelled` 在旧实现上 5 error + 1 fail（`None['outcome']` TypeError 与 `'relaunch_monitor' != 'none'`），即 mid-plan 缺陷被扩展 fixture 直接暴露。mutation 红：`monitor_launch` 的 stage_start 下界临时移除后，`test_stage_result_and_close_preconditions_exit_two` 对「已知未 start 的 R#1」断言 `2 != 0` —— 证明新断言命中目标分支而非 unknown-stage 分支；探针后已恢复 | 每项被改行为均有行为级红 |
| E-066 | 实现变更明细（findings.md 的 rework R1 登记表为权威）：新增 `STAGE_NOTE_EVENTS`；`_stage_of` 改为 stage 级事件 note 寻址、其余按 node 归属；`_open_stage_ids`→`_stage_lifecycle_events` 收 `monitor_launch`；`stage_close` 增「本实例至少一次 `monitor_launch`」前置；`_validate_writer_handoff` 增 monitor-owned 下界与非 stage 级事件伪 `stage_id=` 拒绝（均 A93）；`_ledger_warnings` 增三类镜像报警；`derive_status` 的 `monitor_relaunch_count` 改按「latest outcome==failed 期间的 monitor_launch」因果计数；`current_stage` 优先级改为 open 实例（先等关者）压过未 start 的 pending 节点 | 四 finding 的最小一致闭合 |
| E-067 | 绿：`-k RelayLifecycleTests` `Ran 16 tests ... OK`（87.7s）；全文件 `python3 -m unittest tools/relay-light/test_relay_log.py` → `Ran 100 tests ... OK`（118s，mutation 恢复后复跑同结果） | focused/full 全绿 |
| E-068 | 真实 CLI 探针（`/tmp/probe_rlt05_b3r1.py`，仓外，48 项 PASS / 0 FAIL）：① `node_start`/`monitor_restart`/`plan_amend` 先于 `stage_start` → rc2 `HC-RL-A93 ... cannot precede stage_start`；② `monitor_launch` 打已知未 start 的 `R#1` → rc2 `HC-RL-A89 ... must follow stage_start`；③ `monitor_restart` on W1 带 `stage_id=DHR_90:C#1` → rc2 `HC-RL-A93 ... belongs to DHR_90:W#1; note names DHR_90:C#1`；④ `stage_close` 零 `monitor_launch` → rc2 `HC-RL-A89 ... requires a monitor_launch`，补 launch 后 rc0；⑤ C#1 全节点关+`outcome=done` 未 close 而 R#1 未 start：`status` 实收 `current_stage=DHR_90:C#1`、`current_node=R1`、`last_stage_result.outcome=done`、`suggested_action=open_next_stage`、`errors=[]`；⑥ R#1 初始拉 + 崩溃恢复拉 → `count=0`；`failed` → `relaunch_monitor`/0；failed 重拉 + 再 failed → `notify_user`/1；⑦ 手写 legacy 账本 `status` rc0 且 errors 逐条含 `seq 2/3 A93 precedes stage_start`、`seq 10 A93 伪标 + post-close`、`seq 17 A89 has no monitor_launch` | CLI 行为与单测一致 |
| E-069 | 边界：`git diff --check` exit 0；本批 diff 仅 `relay_log.py`/`test_relay_log.py`（`git status` 里其余条目均为进场前存量 WIP，未触碰）；`tools/relay-light/__pycache__/` 已移除，全仓无缓存残留；禁改清单（task_plan/review/design/DevPlan/TOML/AGENTS/其他卡）零改动 | 范围干净 |

### rework R1 fixture 对齐明细（逐条登记）

| # | fixture / helper | 旧用途 | 改动 | 原因 |
|---|---|---|---|---|
| 14 | `write_stage_plan` | W#1 + 双节点 C#1 | 追加 `R1 \| DHR_90:R#1 \| review \| agent:requirement \| C2` 与 `requirement`+`lesson` 两行 reviewer（恰为 normal 档集合，过 A116） | 提供「已知但未 start」实例供 A89 分支证据与 mid-plan fixture；旧实现上 `test_four_outcomes`/`test_blocked_and_cancelled` 随之 5 error + 1 fail，即缺陷暴露红 |
| 15 | `start_ledger` | 仅写 `plan_loaded` | 改写 `plan_loaded + stage_start + monitor_launch` 合法开场三行（§5.2.1 顺序） | monitor-owned 事件现需 `stage_start` 下界；~20 个调用点经此一行即合法 |
| 16 | `test_add_is_append_only_with_twenty_fixed_schema_events` | `plan_loaded` + 19×`monitor_restart` | 20 行改为 `plan_loaded + stage_start + monitor_launch + 17×monitor_restart`，agent/note 随行 | `monitor_restart` 亦受下界；总数仍 20 |
| 17 | `test_unicode_line_separators_round_trip_as_json_string_content` | 断言 2 行 | 断言 4 行 | `start_ledger` 现写 3 行 |
| 18 | `test_agent_authorization_has_four_exempt_prefixes_and_active_nodes` | 显式 `stage_start` | 删除显式行（`start_ledger` 已含），注释相应更新 | 避免重复 `stage_start` → A89 |
| 19 | `test_attempts_are_keyed_by_node_and_agent_name`、`test_runtime_trigger_and_dependency_gates`（第三段） | C1 直接 `node_start` | C1 事件前补 `stage_start C#1` | C#1 需先 start |
| 20 | `test_plan_without_checker_passes_lint_and_status_without_a_dangling_agent` 的 `coder_ledger` | 无 stage 事件 | 补 `stage_start`+`monitor_launch` 两行 | 该测试断言 `errors==[]`，status 镜像报警下旧 fixture 会多 A93 告警 |

### Batch 3 rework R1 结构化 DONE（durable signal · 本节点收口）

```text
DONE task=RLT_05 batch=3 rework=1 status=READY_FOR_RE_REVIEW evidence=E-063,E-064,E-065,E-066,E-067,E-068,E-069 next=main-controller
```

| E-071 | review-result | Devin SWE-2 Max fresh targeted re-review of Batch 3 rework R1 (dispatch E-070; snapshot labels E-063..E-068 mapped to canonical E-064..E-069) | APPROVE; all four E-062 findings resolved; no new P0/P1/P2; 3 non-blocking P3 notes; full 100/100, focused 16/16, independent CLI probe 29/29, mutation red→green, diff-check/TOML/boundary clean; review artifact `reviews/batch3-r1-rereview-devin.md` | observed |

BATCH_REVIEW_CLOSED task=RLT_05 batch=3 status=APPROVE evidence=E-070,E-071 open=0 next=await-Batch-4-authorization

## Batch 4 授权与派单（2026-09-12 · main controller / devin SWE-2 Max）

| ID | 类型 | 命令/路径 | 结果 | 支撑结论 |
|---|---|---|---|---|
| E-072 | Batch 4 authorization | 用户对话「继续 Rtl 05 多agent 协作进行」+ 新角色分工；durable handoff=`BATCH_REVIEW_CLOSED ... batch=3 ... next=await-Batch-4-authorization` | authorized, exact scope=Batch 4 construction | 只开放 `task_plan.md` Batch 4（limits 驱动内部 X 规划、attempt/X 两套独立止损、A97 精确 lint、A99 双 hash 复算）；review/commit/push/PR/verify/merge/deploy 均未授权 |
| E-073 | session-run | `herdr tab create --workspace w15` → pane `w15:p15`（cwd=RLT_05 worktree）；`herdr agent start rlt05-b4-build-devin --kind devin -- --model swe-2-max --permission-mode dangerous`；`herdr agent prompt` 真提交 Batch-4 ticket | observed；state_change_seq 3081→3082，status=`working` | 施工派出：rlt05-b4-build-devin｜Batch 4 construction only，按 `task_plan.md` 第 130～145 行合同 TDD；完成/阻塞须 durable DONE 并立即停止 |
| E-074 | monitor/decider roster | `herdr pane close w15:p12`（旧 swe-2-max 监工）；`rlt05-monitor-devin` 于 w15:p16（devin `--model swe-2-medium --permission-mode dangerous`）；`rlt05-decide-fable` 于 w15:p17（claude `--model fable --effort low --dangerously-skip-permissions`） | observed | 监工每 ~120s 跑 `/tmp/rlt05-monitor/poll.sh`（flags 已更新为新 roster），材料变化经 `herdr agent prompt w15:p1` 通知编排，可对卡壳 pane 发 bare Enter；decider 常驻：小决策自裁回 DECISION，方向级回 ESCALATE 由编排问用户 |

## Batch 4 construction 记录（2026-09-12 · rlt05-b4-build-devin / SWE-2 Max）

范围=`task_plan.md`「### Batch 4」：limits 驱动内部 X 规划、attempt/X 两套独立止损、A97 精确 lint、strategist 链 user_decision 闸、A99 双配置双 hash、plan_loaded 双键。未进入复核/verify/commit/push/PR/merge/deploy，未触碰 Batch 1–3 已批准行为。

### 证据登记

| ID | 类型 | 命令/路径 | 结果 | 支撑结论 |
|---|---|---|---|---|
| E-075 | construction entry | `git rebase --autostash master`；`git status`/`git log` | HEAD=master=`1bea79fe18271b3b0b45c8d5dc6cc8993bfbf57d`（含 RLT_03 squash `8b67bbd` + completion `1bea79f`）；autostash 创建并重放成功，既有 WIP 全部保留，无冲突 | 基线对齐 RLT_03 验收点；Batch 4 在既有 B1–B3 WIP 之上开工 |
| E-076 | 先红 | `python3 -m unittest tools/relay-light/test_relay_log.py -k RelayLimitsTests -v`（实现前） | `Ran 8 tests in 5.760s FAILED (failures=8)`。**有效行为红 5 条**：`test_x_rounds_beyond_the_configured_limit_are_rejected_as_a97` → `2 != 0`（X#3 在 limit=2 下被 lint 接受）；`test_strategist_chain_finales_require_a_user_decision_in_every_mode` 4 个 subTest（auto+consult × resume+cancelled）全 `2 != 0`（缺 `user_decision` 的终局被接受）。**显式 guard 3 条**（`AssertionError: unexpectedly None`，函数尚不存在，按 Batch 2 先例不计入有效红）：`plan_x_rounds`、`loss_stop`×2。**late-added 判别器 pass-before 3 条**：带 `user_decision` 的完整 strategist 链、decider 链 auto resume、`plan_loaded` 双键——旧行为本已正确，登记为判别器而非伪红 | 红全部命中行为断言/显式 guard，无 import/setup/TypeError/fixture 红 |
| E-077 | minimal implementation | `tools/relay-light/relay_log.py` diff | ①`XRound`+`plan_x_rounds(card, config)`：长度=`limits.rework_max_rounds`，`stage_id=<card>:X#k`，`dh_nodes` 取 `stages.X`（缺 `stages.X` → A92 exit3）；纯内部、不写文件、不进 argparse。②`lint_plan` 新增 A97：`X#k` 的 `k` 超限 → `HC-RL-A97`（置于结构规则之后、A116 之前，与 planner 共用同一字段）。③`LossStop`+`loss_stop(plan, entries, config)`：attempts 按 `(node, agent名)` 计 `agent_launch` 行；`x_rounds` 按卡记已开 X 实例最高 k；`attempt_exhausted`/`x_exhausted`/`triggered` 三键暴露两套独立计数。④`_validate_strategist_conclusion`：strategist 属主链上 `resume`/`cancelled` 之前必须有 `user_decision`，两模式一致；挂 `_validate_event_semantics`、先于状态机 | 三 ID 的最小实现；decider 链语义零改动；TOML 零改动（冻结值已正确，无需修正） |
| E-078 | focused green | `-k RelayLimitsTests`（实现后） | `Ran 8 tests in 6.335s ... OK`（8/8，含 4 subTest 终局矩阵 + 5 subTest dh_nodes） | A97/A99/A107 与 strategist 闸全部转绿；两计数独立性三例断言通过：only-attempt `attempts={(C1,coder):3}`、`x_rounds={}`；only-X `x_rounds={DHR_90:2}`、attempts `1/1` 不受影响；neither `attempts={(C1,coder):2,(X1,coder):1}`、`x_rounds={DHR_90:1}`、`triggered=False`；另 `cancelled`/stage-failed 两种重拉债各一例 |
| E-079 | 全文件回归 | `python3 -m unittest tools/relay-light/test_relay_log.py` | `Ran 108 tests in 120.721s ... OK` | 原 100 条（RLT_03 + Batch 1–3）与新 8 条同批全绿，无回归 |
| E-080 | 真实 CLI 探针：A97 与三命令闭集 | `/tmp/rlt05-b4-probe-M9PH`：`lint`/`status`/`add`/`--help` | limit=2：`lint: HC-RL-A97 line 11: DHR_90:X#3 exceeds rework_max_rounds=2` rc2（stderr 仅一条 HC-RL）；同 plan 在 limit=3 下 `lint: ok` rc0；`status`/`add` 同 plan → `error: HC-RL-A97` rc3 且账本未创建；`--help` 仅 `{add,status,lint}` | A97 精确编号、三命令均过 lint 门、公共子命令集合不变；同 plan 仅因配置上限不同而合法化，证明字段驱动 |
| E-081 | A99 双配置双 hash | 两份**完整**临时配置（`cp` 整个 skill 目录后只改 `rework_max_rounds`）；`sha256sum tools/relay-light/relay_log.py` 在两次 `plan_x_rounds` 运行前后各一次 | cfg(limit=2)→`['DHR_90:X#1','DHR_90:X#2']`，cfg(limit=3)→`['DHR_90:X#1','DHR_90:X#2','DHR_90:X#3']`，`dh_nodes=('E2','E3')`；SHA-256 三次取值同一：`90707b7e61a4aa0a6c1b22010c8ddddfa250f71da41bbb74105ac83c78527798` | 同一不变二进制按两份配置产出不同长度/序列的 X 结构——「改配置即改行为」以真实双运行 hash 证明，非 worktree-diff 论证 |
| E-082 | strategist 链真实 CLI 终局矩阵 | `/tmp` 探针：两 plan（`decision_mode=auto`/`consult`）各一条全 add 链 | auto 与 consult 均：`escalate coder#1(strategist=strategist#1)`→`agent_launch strategist#1`→`decision coder#1`→`done strategist#1` 全 rc0；随后 `resume coder#1` 与 `cancelled coder#1` 各 `error: HC-RL-A97 … requires a user_decision on the strategist chain` rc2；补 `user_decision coder#1` 后 `cancelled` rc0。事件归属：escalate/decision/user_decision/cancelled 全记 `coder#1`，`agent_launch`/`done` 记 `strategist#1` | 「strategist 触发的永远先交用户」在 auto 与 consult 下同样硬约束；两终局缺 `user_decision` 均被精确 A97 拒绝 |
| E-083 | plan_loaded 双键 | 探针账本首行 note | 调用方只传 `skill=0.1.0`，落账为 `skill=0.1.0 config_dir=<abs skill 路径> plan=<abs plan 路径>`——`config_dir=` 与 `plan=` 各恰一次、由解析器事实重建 | A99 的 plan_loaded 双键要求在真实 CLI 上复证（Batch 1 已实现的 provenance 重建，本批为 late-added 判别器） |
| E-084 | 边界、缓存与哈希审计 | `git diff --check`；`git status --porcelain`；`find`/`rm -rf tools/relay-light/__pycache__` | `git diff --check` exit 0；本批改动闭集=`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、`docs/modules/relay-light/workspace/RLT_05/{progress,findings}.md`；其余 `M`/`??` 均为进场前既有 WIP（E-075 autostash 核对）；探针 import 生成的 `__pycache__/relay_log.cpython-312.pyc` 已删除；两 TOML 未触碰；无 SKILL/template/adapter/watch/plan-amend/新子命令 | 边界闭合：仅 allowed-paths，无文件/模板/子命令新增 |

### Batch 4 变更摘要（供小审对照）

| 位置 | 变更 | owner |
|---|---|---|
| `relay_log.py` | `XRound` dataclass + `plan_x_rounds(card, config)`：长度=`limits.rework_max_rounds` 的 `X#1..X#k` 序列，`dh_nodes` 取自 `stages.X`；纯内部 | A99 |
| `relay_log.py::lint_plan` | A97：活跃节点 `stage=="X" and k > limits.rework_max_rounds` → `HC-RL-A97`（与 planner 共用同一配置字段；superseded 行不参与） | A97 |
| `relay_log.py` | `LossStop` dataclass + `loss_stop(plan, entries, config)`：`attempts`/`x_rounds` 两计数 + `attempt_exhausted`/`x_exhausted`/`triggered`；attempt 范围 `(node, agent名)`、X 按卡内已开实例最高 k，互不计数 | A107 |
| `relay_log.py` | `_validate_strategist_conclusion` + `_validate_event_semantics` 接线：`resume`/`cancelled` 在 strategist 属主链上要求最新行为 `user_decision`（auto/consult 一致） | A97 |
| `test_relay_log.py` | `import hashlib`；新增 `RelayLimitsTests`（8 条）+ helper `add_ok`/`assert_rejected`/`ledger_rows`/`config_with_rework_limit`/`write_x_plan`/`x1_prelude` | A97/A99/A107 |
| 未触碰 | 旧 fixture/旧断言**零改动**（本批无 fixture 对齐项）；`task_plan.md`、`review.md`、`reviews/**`、DevPlan、design、AGENTS、其他卡、两 TOML | 边界 |

### Batch 4 结构化 DONE（durable signal · 本节点收口）

```text
DONE task=RLT_05 batch=4 status=CONSTRUCTION_DONE evidence=E-075,E-076,E-077,E-078,E-079,E-080,E-081,E-082,E-083,E-084 next=main-controller
```

## Batch 4 主控回收与小审派出（2026-09-12 · main controller / devin SWE-2 Max）

| ID | 类型 | 命令/路径 | 结果 | 支撑结论 |
|---|---|---|---|---|
| E-085 | controller re-verify | 源 worktree `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tools/relay-light/test_relay_log.py -k RelayLimitsTests` → `Ran 8 ... OK`；全文件同命令 → `Ran 108 tests in 127.559s ... OK`；`git diff --check` exit 0；`git status --porcelain` 本批增量仅两 .py + workspace | observed | E-076/E-078/E-079 红绿与边界主张在源 worktree 独立复算成立；DONE 信号真实 |
| E-086 | review-dispatch | `herdr tab create` → w15:p18（cwd=hash-matched 可写快照 `/tmp/rlt05-b4-review.Qu4zUa/repo`）；`herdr agent start rlt05-b4-review-opus --kind claude -- --model opus --effort high --dangerously-skip-permissions`；claude 信任墙经 `send-keys Down Enter` 通过后 `agent prompt` 真提交 | observed；status=`working` | 复核派出：rlt05-b4-review-opus｜Batch 4 fresh 小审（快照内可动态复跑）；产出 `reviews/batch4-review-opus.md`（快照内）+ `DONE <verdict> open=<n>`；不含 heavy review/verify/commit/push/PR/merge/deploy |

BATCH_REVIEW_CLOSED task=RLT_05 batch=4 status=APPROVE evidence=E-086,E-087 open=6（全为 P2/P3 待裁项，无阻塞） next=heavy-review

| E-087 | Batch 4 fresh 小审结果 | `reviews/batch4-review-opus.md`（快照内产出，主控搬回 worktree）；reviewer=`rlt05-b4-review-opus`，Claude Opus 5 high，fresh | `APPROVE`；P0=0、P1=0、P2=1、P3=5、open=6。动态复算：focused 8/8、全量 108/108、自建 A97 双半探针（精确编号/rc2/rc3/账本不增）、A99 双配置同 hash（90707b7e…）、strategist 闸 auto/consult 四终局、A107 五场景独立计数、M1–M4 定向变异证判别力；静态确认未回归 B1–B3 owner 项 | Batch 4 小审闭合；open 六项（F-B4-R01～R06）全部转 heavy 复核裁决，不属于本批返工 |
| E-088 | review-dispatch | `herdr tab create` → w15:p19（cwd=hash-matched 可写快照 `/tmp/rlt05-hr-r1.ssJyhI/repo`，含已搬回的 batch4-review-opus.md）；`herdr agent start rlt05-hr-devin --kind devin -- --model swe-2-max --permission-mode dangerous`；`agent prompt` 真提交 heavy-code-r1 ticket | observed | 复核派出：rlt05-hr-devin｜heavy 复核**代码轮 1**（整卡 fresh 全量代码复核 + 裁决 F-B4-R01～R06 与 findings 登记项）；按宪章#5 代码轮1先闭合，闭合后才并发派出轮2/需求/一致性/教训四路 |

HEAVY_REVIEW code_round1 status=APPROVE evidence=E-088,E-089 open=6（全为登记/设计裁决项，零返工） next=review-batch-4way

| E-089 | heavy 代码轮1 结果 | `reviews/heavy-code-r1-devin.md`（快照内产出，主控搬回）；reviewer=`rlt05-hr-devin`，SWE-2 Max fresh | `APPROVE`；25/25 oracle 全覆盖（108/108 全量 + 21/21 自建探针一手动态）；F-B4-R02/R04 闭合，R01 ESCALATE（loss_stop 出口归属）、R03/R05/R06 转设计/交接，新增 F-HR1-01/02 两条 P3 登记 | 代码轮 1 闭合，无返工项；触发四路并发 Review Batch |
| E-090 | review-batch dispatch | 四份 hash-matched 快照 `rlt05-hr-{r2.2ophD4,req.L1qX6w,cons.vuk3VN,les.tCj1xu}/repo`；herdr tab ×4 → w15:p1A–p1D；`agent start` devin swe-2-max dangerous ×4；`agent prompt` 分投 code-r2/requirement/consistency/lesson ticket | observed | Review Batch 并发四路：rlt05-hr2-devin（代码轮2+有效 mutation 锚点执行）、rlt05-hr-req-devin（需求方向）、rlt05-hr-cons-devin（一致性）、rlt05-hr-les-devin（教训） |
| E-091 | decision | `herdr agent prompt rlt05-decide-fable`（w15:p17，fable low）：对轮1 留下的 F-B4-R01/R03/R05/R06 逐项裁 defer/escalate | `DECISION：四项全部 defer` | 四项设计层待裁项登记到验收材料转后续卡（去向明细见 findings.md「heavy 复核设计层待裁项处置」）；无 escalate，不变更本卡代码 |
| E-092 | heavy lesson 路结果 | `reviews/heavy-lesson-devin.md`（快照 `/tmp/rlt05-hr-les.tCj1xu/repo` 产出，主控搬回）；reviewer=`rlt05-hr-les-devin`，SWE-2 Max fresh | `APPROVE`；11 条候选全部有真实可核查支撑、无伪造无流水账，`lessons-absent` 不成立；open=5 全 P3：F-HLS-01 两占位行未回填证据、F-HLS-02 L-004 与候选-50 判重待裁、F-HLS-03/04 两项达门槛未登记、F-HLS-05 库内条目重蹈事实未点名 | 教训路闭合；open 五项为 clerical 登记/判重事项，由收口节点处理，不改代码 |
| E-093 | heavy 代码轮2 结果 | `reviews/heavy-code-r2-devin.md`（快照 `/tmp/rlt05-hr-r2.2ophD4/repo` 产出，主控搬回）；reviewer=`rlt05-hr2-devin`，SWE-2 Max fresh（非轮1实例） | `APPROVE`；轮1闭合核对成立、双快照 diff -rq 证明零代码增量；两域有效 mutation 执行：status-lifecycle `relay_log.py:1123`（unclosed 摘除→A89→A112 编号失真红）、config-recipe `relay_log.py:644`（`!=`→`<`→超集/不相交两断言红），还原后全量 108/108；新增 finding=0，open=6 全结转 | 代码轮2闭合；`review.md` mutation 表已按实录回填；两域「改坏必红」证据就位 |
| E-094 | heavy 需求路结果 | `reviews/heavy-requirement-devin.md`（快照 `/tmp/rlt05-hr-req.L1qX6w/repo` 产出，主控搬回）；reviewer=`rlt05-hr-req-devin`，SWE-2 Max fresh | `APPROVE`；25/25 逐项对齐（实现落点+测试名），自跑 108/108 绿；无 RLT_07/09/10/18 抢跑；语义四处与 design 一致；open=5 全 P3：F-HRQ-01 current_stage 精化需 §3.5 补一句、F-HRQ-02 plan_loaded 首节点未核残差、F-HRQ-03 relaunch 因果词表级残差、F-HRQ-04 未知实例静默点、F-HRQ-05 死常量结转 | 需求路闭合；open 五项全登记/残差事项，不改代码 |
| E-095 | heavy 一致性路结果 | `reviews/heavy-consistency-devin.md`（快照 `/tmp/rlt05-hr-cons.vuk3VN/repo` 产出，主控搬回）；reviewer=`rlt05-hr-cons-devin`，SWE-2 Max fresh | `APPROVE`；五方闭集 25 行零漂移、A62/A73 分域一致、无 verdict 级矛盾；open=10：新增 F-HCN-01 台账滞后（已由主控回填 R1 行+25 行 oracle 表）、F-HCN-02 缺 B4 小审节（已补开）、F-HCN-03 `lint --json` 缺阶段注记（design 侧）、F-HCN-04 DECISION_EVENTS 枚举差（design 注记），结转 6 条 | 一致性路闭合；**heavy 五路全部 APPROVE 收敛**，F-HCN-01/02 clerical 项已当场闭合 |
| E-096 | controller closeout-prep | `review.md` 25 行 oracle 表全量回填 PASS（证据源标 heavy-r1 §2 + 批审/前证）+ 需求境证据段汇编；`findings.md` 补开「Batch 4 fresh 小审登记」节（F-B4-R01..R06 带裁决去向）；`lesson_candidates.md` 回填 L-001/L-002 占位、新登 L-012/L-013、L-004 判重注记、重蹈/近失记录 | observed | F-HCN-01/F-HCN-02/F-HLS-01/02/03/04/05 clerical 项全部闭合；剩余 open 全为设计裁决/交接/验收材料登记事项 |
| E-097 | decision + rework dispatch | `agent prompt rlt05-decide-fable`（w15:p17）：对剩余非方向项逐项裁 disposition；`tab create` → w15:p1E（cwd=真实 worktree）+ `agent start rlt05-rw-devin` devin swe-2-max dangerous + `agent prompt` rework ticket | `DECISION`：F-B4-R03→amend-design；设计文字束（F-B4-R05+F-HRQ-01+F-HCN-03+F-HCN-04）→amend-design 打包；F-HLS-02→merge 为候选-50 子款；F-HR1-01/F-HRQ-05→**rework**（测试改导入模块常量+返回值断言）；静默点族（F-HR1-02+F-HRQ-02/04）→accept-as-is。无 escalate | 裁决明细落 findings.md「heavy 复核处置裁决登记」；rework 派 rlt05-rw-devin（仅 test_relay_log.py，改完落 DONE 信号停），改后须定向复审方可算收口 |

DONE task=RLT_05 rework=F-HR1-01 status=DONE evidence=PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tools/relay-light/test_relay_log.py: Ran 108 tests in 126.027s, OK (108/108); git diff --check clean; increment=test_relay_log.py only (import SUGGESTED_ACTIONS from relay_log + drop local copy at old:1866 + assertIn on all _suggested_action branches: none pre-existing, open_next_stage/wait_user/relaunch_monitor in four-outcome loop, notify_user at failed_twice) next=main-controller
| E-098 | rework 结果 + 定向复审派出 | `rlt05-rw-devin`（w15:p1E）落 DONE：test_relay_log.py:23 改从 `relay_log` 导入 `SUGGESTED_ACTIONS`、删 :1866 本地副本、断言落点 :1987（status 载荷）/:2580（四 outcome 循环 open_next_stage×2+wait_user+relaunch_monitor）/:2596（failed_twice→notify_user）；自跑 108/108。主控核验：`relay_log.py` sha256=`90707b7e…` 与轮2还原基线一致（生产零触碰）、focused 13/13 绿。复审：`tab create` → w15:p1F + `agent start rlt05-rwr-devin` devin swe-2-max dangerous，快照 `/tmp/rlt05-rwr-zybVWR/repo`（test_relay_log.py sha256=`1668499e…` 源↔快照一致） | DONE + dispatched | rework 票面兑现；定向复审按六点票面（import 唯一源/分支覆盖/同源断言/hash 不变/108 绿/无夹带）执行中，产出 `reviews/rework-fhr1-rereview-devin.md` |
| E-099 | rework 定向复审结果 | `reviews/rework-fhr1-rereview-devin.md`（快照 `/tmp/rlt05-rwr-zybVWR/repo` 产出，主控搬回）；reviewer=`rlt05-rwr-devin`，SWE-2 Max fresh（非 rework worker）；以轮1快照 `/tmp/rlt05-hr-r1.ssJyhI/repo` 为 pre-rework 基线做精确 diff | `APPROVE` open=0；六点票面全 PASS：import 唯一源（:23）、本地副本已删、`_suggested_action` 5 返回值全覆盖（none→:1987，open_next_stage/wait_user/relaunch_monitor→:2580，notify_user→:2596）、断言同源模块常量、`relay_log.py` hash=`90707b7e…` 未变、108/108 绿、diff 仅 4 hunk 无夹带 | **F-HR1-01/F-HRQ-05 rework 闭合**；E-097 全部裁决项落地完毕；机器侧收口条件清零，剩余全为用户闸门（as-built/commit/push/PR/verify/人验） |
| E-100 | controller housekeeping | `tab close w15:tP`（rlt05-monitor-devin，swe-2-medium 监工）；worker 全部 done、机器侧清零，无可轮询对象，监工自报上下文将满申请退役 | released | 下一阶段（用户闸门动作）需要时重拉 fresh 监工；w15 现存 pane：p1 主控 + p15/p17/p18/p19/p1A–p1F 十个 done 态 worker |
| E-101 | 用户收口授权 | 用户对话明文「1 2 3 都授权」对应主控列示的三闸：①as-built 更新、②GitHub 远端包（commit→push→PR(Relates #8)→CI→squash 合并）、③verify(relay-light)+人验签名 | authorized | 按 RLT_03 既有收口路径执行：先 as-built 落盘（派 rlt05-rw-devin 续棒 w15:p1E）→ 分支 commit/push → PR → 等 CI 硬门（relay-tests-pwsh matrix + relay-light）→ 合并 → master 集成复验 → verify 提交 → docs 回填（Closes #8）→ worktree 清理 |

DONE task=RLT_05 as-built=RLT_05-实现快照 status=DONE
| E-102 | PR/CI/合并 + master 集成复验（主控） | `git push -u origin wt/RLT_05`（commit `c14cae0`，32 文件 +6862）；`gh pr create` → PR #9（Relates #8）；CI run `34680121977`；三硬门绿后 `gh pr merge 9 --squash`；主树 `git pull --ff-only` 至 `a7ce13c` 后跑 `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tools/relay-light/test_relay_log.py` | relay-light Python=SUCCESS(1m24s)、pwsh ubuntu=SUCCESS(1m8s)、pwsh windows=SUCCESS(1m19s)、relay-core Node=FAILURE（模块暂停期 continue-on-error 观测项，不阻塞）；PR #9 于 2026-09-12 squash 合入 master=`a7ce13c369124c4f7d696f168f00c18e04cfa17a`；**集成复验：master 上 `Ran 108 tests in 146.698s OK`** | 远端收口完成；verify 提交随本行落盘，真实 SHA 由下一笔 docs 回填；人验已由用户「1 2 3 都授权」明文确认（E-101） |
| E-103 | verify 提交与 docs 回填（主控） | master 直接提交 `verify(relay-light): RLT_05 …验收`（Verified-By: hyf / Verified-Via: chat-confirm 用户「1 2 3 都授权」/ Evidence: 108/108 集成复验 + PR #9 三硬门 SUCCESS / Verification: full / Risk-Count: 0 / DoD 三勾）；随后本笔 docs 回填 verify SHA 与完成态 | verify SHA=`7d06678d80cf4265a339329ac04bd15405d72614`，提交标题命中 `^verify(relay-light):`；DevPlan RLT_05 行翻「已完成 · release_mode=full」、dh:status 头更新；review.md 状态行落实际 SHA | RLT_05 出口闸闭合；Issue #8 由本笔 `Closes #8` 关闭；worktree `wt/RLT_05`/`.dh-worktrees/RLT_05` 清理随本笔后进行 |

## Node Signal
COMPLETE verify=7d06678d80cf4265a339329ac04bd15405d72614 release_mode=full

（E-103：verify 已合入 master，DevPlan 与 review 按实际 SHA 机械回填；RLT_05 全链收口完毕）
