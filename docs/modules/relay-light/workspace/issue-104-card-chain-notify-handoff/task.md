# Issue #104 · 卡级总表：非维护卡通知维护会话 + 维护人卡收口前移交

- Issue：https://github.com/nashhu180-netizen/dh-relay/issues/104（延续 #77 / PR #78 的同一机制）
- 档位：轻档；task_type=light；仅协议与模板文档，无运行代码。总表：无（协议小修改）。
- 用户授权（2026-09-30）：“你让 sonnet 改把”；上下文为主会话提议补这两条规则后用户同意。范围为本卡编辑、验证和创建 Issue/PR 所必需的精确路径提交/推送；不合并、不安装全局技能、不改任何业务总表。
- 仓库/目标：nashhu180-netizen/dh-relay，origin/master；基线 `9f810d7864f0ec2e74f0fb815bca3ba69c8043e3`。
- 分支：`docs/issue-104-card-chain-notify-handoff`；worktree：`.dh-worktrees/issue-104-card-chain-notify-handoff`。
- 目标：补两个盲点。A 缺通知通道：非维护卡写好待同步行后，orchestrator 向登记维护会话发一行 Herdr prompt `[relay-light] card-chain update <卡号> <交接工件仓相对路径>`，维护会话核原证据后顺序汇总。B 维护权移交无触发点：维护会话所在卡收口汇报前必须先移交，默认给下一张已开工且关联本表的卡的 orchestrator，无则交回用户（“维护会话：待指定（用户）”），同步总表页头及交出/接收方登记。
- 范围：AGENTS.md；tools/relay-light/skill/SKILL.md（v1.0.0 -> v1.1.0）；两侧 references/adapter-{codex,claude-code}.md；docs/relay/templates/card-chain.md；本目录 task.md。
- 验收：通知与移交两条规则在各文件口径一致；通知失败走既有“总表待同步”；worker/reviewer/decider/watcher 写权与消息权限不变；不授予开工/合入权限；仍是会话流程检查。
- 停止边界：不改 relay_log.py，无脚本/daemon/账本/文案断言测试；不改 docs/relay 下业务总表与 design/01；不写 review.md（独立复核由主会话另行安排）。
- 状态：本地文档与验证完成，进入 PR 待审；独立复核待做，合入待用户确认，本机 skill 副本未同步。

## 验证记录

- `python3 -m unittest discover -s tools/relay-light -p 'test_install_skill.py'`：19 tests，OK。
- `python3 -m unittest discover -s tools/relay-light -p 'test_relay_log.py'`：275 tests，OK。
- `git diff --check`：通过。
- 场景走读：
  - 非维护卡开工 -> 该卡 orchestrator 写好待同步行 -> 发 `[relay-light] card-chain update OBD_43 <路径>` -> 维护会话先核原证据再更新行与核对日期（不直接照抄），OBD_43 行不再停在旧“等待”。
  - 维护会话不在线/不可达 -> 走既有“无法更新”出口，待更新内容留原工件并报告“总表待同步”，非维护卡不自行写总表。
  - 维护人所在卡要收口 -> 先移交：有已开工且关联本表的下一卡则交其 orchestrator；没有则交回用户并写“维护会话：待指定（用户）”；同步页头及交出/接收方登记，三处未完成不算收口；用户可另行指定接收方。
  - 权限：通知仅 orchestrator -> 维护会话；worker/reviewer/decider/watcher 写权与消息权限不变，watcher 仍零写入；通知与移交均不授予开工/合入权限。
- 能力边界：仅增加会话必做检查，无程序强制保证；未安装到全局技能。
