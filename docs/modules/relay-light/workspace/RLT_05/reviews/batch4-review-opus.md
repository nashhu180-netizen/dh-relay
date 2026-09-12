<!-- dh:v1 · batch review -->
# Batch 4 小审报告 — RLT_05（fresh checker: rlt05-b4-review-opus / Claude Opus 5）

- **审查对象**：RLT_05 Batch 4（`task_plan.md` 第「### Batch 4」表 + 「施工共通约束」），施工记录 `progress.md` E-075～E-084、`DONE ... batch=4 status=CONSTRUCTION_DONE`。
- **审查环境**：可写一次性快照 `/tmp/rlt05-b4-review.Qu4zUa/repo`（真实 worktree 的字节副本，`.git` 指向真仓）；未触碰 `/home/nash/work/dh-relay` 及其 `.dh-worktrees`。
- **审查方法**：合同对读（design/01 §3.4 / §6.2 / §6.2.1 / §6.3 / §7.3 / §9.3 / §11 的 A97/A99/A107 行、DevPlan RLT_05 卡）＋ 快照内**真实重跑**（unittest 全量与 focused、独立构造的 CLI 探针、独立 `loss_stop` 探针、4 次定向变异）。未采信施工方证据文本作为结论依据，凡结论均自行复算。
- **范围**：仅 Batch 4。Batch 1–3 已 APPROVE，不重开；只检查 B4 是否破坏它们。

---

## 1. 动态复算结果（本审自行执行，非转述）

| 复算项 | 命令/构造 | 本审实测 | 与施工证据是否一致 |
|---|---|---|---|
| focused 绿 | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tools/relay-light/test_relay_log.py -k RelayLimitsTests -v` | `Ran 8 tests ... OK` | 与 E-078 一致 |
| 全量回归 | `... python3 -m unittest tools/relay-light/test_relay_log.py` | `Ran 108 tests in 122.276s ... OK` | 与 E-079 一致 |
| A97 精确编号 | **本审自建** 6 节点 plan（W1→C1→R1→X1→X2→X3，recipe=normal，其余结构合法），cfg 仅改 `rework_max_rounds` | limit=2：`lint: HC-RL-A97 line 12: DHR_99:X#3 exceeds rework_max_rounds=2`，rc=2，stderr 仅 1 条 `HC-RL-`；limit=3：`lint: ok` rc=0 | 与 E-080 一致；**非 A109/A129 冒充** |
| A97 对 status/add fail closed | 同 plan + limit=2 | `status` / `add plan_loaded` 均 `error: HC-RL-A97 ...` rc=3，且 `relay_log.jsonl` **未创建** | 与 E-080 一致 |
| 三子命令闭集 | `relay_log.py --help` | `{add,status,lint}`，无 generate/watch/plan-amend | 一致 |
| A99 双配置双 hash | **本审自建** `planner_probe.py`：同一进程内先后 `plan_x_rounds("DHR_99", load_config(cfg2/cfg3))`，前/中/后各取一次 `sha256(relay_log.py)` | 三次 hash 同为 `90707b7e61a4aa0a6c1b22010c8ddddfa250f71da41bbb74105ac83c78527798`；长度 2 vs 3，`stage_id` 为 `DHR_99:X#1..#k`，`dh_nodes=('E2','E3')` 取自 `stages.X` | 与 E-081 **逐字节一致**（hash 值相同） |
| A97 strategist 闸（auto） | **本审自建** 单 X 阶段 plan，全链经真实 `add` 落账 | `resume` / `cancelled` 缺 `user_decision` 均 `error: HC-RL-A97 ... requires a user_decision on the strategist chain` rc=2；补 `user_decision` 后 rc=0；拒绝行未入账（11 行 = 9 正例 + 2） | 与 E-082 一致 |
| A97 strategist 闸（consult） | 同上，marker `decision_mode=consult` | 同 auto，逐条一致 | 与 E-082 一致 |
| plan_loaded 双键 | 本审探针账本首行 | `note` 含 `config_dir=<规范绝对路径>` 与 `plan=<规范绝对路径>` 各恰一次，由 resolver 事实重建（调用方只传 `skill=0.1.0`） | 与 E-083 一致 |
| A107 两计数独立 | **本审自建** `loss_probe.py`，5 个自设场景（含施工未覆盖的 3 个边界） | A：attempts=3 但末态 `done` → 不触发；B：attempts=3 末态 `agent_lost` → `attempt_exhausted`，`x_rounds={}`；C：X#2 已开但 `outcome=done` → 不触发；D：X#2 已开无 result → 不触发；E：X#2 `failed` → `x_exhausted`，attempts 仍 1/1 未受影响 | 与 E-078 的三例一致，并额外确认两计数**互不递增、互不重置** |
| 边界 | `git diff --check`；`git status --porcelain`；`ls -R tools/relay-light` | `git diff --check` rc=0；`tools/` 下只有 `relay_log.py`、`test_relay_log.py`、`skill/{dh-mapping,roles}.toml`；无 SKILL.md/adapter/template/watch/plan-amend | 与 E-084 一致 |
| TOML 未改 | 内容对读 design §6.3 + mtime | 两 TOML mtime 停在 `2026-09-11 11:43`（Batch 1），而 `relay_log.py`/`test_relay_log.py`/`progress.md`/`findings.md` 为 `2026-09-12 09:14~09:22`；`dh-mapping.toml` 逐值等于 §6.3（含 `stages.X=["E2","E3"]`、`rework_max_rounds=2`、`attempt_max=3`、`[limits.on_exceed]`），`roles.toml` 恰 11 角色且每个有 `model`/`launch` | 支持 E-077「TOML 零改动」 |
| 旧断言未删 | baseline `1bea79f` 54 个 `def test_` vs 现 108；`comm` 求差 | 仅 1 个基线用例名消失（`test_by_is_derived_from_agent_prefix_without_event_ownership_validation`），已由 **Batch 3** 的 E-058 / fixture 对齐表 #11 登记改名承接，**非 B4 改动**；B4 净增 8 | 支持「旧 fixture/旧断言零改动」 |

