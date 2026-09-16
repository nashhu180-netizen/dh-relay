# W1 · builder — 建事件工作区 + 分批可执行 task_plan

先读同目录 `README.md`（身份、允许路径、停止边界、铁律、完成信号），再读本文件。**只做 W1，做完即停。**

## 必读输入

1. `gh issue view 37`（目标 / 非目标 / 验收口径 / 流程）
2. `docs/modules/relay-light/workspace/RLT_11/findings.md`（F-001、F-002 全行 + 文末裁决落记）
3. DevPlan「RLT-A-11 调整（待开工）」条（约第 49 行）、「#### RLT_23」「#### RLT_24」两段（约第 434–462 行）
4. design/01：文件头第 1–35 行（planning-event 声明与修订行格式）、§11 开头总账段（约 1161–1168 行）、验收表末尾 A144–A150 行格式、§11.2 的 `HC-RL-H10` 行、§12 全节（约 1319–1330 行）、§15 表「验收 ID 稳定性」「验收二分与原子化」行
5. 先例：`design/drafts/A09-复核触发信号与返工生命周期修订候选.md`（结构）、`design/evidence/10-交叉审核记录-RLT-A09-复核触发信号.md`（审核记录结构与 `dh:planning-evidence` 锚点写法）

## 你的产出（全部落在 `docs/modules/relay-light/design/drafts/A11/`）

1. **`brief.md`** — 本事件业务合同：目标三条、非目标、验收口径（Issue #37 原文逐条）、允许路径、依赖（落盘前 RLT_23/RLT_24 不开工）、风险与停止边界。**逐条回链来源**（文件:行号 或 小节号），不凭印象转述。
2. **`task_plan.md`** — **分批次、每批可独立执行、可机械验证**的施工计划。每批写清：`批号 / 目标 / 要改的文件（必须在允许路径内）/ 具体动作 / 完成判据（可机械核验的命令或 grep）/ 证据落点 / 该批的审核方式`。流程必须符合先例配方：

   **候选稿 → fresh 审核（三段格式）→ 整改 → 定向复审 → 用户裁决开放项 → 晋级落盘 → 开发后复核**

   参考切法（可以提更好的，但须写理由）：
   - **C1 候选稿**：在 `drafts/A11/A11-候选.md` 写出全部拟改动的**逐字文本**，不碰正式文件：
     - ① §12 表尾兜底类行（措辞 + 对照清单：真计划 `relay/rlt12-win-01/` 与 `workspace/RLT_21/`、`workspace/RLT_12/` 实际 `git ls-files` 产物逐类映射到 §12 哪一行，证明无遗漏类别）
     - ② 账本 / workspace 职责分层口径（落点选择 + 理由；逐字正文；回链 `HC-RL-H10`；写清 `commit=` 为顺手旁注、squash 后失效不构成契约破坏；是否需要同步改 H10 行本身须作为**开放项**列出，默认不改 H10 命题列）
     - ③ 续发 `HC-RL-A151~` 的验收条目逐字文本（命题列 + 怎么验列），分别承接 RLT_23 四条（F-003/F-005/F-006/F-007）与 RLT_24（事件 schema 合法性、`lint` 对 `outcome=failed` 分校验、§12「删失败怎么办」列取证路径可执行、历史账本向后兼容），原子化、可机械核验；条数由你按原子化原则定并说明
     - ④ §11 总账段、§15「验收 ID 稳定性」行、文件头 planning-event 声明 + 修订行、DevPlan RLT_23/RLT_24「验收口径」行与「RLT-A-11 调整」条的拟改文本
     - ⑤ 开放项清单（需要用户点选的产品决定，每项给候选 + 本稿倾向 + 理由）
   - **C1-audit**：codex fresh 审核候选稿，三段格式写 `drafts/A11/review.fresh-01.md`
   - **C1b 整改**（若 REVISE）：同一 coder 按 P1/P2 整改候选稿，写整改对照
   - **RV 定向复审**：只复核上轮 P1/P2 是否闭合，写 `drafts/A11/review.targeted-02.md`
   - **用户裁决**：由编排收集，落 `drafts/A11/decisions.md`（编排写）
   - **C2 晋级**：按裁决把候选稿逐字搬入 design/01、新建 `design/evidence/11-交叉审核记录-RLT-A11-<短名>.md`、改 DevPlan 限定行；每处晋级与候选稿逐字对照
   - **C2-audit**：批检查（晋级文本 = 候选稿 + 裁决，无夹带）
   - **R 开发后复核**：一致性 + 机械核验（验收 ID 集合相对 master 只增不改、A151~ 包内唯一、DevPlan 引用对得上、planning-event 声明可解析、`git diff --stat` 只命中允许路径）

   每批的「完成判据」必须是命令或逐字比对，不能是「写清楚」「核对完成」。
3. **`progress.md`** — 建文件，首行 `<!-- dh:v1 -->`，追加你的 W1 完成信号。
4. **`findings.md`** — 建文件，范围外发现写这里（没有写「本节点无」）。例如：RLT_24 卡「变更范围」含设计 §12 该列表述但允许路径不含 design——这类只登记，不处理。

## 硬约束

- 本节点**只写** `drafts/A11/` 下这四份文件，**不提前执行** C 批动作（不写候选稿、不碰 design/01、DevPlan）。
- 不 commit、不 push。
- 当前最大验收 ID 以你**实测**为准（预期 `HC-RL-A150`），写进 brief。

## 完成

`progress.md` 追加：
```
DONE task=RLT-A-11 role=builder node=W1 status=OK ts=<ISO8601>
  summary: brief 与分批 task_plan 已落盘，共 N 批
  artifacts: brief.md, task_plan.md, progress.md, findings.md
```
写完即停。
