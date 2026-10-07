# RLT_31 · notify 回声局部裁决

裁决：**DECIDED — 可以作纯局部修正**。修正不改变 workspace 发现范围、通知对象资格或轮询节拍；它只把已被投递确认读取到的通知目标状态作为下一轮比较基线的一部分。

## 依据

`SpaceWatch.poll()` 的 `current` 是通知前快照。`Herdr.notify()` 已在同一投递流程中读取目标的 before/after，并以 `after.seq > before.seq` 与同 `pane_id` 作为成功投递 oracle。现有实现却在成功返回后仍写入通知前的 `current`。因此通知目标也属于本 workspace 时，下一轮必然把这次已确认投递造成的 `state_change_seq` 推进误当作外部变化。

成功投递后，以这个 oracle 的 `after: AgentState` 覆盖下一轮基线中**同名通知目标**的条目，即可消除该确定的回声；其他成员仍保留本轮 `current` 的原状态，故不会被通知目标的覆盖吞掉。

## 准许的局部实现

1. `Herdr.notify()` 在全部现有确认条件成立后返回其 `after` 的 `AgentState`；确认失败一律抛 `WatchError`，不得返回状态。
2. `poll()` 先取得 `current` 并算出、发送原有的 `changes`。只有 `notify()` 成功后才生成 `next_previous = dict(current)`。
3. 仅当 `self.notify in current` 时，将 `next_previous[self.notify]` 替换为该次成功投递返回的 `after`。通知目标不在该 workspace 快照时，不加入、不修改任何成员条目。
4. 覆盖前必须再核对 `after.pane_id == current[self.notify].pane_id`；不一致说明从本轮 workspace 快照到确认读取间发生替换/迁移，必须 fail closed（抛 `WatchError`，不推进 `previous`）。
5. 维持「失败不消费 delta」：通知、确认读取或 pane 一致性检查任一失败，`previous` 保持原引用语义上的旧比较基线。

这不排除通知目标，也不把它的普通后续状态变化永久静默：确认后的下一次独立状态/seq 变化仍与更新后的基线不同，必须照常通知。

## 覆盖边界

本裁决能保证同一次已确认投递所读取到的通知目标 `after` 不会在下一轮被重复报告，并保证所有**其他成员**的本轮快照不变。它不声称 Herdr 的两个/多个状态读取能为通知目标提供事件级因果归因：若真实目标变化恰好与 `prompt` 及其 `after` 读取并发，当前 API 只给聚合的 `status/seq`，无法纯靠本地代码区分哪个序号增量由 prompt 造成。

若「任何成员变化」要求把这类通知目标的并发外部变化逐个、可归因地报告，局部实现无法证明满足；需要用户选择 Herdr 提供带来源/事件 ID 的原子通知回执，或明确接受该投递窗口内对通知目标的合并语义。本卡已明确的「不吞其他成员变化」可由上述局部策略满足，无需改变用户方向。

## 必需测试

- 通知对象在同 workspace：先建立基线，令另一成员变化；fake 的成功 `notify` 必须将通知对象 seq 推进；本轮只发一条，下一轮无任何外部变化时必须静默。
- 在上述成功后的下一轮，让另一成员变更，必须再次通知；证明覆盖未改写其他成员基线。
- 通知对象在 workspace 外：成功通知不得把它加入 `previous`，既有外部目标行为不变。
- 确认/通知失败仍不提交基线（保留既有失败测试，并调整 fake 返回值）。
- 同 workspace 通知对象在本轮快照与投递确认间 pane 不一致：fail closed 且 `previous` 不前进。
- 成功覆盖后通知对象再发生一次后续 status 或 seq 变化：必须通知，证明没有把它排除或永久抑制。

未运行测试、未改代码、未进行 Herdr 实时操作。
