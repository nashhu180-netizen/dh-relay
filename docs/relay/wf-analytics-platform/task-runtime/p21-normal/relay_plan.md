<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-21 session=kpi-agg decision_mode=auto recipe=normal cards=TRT_22,TRT_20 -->
# P21 normal 档两卡接力计划（TRT_22 → TRT_20）

> 落点：本计划、账本与 `config/`（roles.toml + dh-mapping.toml）都在 dh-relay 仓 `docs/relay/wf-analytics-platform/task-runtime/p21-normal/`；施工对象是 wf-analytics-platform 仓（下文 `wf-analytics-platform:` 前缀为该仓相对路径）。所有 relay_log 调用 `--config-dir` 指向本目录 `config/`。
> 卡：[P21 §TRT_22](wf-analytics-platform:poc_core_kpi_web/poc_core_kpi_web_v2/docs/modules/task-runtime/dev_plan/P21-任务运行可靠性收敛-开发方案.md)（normal）与 [P21 §TRT_20](wf-analytics-platform:poc_core_kpi_web/poc_core_kpi_web_v2/docs/modules/task-runtime/dev_plan/P21-任务运行可靠性收敛-开发方案.md)（normal）；同计划 TRT_21 为 heavy，另开 `relay/p21-heavy` 计划，不进本计划。工作区已预建：`workspace/71-TRT_22-cleanup-connection-restore/`、`workspace/69-TRT_20-task-polling-reliability/`（七件套与分批 task_plan 均已有，W 阶段只补齐实施基线与精确路径核对，不重写）。
> 基线：master `39a24a8fc`（relay=ThinkBook=GitLab+MR!93）。worktree：`/home/nash/work/wf-analytics-platform/.dh-worktrees/TRT_22`（分支 `wt/TRT_22`）与 `.dh-worktrees/TRT_20`（`wt/TRT_20`），开工前由主控按 [worker 建树三软链约定](wf-analytics-platform:poc_core_kpi_web/poc_core_kpi_web_v2/README.md) 建好（`.venv`、`frontend/node_modules`、`backend/data/datasets`）。本机 `dh.role=worker`：只在 wt 分支施工、push 到本机 relay 裸仓；MR/合入/deploy/test/verify 由主控与用户另行授权，不进本计划。
> **TRT_20 测试通道（2026-09-21 用户裁决：本机不装 node_modules，直接在 test 环境跑）**：单测与组件测试在 integrator 机跑——coder 每批 `git push origin wt/TRT_20`（本机 relay）后执行 `ssh -n -S none thinkbook 'cmd /c "chcp 65001 >nul & %TEMP%\trt20_test.cmd <相对 frontend 的测试文件…>"'`（脚本副本在本计划目录 `tb_trt20_test.cmd`，它在 integrator 机 `C:\t\TRT_20` 检出 relay 的 wt/TRT_20 并用主仓 node_modules 跑 vitest，末行 `VITEST_EXIT=<code>`），输出原样记入 progress.md；`npm run build`（vue-tsc）同法可跑。编排的建树前置对 TRT_20 树免查 `frontend/node_modules`。T4（真实浏览器演示）改为：F2 后由主控把 wt/TRT_20 与 master 同步进 GitLab `deploy/test`，用户在发布系统构建并重启，再在 test 前端演示，证据回填 69 工作区。
> decision_mode=auto：施工 blocked 时 decider 按合同内裁决直接 resume（越界、改计划、需 test/服务器、需新装包的一律 `escalate` 到 strategist → 用户，不得自决）。TRT_20 B0 的「查询等待预算」与「隐藏页策略」两项 P21 要求开工前冻结：decider 可按正式设计 §STB-A01 现有口径冻结并写入 decision 文件，不得扩展允许路径。

## 节点表

