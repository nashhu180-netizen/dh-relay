# W1 · builder — 建 workspace 七件套 + 分批可执行 task_plan

先读同目录 `README.md`，再读本文件。**只做 W1，做完即停。**

工作目录：`/home/nash/work/dh-relay/.dh-worktrees/RLT_24`（分支 `wt/RLT_24`）。第一个 Git 动作 `git rebase --autostash master`。

## 必读来源（逐字核，不凭印象转述）

- DevPlan「#### RLT_24」整段（目标 / 问题陈述 / 非目标 / 验收口径 / 变更范围 / 允许路径 / 档位 / 实施提示）
- design/01：§3.2 第 221 行；§3.4 第 242–330 行（控制事件表 `resource_close` 行 257、wire format 301–328）；§11.1 `HC-RL-A2`（1210）、`HC-RL-A85`、`HC-RL-A155`～`A158`（1335–1338）；§12 第 1360–1370 行
- `workspace/RLT_11/findings.md` F-004
- 现状实现：`tools/relay-light/relay_log.py`（事件词表、控制事件写入者校验、`add` / `lint` / `status` 派生路径）、`tools/relay-light/test_relay_log.py`（现有 19 词断言、A85 写入者枚举、控制事件用例、rlt12-win-01 回放类用例——grep `19`、`CONTROL`、`rlt12`、`A85`、`A2`）
- 历史账本：`docs/modules/relay-light/relay/rlt12-win-01/relay_log.jsonl`（71 行）与 `relay_plan.md`
- 先例格式：`workspace/RLT_10/`、`workspace/RLT_22/` 的 brief / task_plan（标准档卡）

## 产出（全部落 `docs/modules/relay-light/workspace/RLT_24/`）

七件套：`brief.md` / `task_plan.md` / `progress.md` / `findings.md` / `lesson_candidates.md` / `review.md`（含复核路径登记表：code-round1、requirement、lesson 三行 + 人类签名区占位）/ `execution_strategy.md`。

**`task_plan.md` 是核心**，要求：

1. **分批次、每批一个 coder 回合可做完并自证**，批间依赖显式写明。建议 3~4 批，例如：
   - C1 = A155 + A2：词表 19→20、`resource_close` 控制事件写入者/节点合法性、§3.4 wire format 解析器（编码、闭集、重复/未知键），add 与 lint 共用同一校验函数，不进 agent 状态机、不改派生状态；对应 RED→GREEN 单测。
   - C2 = A156：`reason` 条件校验（failed 必填非空非纯空白 / ok 必须无键），add 与 lint 各测，合法 failed 按 seq/object_id 可检索，不新增 `status --json` 字段。
   - C3 = A158：rlt12-win-01 71 行原样回放（字节不变、逐条接受、lint 0、与 master 旧实现 `status` 稳定字段一致）+ 含合法关闭行 fixture 派生不变。
   - C4 = A157：§12 两类终端空间各一例可控关闭失败取证（实跑/打桩明确标注），证据落 `workspace/RLT_24/evidence/`，progress 登记；不冒称已人工处置。
   你可提出更优切法并写理由。
2. 每批写清：`批号 / 承接 HC / 目标 / 要改的文件与函数/类（精确到符号名或行号锚点）/ 测试用例清单（逐条列用例名与断言要点，逐项映射 oracle「怎么证明」列每个要素）/ RED 证据要求（先写测试跑出失败再实现）/ 完成判据（可机械核验的命令与期望：单测名过滤跑、grep 计数、字节哈希比对）/ 回归命令 / 预期证据落点`。
3. 逐条核 oracle 要素不漏：A155「add 与直接植入行后的 lint 分别覆盖」「三类对象 ok 正例」「缺基础键/空标识/非法类型/非法 outcome/非法编码/重复键/未知键/错误 writer/错误 node 各自退出 2」「add 拒绝前后账本字节一致」「终态节点后与重复尝试仍接受」「插入前后状态派生一致」；A156 五个反例 × add/lint、failed 正例可检索；A158 四项；A157 证据四要素。另写明 A2 既有 19 词断言如何改为 20 词、A85 写入者枚举用例如何处理（设计第 320 行口径）。
4. 写明「每批共通约束」：只改允许路径；每批跑 README 两条回归命令并登记退出码；`git diff master --name-only` 只含允许路径；`git status --porcelain` 无 `__pycache__` 新增；不改 `docs/modules/relay-light/relay/**`；只 add 点名文件提交；coder 四行小结；findings/lesson 由 coder 写。
5. 写明停止边界（DevPlan 非目标：不改 herdr、不追溯补记历史账本、不扩资源类型、不改设计正文；skill/as-built 同步只记 findings 转派），以及 R/F 阶段由编排负责。

`progress.md` 建「日志」「证据账本」「信号」三节；`findings.md` / `lesson_candidates.md` 建文件（本节点无则写「本节点无」）。

## 硬约束

- 本节点**不改** `relay_log.py` / `test_relay_log.py`，不提前施工。不 push。

## 完成

只 add 本卡工作区七件套 + `dispatch/`（已由编排建，一并 add），`git commit -m "docs(relay-light): RLT_24 W1 workspace and batched task_plan"`，然后 `progress.md` 信号节追加：
```
DONE task=RLT_24 role=builder node=W1 status=OK ts=<ISO8601>
  summary: 七件套与分批 task_plan 已落盘，共 N 批
  artifacts: brief.md, task_plan.md, progress.md, findings.md, lesson_candidates.md, review.md, execution_strategy.md
```
并另起提交 `docs(relay-light): RLT_24 W1 signal`。写完即停。

## 修订模式（编排说「按 review.plan.md 修订 r<k>」时）
逐条处理 `review.plan.md` 的 P1（P2 酌情），在 task_plan 顶部加修订日志行（日期 / 依据 P 项 / 改动摘要），提交 `docs(relay-light): RLT_24 task_plan revised per review.plan r<k>`，追加信号 `node=W1 status=OK summary: 修订 r<k>`，停止。
