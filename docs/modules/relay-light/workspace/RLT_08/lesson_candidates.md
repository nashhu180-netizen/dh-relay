<!-- dh:v1 -->
# lesson_candidates — RLT_08

> 仅在施工/复核出现有证据且可复用的现场时追加；W 阶段不预判教训结论。

## 候选

| ID | 触发现场 | 可复用规则候选 | 状态 |
|---|---|---|---|
| LC-1 | B1 红命令在 Linux worktree 首次执行时 `rg: 未找到命令`（环境错误不算 RED） | oracle 机检脚本假定 `rg` 在 PATH；worker 环境缺失时先免 root 补装（`apt download ripgrep && dpkg -x` → `~/.local/bin`），再重跑取红 | 候选 |
| LC-2 | B2 落笔时险些给 `RELAY_RECEIPT`/`node_closed` 套反引号 | oracle `rg -F` 判定句按裸文本逐字节匹配（如「有 RELAY_RECEIPT 即冻结 Runner 流水」）；写 AGENTS 条文时凡被 `-F` 锁定的句子不得加反引号/改标点，先复制 oracle 原文再排版 | 候选 |
| LC-3 | B3 RED 复跑时 `rg -c` 零命中输出为空串而非 `0`，`test "" -eq 1` 报「需要整数表达式」 | 写 oracle 计数断言时 `rg -c` 空结果需 `${var:-0}` 兜底或直接用 rc 判；本批 oracle 写法仍正确判红（空串≠1） | 候选 |
| LC-4 | 教训轮 P2-1：同一 worker 的多份派活合同互相漂移——`task_plan.md` 让 B3 直接 `CONSTRUCTION_DONE` 而 `dispatch/exec.md` 要求 audit PASS 后由编排再派令（review.plan.md 首轮 P1-1）；`exec.md` 第 1 步 `git status` 缺宪章#7 与 task_plan 执行契约头要求的 rebase 第一动作（次轮 P1-4） | 给同一 worker 同时下发专门 brief 与 task_plan 时，派工前审必须加一项「同一动作在各合同文件中的规定是否逐条一致」，不能只审单文件内部自洽（候选-42 家族新触发形：合同对合同）。证据：`reviews/lesson-rlt08-review.md` P2-1、`review.plan.md` P1-1/P1-4 | 候选 |
| LC-5 | 教训轮 P2-2：首轮全面审过不等于合同冲突穷尽——P1-4 首轮未被发现，自 `3620ee0` 起就存在于 exec.md，第二轮「全面复看新增发现」才逮出（review.plan.md L96-101） | 派活合同类缺陷一单多点、分散在不同文件；整改轮除回归旧项外须保留一步全量复看，否则「首轮五项全 CLOSED」会造成已穷尽的错觉。证据：`reviews/lesson-rlt08-review.md` P2-2、`review.plan.md` L96-101 | 候选 |
| LC-6 | 教训轮 P2-3：check.C1 初判 FAIL——exec 首个 `READY_FOR_REVIEW` 用 `red:…/green:…/baseline:…` 行内描述符，当时 progress 无 E-ID 账本，信号引用悬空；补记账（`cbea9a6`）+ 更正信号后重审 PASS | worker 发完成信号前，先确认 `evidence=` 引用的每个 ID 在证据账本里已存在；「信号引用存在性」是可机检项（候选-4 在信号层的形态）。证据：`reviews/lesson-rlt08-review.md` P2-3、`check.C1.md`、commit `cbea9a6` | 候选 |