### 1.1 有效红的替代验证（E-076 不可原样重跑）

实现已落地，E-076 的实现前红**无法在快照中原样复现**；本审改以**定向变异**验证这 8 条用例确有判别力（每次变异后立刻按备份还原，还原后 `sha256` 回到 `90707b7e…`）：

| 变异 | 结果 |
|---|---|
| M1 `lint_plan` 中 A97 条件短路为 `False` | focused `FAILED (failures=1)` — `test_x_rounds_beyond_the_configured_limit_are_rejected_as_a97` 红 |
| M2 `_validate_strategist_conclusion` 首行后直接 `return` | focused `FAILED (failures=4)` — 4 个终局 subTest 全红 |
| M3 `plan_x_rounds` 的 `range(1, config.limits.rework_max_rounds+1)` 硬编码为 `range(1,3)` | focused `FAILED (failures=1)` — A99 双配置用例红 |
| M4 `loss_stop` 的 `count < config.limits.attempt_max` 改为 `+1` | focused `FAILED (failures=2)` — 两条 attempt 计数用例红 |

结论：A97（两半）、A99、A107 的断言**均咬住行为**，不是重言式；E-076「5 条有效行为红 + 3 条显式 guard + 3 条 late-added 判别器」的定性与代码一致（`plan_x_rounds`/`loss_stop` 的 `assertIsNotNone` guard 确为显式 guard 而非 import 红）。

---

## 2. 合同符合性判定

