<!-- dh:v1 -->
# B3 checker — RLT_22（fresh 小审 · checker 角色）

## 结论

PASS

- P1：0
- P2：1
- 范围：仅审 B3 的未提交 working tree 改动中相对 check.B2.md 审过时点的增量——`relay_log.py` 的 `LossStop`/`loss_stop` 第三套计数（A147）、skill 四件同步（A149 + `dh-mapping.toml` note）、`test_relay_log.py` 的 a147×2 / a148×2 / a149×4 新用例与 `_close_w_stage` 换流、progress E-010~E-014、findings F-011/F-012，以及 B1 小审 P2（§3.5 映射表断言）在本批的闭环；B1/B2 已核区域（lint 四态、A145、A144、A146、launch 分支重构）仅核对其零回退（diff hunk 与 B1/B2 结论描述一致、全量 197 绿佐证），未重审。**不替代 normal Recipe 三路复核，不构成验收/verify 裁决。**

## P1（阻断）

无

## P2（质量）

### P2-1 — findings.md 编号从 F-009 直接跳到 F-011，F-010 成为空号

B3 在 findings.md 追加两行（`docs/modules/relay-light/workspace/RLT_22/findings.md:21-22`，HEAD 基线止于 F-009），编号却从 F-011 起。全 RLT_22 工作区（含 progress/check/done/lesson_candidates）grep `F-010` 无任何占用、引用或"已删除"痕迹——纯空号。无行为与追溯性实害（没有任何工件指向 F-010），但证据工件里出现"幽灵空洞"，后续追溯者会怀疑 F-010 被删或漏登一条，与「每条结论挂可核查证据」的账本纪律相悖。

可执行整改（二择一，不阻断收口）：①保持 F-011/F-012 现编号不动，在 F-009 与 F-011 之间补一行占位说明（如 `| F-010 | — | （编号保留，未使用） | — | — | — |`）或在 findings 表尾加一行备注；②把 F-011/F-012 重编号为 F-010/F-011，并同步 `progress.md` B3 行的两处引用（「记 findings F-011 交编排」）。两者都不改任何 P 级别与事实内容。

## 已核通过项

1. **A147 语义对照 oracle：pass**（design/01:1294）。
   - 计数键与首轮计入：`loss_stop()` 按 `(node, ready_for_review 目标名)` 对每条 ready checkpoint +1（`relay_log.py:3012-3023`），无任何跳过首轮的逻辑；仅统计 `_active_node_map` 内节点，与 attempts 计数同口径。
   - 耗尽判据：`count < limits.rework_max_rounds` 早退（:3025-3026）+ 该判定名在本节点无任何 `done`（:3027-3033，按 `_agent_parts(agent)[0] == judge` 全节点扫描）——与 oracle「条数 ≥ `limits.rework_max_rounds` 且该判定名在本节点仍无 `done`」逐字对应。
   - 只投影不拒写：grep 全文件 `loss_stop`/`LossStop` 仅落在 :2960-3065 定义区，`add`/`append_event`/`_validate_*` 零引用；`test_a147_no_write_rejection_and_strategist_exit`（`test_relay_log.py:4074-4107`）实证上限 2 下第 3 条 ready 仍被 `add` 接受、账本 3 行含 token，且耗尽后 strategist 链以 `escalate` 起头一路走到 `resume`（A97/A114 不变）。
   - 同一实现两配置：`test_a147_review_loss_stop_projection_only`（:4028-4072）以 `dc_replace(config.limits, rework_max_rounds=3)`（:4032）对**同一个** `relay_log.loss_stop` 断言三条腿——2 条/上限 2 耗尽、2 条/上限 3 未耗尽、3 条/上限 3 耗尽——正确停止点确由同一函数给出。
   - 三套互不叠加互不重置：同用例 mixed 腿（:4061-4072）`attempt_exhausted` 与 `review_exhausted` 同时在列、`x_rounds` 空；`test_attempt_and_x_loss_stops_trigger_independently` 三腿各补第三计数空断言（:4351-4352 / :4382-4383 / :4413-4414）。
   - `triggered` 纳入第三套：`relay_log.py:2987`；新字段 `review_rounds`/`review_exhausted`（:2980/:2983）与返回体（:3062/:3065）齐全，docstring 同步改「three counters / any one alone opens / Projection only」（:2960-2975）。
   - `Status`/`status_document` 零改动：relay_log.py diff 全部 11 个 hunk 头（-62/-600/-1653/-1666/-1692/-1914/-1922/-2048/-2788/-2831/-2857）无一落在两类；`git diff | grep "status_document\|class Status"` 空；`status_document` 区域 grep `loss|review_round|exhaust` 空（A62 冻结 schema 无泄漏通道）；全量 197 绿含 `RelayStatusProjectionTests`。
