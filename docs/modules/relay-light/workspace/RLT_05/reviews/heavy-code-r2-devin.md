<!-- dh:v1 -->
# RLT_05 heavy 复核 · 代码轮 2 — rlt05-hr2-devin

- reviewer：`rlt05-hr2-devin`（Devin CLI · SWE-2 Max），fresh session，未参与 RLT_05 任何批次施工/批审，与轮 1 reviewer `rlt05-hr-devin` 为不同实例
- 快照：`/tmp/rlt05-hr-r2.2ophD4/repo`（真实 worktree 字节副本，`.git` 指向真仓）；基线 master `1bea79fe18271b3b0b45c8d5dc6cc8993bfbf57d`（快照 `HEAD` 实测同值）；未触碰 `/home/nash/work/dh-relay` 及其 `.dh-worktrees`；变异在二级隔离副本 `/tmp/rlt05-hr2-mut/repo` 上执行
- 对象：与轮 1 同一评审对象（`tools/relay-light/relay_log.py`、`test_relay_log.py`、`skill/{roles,dh-mapping}.toml`、workspace 全套）；合同：`design/01` §2/§3.1–3.5/§5/§6.2–6.3/§7.3/§9/§11 与 DevPlan RLT_05 卡
- 方法：轮 1 报告逐条核对 + **跨快照字节级增量比对** + 自建双域有效 mutation + 本审自行全量复算。轮 1 的动态探针证据未重跑、仅作线索；凡本审结论均自验或标注采信来源

## 0. 结论

**APPROVE**。轮 1 `APPROVE` 结论成立、登记项无遗漏；轮 1 之后整卡**零代码增量**（仅 workspace 工件登记增量，字节级证明见 §2）；两域有效 mutation 均产出行为断言红且还原后全量回 108 绿。本审**无新增 P0–P3 发现**；open=6 全部为轮 1 结转的登记/裁决事项（止损出口归属、attempt 硬上限产品裁决、§11 A99 证法文字、RLT_07 交接点名、死常量、stage 事件 node 归属残差），无一项要求改本卡代码。

## 1. 轮 1 闭合核对

轮 1 报告 `reviews/heavy-code-r1-devin.md`：`APPROVE`、open=6、无 P0/P1/P2 返工项。本审逐项核对其可机械复核的主张：

| 轮 1 主张 | 本审复核 | 结果 |
|---|---|---|
| 全量 `Ran 108 tests … OK` | 隔离副本基线复跑 `Ran 108 tests in 127.846s … OK` | **一致** |
| 实现 HC-ID 43 个 / 测试 HC-ID 57 个、无杜撰编号 | 本审独立 `grep -o 'HC-RL-A[0-9]*' | sort -u | wc -l` 复算：43 / 57 | **一致** |
| `WRITER_BY_EVENT`（`70-84`）= §3.4 写者表 | 读码：9 控制事件逐条 + `AGENT_EVENTS` 全归 monitor，无「等」省略 | **一致** |
| A97 lint 块位于结构规则之后、A116 之前（`606-614`） | 读码确认顺序：A109(`604`) → A97(`606-613`) → `_lint_recipe_reviewers`(`614`)；`>` 比较、`active_nodes` 限定 | **一致** |
| `RECIPE_TIERS` 闭集先于配置查询（`626-633`） | 读码确认 `plan.recipe not in RECIPE_TIERS` 在 `recipe_reviewers()` 之前 | **一致** |
| `_validate_strategist_conclusion` 挂 `_validate_event_semantics`、先于状态机（`882-889,1005`） | 读码确认调用点 `1005` 位于语义校验段 | **一致** |
| F-HR1-01：`SUGGESTED_ACTIONS`（`66`）死常量 | 本审 grep：`relay_log.py` 内仅定义行，测试文件 `1866` 自带同名集合 | **属实** |
| F-B4-R01：`loss_stop`/`plan_x_rounds` 无产品侧调用点 | 本审 grep：两函数仅被 `test_plan_x_rounds…`/`test_attempt_and_x…`/`test_attempt_loss_stop…` 三条测试消费，`add`/`status`/`lint` 均无引用 | **属实（裁决属主控/用户层）** |
| findings.md 登记项全覆盖（H1–H4、Opus/Fable 裁决、F-004..F-008、B1/B2/B3/B3R1/B4 事实、批审 P3 残差） | 本审对读 findings.md 全文与轮 1 §5 五小节：§5.1–5.5 逐一对应，无隐藏未裁项；L-001..L-011 属并发教训路径，不属本路裁决 | **无遗漏** |
| F-B4-R02/R04 closed；R01/R03/R05/R06 转设计层/交接 | 四项均为不改代码的流转事项；本审对 F-B4-R01/R03 的事实面做了上述独立复核，成立 | **裁决维持** |