| 合同点 | 判定 | 依据 |
|---|---|---|
| A97 上半：唯一违规为 `X#k > limits.rework_max_rounds` 的合成 plan 被 lint **精确**以 `HC-RL-A97` 拒 | **符合** | 本审独立 plan 复算；`lint_plan` 中 A97 位于 A24/A47/A48/A35/A71/A75/A129/A104/A87/A89/A109 **之后**、A116 之前，故结构错误不会被 A97 抢报、A97 也不会被 A109 冒充；只取 `active_nodes`（superseded 行不参与） |
| A97 下半：strategist 链的 `resume`/`cancelled` 必须经 `user_decision`，auto 亦然 | **符合** | auto/consult × resume/cancelled 四例真实 CLI 复算全部 rc2 + 精确 ID + 账本不增；补 `user_decision` 后两终局各 rc0；事件归属（决策类记 coder#1、`agent_launch`/`done` 记 strategist#1）与 §3.4/§9.3 一致 |
| decider 链未被误伤 | **符合** | 闸仅在 `_active_decision_owners` 命中且 helper 前缀为 `strategist` 时生效；auto 下 decider 链 `decision→resume` 实测 rc0（A96/A114 属他卡，未被 B4 改写） |
| A99：长度 == 配置上限、`stage_id=<card>:X#k`、`dh_nodes` 取 `stages.X`、纯内部 | **符合** | 双配置双 hash 复算；`plan_x_rounds` 不写文件、不进 argparse；`--help` 仍 `{add,status,lint}`；缺 `stages.X` 时 `HC-RL-A92` exit 3 |
| A99：`plan_loaded.note` 含 `config_dir=` 与 `plan=` | **符合** | 真实 CLI 复算，两键各恰一次、由 resolver 事实重建（承接 B1-F2-R1 的无条件重建） |
| A107：attempt 按 `(node, agent 名)`、X 按卡内阶段实例，两计数独立、首到者触发 | **符合** | 5 场景独立复算；`attempts` 键含 node，跨节点不累计；X 取卡内已开实例最高 `k`；两者无交叉赋值、无互相重置 |
| 允许路径闭集 | **符合** | B4 落在 `relay_log.py`、`test_relay_log.py`、`workspace/RLT_05/{progress,findings}.md`；其余 `M`/`??` 为进场前既有 WIP（mtime 佐证：四份文档同为 autostash 回放时间 `08:59:27`，B4 编辑均在 `09:14` 之后） |
| 禁改项 | **符合** | 无新公共子命令、无 SKILL/adapter/模板、无 watch/plan-amend 实现、未改 dev-harness、未改 DevPlan/design/AGENTS/`task_plan.md`/`review.md`/`reviews/**`、未改两 TOML、未 commit/push |
| 未破坏 Batch 1–3 | **符合** | 全量 108/108 绿（原 100 条含 RLT_03 与 B1–B3 全部保留）；无基线用例被 B4 删除或弱化 |

---

## 3. findings

### F-B4-R01 · P2 · open — `loss_stop` 为纯内部函数，产品侧无任何触达路径

`loss_stop`/`LossStop` 除单测外**无调用点**：`add` 不拒、`status` 不出、`lint` 不查（`grep` 全仓仅命中定义与 3 处测试）。A107 的 §11 证法确实只要求单测，`status` 的 13 键又被 A62 冻死、不能随手加字段，因此**不构成本批合同违反**；但「任一先到上限即停 → 拉 strategist」这条运作规则目前没有任何可被编排/监工机械消费的出口，RLT_07/RLT_18 接手时若各自另写一份计数，会出现第二处真值。

- 期望处置：由主控/heavy 复核裁定该计数的正式出口（RLT_07 skill 内部消费？RLT_18 watch 提示？还是留作纯库函数），并在 as-built 或后续卡登记；**不建议在本批扩边界去改 A62 schema**。

### F-B4-R02 · P3 · open — 两个计数的「触发时点」采用了 design 未逐字写明的收敛读法