| node | card | stage | type | close | depends_on | note |
|---|---|---|---|---|---|---|
| W1 | TRT_22 | TRT_22:W#1 | build | agent:plan-reviewer | | builder 核对 71 工作区七件套与 task_plan 对 master 39a24a8fc 仍成立（基线 SHA、允许路径、B0 复现命令），只补不改目标；plan-reviewer 按 normal 审 |
| C1 | TRT_22 | TRT_22:C#1 | construction | agent:checker | W1 | task_plan B0+B1：复现 cleanup 调用链、事务归属确认，RED 完整生产调用链失败测试 |
| C2 | TRT_22 | TRT_22:C#2 | construction | agent:checker | C1 | task_plan B2：归池前恢复与恢复失败失效，GREEN + 定向回归；只改 P21 TRT_22 允许路径 |
| R1 | TRT_22 | TRT_22:R#1 | review | agent:scribe | C2 | normal：requirement + lesson 并行；scribe 跑 `dh task-runtime` 体检、B3 回归命令并汇总 review.md |
| X1 | TRT_22 | TRT_22:X#1 | rework | agent:requirement | R1 | 仅当 R1 stage_result 带 rework_required 才进入；coder 新实例修 requirement 打回项（STB-A03 commit 失败场景补真实测试证据），requirement 再审；轮数上限 2 |
| F1 | TRT_22 | TRT_22:F#1 | handoff | agent:scribe | X1 | R1 无返工时 X1 由编排按 outcome 直接跳过（账本不开 X1 节点，F1 视 R1 为前置）；备料：as-built 段落、AI 提交区、交付汇报、STB-A03 证据清单；不 push GitLab、不建 MR、不 verify |
| W2 | TRT_20 | TRT_20:W#1 | build | agent:plan-reviewer | F1 | builder 核对 69 工作区与 task_plan 对基线成立，补齐 B0 冻结项模板（等待预算来源、隐藏页策略）；**把 task_plan 的验证命令改为「远程测试通道」**（见前言「TRT_20 测试通道」），T4 真实浏览器演示改为 test 环境部署后由主控与用户做；plan-reviewer 按 normal 审 |
| C3 | TRT_20 | TRT_20:C#1 | construction | agent:checker | W2 | task_plan B0+B1：冻结交互合同与复现基线；真实查询有界等待与协议分类（含真实 fetch 中止/清理） |
| C4 | TRT_20 | TRT_20:C#2 | construction | agent:checker | C3 | task_plan B2：单飞轮询与状态保留（同页两条 GET 链全部经轮询 composable，审核 P1 项） |
| C5 | TRT_20 | TRT_20:C#3 | construction | agent:checker | C4 | task_plan B3：页面接线 + T3 组件测试（远程通道）；T4 真实浏览器演示不在本节点，留 F2 备料后在 test 环境做 |
| R2 | TRT_20 | TRT_20:R#1 | review | agent:scribe | C5 | normal：requirement + lesson；scribe 跑前端定向测试与 `dh task-runtime` 体检，汇总 review.md |
| X2 | TRT_20 | TRT_20:X#1 | rework | agent:requirement | R2 | 同 X1 语义 |
| F2 | TRT_20 | TRT_20:F#1 | handoff | agent:scribe | X2 | 备料同 F1；另备 deploy/test 同步与发布步骤清单（integrator 机操作 + 用户在发布系统构建/重启）与 T4 浏览器演示清单；另列 test 人验（STB-H 项）步骤清单交主控 |

## agent 表

