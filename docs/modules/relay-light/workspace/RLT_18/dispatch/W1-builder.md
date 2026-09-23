# W1 · builder — 建 workspace 七件套 + 分批可执行 task_plan

先读同目录 `README.md`，再读本文件。**只做 W1，做完即停。**

工作目录：`/home/nash/work/dh-relay/.dh-worktrees/RLT_18`（分支 `wt/RLT_18`）。

## 必读来源（逐字核，不凭印象转述）

- DevPlan「#### RLT_18」整段（目标 / 非目标 / 验收口径 / 变更范围 / 允许路径 / 档位 / 实施提示）与任务表第 137 行、第 741 行
- design/01：§3.6（约 480–491）；§7.2（约 894–908）；第 115、140、189、1436–1439 行；§11.1 `HC-RL-A82`/`A83`/`A101`（约 1351–1353）；人判 `H11`/`H12`（约 1408–1409）；`A125`（约 1280）
- 两个 adapter 现状：`tools/relay-light/skill/references/adapter-claude-code.md`、`adapter-codex.md`（grep `watch`、`wait`、`tick`、`接收者`——「watch 未实现」措辞在实现后都要改写）
- 现状实现：`tools/relay-light/relay_log.py`（子命令注册、`status --json` 产出、账本读取、终态事件判断）、`test_relay_log.py`（现有打桩/子进程用例写法）
- 先例格式：`workspace/RLT_24/` 的 brief / task_plan / review.md（标准档 normal 卡；本卡是 heavy，review.md 登记五路）

## 产出（全部落 `docs/modules/relay-light/workspace/RLT_18/`）

七件套：`brief.md`（写明 Issue #65、前置豁免及三条已知影响）/ `task_plan.md` / `progress.md` / `findings.md` / `lesson_candidates.md` / `review.md`（heavy 五路登记：code-round1、code-round2、requirement、consistency、lesson + 人类签名区占位含 H11、H12、verify）/ `execution_strategy.md`。

**`task_plan.md` 是核心**：

1. **分批，每批一个 coder 回合可做完并自证**，批间依赖显式写明。建议切法（可改，写理由）：
   - C1 = watch 骨架 + A101：`watch --plan <dir> --notify <agent>` 子命令、读 `status --json` 取在场 agent、herdr 调用走可注入的适配层（便于打桩）、静态检查用例证明 watch 路径无写账调用。
   - C2 = A82：每 agent 一线程挂 `herdr agent wait`；返回即 prompt `"[relay-light] <agent> -> <state>"`（短 ASCII 单行）；不立即重挂、改 30 秒 `agent get` 轮询；(a) 账本出该 agent 终态 → 停盯退出线程；(b) 回 `working` → 重挂；`(agent, 状态)` 转换去重。打桩断言无立即重挂、两条退出路径、去重。
   - C3 = A83：20 分钟 tick；阶段级 watch 在本阶段末节点 `node_close` 后退出、编排级 watch 在末阶段 `stage_close` 后退出（两层退出条件如何区分要写清参数/判据）；打桩时钟。
   - C4 = adapter：两个 adapter 改写等待段（watch 推送为默认、无 watch 回退前台 `wait --timeout 1200000`、20 分钟节拍归属写明），满足 A83「结构检查适配层写明归属」；去掉「watch 未实现」过时措辞；可机械核验（grep 计数）。
   - C5 = H11/H12 实测取证（见 README「实测特别授权」）：Claude 监工、Codex 监工各一次忙时推送；杀 watch 后兜底展示。只展示证据，人判留给用户。
2. 每批写清：`批号 / 承接 HC / 目标 / 改的文件与符号 / 测试用例清单（逐条用例名与断言要点，逐项映射 oracle「怎么证明」列）/ RED 证据要求 / 完成判据（可机械核验命令与期望）/ 回归命令 / 证据落点`。
3. 逐条核 oracle 要素不漏；写明哪些 design 语句有歧义（如 watch 如何知道「本阶段末节点」、`--notify` 名解析、线程与退出的收敛），给出 task_plan 的具体解读并标为「待 plan-review 确认」；**不改 design**。
4. 「每批共通约束」：只改允许路径；每批跑 README 两条回归命令并登记退出码；`git diff origin/master --name-only` 只含允许路径；无 `__pycache__` 新增；不写 `docs/modules/relay-light/relay/**`；只 add 点名文件；coder 四行小结。
5. 停止边界（DevPlan 非目标：watch 不写账、不做驱动器、不秒级监控）；R/F 阶段与用户级副本同步由编排负责。

`progress.md` 建「日志」「证据账本」「信号」三节；`findings.md` 首条登记前置豁免三条影响；`lesson_candidates.md` 无则写「本节点无」。

## 硬约束
本节点**不改** `relay_log.py` / `test_relay_log.py` / adapter，不施工。不 push。

## 完成
只 add 本卡工作区七件套 + `dispatch/`，`git commit -m "docs(relay-light): RLT_18 W1 workspace and batched task_plan"`；再在 `progress.md` 信号节追加：
```
DONE task=RLT_18 role=builder node=W1 status=OK ts=<ISO8601>
  summary: 七件套与分批 task_plan 已落盘，共 N 批
  artifacts: brief.md, task_plan.md, progress.md, findings.md, lesson_candidates.md, review.md, execution_strategy.md
```
另起提交 `docs(relay-light): RLT_18 W1 signal`。写完即停。

## 修订模式（编排说「按 review.plan.md 修订 r<k>」时）
逐条处理 P1（P2 酌情），task_plan 顶部加修订日志行，提交 `docs(relay-light): RLT_18 task_plan revised per review.plan r<k>`，追加信号 `node=W1 status=OK summary: 修订 r<k>`，停止。