实现把「达上限」读成「**再要一轮/再要一次重拉时已无余量**」：X 侧要求最高 `k >= rework_max_rounds` **且**该实例最新 `stage_result.outcome == failed`；attempt 侧要求 `agent_launch` 计数 `== attempt_max` **且**最新行仍需重拉（`agent_lost`/`cancelled`/其后 `stage_result outcome=failed`，与 A49 同一组原因）。本审实测确认：attempts=3 但末态 `done` → 不触发；X#2 已开但 `outcome=done` 或尚无 result → 不触发。

- X 侧有 §9.3 原文直接支撑（「X2 **仍不过**（X 轮数达 max_rounds=2）→ 监工拉 strategist」），判定**成立**。
- attempt 侧 §7.3/§9.3 只写「attempt 达 3」，字面读法会在 `coder#3` 刚拉起时就触发、使 `attempt_max=3` 实际退化为 2，明显非本意；实现读法更合理，但属**施工者的解释**，已由施工方在 `findings.md` B4-F1/B4-F2 自行登记，未偷改合同。
- 期望处置：heavy 复核或用户裁决时**确认/追认**该读法（必要时回写 design §7.3 一句澄清），不必返工。

### F-B4-R03 · P3 · open — `attempt_max` 无硬闸，与 X 侧的 A97 硬闸不对称

`X#k` 超限由 lint A97 **硬拒**（§3.5 规则→ID 映射表有该行），但 `agent_launch` 到 `coder#4` 时 `add` 仍 rc0（`_validate_agent_transition` 只校验 A58 连号与 A49 重拉资格，不比对 `limits.attempt_max`）。design §11 现无任何 oracle 要求 add 拒绝超 `attempt_max` 的重拉，故**不是缺口违反**，只是两套计数的执行强度不对称。

- 期望处置：登记待裁；若产品意图是硬上限，应由 design 补一条规则→ID 映射后再派卡，**不由本批自行扩边界**。

### F-B4-R04 · P3 · open — strategist 链 `resume` 之后的 `cancelled` 不再过闸

本审实测：完整 strategist 链 `... → user_decision → resume` 落地后，再对同一 `coder#1` 写 `cancelled` **rc=0**（`_active_decision_owners` 在链 `resume` 后失效）。施工方已在 `findings.md` B4-F3 自陈此语义。§3.4/§9.3 的链定义确实到 `resume`/`cancelled` 二选一为止，「resume 之后另行停卡」不属该链，故**判定可接受**；但「strategist 触发的永远先交用户」若被读成「strategist 介入过的卡此后任何停卡都要 user_decision」，则本实现不满足。

- 期望处置：heavy 复核确认取窄读法即可，无需返工。

### F-B4-R05 · P3 · open — A99 的证法由「`git diff` 为空」替换为「双运行双 sha256」

§11 A99 行的证法原文含「`git diff` 对 `relay_log.py` 为空」。B1–B4 全部是未提交 WIP，该字面证法在本卡内**不可能成立**；`task_plan.md` Batch 4 已冻结为「两次内部规划前后各取 `sha256sum`，三次同值」并明令「不得用工作树 diff 为空证明，也不得 commit/stash」。施工方照此执行，本审亦独立复算得同一 hash。替代证法在强度上**不弱于**原证法（它证明的是同一二进制按两份配置产出不同结构）。

- 期望处置：在 heavy 复核/验收时**显式追认**该证法替换（或由 A 侧在 design §11 A99 行把证法改写为 hash 口径），避免验收阶段被当作缺证。

### F-B4-R06 · P3 · open — `XRound` 结构不承载「coder 修 + reviewer 再审」语义

Batch 4 合同写「语义是 coder 修 + reviewer 再审」，但 `XRound` 只有 `stage_id/card/k/dh_nodes` 四个字段，该语义仅存在于 docstring。对 A99 的验收（长度、ID、dh_nodes、纯内部）无影响，但 RLT_07 消费该函数生成模板时，agent 行仍要自行拼。

- 期望处置：交接给 RLT_07 时在 as-built/交接说明里点名，避免 RLT_07 反过来硬编码。

---

## 4. 未能复算 / NOT_RUN 事项（不得视为已验证）

