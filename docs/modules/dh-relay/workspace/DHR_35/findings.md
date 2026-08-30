<!-- dh:v1 · workspace/DHR_35/findings.md -->
# findings — DHR_35

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|
| F-3501 | P2 | Linux SSH smoke 按 DHR-B-22 调整①延后；本卡 Windows 闭环不证明 P6-M6。 | `progress.md` E-3502；DevPlan §4 | 保持 `延后/受限`，P6 阶段闸由用户受理或指定补录卡。 | open |
| F-3502 | P1 | 默认 Executor Profile Registry 在不输出配置内容的只读预检中 fail-closed：`E_BAD_VALUE:PROFILE_REGISTRY / E_UNRESOLVED_CONFIG`。真实 Attempt 不能安全签发，不能猜测、局部绕过或静默改写用户配置。 | `progress.md` E-3503、E-3507 | 用户已授权维护方向；A-full 候选要求 B-adjust 单列非敏感 registry 维护/复验卡，仍须在正式设计与该卡 D-start 后才操作。 | open |
| F-3503 | P1 | 现役生产 `service.mjs` 启动 driver 时未注入 `herdrJudge`；driver 对真实 Herdr `done/idle` 无 verdict 就不写 Result，最终只产生 Attention/等待。即使 F-3502 消除，DHR35 的 Receipt→Result→终态目标仍不可证。 | `progress.md` E-3504、E-3507；`runtime/service.mjs:284-287`、`runtime/workflow-driver.mjs:253-255` | 用户已确认的 A-full 候选改为 Receipt-bound submission，而非补一个 status→success judge；须正式设计、fresh review、B-adjust、新 bridge 卡 D-start 后施工。 | open |
| F-3504 | P2 | 三文件组合定向测试没有终态摘要；仅隔离 DHR61 Receipt 用例 1/1 通过。共享环境有既有 Node 进程，未清理以免影响并行 WIP。 | `progress.md` E-3505 | 不作为失败或通过结论；后续在新的 worktree-local basetemp/隔离环境重跑。 | open |
| F-3505 | P1 | `herdr.codex.main` 的 Registry 可解析，但实际 `freezeProfileIdentity` 返回 `E_NONSECRET_PROJECTION_MISSING:/profiles`。若绕过它，Receipt 的身份快照将不可证；若改用户配置则越过本卡边界。 | `progress.md` E-3512；`evidence/herdr.codex.main/failed-run/events.jsonl` | 保持 fail-closed。须由拥有用户级 registry 非敏感投影维护权限的后续卡决定并实施；DHR35 不读取配置正文、不猜路径或值。 | open |
| F-3506 | P2 | Claude Profile 的身份冻结已通过，但尚未真实拉起：现役 `herdr-executor.mjs` 统一调用 `agentStart(kind=claude)`，而 Windows 已登记该路径须改经 `pane run` 才能绕开 CLI shim。 | `runtime/executors/herdr/herdr-executor.mjs`；`knowledge/herdr-派活操作.md`「已知坑 1」 | 这是 DHR35 的生产禁改路径；在 P1 未闭合前不启动 Claude Attempt，也不将已知风险写成已复现缺陷。 | open |

> 级别：P0 阻塞发布 / 数据丢失 / 安全 · P1 阻塞任务目标 · P2 质量 / 证据缺口 · P3 后续不阻塞。
