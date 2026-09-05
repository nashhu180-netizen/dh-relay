<!-- dh:v1 -->
# findings — DHR_72

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|
| F-7201 | P2 | 当前无施工期新问题；F-3517、F-3520 与 DHR_74 R31 回签义务由任务合同承接。 | DevPlan DHR_72 | 施工中逐项取证，不将前卡证据冒充本卡完成。 | tracking |
| F-7202 | P1 | **允许路径与验收冲突**：机器证 B 要求长期 `idle` 不结束、仅人工 stop 退出；`test/dhr64-driver-observation.test.mjs` 的 idle 用例现有 `await driver.done`，实现后将不能自行结束。该文件未列入 DHR_72 允许路径，但它属于 55 文件套件，无法在不改它的情况下达成机器证 E 的 55/55。 | E-7202；`workflow-driver.mjs:404-417`；DHR64 idle 用例 | B-37 已确认并落地：该文件仅两条 done/idle 用例改为 Attention→后续 poll→显式 stop。 | resolved |
| F-7203 | P1 | **默认回归仍有旧终态断言**：`identity-quota.test.mjs` 九条用例以 `idle/done → herdrJudge → Result` 驱动旧 quota/judge 测试；DHR_72 实现后这类用例不能自然结束，且仅改 stop 会抹去原 fallback 业务断言。 | E-7204、E-7205；`identity-quota.test.mjs:131-340` | 用户确认另立 DHR_34 配额迁移/修复卡，先定正式 Receipt-bound Result 是否继续触发自动 fallback；DHR72 不改该文件。 | deferred |
| F-7204 | P1 | 三条非 quota 的直接回归仍把 `idle/done → driver.done` 当作结束，导致持久观察下挂住；另有 scope 文本遗漏 waiter 配套清理与新守卫文件。 | E-7209；三路 fresh review | B-39 已用户确认：仅迁移 `dhr64-result-bridge` missing、`dhr70` C、`herdr-adapter` blocked→done；补齐允许文字和直接证据。E-7213 冻结五文件 `55/55`、0 skip、0 fail。 | resolved |
| F-7205 | P1 | DHR72 专属连续观测测试在 `%TEMP%` 临时根重复撞 `state.json.<uuid>.tmp → state.json` 的 `EPERM`；driver 随后 fail-closed，checkpoint 状态等待超时。隔离出口绿不能替代整份专属测试绿。 | E-7211；两次完整/单独运行 exit=1；E-7213 修后复跑 | 仅在测试侧把高频持久读取改为等待 fake 状态稳定后的单次快照读取；不改 Store、原子写入或临时目录策略。修后 DHR72 专属套件 `8/8`，未再出现该签名。 | resolved |
| F-7206 | P1 | DSH-off 冻结 Codex Profile 的真实实录此前始终未取得 checkpoint：首次表现为 prompt/agent 已结束而账本停在 `attempt_started`；用户授权处理交互后，隔离 probe 已证明短 prompt 能真提交且命令退出 0，但旧基线仍无首条 host observation。 | E-7212、E-7215、E-7216；脱敏 failure/host-view/events | DHR75/76 入主干后由 E-7221 在本卡新基线取得真实 checkpoint，保存账本 checkpoint=4、Result=0；机器证 F 已满足。 | resolved |
| F-7207 | P2 | Receipt-bound Result 与同一轮已排队的 Attention 写入竞争时，Store 会在 Attempt 终态后拒绝该旧写，driver 记录 `E_TERMINAL_STATE_CONFLICT` 并 fail-closed；当前未见终态后新增事件，但日志噪声与竞争窗口仍需后续观察。 | E-7213；冻结五文件 DHR_33 driver #3/#5 输出 | 保留现役 Store 终态闸和零追加断言；不在本卡扩大为非轮询段重构。 | tracking |
| F-7208 | P1 | **旧基线真实启动期间 host lease 先过期**：三次追加实录的 lease 都早于 `attempt_started` 到期，driver 随后没有写出 host observation；最后一份 `expires_at=09:11:23Z`，attempt 为 `09:11:32Z`。adapter 与 Store 分别隔离验证可用，故修复面落在同步启动与 lease/host/service 生命周期。 | E-7216、E-7217；三份脱敏 `host-lease.json` + `events.jsonl` | DHR72 未越界修启动链；吸收 DHR75/76 后 E-7221 的真实实录已在有效 actor 下写出 alive observation 与 checkpoint。旧失败保留作前置卡效果对照。 | resolved |
| F-7209 | P2 | DHR72 真实 runner 的 `agent prompt` 会以 native 非零退出，且 Codex 可能仍保持 idle；旧脚本在 PowerShell `ErrorActionPreference=Stop` 下无法进入 Enter 回退，回退后的 400ms 观察窗也短于 Herdr 手册 5s 判据。 | E-7220；run1~run5 脱敏 failure/host-view | 指令压为单行；仅对 prompt 局部捕获 native exit；按手册最多补两次 Enter、每次观察 5s。E-7221 真机成功。 | resolved |
| F-7210 | P1 | 脱敏器把无 `rcpt-` 前缀的 launch Receipt UUID 按通用裸 UUID 规则写成 `att~`，结构化 `receipt_id` 与 operation 文件名丢失 Receipt 角色语义。 | E-7226 一致性复核；21 个字段文件、10 个 launch operation 文件名 | 按 `receipt_id` 字段归一为 `rcpt~`，并仅对 `relay.launch-receipt/v2` 文件归一名称；全卡应用后 dry-run 0/0、`receipt_id:att~` 与错误 launch 文件名均为 0，原复核者 RECHECK PASS。 | resolved |
