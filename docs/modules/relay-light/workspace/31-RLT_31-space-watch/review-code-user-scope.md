<!-- dh:v1 -->
# RLT_31 用户范围修订独立定向代码复查

复查人：Codex `rlt31_code_review`（独立 reviewer，未参与施工）。范围限本次用户修订：主编排只作通知对象、同 space 的其它 agent 监控、通知全生命周期无回声、并发变化与失败基线、安全闸。

## 结论

**PASS。** 本定向范围未发现开放 P0/P1/P2；SW6 仍待真实 Herdr 管理会话，当前 fixture/mock 不替代该项实跑证据。

## 核对结果

- `tools/relay-light/space_watch.py:115-144` 每轮重新 list，以精确 `workspace_id` 取得成员；每轮先 `get --notify` 的实际 pane，排除该 pane 与 watcher pane。因而主编排即使位于相同 workspace 或 list 无 `name` 也不会进入快照；其它近似命名的 worker 仍被纳入，未使用前缀过滤。
- `tools/relay-light/space_watch.py:146-174` 已移除投递后的 after-state 合并。主编排从快照中排除，投递造成的状态/seq 变化不构成回声；其它 worker 的并发变化保留在当前快照，下一轮仍形成差异通知。
- `pending_message` 在投递前建立；投递失败在 `previous` 赋值前中断，故旧基线与 pending 均保留。进程出口只打印构造后的 `UNCONFIRMED` 状态差异，不回显 Herdr 原始 JSON 或 pane 内容。
- `tools/relay-light/space_watch.py:32-37,73-84,183-199` 保持 `RELAY_RECEIPT` / `HERDR_ENV` 前置 fail-closed、投递需同 pane + seq 前进 + `working`、无 Enter，且无文件写入。

## 验证

- `python3 -m unittest test_space_watch.py test_install_skill.py`（`tools/relay-light/`）通过：44 tests（25 watcher + 19 installer）。
- `git diff --check` 通过。
- 勘误：本次 ECHO-01 生命周期业务 mutation 的 RED → 精确字节恢复 → GREEN 证据在 `docs/modules/relay-light/workspace/31-RLT_31-space-watch/delayed-echo.md` 末节；`mutation.md` 仅为前序 seq-only 证据。两者均为本地 fixture，不替代 SW6 Herdr 实跑。
