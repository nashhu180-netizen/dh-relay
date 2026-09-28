<!-- RLT_30 需求方向复核 · reviewer=fresh subagent（会话 rlt30-requirement-1，未参与施工，只读）· 主会话按复核者回复摘录落账 -->
# RLT_30 需求方向复核

- 结论：**PASS**。核心问题「新终端启用 relay-lite 角色层是否只见 stage-lead / watcher」：是。

| 需求项 | 场景操作路径 | 观察结果 | 结论 |
|---|---|---|---|
| 新装 skill 角色层只剩 stage-lead / watcher | 临时 HOME `install_skill.main(['--all'])` 装两份副本，grep 五件 `monitor\|监工` | 监工 0；monitor 每副本 8 行，全为别名句 / `monitor#<n>` 账本标识 / `monitor_launch`·`monitor_restart` 事件名 / `[monitor]` 旧名兼容句 | 满足 |
| roles.toml `[stage-lead]` + `[watcher]` 不写死 | 看装出的 roles.toml | stage-lead=codex sol medium；watcher=codex luna medium；无 `[monitor]` 段头 | 满足 |
| 旧计划只有 `[monitor]` 兼容 | 改回 `[monitor]`、删 `[watcher]` 作 config 跑 status/lint | status rc=0，lint ok | 满足 |
| status 文本按样张 | §10.1/§10.2 fixture 跑 `relay_log.py status` | `当班写入者：stage-lead（DHR_90:C#1）` | 满足 |
| `--json` 键枚举冻结 | 新旧两版各跑 `status --json` 并 cmp | 字节相同 | 满足 |
| 报错三条规矩 | 4 条故意写错的 `add` | A85/A69/A119 主语 stage-lead、括号带原值；rc=2 同旧版；账本未变 | 满足 |
| 标头不接受 `phase=monitor` | 看 SKILL/adapter/AGENTS 闭集 | 闭集为 watcher | 满足 |
| `[watcher]` 只管完整模式 | 看 adapter single-task 段 | model-allocation gate 保留 | 满足 |
| AGENTS 只动 relay-light 两段 | `git diff … -- AGENTS.md` | 仅两 hunk | 满足 |

| ID | 级别 | 事实 | 处置 |
|---|---|---|---|
| RQ-1 | P3 | 冻结面：watch 通知显示 `monitor#1`；未写 `herdr=` 时按 `monitor-<n>` 猜名 | 后续项（F-008） |
| RQ-2 | P3 | roles.toml 注释未写 `[watcher]` 只管完整模式 | 后续项（F-009） |
| RQ-3 | 信息 | 复核期间主会话并发改工作区文档（F-002/F-003） | 本次提交纳入 |
