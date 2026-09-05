<!-- dh:v1 -->
# DHR_72 heavy 收口 Review Batch brief（2026-09-05）

## 共同合同

- 精确现场：`D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_72`，候选=`eb89e61`，base=`master@084a00d`。
- 先读仓根 `AGENTS.md`，再读本卡 `brief.md`、`task_plan.md`、`progress.md`、`findings.md`、`review.md`；只以 `git diff master...eb89e61` 和已落账证据下结论。
- 只读：不得修改任何文件、不得提交、不得派活、不得问用户。每条 finding 必须给 `P0/P1/P2 + file:line + 失败场景 + 最小建议`；没有问题明确写 `PASS`。
- 不得把 fake/旧实录/DHR75/DHR76/DHR35 证据互相替代；真实 F 只认 `windows-checkpoint-20260905T-run6` 的脱敏账本。
- 当前实时 `dh dh-relay`：master 有 DHR75 R18/R31 与 DHR74 R31；任务分支另有 pending 卡 R30 归属。只判 DHR72 是否引入/漏报，不越权替别卡清零。

## code_round_2

- fresh-context 增量轮 2；未参与施工，不继承轮 1 会话，只可读仓内已落账的轮 1 记录。
- 核全程 production diff、rebase 后 DHR75/76 集成、专属/冻结测试、真实 runner、脱敏器与 run1~run6 证据边界。
- 必须独立选择一个 `relay-core/runtime/workflow-driver.mjs` 生产变异点，给出原值→变异值、语义类别、指定测试名与精确命令；该变异应以断言失败变红，不能靠语法错误/挂死。

## requirement_direction

- 对照 brief 完成条件 1~7、DevPlan DHR72 A~H，逐条判断覆盖态；重点核真实 F 是否确有 checkpoint、零 Result、DSH-off、脱敏与 DHR35 隔离。
- 核本轮 runner 修复是否仍只运行受控 5 秒 Node 命令，是否越过禁止配置/凭据/Result 的边界；核当前 dh failure 的真实归属是否被如实表达。

## lessons

- 读取 `docs/modules/dh-relay/knowledge/教训库-候选.md` 与本卡 `lesson_candidates.md`，按本批触发场景检查：PowerShell native exit、Herdr prompt 真提交、Receipt 脱敏、Windows EPERM、跨卡证据隔离。
- 输出命中条目、是否重蹈、以及 L-7201 是否足够；新候选仅在有可复用且非一次性事实时提出。

## consistency_review

- 横向比对并列清单，至少覆盖：① Herdr prompt/Enter 回退；② DHR35 与 DHR72 真实 runner；③ Receipt/Attempt 脱敏器；④ checkpoint→running 状态折叠；⑤ `package.json` DHR75/76/72 测试登记。
- 每维写找到几处同类；每个差异裁决为「有意差异」或「遗漏」并说明理由。只写“看过没问题”不算完成。