轮 1 的 21 项自建 CLI/库探针本审**未重跑**（见其 §8 与本审 §7 NOT_RUN）；因评审对象与轮 1 字节相同（§2），该等证据对本快照保持有效。

## 2. 增量复核：轮 1 之后零代码增量（字节级证明）

轮 1 快照 `/tmp/rlt05-hr-r1.ssJyhI/repo` 仍在机，本审与其做 `diff -rq`（排除 `.git`）：

| 比对项 | 轮 1 快照 | 本审快照 | 结果 |
|---|---|---|---|
| `relay_log.py` sha256 | `90707b7e61a4aa0a6c1b22010c8ddddfa250f71da41bbb74105ac83c78527798` | 同值 | **字节相同**（即 E-081/E-085/B4 小审/轮 1 共同记录的同一 hash） |
| `test_relay_log.py` sha256 | `dc726957021f288b0c198a18363b3a6d44fd5f1a100fcca175e4117012180360` | 同值 | **字节相同** |
| `skill/roles.toml` / `dh-mapping.toml` sha256 | `466c88d9…6790` / `cbbfe236…7fe0` | 同值 | **字节相同**（自 Batch 1 起未变） |
| `git status --porcelain` | 11 项（6 M + 5 ??） | 排序后 `diff` 为空 | **逐行相同** |
| `diff -rq` 全仓（除 `.git`/workspace） | — | — | **零差异** |
| workspace/RLT_05 增量 | — | 仅 `progress.md` +5 行（`BATCH_REVIEW_CLOSED batch=4`、E-087、E-088 登记）与 `review.md` 三行回填（code-round1 行、Batch 4 行、状态段） | 纯主控登记，非代码改动 |

mtime 佐证：`relay_log.py`/`test_relay_log.py` 停在 `09:14~09:16`（Batch 4 施工窗），早于轮 1 报告落盘 `10:26`——轮 1 评审的正是当前字节。`git diff --check` exit 0；本审快照与隔离副本均无 `__pycache__`/`*.pyc`。**增量边界仍闭合：allowed-paths 之外零改动，轮 1 结论对本快照原样成立。**

## 3. 有效 mutation 执行记录（本审自选精确行，两域各一）

隔离副本：`/tmp/rlt05-hr2-mut/repo`（快照字节副本，副本基线全量 108/108 OK）。施加方式：逐行精确替换；还原方式：`cp` 回原始字节并核 sha256。被变异文件原值 sha256（施加前/还原后均为此值）：`90707b7e61a4aa0a6c1b22010c8ddddfa250f71da41bbb74105ac83c78527798`。

### 3.1 status-lifecycle 域 — stage-close 偏序守门（A89「全节点 closed」）

| 项 | 值 |
|---|---|
| 锚点 | `tools/relay-light/relay_log.py:1123`（`_validate_stage_event` 的 stage_close 分支） |
| 原值 → 变异值 | `unclosed = [node.node for node in instances[stage_id] if not _node_closed(entries, node.node)]` → `unclosed = []` |
| 语义 | 摘除「stage_close 要求该实例全部节点 closed」守门——node_close→stage_close 偏序的右端判据 |
| 施加 hash | `c8563fe56c46a8bd83919364a2addff940961e827cc0794a607a8c1096154089` |
| 还原 hash | `90707b7e61a4aa0a6c1b22010c8ddddfa250f71da41bbb74105ac83c78527798`（复拷回原字节，`diff -q` 与主快照一致） |
| 命令 | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tools/relay-light/test_relay_log.py -k RelayLifecycleTests` |
| 红结果 | `Ran 16 tests in 61.624s … FAILED (failures=1)`：`test_stage_result_and_close_preconditions_exit_two`（`test_relay_log.py:2449`→`2381`）`AssertionError: Regex didn't match: '^error: HC-RL-A89 ' not found in 'error: HC-RL-A112 stage_close requires a stage_result for DHR_90:C#1\n'` |
| 判定 | **有效行为断言红**（AssertionError，非 import/setup/TypeError）。机制分析：add 可达账本中 `stage_result` 必以全节点 closed 为前提（A112 前置），故摘除 A89 未关节点检查后，带未关节点的 `stage_close` 落进 `result is None → A112`——拒绝仍发生但**编号与原因失真**。这证明该守门在 add 空间的独立判别力=精确 HC-ID + `still open` 诊断（§3.5 映射行）；对含 `stage_result` 行而节点未关的手工/legacy 账本，它仍是真实的接受/拒绝闸 |

### 3.2 config-recipe 域 — Recipe 集合比较（A116 集合相等）

