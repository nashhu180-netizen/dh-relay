<!-- dh:v1 · task_plan.md -->
# task_plan — RLT_03 relay_plan 解析/lint 与纯追加账本/状态机

## 要读的上下文 (Context Packet) ★前置

> **执行契约头（zero-context）**：你是 RLT_03 施工 worker，只处理 construction Node。第一个 Git 动作是 `git rebase --autostash master`。读完本文件、`brief.md`、DevPlan 卡与下列 Context 后按批 TDD；路线偏离只记 `progress.md`，不回写本文件。不改 DevPlan 状态，不自行进复核/验收/合并/push。

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | `AGENTS.md` | 工作者边界、密钥、worktree 纪律 |
| C-002 | `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` §RLT_03 | 任务终点、非目标、允许路径和 heavy Recipe |
| C-003 | `docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md` §3.1–3.5 | CLI、七字段 JSONL、19 事件、时序/状态机、错误合同 |
| C-004 | 同上 §4.1–4.4 | relay_plan marker、双表、lint、superseded 权威合同 |
| C-005 | 同上 §5.1–5.3、§9.1–9.4 | 阶段实例、节点关闭、trigger/升级链样张 |
| C-006 | 同上 §10.1–10.3 | 可解析的 plan/ledger 样例，用于 test fixture |
| C-007 | 同上 §14 中 RLT_03 验收表 | 每个 HC-RL 反例和断言方式 |
| C-008 | `docs/modules/relay-light/as-built/现役Runner一致性对照.md` | 只借纯追加/枚举命名的边界；不复用 v1 代码 |

## 施工原则

- 公开 CLI 只有 `add` / `status` / `lint`；纯标准库 Python，不增依赖。
- 解析器逐行扫描与 `split('|')`；不引入 Markdown parser。
- 账本仅 `open(path, 'a', encoding='utf-8', newline='')` 追加一行 JSON + `\n`；不得锁、rewrite、replace、tempfile。
- 先红后绿。每批结束必须更新 `progress.md`，用 `READY_FOR_REVIEW batch=<n>` 停下；等主控派 Opus 小审并回送结论后再继续。
- 生产代码建议内部分层：`RelayError(exit_code, code, message)`；`Plan/NodeSpec/AgentSpec`；`parse_plan()`/`lint_plan()`；`read_ledger()`/`validate_event()`/`append_event()`；`main(argv)`。名称可小幅调整，不得改外部合同。

## 施工步骤 (Steps)

### 批 1 — plan parser + structural lint

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 1 | **Create Test** `tools/relay-light/test_relay_log.py` | 建 `unittest.TestCase` + `TemporaryDirectory` fixture，写最小合法 marker/节点表/agent 表样本。覆盖 HC-RL-A24/A18/A130/A46/A47/A48/A72/A75/A128/A129/A104/A109/A87/A126/A35/A71；每个拒绝例断言验收 ID 出现在错误中。 | `python3 -m unittest tools/relay-light/test_relay_log.py -v` → 因生产模块/行为缺失而断言红，把失败摘要写 E-001 |
| 2 | **Create** `tools/relay-light/relay_log.py` | 实现 marker 字段、decision_mode 默认，两张固定表逐行解析，以 dataclass/等价结构保留物理顺序和 superseded 原行；lint 依次查列数/竖线效果、节点/引用/闭环、stage_id/分组/同卡串行、agent 唯一/trigger/close/空节点和禁用类型。`depends_on` 空值在解析后解为前一个非 superseded 节点的依赖。 | 同一 unittest 命令 → 批 1 绿；错误格式 `error: <HC-ID> <message>` |
| 3 | **Record** workspace | 在 `progress.md` 登红/绿命令、测试数、diff 路径；`git diff --check`；停在 `READY_FOR_REVIEW batch=1`。 | 仅允许三个 task path 有 diff；Opus 批 1 复核前不进批 2 |

