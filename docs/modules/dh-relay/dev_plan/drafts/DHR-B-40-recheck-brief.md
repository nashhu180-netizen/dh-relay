<!-- dh:v1 -->
<!-- dh:planning-no-event:v1 artifact="dev_plan/drafts/DHR-B-40-recheck-brief.md" reason="DHR-B-40 定向复审派单形成史；不形成独立 planning event" -->
# DHR-B-40 v2 定向复审 brief

你是第二个 fresh-context 只读 reviewer。禁止修改文件、运行真实 Agent、提交、合并或推送。读仓根 `AGENTS.md` 与 `DHR-B-40-Herdr同步启动阻塞HostLease续租-候选.md`，再独立核对所引生产文件和正式设计段。

只核以下整改：

1. 因果是否已降级为“最强候选”，且 DHR_73 保留剩余机制调查。
2. 机器证 A 是否强制默认 TTL=15,000ms、同事件循环、逐次 expiry、至少两次 renew、独立 contender 拒绝，以及 TTL-only 变异不能过。
3. `workflow-driver.mjs` 是否已移出范围；`herdr-adapter.test.mjs` 与 `package.json` 是否按不重叠区域冻结；漏掉的必改文件或调用者是否存在。
4. DevPlan README 是否补入且仅机械同步。
5. fencing、child close、Windows 子进程/后代清理、有效单测九字段是否可执行。
6. DHR_75→DHR_72→DHR_74 回签/删树以及 DHR_73/DHR_35 顺序是否准确，无自动完成暗示。
7. B-adjust、D-start、E10、E11/verify 是否分闸。

输出：逐项 `到位/未到位`；若未到位给 P0/P1/P2、事实、影响、最小修改。最后给 `PASS` 或 `CHANGES_REQUESTED`，并附打开文件、HEAD、Git 前后状态、是否运行测试。
