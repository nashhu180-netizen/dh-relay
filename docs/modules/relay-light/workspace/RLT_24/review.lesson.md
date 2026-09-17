# review.lesson — RLT_24 开发后复核 · 教训路（R3，fresh 非施工者）

## 结论

APPROVE（P1 0，P2 1）。唯一 P2：checker C1 抓出的「冻结 wire format 下判据不可机器校验」模式已在 findings/decisions 留痕，但未按「现象/为什么/下次怎么做」登记进 lesson_candidates.md。代码轮 1（rlt24-review）并行进行中，本结论不等待也不覆盖它；若其 REVISE 引发返工，按 review.md 三路并行说明须对返工差异定向回核。

## 逐条判据

| # | 判据 | 结论 | 级别 | 依据（文件:行） | 整改动作 |
|---|---|---|---|---|---|
| 1 | 来源教训回流：RLT_11 F-004 + RLT_12 E-003 的「关闭无事件位」在实现与证据里被闭合，非仅加词表项 | PASS | — | 实现：`tools/relay-light/relay_log.py` — `CONTROL_EVENTS` 增 `resource_close`（diff 块 @+42）；严格 wire format `_decode_close_value`/`_close_note_fields`（+2212–2367）；`_validate_close_row` 供 `add` 追加前与 `_lint_ledger` 逐行共用（+1521–1639、+2369–2376）；`_ledger_warnings` 按解码 `object_type` 定写入者并豁免 A93（+2901–2939）。证据：`evidence/A157-stage-workspace.md:12-62`、`evidence/A157-orchestrator-workspace.md:11-60`——两类终端空间各一例**实跑**关闭失败（`herdr workspace close` 探针 id，rc=1 `workspace_not_found`，前后在用空间集不变），`outcome=failed` 合法落账 seq4@C1 / seq5@F1，按 seq 与解码 `object_id` 双向检索命中（`evidence/raw/retrieval-by-seq-and-object-id.txt`），处置=待人工处理不冒称。F-004 点名的三缺口逐一对销：独立事件位（第 20 词 + outcome）、pane 级关闭单独记账（`object_type=pane`→monitor 写入者）、命令级证据落盘（`evidence/raw/herdr-close-*.std*`）。历史 71 行账本兼容由 C3 三用例证明（`test_relay_log.py` `RelayResourceCloseBackwardCompatTests`，sha256 前后不变 + 71/71 回放 + lint 0 + 新旧实现稳定字段相等）。 | 无 |
| 2 | 与既有教训冲突或重犯（账本/schema/兼容/fixture/`__pycache__`/字节/dotted 入口/只测 add 不测 lint/状态派生漂移） | PASS | — | 逐条对照无重犯：①测试不写仓内账本——`test_relay_log.py:7675-7681` `copy_historical` 只向 tempdir 复制，`test_a158_historical_source_bytes_and_71_row_replay` 断言源 sha256 前后不变；rlt12-win-01 账本当前 sha256=`3cd08fd…40b` 与 master 一致，`git diff master --stat -- docs/modules/relay-light/relay/` 为空。②单测入口全部 `cd tools/relay-light && python3 -m unittest test_relay_log`（progress.md E-C1-01～E-C3-02），未用 dotted 路径。③`find . -name __pycache__ -o -name '*.pyc'` 为空；所有命令带 `PYTHONDONTWRITEBYTECODE=1`。④add/lint 双入口由 `assert_close_rejected_both` 承载（test_relay_log.py:7165 起），五类 A156 反例与 A155 各反例均两入口实跑（check.C2.md 判据 1）。⑤状态派生无漂移——`_ledger_warnings` 对 `resource_close` 独立分支、豁免 A93 关后异常；`test_a158_old_and_new_status_stable_fields_equal` 逐字段比较新旧实现（仅对称排除 `idle_seconds`），`status --json` errors=[] 由 C4 取证实证。⑥字节级变异纪律（库候选-53）：checker 故障注入全部在 `/tmp` 副本（check.C3.md 判据 3），未碰仓内文件。⑦枚举大小写（库候选-5 家族）：闭集 frozenset 精确匹配，无 `.lower()`/`.casefold()`，A41/A42 静态守卫未动。⑧外部工具越界产物（RLT_21 L-006）：`git status --porcelain` 干净。⑨旧 fixture 须驱动现役协议（库候选-84）：71 行历史账本逐条经新 `add` 回放接受。 | 无 |
| 3 | 本卡 lesson_candidates.md / findings.md：P1 模式登记候选教训；范围外项登记 findings 写明承接方且未被顺手改 | FAIL | P2 | 已登记：L-C1-01（承接 W2 P1 #6「非字符串 note 失败层级歧义」→ 通用行闸/事件语义分层）、L-C1-02（F-C1-02 静态守卫字面量相撞）、L-C2-01（条件必填键空值透传）、L-C3-01（首跑 GREEN 诚实要点）、L-C4-01/02（同树并行姿势、实跑优于打桩）；findings F-C1-01 登记 skill/adapters/as-built 未含 `resource_close` 并写明「建议收口时由编排评估是否派单同步」承接方（grep 证实 `tools/relay-light/skill/`、`docs/modules/relay-light/as-built/` 零命中）；F-C1-04 完整记录 wire format 合同缺口并触发 decisions.md 用户裁决。**缺口**：checker C1 的 P1（check.C1.md 判据 1）暴露的可复用模式——「W1 把『编排空间→F 首节点退 2』写成机器校验判据、W2 复审亦未识别其在冻结 wire format（四键闭集、`object_type=workspace` 两空间共枚举、`object_id` 无命名约定）下不可计算，施工撞墙才走 BLOCKED→CONSULT」——findings/decisions 有事实留痕，但 lesson_candidates.md 无对应「下次怎么做」条目。 | 在 lesson_candidates.md 补一条候选教训：现象=计划判据超出冻结合同可计算边界；为什么=键闭集/枚举值不含所需区分时判据不可实现；下次怎么做=W1 拆计划与 W2 计划评审对每条「须机器校验退 2」的判据先核 wire format/键闭集能否承载该区分，承载不了的在计划期就标为写入者纪律或上报裁决，不留给施工撞墙。属文档补登，不需代码返工。 |
| 4 | 不越界：`git diff master --name-only` 只含允许路径；历史 workspace、design、DevPlan、skill、`relay/**` 无变化 | PASS | — | `git diff master --name-only` 全部条目 ∈ {`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、`docs/modules/relay-light/workspace/RLT_24/**`}；`git diff master --stat` 对 `design/`、`dev_plan/`、`tools/relay-light/skill/`、`as-built/`、`docs/modules/relay-light/relay/`、`AGENTS.md`、`install_skill.py` 均为空；`git status --porcelain` 干净；rlt12-win-01 账本 sha256 与 master 相同。 | 无 |

## 范围外发现

- **E-003 残余口径**：RLT_12 E-003 空槽还含「编排 pane 操作序列（逐条命令+时间戳）」整段人判材料——`resource_close` 只覆盖关闭动作记账，不覆盖完整命令序列；且 RLT_12 那次运行的历史材料按定义无法回填。本卡闭合的是 F-004 裁决范围内的「关闭失败无事件位/无证据位」，E-003 全量材料的缺口如仍被需要应另立案，不属于本卡 FAIL 项。
- **HC-RL-A85 §11.1 行文本滞后**：design L1258 的 A85 行仍逐字列 19 词写入者二分枚举（未含 `resource_close`），但 §3.4 L320 已自带「A85 系 19 词时代口径、新事件以 §3.4 表为准」的豁免句，口径不自相矛盾；若未来修订设计正文可顺手同步该行，当前不构成需转派缺口。
- **教训路无法预登记代码轮 1 的 P1**：`review.md` L11 已写明若代码轮 1 REVISE 引发返工须对差异定向回核；届时新暴露的 P1 模式应一并补登 lesson_candidates.md。

## X1 定向回核

复核人：rlt24-review3（devin swe-2-max，fresh，非施工者）· node=X1 · 范围 `git diff 407b4c0..5551624`，按 review.md「三路并行说明」对返工差异定向回核。

结论：**APPROVE**（P1=0，P2=0）——R3 唯一 P2 闭合，代码轮 1 的 P1 模式亦已登记为可复用候选教训。

| # | 回核判据 | 结论 | 依据（文件:行） |
|---|---|---|---|
| X1-L1 | R3 P2 闭合：checker C1「判据超出冻结 wire format 可计算边界」模式按「现象/为什么/下次怎么做」补登 lesson_candidates | PASS | `lesson_candidates.md` §X1 `L-X1-01`：现象=W1 把「编排空间→F 首节点退 2」写成机器校验判据、W2 复审未识别、施工 C1 撞墙走 BLOCKED→CONSULT 才发现 `object_type=workspace` 两空间共用枚举、四键闭集无扩展位、`object_id` 无命名约定，最终靠用户裁决降为写入者纪律；为什么=验收判据要求的区分在 wire format 键闭集/枚举值/命名约定里没有载体；下次怎么做=W1 拆计划与 W2 计划评审对每条「须机器校验退 2」判据先核冻结 wire format 能否承载该区分，承载不了的在计划期标写入者纪律或上报裁决，不留给施工撞墙。三段齐备且与 findings F-C1-04、decisions.md 第 1 行事实链一致，正是 R3 判据 3 整改动作所要求的补登。 |
| X1-L2 | 返工新暴露模式（代码轮 1 P1）一并登记且可复用 | PASS | `lesson_candidates.md` §X1 `L-X1-02`：现象=测试依赖本地分支名 `git show master:` 在 `actions/checkout@v4` fetch-depth=1 detached checkout 下必崩（无 `master`/`origin/master` ref），本地与 dev 机全绿、PR 两硬门禁必红；为什么=「能取到基线」寄托在只存在于全量克隆的本地 ref 名上，且以 `master` 为基线是移动目标、合入后退化自我比较；下次怎么做=凡测试需仓内 git 对象把来源钉固定 SHA——`cat-file -e` 探测、缺失 `git fetch --depth=1 origin <sha>`、仍失败带原因显式报错不静默 skip，并用 `git init`+`fetch --depth=1`+`checkout --detach FETCH_HEAD` 的 /tmp 浅克隆实测取证。该教训与实现（`test_relay_log.py` `BASELINE_SHA`+探测/fetch/`self.fail`）和 `evidence/X1-ci-shallow-clone.md` 逐字记录互相印证，模式可直接复用于任何「测试需基线 git 对象」场景。 |
| X1-L3 | X1 不越界、无既有教训重犯 | PASS | `git diff 407b4c0..5551624 --name-only` 仅 `test_relay_log.py` + `workspace/RLT_24/**` 四件工件；`relay_log.py`、design/、skill/、`relay/**` 零改动；rlt12-win-01 账本 sha256 复跑=`3cd08fdc…40b` 不变；无 `__pycache__`/`.pyc` 入树（命令全部 `PYTHONDONTWRITEBYTECODE=1`）；测试内 `git fetch` 只触及 `.git` 对象库不产生仓内文件，`git status --porcelain` 干净。教训写入者边界守住：lesson_candidates/findings 由 coder 写，本路只复核追加本节。 |
