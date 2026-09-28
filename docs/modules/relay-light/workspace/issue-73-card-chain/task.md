# Issue #73 · 单卡接力总表

- Issue：https://github.com/nashhu180-netizen/dh-relay/issues/73
- 档位：轻档；task_type=light；纯文档，无执行协议或代码改动。
- 基线：origin/master `61cdda0`；分支：`docs/issue-73-card-chain`；独立 worktree：`.dh-worktrees/issue-73-card-chain`。
- 用户确认（2026-09-28）：“可以，建issue+pr。不要设计的太复杂，太工程化，能用就行。接力计划还是放在专门放接力计划的文件夹里面”。
- 目标：一张表记住跨模块卡间衔接；卡内计划、施工、复核和验收仍由原卡承担。
- 验收：模板可复制到既有计划目录；能找到原卡/恢复入口、前置条件、停点和下一步；等待用户是正常停点；衔接表不充当验收证据或开工授权；与现有执行计划明确区分。
- 允许路径：`docs/relay/README.md`、`docs/relay/templates/card-chain.md`、`docs/relay/wf-analytics-platform/README.md`、`tools/relay-light/skill/SKILL.md`、本目录的 `task.md` 与 `review.md`。
- 停止边界：不生成未经核实的 WFP/OBD 业务计划，不启动业务卡、不安装技能、不合并 PR。
- 复核：独立 reviewer 检查一致性与教训两路；无生产代码，不增加单元测试。
- 状态：文档交付已备齐，独立一致性/教训两路 PASS（见 `review.md`），待 PR CI 与维护者合并。

## 验证记录

- `git diff --check`：通过。
- 仓入口、wf 入口和技能文档的 Markdown 链接目标检查：通过；技能使用明确的 dh-relay 仓根路径，避免安装后相对路径失效。
- 需求走读：模板可记录“卡 A 待用户验收 → 卡 B 等前置”，恢复需回读原卡证据，只有交接条件成立才记录已交棒；卡内执行方式、复核与验收未被总表替代。
- `python3 -m unittest discover -s tools/relay-light -p 'test_*.py'`：已启动，最终结论在 PR 验证记录中更新；GitHub Actions 必需三项检查以 PR checks 为准。
- 独立复核实例：`/root/review_card_chain`；一致性、教训两路均 PASS，无 P1/P2。