### 批 2 — JSONL append + schema/CLI/exit contract

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 4 | **Modify Test** `test_relay_log.py` | 加 HC-RL-A37/A38/A39/A40/A2/A41/A42/A5/A45/A84/A55/A51/A63/A56。对 20 次 add 保存每次前缀 bytes 并断言下次仅增尾；目录集合前后相等；捕获 stdout/stderr/exit code。 | 定向新 test 先红，写 E-00x |
| 5 | **Modify** `relay_log.py` | 实现固定七键且键集合精确的 JSONL 读写，19 事件大小写敏感白名单，seq=有效旧账本最后 seq+1；空账本只允许 plan_loaded 首写。错误统一只写 stderr，计划错=3、参数/时序=2、账本读写=4。 | 批 2 测试绿；`rg -n "lower|casefold|flock|lock|tempfile|replace" tools/relay-light/relay_log.py` 不得出现违约用法 |
| 6 | **Record** workspace | 记录红/绿、20 次追加的可复算摘要和目录无临时文件证据；停在 `READY_FOR_REVIEW batch=2`。 | `git diff --check` + 全部定向 unittest 绿 |

### 批 3 — attempt + agent/event state machine

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 7 | **Modify Test** `test_relay_log.py` | 加 HC-RL-A50/A49/A58/A59/A60/A68/A69/A70/A77/A78/A17/A74；以表驱动方式覆盖 `(node,name)` attempt、四类豁免、终态封口、monitor_restart、decider/strategist 链、trigger 现场、依赖和 close 双条件。 | 新 test 先红；失败必须是行为断言，不是语法/导入错 |
| 8 | **Modify** `relay_log.py` | 读取已有事件为 `(node,agent-name)` 派生 attempt 最大值和 agent 最新事件；仅 `agent_lost/cancelled/stage failed` 允许同节点重拉的 +1。实现 node_start、agent_launch、trigger、agent 转移、升级链归属和 `node_close = 所有 agent 终态 AND close 指定 agent done`。 | 批 3 定向与全量 unittest 绿 |
| 9 | **Record** workspace | 记录红/绿和关键状态序列；停在 `READY_FOR_REVIEW batch=3`。 | Opus 批 3 复核前不进批 4 |

### 批 4 — matrix closure + construction handoff

> RLT-B-04 生效后的本批窄返工：把生产错误编号与测试断言 `A64/A86/A88/A90` 迁移为 `A128/A129/A126/A130`；空账本 pending 注释与对应测试只保留 `A128/A84`，不再把 A73 当作本卡 closeout；不得实现 RLT_05 完整 status、RLT_07 模板或 RLT_09 运行中改计划。

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 10 | **Modify Test** `test_relay_log.py` | 逐项用 test 名/子测试映射 brief 16 组条件与 RLT_03 全部 HC-ID；补关联边界：superseded 同时影响 lint/status/depends_on，空账本与坏账本分流，非 plan_loaded 首行不落盘。 | `python3 -m unittest tools/relay-light/test_relay_log.py -v` 全绿；列出 test count |
| 11 | **Modify** `relay_log.py` | 只做矩阵补洞与可读性收敛，不开 RLT_05 范围。保持 CLI 三子命令和纯追加不变。 | `python3 tools/relay-light/relay_log.py --help` 只显示 add/status/lint；全量定向测试绿 |
| 12 | **Modify** `progress.md` / `findings.md` | 记完整命令、退出码、关键输出、已知边界；不改 review.md。发出 `CONSTRUCTION_DONE` 后停止，等 node_closed；不 commit、不自审。 | `git status --short`、`git diff --check`、`git diff --name-only master...HEAD` + working diff 均仅在允许路径 |

## 关键决策

- Worktree：是，`/home/nash/work/dh-relay/.dh-worktrees/RLT_03`，分支 `wt/RLT_03`。
- 施工：Herdr pane 内 OMP `opencode-go/glm-5.3-flash`。
- Review：Herdr pane 内 fresh 独立 reviewer；批次小审形成代码轮 1，收口再以 fresh 实例做代码轮 2 并选变异点；需求/一致性/教训路径仍独立登记。
- 本次授权不含 commit、merge、verify、push、deploy 或下一卡。
