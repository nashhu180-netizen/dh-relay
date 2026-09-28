# Issue #77 · 卡级总表维护与交棒核对

- Issue：https://github.com/nashhu180-netizen/dh-relay/issues/77
- 档位：轻档；task_type=light；仅协议与模板文档，无运行代码。
- 用户授权（2026-09-28）：“那你建个 issue 和 pr，补全下机制。不要过度工程化”。范围为本卡编辑、验证和创建 Issue/PR 所必需的精确路径提交/推送；不合并、不安装全局技能、不改派 WFP_02。
- 仓库/目标：nashhu180-netizen/dh-relay，origin/master；基线 `691cdcb8dfc9347dea5408a703ad27f0fd54e6fe`。
- 分支：`docs/issue-77-card-chain-maintenance`；worktree：`.dh-worktrees/issue-77-card-chain-maintenance`。
- 目标：明确总表关联、唯一维护会话、更新时机、交棒核对与失败出口，消除 single-task 同名 relay_plan.md 歧义。
- 范围：AGENTS.md；tools/relay-light/skill/SKILL.md；两侧 references/adapter-{codex,claude-code}.md；docs/relay/templates/card-chain.md；本目录 task.md/review.md。
- 验收：有表/无表、等待用户、结果变化、恢复/交棒、并行更新及写入失败都有明确处理；worker/watcher 权限不扩大；摘要不替代原卡证据、验收、开工授权；流程核对与程序强制保证明确区分。
- 步骤：先补模板关联与维护规则，再将技能/adapter/仓入口接到相同规则；场景走读与既有技能测试；独立一致性/教训复核；提交并创建 PR。
- 验证与复核：既有技能契约测试、diff/链接检查；独立 light 一致性/教训两路。无新增运行逻辑，不新增照抄文案的测试。
- 停止边界：无自动同步脚本/daemon/账本/状态库/哈希凭证；原 WFP/OBD 总表提交 `2e6053b` 留在原文档分支，本 PR 不夹带、不更改业务依赖。
- 状态：本地文档及验证完成，独立一致性/教训两路 PASS（见 review.md），进入 PR 待审；不代表已合入或安装。

## 验证记录

- `python3 -m unittest discover -s tools/relay-light -p 'test_install_skill.py'`：19 tests，OK。安装相关测试只写临时 HOME，不修改用户技能副本。
- `git diff --check`：通过；修改涉及的技能/模板引用目标存在。
- 场景走读：有表→在现有工件登记入口/维护会话；无表→明确独立单卡；提到表但无路径→待定位；等待/结果改变→只更新卡级摘要；交棒→核状态、下一步、证据与日期；写入受阻→待同步内容留原工件，不虚报交棒；多卡并行→单一维护会话顺序汇总。
- 能力边界：本次仅增加会话必做检查；无运行时强制检测，不承诺程序保证；尚未安装到全局技能或关联在途 WFP_02。

- 独立复核实例：`/root/review_issue77`；两路 PASS。候选-41 强制 findings 扩展经定向复核确认不属于本卡缺口，未增加机制；原意见与裁决保留于 review.md。
