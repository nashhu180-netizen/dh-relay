# rlt10-build — W 阶段 builder

你是 RLT_10 的 builder。**只做本文件这一件事**，不写测试、不写薄壳、不复核、不派活、不问用户。

## 先读
1. 仓根 `AGENTS.md`（宪章 + relay-light 编排协议段 + worker 铁律）。
2. `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` §RLT_10 卡与 §3.1 交付物矩阵 `test-entry` 行。
3. `docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md` §3.5 账本合同（lint 规则编号映射表）与 §11 中 HC-RL-A80 / A94 / A11 / A15 / A16 原文。
4. 现状代码：`tools/relay-light/relay_log.py`（lint 子命令、退出码、stderr 行格式、`--json`、import 清单）、`tools/relay-light/test_relay_log.py`（3900 行，已有大量 lint 用例——先盘点哪些 HC 已被覆盖、哪些编号尚无反例）、`tools/relay-light/test_install_skill.py`、`tools/tests/run-relay-tests.ps1`（`$suites` 数组 + `SUITE SKIP` 识别）与任一现有 `tools/tests/relay-*.ps1` 的输出/退出码风格。
5. 模板：`docs/modules/relay-light/workspace/RLT_08/`（brief / task_plan / execution_strategy / progress / findings / lesson_candidates / review 七件的格式，以及 progress 的「证据账本」节写法），照格式写 RLT_10 的。

## 产出（全部落 `docs/modules/relay-light/workspace/RLT_10/`）
- `brief.md`：任务表、Issue #16、施工现场、目标、Zero-context 自查、**完成条件**（四条 HC 逐字承接 + 每条给出可执行验证命令）、边界、触及子系统。
- `task_plan.md`：**分批、worker 可照做粒度**（每批：改哪个文件 / 加哪些用例或函数 / 验证命令 / 红→绿判据 / audit 小审输入清单）。建议批次：
  - B1 **lint 合同与规则全覆盖**（A80 + A94）：在 `test_relay_log.py` 补齐三种退出码各一例、stderr 行格式 `lint: <规则编号> <message>` 断言、`--json` 逐字段断言；从 §3.5 映射表机械枚举全部规则编号，逐规则构造反例，断言报出编号集合 ⊆ §11 验收 ID 集合。先做差集盘点（映射表编号 − 现有用例已触发编号），只补缺的。
  - B2 **标准库静态检查**（A16）：在 `test_relay_log.py` 加一条静态用例，解析 `relay_log.py` 的 import（`ast`），断言顶层模块全在 `sys.stdlib_module_names`。
  - B3 **薄壳与 suite 登记**（A11）：新建 `tools/tests/relay-light-log.ps1`——只 shell out 到 `python`/`python3`，依次跑 `test_relay_log.py` 与 `test_install_skill.py` 两份 unittest（同一文件，不复制），原样透传输出与退出码；缺 python 只输出 `SUITE SKIP <原因>` 且 exit 0；在 `run-relay-tests.ps1` 的 `$suites` 数组末尾登记一项，**不改循环架构**。验证：`pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` 全量绿、展示退出码与套件名；另单独跑薄壳展示透传。
  批次可合并但必须说明理由。
- `execution_strategy.md`：角色/写权限/禁止事项表（用 dispatch/README.md 的六角色），批次同步点，信号格式。
- `progress.md`：日志表首行记你本次 W 动作；「证据账本」与「信号」节预留。
- `findings.md`、`lesson_candidates.md`：空表头 + 说明。
- `review.md`：normal 三路（代码轮 1 / 需求方向 / 教训）骨架，含 `<!-- dh:change-surface:v1 task=RLT_10 phase=predict -->` 块（照 RLT_08 review.md 的写法，含独立复核区 / AI 提交区 / 需求对齐证据表 / 人类签名区）。

## 硬边界
- 只写上述工作区文件；**不改 tools/ 下任何代码、不改 dev_plan、不改 design**。
- 发现合同冲突（如 §3.5 映射表某编号在 §11 找不到、或 `relay_log.py` 某规则根本触发不了）→ 写进 findings.md 并在 task_plan 标注，不自行选边、不改程序。
- 完成后 `git add docs/modules/relay-light/workspace/RLT_10 && git commit -m "docs(relay-light): RLT_10 W workspace seven-piece and task_plan"`，然后在 progress.md 追加信号 `DONE task=RLT_10 role=builder batch=W status=W_READY evidence=<文件列表,commit> next=orchestrator`，再把同一行信号打印到终端，**停止**。