| agent | node | role | launch | output | trigger | note |
|---|---|---|---|---|---|---|
| builder | W1 | builder | roles.toml:builder | 71-TRT_22 七件套核对 + task_plan 基线段 | | 不改 brief 目标/边界 |
| plan-reviewer | W1 | plan-reviewer | roles.toml:plan-reviewer | 71-TRT_22/review.plan.md | on:review_ready:builder | normal 全量审：允许路径、写入者、节点边界、验收命令 |
| coder | C1 | coder | roles.toml:coder | 复现记录 + RED 测试 + findings/lesson 行 | | RED 先于实现；只 stage 允许路径 |
| checker | C1 | checker | roles.toml:checker | 71-TRT_22/check.C1.md | | 核 B0/B1 偏离、调用链复现真实、RED 真实 |
| scribe | C1 | scribe | roles.toml:scribe | 71-TRT_22/progress.md | on:done:coder | |
| decider | C1 | decider | roles.toml:decider | 71-TRT_22/decision.<d>.md | on:blocked | 合同内小决策；越界写明需改计划并 escalate |
| coder | C2 | coder | roles.toml:coder | 实现 + GREEN + 回归 + findings/lesson 行 | | 按路径 stage 提交到 wt/TRT_22，push origin |
| checker | C2 | checker | roles.toml:checker | 71-TRT_22/check.C2.md | | 核 GREEN 真实、无新红、diff 仅允许路径 |
| scribe | C2 | scribe | roles.toml:scribe | 71-TRT_22/progress.md | on:done:coder | |
| decider | C2 | decider | roles.toml:decider | 71-TRT_22/decision.<d>.md | on:blocked | |
| requirement | R1 | reviewer | roles.toml:reviewer | 71-TRT_22/review.requirement.md | | 只读；对 STB-A03 七种调用链覆盖逐项核 |
| lesson | R1 | reviewer | roles.toml:reviewer | 71-TRT_22/review.lesson.md | | 只读；核教训库重犯与 lesson_candidates |
| scribe | R1 | scribe | roles.toml:scribe | 71-TRT_22/review.md + progress.md | | 全部 reviewer done 后由 monitor 拉起；先体检后汇总 |
| coder | X1 | coder | roles.toml:coder | rework.1.md + 修复代码/测试 + findings 行 | | 新实例，attempt 从 1 起；只改 P21 TRT_22 允许路径 |
| requirement | X1 | reviewer | roles.toml:reviewer | review.rework.1.md | on:review_ready:coder | 只读；只复审被打回项 |
| decider | X1 | decider | roles.toml:decider | 71-TRT_22/decision.<d>.md | on:blocked | |
| scribe | F1 | scribe | roles.toml:scribe | as-built 段落、AI 提交区、交付汇报、证据清单 | | 只备料，不越权限闸 |
| builder | W2 | builder | roles.toml:builder | 69-TRT_20 七件套核对 + task_plan 基线段与 B0 冻结模板 | | 不改 brief 目标/边界 |
| plan-reviewer | W2 | plan-reviewer | roles.toml:plan-reviewer | 69-TRT_20/review.plan.md | on:review_ready:builder | normal 全量审 |
| coder | C3 | coder | roles.toml:coder | B0 冻结记录 + B1 代码/测试 + findings/lesson 行 | | 只改 P21 TRT_20 允许路径（frontend 六文件及其测试） |
| checker | C3 | checker | roles.toml:checker | 69-TRT_20/check.C3.md | | 核冻结项已落、fetch 真实中止、无 POST 自动重试 |
| scribe | C3 | scribe | roles.toml:scribe | 69-TRT_20/progress.md | on:done:coder | |
| decider | C3 | decider | roles.toml:decider | 69-TRT_20/decision.<d>.md | on:blocked | 可按正式设计冻结等待预算/隐藏页策略；不得扩路径 |
| coder | C4 | coder | roles.toml:coder | B2 代码/测试 + findings/lesson 行 | | |
| checker | C4 | checker | roles.toml:checker | 69-TRT_20/check.C4.md | | 核同页 GET 链全部经 composable |
| scribe | C4 | scribe | roles.toml:scribe | 69-TRT_20/progress.md | on:done:coder | |
| decider | C4 | decider | roles.toml:decider | 69-TRT_20/decision.<d>.md | on:blocked | |
| coder | C5 | coder | roles.toml:coder | B3 页面接线 + 组件测试 + findings/lesson 行 | | push origin wt/TRT_20 |
| checker | C5 | checker | roles.toml:checker | 69-TRT_20/check.C5.md | | |
| scribe | C5 | scribe | roles.toml:scribe | 69-TRT_20/progress.md | on:done:coder | |
| decider | C5 | decider | roles.toml:decider | 69-TRT_20/decision.<d>.md | on:blocked | |
| requirement | R2 | reviewer | roles.toml:reviewer | 69-TRT_20/review.requirement.md | | 只读；对 STB-A01 逐项核 |
| lesson | R2 | reviewer | roles.toml:reviewer | 69-TRT_20/review.lesson.md | | 只读 |
| scribe | R2 | scribe | roles.toml:scribe | 69-TRT_20/review.md + progress.md | | 全部 reviewer done 后由 monitor 拉起 |
| coder | X2 | coder | roles.toml:coder | rework.1.md + 修复 + findings 行 | | 新实例 |
| requirement | X2 | reviewer | roles.toml:reviewer | review.rework.1.md | on:review_ready:coder | 只读 |
| decider | X2 | decider | roles.toml:decider | 69-TRT_20/decision.<d>.md | on:blocked | |
| scribe | F2 | scribe | roles.toml:scribe | as-built 段落、AI 提交区、交付汇报、test 人验步骤 | | 只备料 |

## 角色启动参数

- `launch=roles.toml:<role>` 解析为该角色 `roles.toml` 的 `launch`；本机 `zcode` 不可用时 builder/coder/scribe 回退 `codex -m gpt-5.6-terra -c model_reasoning_effort=high -a never`（不加 `--sandbox workspace-write`）。
- Claude 角色 `--dangerously-skip-permissions`；codex 复核只读 `-- --sandbox read-only`。decider 按用户既定口径用 `claude --model fable --effort medium`。

## 公共施工约定

1. 每批开工先核：`git config --local --get-all dh.role`=worker、`git branch --show-current`=wt/<card>、`git status --short` 净、基线祖先含 39a24a8fc；`$PY`=主仓 v2 `.venv/bin/python`，`PYTHONDONTWRITEBYTECODE=1`；前端用主仓 `frontend/node_modules` 软链。
2. 分批内容、验证命令与停止条件以各卡 `task_plan.md`「分批详细计划」为准，本计划只映射批次到节点；task_plan 的 B3/B4「回归、独立复核与交接」由 R/F 阶段承接，不另设 C 节点。
3. 禁止：新装包、push GitLab、建 MR、合入、verify、deploy、碰 test/prod、删 worktree、改 P21 允许路径以外文件。
