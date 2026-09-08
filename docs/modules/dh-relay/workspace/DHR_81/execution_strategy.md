<!-- dh:v1 -->
# execution_strategy — DHR_81

## 操作模型

主会话在 `wt/DHR_81` 施工；任务是一个可独立验证的固定包络语义点，不分批。收口复核使用未参与施工的 fresh-context 实例。

## 收尾铁律

- 只 stage 本卡允许路径。
- fake/快照绿只证明 A13~A15，不证明 DHR_35 的真实 task side effect 或 P6-M1。
- 无用户 E11 确认不 verify、合并或删树。
