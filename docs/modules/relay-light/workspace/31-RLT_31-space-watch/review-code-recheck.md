<!-- dh:v1 -->
# RLT_31 独立代码轮 1 定向复查

复查人：Codex `rlt31_code_review`（与原代码轮 1 同一独立 reviewer；未参与施工）。本报告只复查原 P1-01 的整改以及被要求的 target 归属、失败 pending 行为；原 `review-code.md` 和 `code-review.DONE.md` 均未改写。

## 结论

**PASS。** 原 P1-01 已闭合；本次定向范围未发现开放 P0/P1/P2。SW6 仍是待真实 Herdr 管理会话的独立环境闸，未由 mock 结论替代。

## 闭合核对

- 原 P1-01：`tools/relay-light/space_watch.py:73-84` 现在只有同 pane、`state_change_seq` 严格前进且 `after.status == "working"` 才确认投递。`test_space_watch.py:228-235` 覆盖 seq 前进但 `idle` / `done` / `blocked` / `unknown`，均应抛 `notification_unconfirmed`。
- 目标归属：清单项的 `agent` 已不再当作唯一名称；`tools/relay-light/space_watch.py:87-93` 使用 `name`，无名时使用 pane ID；`snapshot()` 以 list 项 pane ID 做 get（`L132-143`），从而不会把 kind（如 `codex`）用作 CLI target。`test_space_watch.py:131-139` 覆盖两个无名同 kind 成员。
- 同 workspace 的通知对象：`poll()` 在 `L165-170` 只将 `notify()` 已确认的 after-state 写回同 pane 对象；其余成员保持提交前快照，故通知期间产生的其他成员变更会在下一轮再次送达。目标已被替换则 `L167-168` fail closed；定向测试在 `L108-129` 覆盖两条分支。
- 失败与 pending：变更消息在投递前进入 `pending_message`（`L159-161`）；任何 `notify()` 失败在 `previous` 赋值前抛出（`L171-173`），故基线和 pending 均保留。进程边界仅输出构造后的状态差异 `UNCONFIRMED`（`L193-199`），不输出原始 Herdr/pane 内容。

## 验证

- `python3 -m unittest test_space_watch.py`（`tools/relay-light/`）通过：24 tests。
- `git diff --check` 通过。
- 未执行 Herdr 实态控制、网络写入或 Enter；真实 SW6 留待获准的 Herdr 管理会话。