| 项 | 值 |
|---|---|
| 锚点 | `tools/relay-light/relay_log.py:644`（`_lint_recipe_reviewers` 的 per-R 实例集合比较） |
| 原值 → 变异值 | `if names != set(expected):` → `if names < set(expected):`（集合相等 → 严格子集才拒） |
| 语义 | reviewer 集合合同从「精确等于配置档集合」退化为「只要是配置档子集即放行」——超集与不相交集均被接受 |
| 施加 hash | `51236fab1f15d665a6681881aa6a5bf595d5eb8299b27e306e93c0b634bb58a2` |
| 还原 hash | `90707b7e61a4aa0a6c1b22010c8ddddfa250f71da41bbb74105ac83c78527798` |
| 命令 | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tools/relay-light/test_relay_log.py -k RelayConfigTests` |
| 红结果 | `Ran 18 tests in 7.988s … FAILED (failures=2)`：①`test_recipe_reviewer_mismatch_is_rejected_as_a116`（`:1465`）`AssertionError: 2 != 0`——`{requirement, lesson, code-round2}` 超集被 lint 接受（rc0）；②`test_one_mismatched_r_instance_rejects_the_whole_plan`（`:1505`）`AssertionError: 2 != 0`——`{consistency}` 不相交集被接受（rc0） |
| 判定 | **有效行为断言红**（两条均为 rc 断言失败，非解析/setup 红）。两个方向（超集、不相交）各被一条独立断言咬住，证明 `!=` 的两侧判别力均为实质覆盖；exact-match 正例（`test_each_recipe_tier_lints_a_matching_r_instance` 等）与零 reviewer 豁免（`:1510`）在变异下仍绿，无副作用红 |

### 3.3 还原后全量回归

| 命令 | 结果 |
|---|---|
| `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tools/relay-light/test_relay_log.py`（两次还原完成后） | `Ran 108 tests in 133.008s … OK` |

## 4. 本审 findings（F-HR2-*）

**无新增 P0–P3 发现。** 轮 1 结转的 open=6（F-B4-R01 P2、F-B4-R03/F-B4-R05/F-B4-R06/F-HR1-01/F-HR1-02 各 P3）经本审 §1 复核维持原裁决，均为登记/裁决/交接事项，不要求改本卡代码：

| ID | 级别 | 轮 1 处置 | 本审复核增量 |
|---|---|---|---|
| F-B4-R01 | P2 | ESCALATE：止损计数正式出口归属待主控/用户裁决 | 独立 grep 确认两函数无产品调用点，事实面成立；open |
| F-B4-R03 | P3 | 接受 + ESCALATE-lite（attempt 硬上限属产品裁决） | A97（X 侧硬闸）与 attempt（无硬闸）的不对称已读码确认逐字合规；open |
| F-B4-R05 | P3 | 追认证法替换 + 建议 §11 A99 行改 hash 口径 | B4 小审与轮 1 的 hash 值 `90707b7e…` 与本审实测一致；open（设计文字） |
| F-B4-R06 | P3 | 接受 + RLT_07 交接指针 | `XRound` 四字段读码确认；open（交接登记） |
| F-HR1-01 | P3 | 死常量登记 | 本审 grep 复核属实；open |
| F-HR1-02 | P3 | stage 事件 note 寻址不核 node 归属残差（补强 E-062/B3R1-F1） | `_stage_of`/`STAGE_NOTE_EVENTS` 读码确认残差仍在、无 oracle 覆盖；open |

## 5. 与其他并发路径的分工

本报告只覆盖 `review.md` 的 `code-round2` 路径（轮 1 闭合核对 + 增量 diff + 有效 mutation）。需求方向（25 条逐字对齐）、一致性（§↔TOML↔Python↔tests 闭集比对）、教训（lesson_candidates 核查）三路为同一 Review Batch 的独立 fresh 路径，本审不代签、不预判其结论。

## 6. NOT_RUN（不冒充已验证）

| 事项 | 状态 | 说明 |
|---|---|---|
| 轮 1 的 21 项自建 CLI/库探针 | NOT_RUN（本审） | 评审对象与轮 1 字节相同（§2 双快照 hash 一致），重跑冗余；本审以全量 suite + 双域 mutation + 静态核对补足独立判别 |
| E-076 实现前红原样重跑 | NOT_RUN | 实现已在树内不可原样复现；B4 小审 M1–M4 + 本审两域 mutation 为替代性判别力证据 |
| 需求/一致性/教训三路结论 | 不适用 | 并发路径，由各自 reviewer 独立产出 |
| verify、需求境证据、验收 | 未执行 | 非本节点职责；本报告不构成「待验收」依据 |

## 7. Verdict

`APPROVE`。轮 1 `APPROVE` 闭合成立且无 P0/P1/P2 返工项遗漏；轮 1 之后整卡零代码增量（双快照字节级证明，git 边界仍闭合）；两域有效 mutation（stage-close 偏序守门 `1123`、Recipe 集合比较 `644`）均获行为断言红、还原后全量 108/108 绿。本审新增 finding 数 0；open=6 全部结转轮 1，均为不改代码的主控/用户裁决或交接登记事项，不阻断本路径闭合。

DONE APPROVE open=6
