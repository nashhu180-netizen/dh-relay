# 施工里程碑与证据索引

- 任务：issue-94-decision-placement；Issue：https://github.com/nashhu180-netizen/dh-relay/issues/94
- 2026-09-29：核心 SKILL 与双 adapter 的决定落点、写者、恢复和派单模板已完成；既有 `python3 -m unittest discover -s tools/relay-light -p 'test_install_skill.py'` 执行 19 tests / OK，exit=0；临时 HOME 安装测试不修改全局副本。`git diff --check` exit=0；双 adapter 决定规则与派单模板逐字相等检查通过。实际 cwd 为本卡 worktree，解释器 python3。证据与场景走读见 review.md；独立一致性/教训复核均 PASS，原始报告见 review.independent.md。无运行代码变更，不新造重复文字断言测试。