| 事项 | 状态 | 说明 |
|---|---|---|
| E-076 的实现前红原样重跑 | **NOT_RUN** | 实现已在树内，红不可原样复现；已用 4 次定向变异（M1–M4）替代验证判别力，见 §1.1。变异均已还原，`relay_log.py` sha256 回到 `90707b7e…` |
| E-075 的 `git rebase --autostash master` 过程 | **NOT_RUN** | 一次性历史动作；仅以 `HEAD=1bea79f`、WIP 完整、四份文档 mtime 同为 `08:59:27` 作间接佐证 |
| 「B4 未改 AGENTS/design/DevPlan」的字节级归因 | **静态佐证** | 这些文件是进场前既有 WIP，无提交可 diff；以 mtime 分层（08:59 vs 09:14+）与 B1–B3 记录佐证，非硬证明 |
| 两 TOML「本批未触碰」 | **静态佐证** | untracked，无 git 基线；以 mtime 停在 `2026-09-11 11:43` 与逐值等于 design §6.3 佐证 |
| B4 对 `test_relay_log.py` 的增量是否**只**增了 8 条 | **静态佐证** | 无 B3 快照可 diff；以「B4 符号仅被 `RelayLimitsTests` 引用」「baseline→现仅 1 例改名且归属 B3」「全量 108 绿」佐证 |

## 5. oracle 覆盖清单

| oracle | 本审复算方式 |
|---|---|
| **HC-RL-A97**（X 超限精确 lint） | **动态**：自建合成 plan，真实 CLI `lint`/`status`/`add` 三路，rc2/rc3 + 精确 ID + 账本不增 + 提限即合法；另以 M1 变异验证判别力 |
| **HC-RL-A97**（strategist 链 user_decision 闸） | **动态**：自建 auto/consult 两 plan，全链真实 `add`，四终局反例 + 两终局正例 + 事件归属；另以 M2 变异验证判别力 |
| **HC-RL-A99** | **动态**：自建 `plan_x_rounds` 双配置探针 + 三次 sha256 + `dh_nodes` + `--help` 子命令闭集 + `plan_loaded` 双键真实落账；另以 M3 变异验证判别力 |
| **HC-RL-A107** | **动态**：自建 `loss_stop` 探针 5 场景（含施工未覆盖的 3 个边界），断言两计数互不影响；另以 M4 变异验证判别力 |
| HC-RL-A92（`stages.X`/limits/on_exceed 承载） | **静态**：逐值对读 design §6.3；`plan_x_rounds` 缺 `stages.X` 时 A92 exit 3 为读码判定（B1 owner，本批只复用） |
| HC-RL-A116 / A115 / A131 / A135 / A134 | **静态**：仅确认 B4 未改其实现与断言（全量 108 绿、A97 插在结构规则后 / A116 前）。这些是 **Batch 1/2 已 APPROVE 的 owner 项**，本审不重开 |
| HC-RL-A85 / A93 / A89 / A105 / A106 / A110–A112 / A118 / A43 / A44 / A61 / A62 / A65 / A73 / A81 | **静态**：仅以全量 108/108 绿确认 B4 未回归；Batch 2/3 已 APPROVE，不重复取证 |
| HC-RL-A96 / A114 / A130（decider 链模式闸） | **不属本卡 25 条**；仅确认 B4 的 strategist 闸未误伤 decider 链（auto 正例 rc0，**动态**） |

---

VERDICT: APPROVE · open=6 · P0=0 P1=0 P2=1 P3=5 · 动态复算 oracle：HC-RL-A97（两半）、HC-RL-A99、HC-RL-A107；仅静态确认未回归：A92/A115/A116/A131/A134/A135 与 status-lifecycle 全组（A43/A44/A61/A62/A65/A73/A81/A85/A89/A93/A105/A106/A110/A111/A112/A118）；NOT_RUN：E-076 实现前红（以 M1–M4 变异替代）、E-075 rebase 过程。
