<!-- dh:v1 · lesson_candidates.md — 候选经验，不自动升格规范。 -->
# lesson_candidates — DHR_26

1. **仓外生产落点也需要可审查交接物**：用 transport mirror + fail-closed materializer，比偷偷改变 DevPlan 落点更诚实。
2. **JSON 字典不能默认用 `{}` 承载外部 ID**：`__proto__` 等合法字符串会污染原型；应使用 null-prototype map + own-key 查询，并写回归测试。
3. **静态生命周期证据不等于进程清理证据**：无 event/timer 只能降低风险，安装/禁用/卸载仍须目标机转录。
4. **Host/Client 应独立实现 fixture 读取，再对 canonical snapshot**：避免“两个客户端共用同一错误代码”制造伪一致。
