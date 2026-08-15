<!-- findings.md — 问题清单。🟢 边做边记。 -->
# findings — DHR_03 接真实可见 psmux 并完成阻塞接力 dogfood

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|----|------|------|------|------|------|
| F-001 | P2 | psmux `kill-session -t =<name>`（tmux 精确匹配语法）exit 0 但**不杀会话**——若 adapter 沿用 tmux 习惯写 `=name`，stop 永远"成功"而 session 长存，Runner 收不到 exited；已定 K-3/K-6（裸名 + list-sessions 全等复核）并进离线套件断言 | E-002 | task_plan K-3/K-6/A3⑧ 锁住 | mitigated（待套件落地转 resolved） |
| F-002 | P3 | psmux 无宿主推送通道，`emit_observation` 只能返回空；running/idle 判据退化为 `window_activity` 时间窗启发式（`IdleAfterSeconds`），agent 在"思考中不输出"时可能被误判 idle（不影响业务投影，只影响终端维展示） | Code Scout | 记录·P1 接受；orca `terminal wait --for tui-idle` 是对比项（批0 记结论） | open |
| F-003 | P3 | 本仓 dh-crew 尚未注册进 orca `repo list`；orca preflight 需先 `orca repo add`（只加注册元数据·不建 worktree·不改本仓文件） | Code Scout S6 | 批0 执行时做；记 progress | open |
