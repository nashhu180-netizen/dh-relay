# Issue #104 · light 独立复核

复核者：主会话（Claude Fable 5.1），非施工者（施工为 Sonnet 5.5 子代理）。复核范围：PR #105 的 `AGENTS.md`、relay-light SKILL、两侧 adapter、卡级总表模板与 task.md；只评估协议/模板一致性及教训适用性，未改运行代码。

## 一致性路径：PASS（一轮返工后）

- 首轮（`e088c9f`）发现 F1：移交规则要求交出方同步“接收方 execution_strategy.md 的登记”，与 SKILL「sole writer：`execution_strategy.md` 仅 orchestrator 写」冲突。F2：“下一张已开工卡”多张时不明确。
- 返工（`47b244c`）：交出方改为 Herdr prompt `[relay-light] card-chain maintainer-handoff <总表路径>` 通知接收方，接收方自登记并回确认，交出方收确认后才改页头与自己的登记，明写“交出方不写接收方的工件”；未确认/不可达按交回用户处理；多张按总表行序取首张、用户可另指定。F1/F2 闭合。
- 通知规则：非维护卡写好待同步行后由 orchestrator 发 `card-chain update`，维护会话先核原证据再汇总；通知不可达走既有“总表待同步”出口；投递确认复用两侧 adapter 已有“读 pane 末行确认投递”规则。与唯一写入者、交棒核对、无法更新三条既有规则无冲突。
- 权限边界：新增消息仅限 orchestrator（交互单会话为主会话）→ 维护会话/接收方；worker/reviewer/decider/watcher 写权与消息权限不变；不授予开工/合入/verify 权限；仍明确为会话流程检查，无程序强制。
- 五处（SKILL、两 adapter、模板第 2 条、AGENTS.md 半句）口径一致；AGENTS.md 只写“须先移交”，与细化流程不冲突。

## 教训路径：PASS

- 直接承接实跑缺口：OBD_43 编排把待同步行写进本卡 execution_strategy 后被动等待，总表 OBD_43 行停在“等待…不授予开工权限”与开工事实冲突；维护权三次移交均靠用户口头指示。两条规则分别补上通知触发与移交时机。
- 未过度工程化：无脚本/daemon/账本/文案断言测试，符合 #77 轻量边界。

## 验证

- CI（`47b244c`）：relay-tests ubuntu/windows、relay-light Python 三个必需 job pass；relay-core 仅观测。
- 本地：test_install_skill 19 OK、test_relay_log 275 OK、`git diff --check` 通过（见 task.md）。
