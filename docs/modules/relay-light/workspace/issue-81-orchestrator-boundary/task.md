# Issue #81 · 单卡编排执行边界与基线失败取证

- Issue：https://github.com/nashhu180-netizen/dh-relay/issues/81
- 档位：轻档；task_type=light；协议文档维护，无运行代码变更。
- 用户授权（2026-09-28）：研究草案后回复“确认 开issue + pr 修复”；承接已讨论的三文件方案。目标是修复并创建 PR，合并、全局技能安装、部署与 verify 不在本次范围。
- 仓库/目标：nashhu180-netizen/dh-relay，origin/master；基线 `bf1b64d10d1c5f7ccbf68440370854c653814150`（已核远端一致）。
- 分支：`docs/issue-81-orchestrator-boundary`；worktree：`.dh-worktrees/issue-81-orchestrator-boundary`；client=codex-cli。进树已执行 `git rebase master`，无变化。
- 目标：编排不代跑测试/基线/业务复算；范围外失败可核验、不可自我豁免；原则纠正不隐含 kill/删现场。
- 允许路径：`tools/relay-light/skill/SKILL.md`；`tools/relay-light/skill/references/adapter-claude-code.md`；`tools/relay-light/skill/references/adapter-codex.md`；本目录 `task.md`、`review.md`。
- 验收：Issue 六项验收全部满足；核心与 adapter 无职责/写者冲突；缺证、环境不可比、同名异因、漏测、已修复项回退均不能靠失败子集放行；必需 CI 不受基线豁免；明确停止指令仍立即执行。
- 步骤：先登记本任务；补核心合同和双侧派单；场景走读、既有测试、独立一致性/教训复核；完成授权范围内的 PR 交付。
- 复核：light 一致性/教训两路，由未参与施工的 fresh reviewer 执行；仅文档，不新建照抄措辞的测试。
- 停止边界：不改 roles.toml、phase/signal/batch schema，不修 WFP_02 现场，不新增角色或执行工具，不把本卡文档合同当作程序强制保证。
- 状态：文档施工与独立一致性/教训复核通过，进入 PR 待审；本地全量回归和 GitHub CI 最终结论见关联 PR 验证记录，不代表已合入或安装。

## 验证记录

- `python3 -m unittest discover -s tools/relay-light -p 'test_install_skill.py'`：19 tests，OK；测试只安装到临时 HOME，没有更新全局技能。
- `git diff --check`：通过。
- 文档场景走读（不是程序强制保证，也不是业务测试复跑）：
  - 编排读 JSON verdict/证据路径 → 允许程序性核对；从 ops profile 重算增删/hash → 派 coder/reviewer。
  - 对照导出缺 docs 或导入了候选代码 → 环境不可比，BLOCKED，不形成有效允许集合。
  - 使用批次前 SHA → 必须声明批次用途，不能冒充整卡开工基线。
  - 失败名称相同但原因改变、测试漏收集/skip、已修复项再次失败 → 不能凭子集关系放行。
  - 新失败或缺少完整报告 → BLOCKED，不能先 closed-as-baseline 后补证。
  - 原合同全绿 → 如改变验收标准，交用户确认；基线标签不覆盖必需 CI。
  - reviewer 发现基线问题 → 自写 review，由编排路由 coder 登记 findings；编排不代写归因。
  - 用户仅纠正今后分工 → 不自动 kill/删现场；明确要求立即停止 → 立即执行；删除另判。
- 范围外发现：现行 batch 闭集仍写 `1|2|3|na`，现场存在 B0～B6；本卡不扩 schema，留待独立确认。

- 独立复核初审发现 P1 R81-C-01（审核通过后 findings 回写时序缺口）；新增“闭合时序”：归因确认但登记待补时沿用 FAIL→原 coder→原 reviewer，计入既有整改额度，登记齐全才 batch PASS/clear；不新增 signal/角色。待定向复核。

- 独立复核实例：`/root/review_issue81`；初审 R81-C-01 经原实例定向复核闭合，两路最终 PASS，详见 review.md。
- 两份 adapter 新增边界和派单字段逐字一致（脚本断言通过）。

- 补充授权（2026-09-28）：用户点选“授权 commit + push，继续创建 PR”，对象为本卡已复核的 5 文件、`docs/issue-81-orchestrator-boundary` → origin/master；不合并。
