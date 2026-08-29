<!-- dh:v1 -->
# findings — DHR_62

| ID | 级别 | 状态 | 发现 | 处置 |
|---|---|---|---|---|
| F-001 | P1 | resolved | 模块 verify hook 要求全模块 dh-check 通过，历史工件 70 项使无关的新卡无法形成 verify。 | 初修中的绕闸已撤销；合法返工经 DHR_32 一致性补审与 DHR_62 三路正式复核 approved，终态 `dh dh-relay` 实跑 0 failures/60 warnings。 |
| F-002 | P0 | resolved | 初修把 DHR_32/33 的「待人验」改成 `进行中`，并从 DHR_33 签名区删 `66dd16a`，实际关闭 R13/R18。 | 已恢复 SHA；状态改为语义正确的 `待验收`；R13 以用户代决策授权把两条 P1 精确移交 DHR_35；R18 用真实账本/E9/E10/as-built 闭合。 |
| F-003 | P1 | resolved | 新增需求表引用 E-320x/E-330x，但 progress 无 Evidence Ledger，导致 failure 转为「疑似编造」warning。 | 补齐两卡 Evidence Ledger；warning 71→61，相关 R8 warning 消失；DHR_62 的 R16 另以真实 test 证据闭合。 |
| F-004 | P2 | open（已移交 DHR-BL-16） | DHR_30 的 E-020 在 progress 定义为 review-dispatch，但历史 review 把 E-020~E-024 整段当 CLI 测试证据；E-025/E-027/E-032/E-056/E-058 在 progress 散文有定义但未进 Evidence Ledger，其中 E-025/E-027 被 findings 引用、E-056 被 review 与 findings 引用。 | 本卡只显性化不改历史裁决；按用户代决策授权移交 DHR-BL-16 拆正证据范围、账本与补录标记。 |
| F-005 | P2 | resolved | R23 仅靠加入「同版本/同调用链」关键词即可绿，缺真实切点。 | DHR30-M1、DHR31-M1/M5 已逐行写明 CLI/RPC/service/Store/重连切点；未新增测试事实。 |
| F-006 | P2 | resolved | DHR_32/33 摘要把候选-40 模型身份争议压成 `Opus fresh`。 | 改为 `--model opus` 与 SessionStart=fable-5 双证并存；用户裁决仍保留。 |
| F-007 | P3 | resolved | DHR_53 用 archive E-005 支撑八条未施工完成条件，证据错挂。 | 八条改 `—（未施工）`；仅需求表用 E-005 证明旧实现归档、新施工未启动。 |
| F-008 | P1 | resolved | DHR_32 一致性补审指出 F-3「已确认」与 DevPlan 待用户、review 空框冲突。 | 明确引用用户原话「有决策你来进行」仅授权风险路由；DevPlan 不再把 F-3 列为待决，人验表只展示现状、不要求重复确认；签名/verify 仍空。 |
| F-009 | P2 | resolved | DHR_32 计划范围漏 package/test，as-built 把不可派写成机读结论，evidence 两处表达冲突。 | DevPlan 范围、as-built 约束、codex-ninth 双入口、claude5 六能力逐行与 task_plan 第 7 规则均已补正。 |
| F-010 | P2 | open（已移交 DHR_35） | DHR_32 headless 正则收窄与 profiles 测试的本机/docs 耦合属于生产测试缺陷，超出 DHR_62 文档治理边界。 | 录入 DHR_32 F-11/F-12；按用户代决策授权移交 DHR_35，在真实闭环前保持 open。 |
