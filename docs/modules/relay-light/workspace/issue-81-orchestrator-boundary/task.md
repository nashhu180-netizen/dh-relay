# Issue #81 · 单卡编排执行边界与基线失败取证

- Issue：https://github.com/nashhu180-netizen/dh-relay/issues/81
- 档位：轻档；task_type=light；协议文档维护，无运行代码变更。
- 初始用户授权（2026-09-28）：研究草案后回复“确认 开issue + pr 修复”；承接已讨论的三文件方案。初始目标是修复并创建 PR；后续合并、全局安装与收尾授权见下方补充记录。部署与 verify 未执行。
- 仓库/目标：nashhu180-netizen/dh-relay，origin/master；基线 `bf1b64d10d1c5f7ccbf68440370854c653814150`（已核远端一致）。
- 分支：`docs/issue-81-orchestrator-boundary`；worktree：`.dh-worktrees/issue-81-orchestrator-boundary`；client=codex-cli。进树已执行 `git rebase master`，无变化。
- 目标：编排不代跑测试/基线/业务复算；范围外失败可核验、不可自我豁免；原则纠正不隐含 kill/删现场。
- 允许路径：`tools/relay-light/skill/SKILL.md`；`tools/relay-light/skill/references/adapter-claude-code.md`；`tools/relay-light/skill/references/adapter-codex.md`；本目录 `task.md`、`review.md`。
- 验收：Issue 六项验收全部满足；核心与 adapter 无职责/写者冲突；缺证、环境不可比、同名异因、漏测、已修复项回退均不能靠失败子集放行；必需 CI 不受基线豁免；明确停止指令仍立即执行。
- 步骤：先登记本任务；补核心合同和双侧派单；场景走读、既有测试、独立一致性/教训复核；完成授权范围内的 PR 交付。
- 复核：light 一致性/教训两路，由未参与施工的 fresh reviewer 执行；仅文档，不新建照抄措辞的测试。
- 停止边界：不改 roles.toml、phase/signal/batch schema，不修 WFP_02 现场，不新增角色或执行工具，不把本卡文档合同当作程序强制保证。
- 状态：交付完成。PR #82 已合并，Issue #81 已关闭，独立复核与三项必需 CI 通过，ThinkPad/ThinkBook 全局技能已安装并校验；本次收口回填不改变技能内容。

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

- 独立复核初审发现 P1 R81-C-01（审核通过后 findings 回写时序缺口）；新增“闭合时序”：归因确认但登记待补时沿用 FAIL→原 coder→原 reviewer，计入既有整改额度，登记齐全才 batch PASS/clear；不新增 signal/角色。已定向复核闭合，详见 review.md 整改复核 1。

- 独立复核实例：`/root/review_issue81`；初审 R81-C-01 经原实例定向复核闭合，两路最终 PASS，详见 review.md。
- 两份 adapter 新增边界和派单字段逐字一致（脚本断言通过）。

- 补充授权（2026-09-28）：用户点选“授权 commit + push，继续创建 PR”，对象为本卡已复核的 5 文件、`docs/issue-81-orchestrator-boundary` → origin/master；不合并。

- 合并前复核补充（2026-09-28）：PR 自动审核 P1 指出 workflow-final/E2 首次发现失败无合法路径；补齐原 phase/path 下 coder 补证与对应 reviewer 审核，保留 workflow-final fresh 与 E2 同实例 attempt 2 条件，不回开已 PASS 批次。独立原 reviewer 定向复核 PASS，19 项安装契约测试通过；新 HEAD CI 以 PR 记录为准。


## 最终交付与收口

- 后续用户授权（2026-09-28）：用户明确“全局安装”，随后“thinkbook 和 thinkpad 都安装了吗？ PR合并下”，并在核对剩余任务记录/worktree 后指示“继续收尾”。本次只回填本卡事实、提交收口 PR、通过必要检查后合并并清理本卡 worktree/分支。
- 主交付：[PR #82](https://github.com/nashhu180-netizen/dh-relay/pull/82)，2026-09-28 已 squash 合并，SHA `5f8850228c54b6c0da1bfb448d331808f0316e9d`；Issue #81 随合并关闭。
- 复核：`review.md` 保留初审与两次整改记录；最终一致性/教训 PASS，自动审核 P1 已在 `e9fe6f8` 修复并经独立定向复核，未代签人验。
- 验证：首版完整 Python 回归 294 tests OK；最终修订的安装契约 19 tests OK；[最终实现 CI run 36437923993](https://github.com/nashhu180-netizen/dh-relay/actions/runs/36437923993) completed/success，Python、Ubuntu PowerShell、Windows PowerShell 三项必需检查全部通过。`relay-core` 失败为现行 `continue-on-error` 观测项，未冒充全项通过。
- 安装：ThinkPad（`nash-ThinkPad-E470c`）的 `.claude`/`.codex`/`.agents`，ThinkBook（`LAPTOP-P327JFGO`）的 `.claude`/`.codex`，均以 `5f88502` 为安装源；各副本 5 文件与本机 manifest 原始哈希一致，双机经 CRLF→LF 归一化后内容一致。ThinkBook 不存在 `.agents/skills/relay-light` 副本。安装校验时两机 master 均为该完整 SHA 且干净。
- 清理：仅针对本卡 `.dh-worktrees/issue-81-orchestrator-boundary`、`docs/issue-81-orchestrator-boundary` 与收口分支 `docs/issue-81-closeout`；本收口记录合入、确认无 WIP/进程占用且所有差异已归主干后删除，实际结果留在收口 PR。不得删除其它 worktree、运行现场或安装副本。
- 范围外事项：batch 闭集扩展未获本卡授权，仍留待独立确认；本卡是轻档协议维护，不涉及高危 verify、部署或业务仓施工。