2. **A148 对照 oracle：pass**（design/01:1295）。
   - 真计划路径可靠：`REAL_PLAN_DIR = Path(__file__).resolve().parents[2] / "docs/modules/relay-light/relay/rlt12-win-01"`（`test_relay_log.py:4111-4114`）——按测试文件位置解析到仓根的仓内相对路径，非跨树绝对路径（F-001 的跨树担忧因 RLT_12 已 PR #25 合入 master 而自然消解，该目录在本树内实存）；重放读写走 `read_ledger`/utf-8，无 F-008 担心的平台默认编码依赖。
   - 71 行重放：`test_a148_legacy_plan_lints_and_ledger_replays`（:4116-4132）先 lint 真计划（不抛即过，等价退出 0），再断言 `len(entries)==71` 并对每行序贯 `_validate_runtime_event`，任一拒绝即测试红——R 段 reviewer 裸 done 若被 A146 误伤必红；现行绿即「R 段不触发 A146」的实证。
   - lint 不报「建议迁移」：`lint_plan` 的 diff 仅改前缀分流；全文件 grep「迁移/migrate/suggest」仅命中既有 `suggested_action`（§3.5 路由建议字段，A106 既有物，与 trigger 迁移无关）；无警告通道。
   - 混用两路编号不串：`test_a148_mixed_triggers_in_one_node`（:4134-4170）——`on:done:` 路（scribe）在 coder 未 done 时拉起报 **A70**（:4149-4151）、`on:review_ready:` 路（plan-reviewer）无信号拉起报 **A144**（:4153-4155），随后两路各按自己前置走通主线（信号→拉起→送审方 done→配对 done→scribe，:4157-4170）。
   - A65 补例到位：`test_node_close_ignores_an_untriggered_agent`（:1509-1533）补 `on:review_ready:coder` 同款——plan-reviewer 从未拉起，node_close 照常被接受（:1522-1533），命题与既有 `on:done:` 腿并存。
3. **A149 对照 oracle：pass**（design/01:1296）。
   - trigger 新值：W plan-reviewer → `on:review_ready:builder`（SKILL.md hunk @@ -51；test:5502）、X reviewer → `on:review_ready:coder`（hunk @@ -100；test:5505）。
   - C trigger 列未改：C 模板 markdown 表不在任何 hunk；`test_a95_a133_c_template_shape`（:5483-5495，coder/checker 空 trigger、scribe `on:done:coder`、decider `on:blocked` 精确断言）抽查复跑绿。
   - **R 模板三行逐字未动（双证据）**：①`git diff` SKILL.md 仅 3 个 hunk（@@ -51,14 / @@ -100,7 / @@ -221,6），R 模板区（:74-88）不在其中；②`test_a149_template_sync_wcx` 对 R 的 1 node 行 + 2 agent 行做整行精确断言（:5507-5517）。
   - 纪律原文逐字一致：test 常量 `DISCIPLINE`（:5392-5396）与 design/01:1295 原文句「判定方判定 PASS 前，送审方与判定方均不记 `done`；FAIL 走 live 判定方的 `checkpoint` 路由回同一送审方；PASS 后按送审方→判定方顺序记终态」逐字同（含全角分号、`→`、反引号），未以 brief 转述版为准；四处命中各有断言——C prose（:5518-5520）、SKILL.md 硬规则段（:5521-5522，新增第 11 条 hunk @@ -221 为纯 +1 行追加、原 10 条未动）、两份 adapter（:5523-5526，各自 ```text 块内同句）。
   - W/C/X 三条最小账本序列（与 F-003 裁决「W 纳入」一致）：W（:5535-5569）判定方 `agent_lost` 后按 A49 合法重拉 #2、消费**新**信号、node_close 收口，另断言 builder 仅 `["builder#1"]`；C（:5571-5606）checker#1 FAIL 走 `routed_to=coder#1` checkpoint 路由、coder 整改后同实例复审 PASS、node_close 收口，断言 `coder_launches==["coder#1"]`（无第二条 `agent_launch`）；X（:5608-5660）两路一 FAIL 一 PASS、各绑各的 `ready_seq`、PASS 路不重拉不提前封口、node_close 收口，断言 launches 恰三条——与 oracle ②列三种情形一一对应，且各自以 node_close 收口。
   - **B1 小审 P2 闭环**：同结构用例尾部断言 design/01 §3.5 映射表 `on:review_ready:` 两行存在且分别咬 A35/A71（:5527-5533）；design/01:434-435 实存（本 checker 独立查看），正则现行命中。
   - B2 小审 P2 闭环（顺带核实）：`progress.md` E-006 行已改为「其余五用例（B1 四用例 + A146 不生效正例）保持绿」，措辞整改落地。
4. **skill 文件一致性：pass**。
   - `dh-mapping.toml` diff 仅 `[limits.on_exceed].note` 文本（「两套计数」→「三套计数」+ 补「review 抓『节点内送审轮次』」一句）；`action`/`rework_max_rounds`/`attempt_max`/`silence_timeout_min` 全部为上下文行，键名与取值零改动；`roles.toml` 不在改动集（git status 无此文件）。
   - 两份 adapter 新增段逐字同构（同标题「送审封口纪律（监工记账，W/C/X 适用、R 不适用）」+ 同 text 块 + 同补充句），插入位置同为 worker 完成块之后；无路径差异。
   - 新增文本无裸「workspace」中文邻接、无模型名：diff `^+` 行 grep `claude/codex/gpt/gemini/glm/workspace` 仅命中文件头行；A100/A132 回归由 SkillTemplateTests 全绿佐证。
