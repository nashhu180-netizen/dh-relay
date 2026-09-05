<!-- dh:v1 -->
# DHR_76 · D 异常清理边界待裁决稿

用户于 2026-09-05 对本稿明文回复“确认”。本稿据此转为 DHR-B-42 的裁决来源；正式合同同步到 P6 DevPlan 与 brief。该确认不签风险接受、verify 或 E11。

现有合同同时冻结：alias 15s、整轮60s、cleanup宽限10s；D要求超时后等待child close及Windows后代无残留。

现有代码与已证事实：正常超时等待真实child close与taskkill结果，正式15s超时双路径及60s整轮均已通过；但OS清理在宽限内未完成时，10s到期返回 E_UNRESOLVED_ALIAS:probe-close-timeout，loader保持 E_BAD_VALUE:PROFILE_REGISTRY。此时不制造close，不报清理成功，也不能证明无残留。

复核分歧：代码两轮接受“硬预算内等close，未确认则明确失败”；需求复审列P2未验证边界；一致性保留P1，按原D字面要求失败返回前也必须close。主控未将该分歧自行改写成全路approved。

已确认的最小澄清文本（按 DHR-B-42 落正式权威）：

> 正常探针超时后，在10s清理宽限内等待child close及Windows杀树完成。若到期仍无法确认清理，必须明确失败且不得启动Attempt/Agent/pane、不得声称无残留；允许失败返回先于close，证据标记清理未确认。错误外层与现役reason code保持不变。此异常不计作清理验收通过。

保持原字面要求也是合法决定，但需重新设计能满足该前提的清理/隔离机制，并重新确认预算或范围；不得悄悄无限等待、加长TTL或修改禁改Host/lease。

该裁决不包含本地合入、verify、清理worktree、push、部署或相邻卡授权。
