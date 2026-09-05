<!-- dh:v1 -->
# findings — DHR_75

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|
| F-7501 | P2 | `spawnSync` 饿死续租是当前最强候选机制，尚未排除其它启动停摆机制。 | evidence/37；DHR_72 E-7212/E-7215~E-7218 | 本卡只证明/修复同步阻塞路径；剩余机制保留给 DHR_73。 | open |
| F-7502 | P2 | `runtime.test.mjs:514` 在主树与任务树均因 5s 自停预算早于本机约 35s 初始化而红；隔离 TEMP 不能消除。 | E-7508/E-7509 | 不归因 DHR_75，不越界修改 `runtime.test.mjs`；交 fresh 复核判断其是否阻塞机器证 E，必要时另走 B-adjust。 | open |
| F-7503 | P2 | Windows `taskkill` 清理原先无自身超时且忽略非零退出，极端时 async CLI 可能不能有界 settle。 | E-7515 | 增加 5s 清理上限；error、非零与超时均回落直接 `SIGKILL`，仍等待目标 child close。 | resolved |
| F-7504 | P2 | stdout/stderr pipe 原先未监听 `error`，底层流错误可能成为未处理异常。 | E-7515 | 两条 pipe error 归一到 `spawn:<code/message>` 失败形状，并触发同一有界清理。 | resolved |
| F-7505 | P2 | 极端情况下 Windows `taskkill /T /F` 自身失败或超时，fallback 只能直接 kill 父进程，Node 标准库无法保证已脱离的后代同步清零。 | E-7518 | 主路径已用真实父子进程验证零残留；异常工具失败路径保持有界且 fail closed。交第二轮 reviewer 判断是否为可接受平台边界或需另卡。 | open |
| F-7506 | P1 | 原主会话 `HERDR_ENV` 为空，无法合法执行真实机器证 F。 | E-7521/E-7522/E-7529 | 已进入 Herdr-managed pane 并真实执行；环境权限阻塞解除，运行结果转由 F-7508 承接。 | resolved |
| F-7507 | P3 | L-7501 已在本卡工作区形成并经 miner/教训复核通过，但共享 `knowledge/教训库-候选.md` 不在冻结 allowed paths。 | E-7523/E-7525 | 不越界 append；handoff 给后续获授权的共享知识维护任务。 | open |
| F-7508 | P1 | 旧基线真实链在 Herdr CLI 之前执行全 Profile 同步 alias 校验；两次约 19.7s，饿死默认 15s Host lease。 | E-7529/E-7530 | DHR_76 已在独立范围承接该面；DHR_75 rebase 后 E-7535 已取得新鲜 lease 下的首 observation。旧失败保留为历史事实，不再阻塞本卡 F。 | resolved |
| F-7509 | P2 | E-7535 的冻结 Codex Profile 在 agent-ready 变为 blocked，受控 runner 因而没有发送无害命令，未取得 checkpoint。 | E-7535 | F 的合同只要求 attempt 后首 observation 且 lease 新鲜，checkpoint 仅为佐证；等待 fresh 需求复核确认该解释，不把它写成 DHR_72/DHR_35 证据。 | tracking |