5. **测试质量与证据：pass**。
   - E-012 与 `/tmp/rlt22-b3-full.log` 一致（`Ran 197 tests in 575.741s OK`）；197 = B2 后 189 + B3 净增 8（a147×2 + a148×2 + a149×4），数目自洽。E-013 与 `/tmp/rlt22-b3-relaytests.log` 一致（`RELAY ALL PASS (SKIPPED: 1)`；skip 为 psmux 实连套件；log 中 `installed: %TEMP%\...` 是 run-relay-tests 的临时 HOME fixture，不碰用户级两侧）。
   - E-010/E-011 未留日志文件（同 E-006/E-007 先例，以 re-run 为准）：本 checker 复跑同集合证实 E-011（见第 6 条）；E-010 的 `failures=4, errors=1` 与「实现缺失」状态推演自洽——a147 投影用例 ERROR（`LossStop` 无 `review_rounds`）+ a149 四条 FAIL（W/X trigger 旧值使新序列在 launch 处被拒），而 a147 无上限用例与 a148×2 不依赖新实现、实现前即绿（回归守卫）。
   - 三次夹具返工如实登记于 progress B3 行，与代码现状互证：`dc_replace` 按导入名使用（:4032）、X 两路夹具 `_assembled_plan` 后手工追加 lesson 行（:5611-5613）、mixed 夹具全量保留 ready 信号 + 追加行 seq 顺延（:4061-4067）。无美化。
   - `git diff --check` exit 0 无输出；改动集恰在允许路径闭集内——modified 8 文件 = `tools/relay-light/**`（relay_log.py、test_relay_log.py、SKILL.md、dh-mapping.toml、adapter×2）+ `workspace/RLT_22/**`（progress.md、findings.md）；untracked 仅 check/done 四件（本卡工作区）与 `tools/relay-light/__pycache__/`（RLT_10 F-002 已挂账的测试副产物）。
6. **抽查复跑：pass**。派单指定 5 用例 `PYTHONDONTWRITEBYTECODE=1 python -m unittest tools.relay-light.test_relay_log.RelayReviewReadyTests.test_a147_review_loss_stop_projection_only tools.relay-light.test_relay_log.RelayReviewReadyTests.test_a148_legacy_plan_lints_and_ledger_replays tools.relay-light.test_relay_log.SkillTemplateTests.test_a149_template_sync_wcx tools.relay-light.test_relay_log.SkillTemplateTests.test_a149_x_sequence_two_paths_one_fail_one_pass tools.relay-light.test_relay_log.SkillTemplateTests.test_a95_a133_c_template_shape -v` → `Ran 5 tests in 10.612s, OK`。按派单口径未重跑 10 分钟全量（E-012/E-013 日志已核）。
7. **findings 登记：pass（编号缺口见 P2-1，事实本身准确）**。
   - F-011（P3）：`skill/SKILL.md:139` 实存「attempt 与 X 轮数两套计数独立、不叠加、不互相重置」，位于 `## 账本用法`（:119 起）段、在 B3 全部 hunk 之外（既有文本，非本批引入、非本批漏改）；brief 变更范围对 SKILL.md 只圈「W/C/X 模板与硬规则段」——「范围外、交编排裁决」定性准确，施工未自行扩权顺手改。
   - F-012（P2）：逐字核实三方口径——`workspace/RLT_12/findings.md:28` F-019 行确为「遗留→RLT_22（与 F-008 一起设计；**未确认**：用户尚未就本条点头，不按 DC_46『已确认』计）」（本树即 RLT_12 合入后内容）；DevPlan §3.1 RLT_12 行确写「F-019（close 判据看不见结论）并入 RLT_22」；DevPlan §RLT_22 卡面（:429 实施提示）只承接 F-008。冲突属实；本批确未实现 F-019（`_validate_node_close` 与 close 语义零改动）。登记交裁决而非自行选边，处理正确。
8. **未越权确认：pass**。`C:\Users\nash\.claude\skills\relay-light\manifest.json` 与 `.codex` 侧 manifest 的 `source_head` 均仍为 `72c6c4d7aed299fd59ad49db1a3335b403147797`、`source_dirty: false`（与 E-001 记录逐字一致，未被本批触碰）；progress B3 行亦明确「skill 改动后的两侧重同步按闸**未执行**……停在仓内验证」。本 checker 只读查看，未修改。

**边界声明**：本 checker 独立 fresh 视角、与施工者无关；只读代码与证据，仅写本 `check.B3.md` 与 `done.checker.B3.md` 两文件；未改任何程序/测试/工件，未 commit，未跑 install_skill.py，未做验收裁决。审查范围仅 B3 增量及其与全局一致性；不替代 normal Recipe 三路复核（代码轮 1 / 需求方向 / 教训 + 一致性登记位），不构成验收、verify、push、PR、CI 或合并的任何结论。P2-1 不阻断收口与否由编排裁决。
