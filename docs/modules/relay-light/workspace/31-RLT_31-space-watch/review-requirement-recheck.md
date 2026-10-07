<!-- dh:v1 -->
# RLT_31 独立需求复查：notify 回声修复

复查人：原需求 reviewer，未参与修复实施。本报告只复查原 HIGH 的局部修复与其协议边界；原 `review-requirement.md` 及其 `CHANGES_REQUIRED` signal 保留、不覆盖。

## 结论：PASS（仅本次局部复查）

`Herdr.notify()` 只在同 pane、seq 推进且最终为 `working` 时返回 after-state（`tools/relay-light/space_watch.py:73-84`）。`poll()` 仍先以完整 workspace 快照计算变化，投递成功后仅以该 after-state 更新同 pane 的目标条目；其他成员的通知前快照原样保留（`:146-174`）。若同 workspace 的命名目标在 after 读取前换 pane，会抛 `notification_target_replaced`，且 `previous` 不前进。

这满足 decider 的聚合快照合同：没有从发现集合排除通知对象，也没有把它永久静默；其下一次独立 status/seq 变化仍与 after-state 基线不同，照常通知。目标在同一次 prompt/after 窗口内发生的外部变化无法由现有 API 按事件来源拆分，三份协议文本已明确为同次聚合观察，不声称逐事件因果上报。

定向证据：`cd tools/relay-light && python3 -m unittest test_space_watch.py` 结果为 `Ran 24 tests ... OK`。其中覆盖同 workspace 一次通知后的静默、通知目标后续独立变化、其他 worker 在投递期间变化后下一轮报告，以及目标 pane 替换 fail closed。实现改为按 pane ID get，未命名成员以 pane ID 纳入快照，未增加任何排除目标。

本结论不改变 SW6 仍需真实 Herdr 管理会话验证的状态；本会话未进行 Herdr 实时操作。

记录：以上为本轮独立原始结论，历史结果保留。
