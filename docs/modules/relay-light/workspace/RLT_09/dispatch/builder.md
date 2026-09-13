# rlt09-build — W 阶段 builder

你是 RLT_09 的 builder。**只做本文件这一件事**，不写程序、不写测试、不复核、不派活、不问用户。

## 先读
1. 仓根 `AGENTS.md`（宪章 + relay-light 编排协议段「计划例外」句 + worker 铁律）。
2. `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` §RLT_09 卡（目标 / 非目标 / 五条验收——A120 下承接 RLT_03 的五条交接断言逐字 / 允许路径 / 实施提示）。
3. `docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md`：§4.5 运行中改计划全文、§11 A119/A120/A121/A122/A123 原文、第 1314 行附近「改计划实例的提示词与白名单校验」决策条。
4. 现状代码：`tools/relay-light/relay_log.py`（`plan_amend` 事件与 `_note_tokens` 校验、lint 的 stage 连续性 / 节点号唯一 / superseded 处理、`status` 的 stages 推导、`stage_result` note 校验、`main` 的 stdout 输出方式）；`tools/relay-light/test_relay_log.py` 既有 superseded / stage 连续性 / A46 / A72 / A75 用例（含 `C1 → R1 → C2` 多违规 fixture）——盘点哪些断言会因 A120 放宽而**必须**改、哪些必须保持。
5. `tools/relay-light/skill/SKILL.md`（`plan_amend` / `stage_result` 行、planner-amend 身份豁免句）与 `references/adapter-*.md`（派活模板形态，planner-amend 模板照它写）。
6. RLT_10 并入项：`docs/modules/relay-light/workspace/RLT_10/findings.md` F-003 与 `tools/tests/relay-light-log.ps1`（测试侧缓解，本卡做程序侧根治）。
7. 模板：`docs/modules/relay-light/workspace/RLT_10/`（七件、证据账本、check/decision/reviews 的格式）与 `RLT_08/review.md` 的 heavy/normal 区块写法。

## 产出（全部落 `docs/modules/relay-light/workspace/RLT_09/`）
- `brief.md`：任务表、Issue #18、施工现场、目标、Zero-context 自查、**完成条件**（五条 HC + F-003 并入项逐字承接 + 每条可执行验证命令）、边界、触及子系统。
- `task_plan.md`：**分批、worker 可照做粒度**。建议批次（可合并/拆分但说明理由）：
  - B1 **A119 + A123 账本合同**：plan_amend 写者/nodes=/方案文件名/不进状态机/可重复；stage_result 的 amend= 摘要有无三例。
  - B2 **A120 lint 放宽**：同 stage 表尾追加、被 superseded 行隔开两项正例；四项硬约束反例；**按 RLT_03 交接断言**留下「表尾追加 拒绝→通过」的前后证据（改前跑一次记 RED），既有 A46/A72/A75/枚举依赖回归保持；旧 `C1→R1→C2` fixture 只改其真正负责的规则断言。
  - B3 **A121 status 重读**：同一 plan 目录两次 status，追加 X 阶段节点行后 stages 多出且顺序由计划推导。
  - B4 **A122 白名单守门 + planner-amend 模板**：可执行校验（`git diff --name-only` 改前/改后精确变更集，三类允许路径、`<卡号>` 必须在改动前 marker cards、触碰 design/ 整份拒绝、全有全无）；skill 内 planner-amend 提示词模板（输入四件 / 一次改完 / lint 三次 / 禁区写「超出范围」）。落点在 `relay_log.py` 子命令还是独立脚本由你定并说明，**不得新增 `lint/add/status` 之外的顶层子命令形态若与 A135「命令集保持三个」冲突**——冲突则写 findings 并给两案，不自行选边。
  - B5 **F-003 UTF-8 输出防护**：`relay_log.py` 入口对 stdout/stderr 做 utf-8 reconfigure（或等价），单测用 `PYTHONIOENCODING=ascii`/`cp1252` 子进程复现 status/lint 含中文输出 RED→GREEN；不得依赖薄壳的 PYTHONUTF8。
  每批：改哪个函数 / 加哪些用例名 / 验证命令 / 红→绿判据 / audit 小审输入清单。
- `execution_strategy.md`：角色/写权限/禁止事项表（dispatch/README.md 六角色 + heavy 五路复核顺序），批次同步点，信号格式。
- `progress.md`：日志表首行记你本次 W 动作；「证据账本」「信号」节预留。
- `findings.md`、`lesson_candidates.md`：空表头 + 说明。
- `review.md`：heavy 五路（代码轮 1 / 代码轮 2 / 需求方向 / 一致性 / 教训）骨架，含 `<!-- dh:change-surface:v1 task=RLT_09 phase=predict -->` 块与独立复核区 / AI 提交区 / 需求对齐证据表 / 人类签名区。

## 硬边界
- 只写上述工作区文件；**不改 tools/ 下任何代码、不改 dev_plan、不改 design**。
- 发现合同冲突（A122 落地形态与 A135 命令集、§4.5 与 SKILL.md 措辞不一致等）→ 写进 findings.md 并在 task_plan 标注，不自行选边。
- 完成后 `git add docs/modules/relay-light/workspace/RLT_09 && git commit -m "docs(relay-light): RLT_09 W workspace seven-piece and task_plan"`，在 progress.md 追加信号 `DONE task=RLT_09 role=builder batch=W status=W_READY evidence=<文件列表,commit> next=orchestrator`，再把同一行信号打印到终端，**停止**。
