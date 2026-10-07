<!-- dh:v1 -->
# RLT_31 独立代码轮 1 复核

复核人：Codex `rlt31_code_review`（独立实例，未参与施工）；范围：`tools/relay-light/space_watch.py`、`test_space_watch.py`、`install_skill.py`、`test_install_skill.py` 及 watcher 文档差异。复核时恢复后候选 `space_watch.py` SHA-256 为 `db84fb8eb5a771195b42cd487ee03ce8ac095adbec99d3dd919a1c247b6856f2`；临时 business mutation 未计入候选。

## 结论

**FAIL：1 个开放 P1。** 不可放行下一复核/收口，须由施工者整改并做定向复验。

### P0

无。

### P1

- **P1-01 — 投递确认没有核验目标最终为 `working`，会把仍未开始处理的通知当作已确认并提交差异基线。** `tools/relay-light/space_watch.py:73-83` 在 `--wait --until working` 返回后仅要求返回类型、同 pane 和 `state_change_seq` 增长。若 Herdr 返回 `agent_prompted`，但随后 `agent get` 显示相同 pane、seq 已增加而 `agent_status` 仍是 `idle`、`done`、`blocked` 或 `unknown`，函数仍返回成功；`poll()` 随即在 `tools/relay-light/space_watch.py:156-158` 覆盖 `previous`。这与文档的 `--until working` 投递确认契约及 SW3 不符，可能丢失这次变化的后续重报机会。整改应把 `after.status == "working"` 作为确认条件，并加一个“seq 前进但 after 非 working”必须 `notification_unconfirmed`、且 `previous` 保持不变的定向测试。

### P2

无。

## 已核对的正向项

- 每轮重新 `agent list`，以精确 `workspace_id` 过滤、只排自身；成员逐个 `get`，list/get 成员漂移或缺 `state_change_seq` 均 fail closed，未把旧 fixture 的缺 seq 当作通过。
- 状态、seq、pane 变化及新增/离开均进入差异；投递失败在写入新基线前抛错；无 `send-keys`/Enter 调用，`RELAY_RECEIPT` 和 `HERDR_ENV` 均在首次 Herdr 命令前阻断。
- 脚本不落文件；安装器将脚本纳入两侧副本并做 hash 验证。三份 watcher 文档均固定 workspace 作用域、脚本启动方式和零写入要求。

## 复核执行

- `python3 -m unittest test_space_watch.py test_install_skill.py`（在 `tools/relay-light/`）通过：38 tests。
- `git diff --check` 通过。
- 未作 Herdr 实态控制或网络写入；SW6 仍待真实管理会话，mock/subprocess 注入不冒充实跑。
