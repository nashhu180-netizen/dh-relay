# phase=plan · builder — 七件套 + 分批 task_plan

先读同目录 `README.md`。只做本 phase，写完 signal 即停。工作目录 `/home/nash/work/dh-relay/.dh-worktrees/RLT_18`。

## 必读（逐字核）
- DevPlan「#### RLT_18」整段、任务表第 137 行、第 741 行
- design/01：§3.6（约 480–491）、§7.2（约 894–908）、第 115/140/189/1436–1439 行、A82/A83/A101（约 1351–1353）、H11/H12（约 1408–1409）、A125（约 1280）
- `tools/relay-light/skill/SKILL.md`（现行术语：stage-lead、watcher、single-task 节）；两个 adapter 里所有 `watch`/`wait`/`tick`/`接收者` 段（「watch 未实现」措辞实现后都要改写）
- `relay_log.py`（子命令注册、`status --json`、账本读取、终态事件）、`test_relay_log.py`（现有打桩写法）
- 先例：`workspace/RLT_29/`（single-task 七件套、task_plan 写法、signal 文件）

## 产出（`docs/modules/relay-light/workspace/RLT_18/`）
`brief.md`（Issue #65、single-task 模式、前置豁免三条影响）/ `task_plan.md` / `progress.md`（空骨架：「施工里程碑」「证据账本」两节，只由 batch coder 追加）/ `findings.md`（首条登记前置豁免三条影响）/ `lesson_candidates.md` / `review.md`（heavy 五路登记 + E2 + 人类签名区占位：H11、H12、需求境证据、verify、最终验收）。**不写 `execution_strategy.md`**（orchestrator 已建）。

## task_plan 要求
1. **最多 3 批**，每批一个 coder 回合可完成并自证，批间依赖显式。建议：
   - batch 1 = watch 核心 + A101 + A82：`watch --plan <dir> --notify <agent>`、读 `status --json` 取在场 agent、herdr 调用走可注入适配层、每 agent 一线程 `agent wait`、短 ASCII 单行 prompt、不立即重挂改 30 秒 `agent get`、终态退出 / working 重挂、`(agent,状态)` 去重；静态检查无写账调用。
   - batch 2 = A83 + adapter：20 分钟 tick、阶段级（本阶段末节点 `node_close`）/ 编排级（末阶段 `stage_close`）两层退出；两个 adapter 等待段改写（watch 默认、无 watch 回退前台 `wait --timeout 1200000`、节拍归属写明），机械 grep 可核。
   - batch 3 = 实测批 H11/H12（见 README 特别授权）：Claude 监工、Codex 监工**分别**忙时推送；杀 watch 后兜底展示。只取证不判。
2. 每批：`承接 HC / 目标 / 文件与符号 / 用例清单（逐条映射 oracle「怎么证明」要素）/ RED 先行 / 完成判据（机械命令与期望）/ 回归命令 / 证据落点 / signal 文件名`。
3. design 歧义（watch 如何得知「本阶段末节点」、阶段级/编排级怎么区分、`--notify` 解析、线程收敛）给出具体解读并标「待 plan-review 确认」，不改 design。
4. 每批共通约束：只改允许路径；`git diff origin/master --name-only` 只含允许路径；无 `__pycache__` 新增；`docs/modules/relay-light/relay/**` 不变；coder 只在本批完成时向 progress 追加一条。
5. 用 single-task 词汇（plan / batch / workflow-final / e2），**不用 W/C/R/X/F**。

## 硬约束
不改代码与 adapter。不 push。

## 完成
只 add 本卡工作区上述文件，`git commit -m "docs(relay-light): RLT_18 plan workspace and batched task_plan"`；然后写 `DONE.builder.md`（单行 schema，phase=plan agent=builder#1 batch=na path=na review_round=1 remediation_count=0 verdict=READY）并另起提交 `docs(relay-light): RLT_18 builder signal`。停止。

## 整改（orchestrator 说「按 review.plan.md 整改 k」）
逐条处理 P1（P2 酌情），task_plan 顶部加修订日志行，提交后写 `DONE.builder.plan-remediation-<k>.md`（remediation_count=k），停止。
