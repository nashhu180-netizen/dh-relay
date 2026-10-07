<!-- dh:v1 -->
# RLT_31 用户范围修订后的独立需求与一致性复查

复查范围：用户明确的「watcher 不监控主编排、监控同 space 其它标签页 agent」；候选脚本、两份 adapter/派单模板、AGENTS、SKILL、DevPlan/brief 与安装入口。未运行测试、未执行 Herdr 或网络操作，原有报告与 signals 未修改。

## 结论：PASS（本次用户范围）

- `space_watch.py` 每轮 `agent list` 后按 `workspace_id` 发现成员，并先解析 `--notify` 对应主编排的实际 pane；快照仅排 watcher 自身与该 pane，未按角色、名字前缀或派单名单排除其它成员。主编排在同 space 的状态完成、seq 推进或 pane 更换均不进入差分；其它新成员、离开成员和 status/seq 变化仍进入差分。未命名成员以 pane ID 取状态和作为快照键。
- 完整通知生命周期仍受确认约束：通知前/后同 pane、seq 前进且最终为 `working`，否则 fail closed；失败时 `previous` 未更新，脚本不发送 Enter。主编排被排除后，不再采用 after-state 去回声合并；`delayed-echo.md` 的历史 RED 作为此前范围的证据保留，用户新范围下的业务 mutation RED→精确恢复→GREEN 和生命周期 fixture 覆盖本次排除的合同。
- AGENTS、SKILL 与 Claude/Codex adapter 的 watcher 节拍、范围、固定 `--workspace --notify --self` 派单模板和零写入边界相同。watcher 只启动脚本并巡检，不写 signal/progress/日志、不路由或派活；通知与确认由脚本负责。安装器把 `space_watch.py` 与三份文档同源复制并逐文件哈希校验，安装测试覆盖此入口。
- 工作区记录声明 25 watcher、19 installer 测试 PASS；本复查未把该本地/mock 证据升级为真实环境结论。SW6 仍缺 Herdr 管理会话，保持 BLOCKED，不能据此给出全卡验收或合入结论。
