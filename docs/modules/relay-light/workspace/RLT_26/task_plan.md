<!-- dh:v1 -->
# task_plan — RLT_26

## Context Packet
- Issue: https://github.com/nashhu180-netizen/dh-relay/issues/50 （F-010 扩围评论 issuecomment-5747218816）。
- worktree: `D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/RLT_26`；branch: `wt/RLT_26`；client: `other`（Devin CLI）。
- 基线：master `9ca3eda8e743f356e8ef0dfb8351eaffaba315fb`，建树后快进纳入已推送的 B-08 规划提交 `660c9be8eff916cc2df1fff1f707d1dacafc4735`；无新增 merge commit。
- 用户 2026-09-20「确认」六项推荐方案，已授权本卡落户并由 Devin SWE-2 Max 施工；随后「做之前 代码先提交推送」要求先推送准备基线。施工者只负责本卡施工，不自核、不提交推送、不创建 PR、不合并、不 verify、不改用户级 skill 副本。

- 正式输入：[design/01](../../design/01-RelayLight-产品设计与验收.md) §3.4、§6.3、§11 A2/A137/A144～A150/A155～A158、§12；design/README 白名单只含此正文。
- 对照实现：`relay_log.py` 的 EVENTS、`_validate_close_row`、stage_result 与 trigger 分支，只读。
- 既有测试：`test_relay_log.py` 的 SkillCoreDocTests（约 5334 行）、SkillAdapterTests（约 6173 行）、RelayResourceCloseTests（约 6881 行）、RelayResourceCloseBackwardCompatTests（约 7657 行）；行号只供定位，以符号为准。
- 来源：workspace/RLT_22/findings.md F-010、workspace/RLT_24/findings.md F-C1-01/F-C1-03；RLT_13 来源在未合入 wt/RLT_13，不触碰。

## 施工步骤（开工冻结；跑偏只记 progress）
1. 进场第一条命令 `git rebase --autostash master`。核对 cwd/branch/AGENTS 与本 workspace。在 progress 写会话/模型身份、基线和实际开始时间。若 rebase 冲突停止，不覆盖并行改动。你不独占仓库；只在本树允许路径内写。
2. Modify/Test `tools/relay-light/test_relay_log.py` 的既有 skill 文本测试，补会失败的结构/语义断言：resource_close 归控制事件、解码后的 object_type→写者映射、note 四键闭集与 reason 条件、关后可记账、两个 adapter 关闭失败按 seq/object_id 取证。补 F-010 四态/三套计数/stage_result 非成功前提的回归断言。测试依据正式合同，避免只镜像自己的措辞；确认当前文档使新增测试断言失败再编辑正文。
3. Modify 三份 skill 文档与 `as-built/RLT_05-实现快照.md`。按 A2/A155～A158 完整写明第 20 控制事件、wire format、写入者、outcome=failed 的非空非空白 reason、outcome=ok 不得 reason、关闭后可记账且不改派生状态。两 adapter 与 F checklist 写失败事件→检索→处置证据路径。as-built 记录 RLT_24 的 71 行兼容证据出处，不伪造重跑或补写历史账本。
4. 在相同现役文件内清理 F-010：trigger 四态含 on:review_ready:；计数为三套且第三套只投影；stage_result 成功和 blocked/failed 条件分别描述。扫描 19 词残留，历史表述逐项登记不改原因；不得为 grep 归零改历史证据。与实现不符即 blocked。
5. 验证：在 tools/relay-light 运行 `python -m unittest test_relay_log.SkillCoreDocTests test_relay_log.SkillAdapterTests`；再在仓根运行 `python -m unittest discover -s tools/relay-light -p "test_*.py"` 及 `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`。记录自然退出码、PASS/FAIL/SKIP 数与日志路径，不用尾部 PASS 掩盖非零退出。`git diff --check` 和逐路径审计；若环境阻塞保留失败证据，禁止改范围外代码。normal 有效单测：选本次现役文档的一处合同语义，临时改坏应触发指定测试断言失败，立即恢复并记录前后 hash、测试 ID、命令与结果；若上游闸不接受文档变异，明确报限制而非伪造代码变异。
6. progress 记每条验收证据，findings 记未关闭问题；不得填独立 reviewer 结论或人类签名，不改 DevPlan。最后创建 `construction.DONE.md`，字段 status=implemented 或 blocked、session、model、changed_paths、tests、evidence、open_findings、next=independent-review，随后自然退出。完成施工信号不代表整卡验收。无新委托、无 watcher、无 Git 提交推送/PR/merge/verify/安装器 --all。
