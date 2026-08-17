# as-built · relay-psmux-host（DHR_03 真实 psmux adapter + 宿主循环）

> 首份快照：DHR_03（P1 批次 2·真实可见 psmux、宿主循环、agent 侧工具与 blocked/decision 两场 dogfood）。建立在 [relay-runner.md](relay-runner.md) 与 [relay-contracts.md](relay-contracts.md) 之上；Runner 仍是业务状态、authority、receipt、final result 与 event 的唯一写者。

## 范围与边界

- `psmux` adapter 实现六动词 `launch/probe/suspend/resume/stop/emit_observation`，返回键恰为 `backend,launch,probe,suspend,resume,stop,emit_observation,calls,sessions`；adapter 只翻译终端宿主语义，不判代码质量、不写 Runner state。
- 宿主循环负责摄入 worker 临时文件与 inbox 提案、调用 Runner tick、拉起 ready node、按 generation 触发一次性重编排，并输出每 tick 一行状态。
- agent 侧工具负责从 receipt 取得身份链，生成 checkpoint/result/handoff/session-tail/proposal；worker 入口注入环境并拉起可见 `claude|codex`。
- dogfood 包装负责渲染假需求、装配真实 adapter、启动 headless orchestrator/replanner、回收成功会话和复制证据。
- 本层不提供人工输入 API，不读取或代答终端对话，不调用 `suspend/resume`，不实现通用 DAG/工作流引擎，不实现 orca adapter，也未修改 Runner core 判定。

## 落点

| 类别 | 路径 |
|---|---|
| psmux adapter | `tools/adapters/psmux-adapter.ps1`；六动词九键、精确 session registry、可见窗口与屏幕指纹 probe |
| adapter 说明与 preflight | `tools/adapters/README.md`；`adapters/preflight/Invoke-RelayBackendPreflight.ps1`（P1～P6 判据） |
| 宿主循环 | `tools/host/relay-host.ps1`；tick、状态行、截图、时间线和证据复制 |
| agent 侧工具 | `tools/host/relay-agent-tool.ps1`；`checkpoint/result/propose` 与两阶段写 |
| worker 入口 | `tools/host/relay-worker-entry.ps1`；receipt 环境、继承环境清理、CLI 启动 |
| dogfood 包装 | `tools/host/run-dogfood.ps1`；`blocked|decision` 场景装配与证据落盘 |
| dogfood 夹具/迟到检查 | `tools/dogfood/{blocked,decision}/`；`Invoke-LateResultCheck.ps1` |
| 参数冻结点 | `tools/contracts/relay-params.psd1`；新增 `IdleAfterSeconds=5`、`StopDeadlineSeconds=30`、`AttachDeadlineSeconds=90` |

## 关键实测事实与冻结决策

1. **回收目标语法**：本机 `kill-session -t =<name>` exit 0 但会话仍在，是静默无效；stop 固定使用裸名 `kill-session -t <name>`，再以 `list-sessions` 的 `session_name -ceq <name>` 轮询确认消失（F-001、E-002）。
2. **活动判据**：`#{window_activity}` 只在建会话时写一次，pane 持续输出也不更新；probe 改为对 `capture-pane -p` 文本与 `cursor_y|cursor_x|history_size` 取 SHA-256，指纹变化报 `running`，沉默超过阈值报 `idle`（F-009、E-006）。
3. **窗口拥有会话**：`attach -t <name>`、`attach-session` 等在多会话时无视目标，总接到“当前会话”；launch 因此直接让可见客户端执行 `psmux new-session -s <name> -n <node> -- <cmd>`（非 `-d`），轮询会话出现、设置标题、等待 attached 与可见，全程不调用 attach（F-016、E-011）。
4. **首 probe**：会话存活且 registry 尚未记录 `observed_running` 时一律报 `running`，先保证 `launching→running` 合法；第二次起才按屏幕指纹判断，避免启动慢时误报 idle（F-015、E-010）。
5. **三参数定值**：`IdleAfterSeconds=5` 是屏幕指纹沉默窗；本机负载下单次 psmux CLI 约 0.5～3.7 秒、launch 约 3.5～8.3 秒，先定 Attach/Stop=30/15，run2 在 88% 负载下 attach 仍超时，最终冻结为 `AttachDeadlineSeconds=90`、`StopDeadlineSeconds=30`（F-010、F-014、K-16）。
6. **主控继承环境清理**：worker 入口未显式给配置目录时删除空的 `CLAUDE_CONFIG_DIR`，并清 `CLAUDECODE`、`CLAUDE_CODE_CHILD_SESSION`、`CLAUDE_CODE_ENTRYPOINT`、`CLAUDE_CODE_SESSION_ID`、`CLAUDE_PID`；dogfood 进程还清 `PSMUX_SESSION`，避免未登录、子会话告警和嵌套守卫（F-012、E-007）。
7. **agent-tool 空列表**：`result` 未传 `ChangedPaths/TestsRun` 时必须得到真正的空数组；实现先滤除 `$null`，修复“没改文件或没跑测试的节点无法交棒”的 `bad-type:tests_run`（F-013、E-008）。
8. **无 receipt 的 propose**：orchestrator/replanner 没有 launch receipt；inbox 依次按显式 `-InboxDir`、`$env:RELAY_RUN_ROOT/inbox`、receipt 推导路径定位，dogfood headless agent 走 `RELAY_RUN_ROOT`（progress E-007/E-008）。
9. **失联≠退出**：负载下 psmux 客户端偶发连不上服务器（列表为空/“no server running”），adapter 不能据此判 `exited`；`ProcessProbe` 缝交叉核对 pane 进程：列表缺席且进程仍活 → `probe_error psmux-command-failed`（有界，超阈值走 probe-lost 暂停），进程也消失才 `exited`；stop 的退出确认同样要求进程消失（F-017、E-013）。
10. **checkpoint 默认备注**：`checkpoint` 未传 `-Note` 时 progress_note 默认 `checkpoint <status>`，避免 decision 登记被 schema 拒（F-018）。
11. **句柄与后端闸**：session 存在性只认 `list-sessions` 全等且恰一行；registry 绑定 launch/session/name、psmux session/pane ID、pane/client PID 与窗口标题。psmux adapter 级 preflight P1～P5 为 5/5；orca 原语级为 4/5，未换后端（E-003/E-004/E-011）。
12. **失败分支必清理、异常不穿透**（两轮换人复核返工·F-022）：launch 阶段1（等会话出现）中途 psmux 失败或超时时 `Invoke-RelayPsmuxLaunchCleanup` 先裸名 kill-session、再经可注入 `ClientStopper` 尽力停掉窗口进程；`LaunchCommand`/`ClientLauncher` 抛异常（如 psmux 不在 PATH）与 registry 落盘失败均收敛为 `@{ok=$false;reason='psmux-command-failed'}` 而不穿透宿主 tick；registry `Move` 对 %TEMP% 扫描器短暂占用做 5 次有界重试。stop 遇 list 瞬态为空但 pane 进程仍活时照样 kill 并按"列表消失∧进程消失"确认，不再误判 `unknown-session`（与 probe 的 F-017 判据对称）。
13. **宿主出口三态**：`Get-RelayHostOutcome` 纯函数统一判定——done 且全 succeeded=0、done 但有 paused/blocked 等非 succeeded 节点=3、MaxTicks 未完=2；`Invoke-RelayHost` 与 `run-dogfood.ps1` 同用，避免 launch 失败后"无事可做"被当成功（复核 R1-04/R2-08）。dogfood 对 succeeded 会话的回收 stop 失败有界重试 3 次，收尾列出未确认回收的会话。
14. **进仓证据卫生**：`Save-RelayScreenshot`（preflight 复用同一函数）**只拍 `RELAY:*` 窗口自身**（EnumWindows 标题前缀 → GetWindowRect + `PrintWindow(PW_RENDERFULLCONTENT)`，被遮挡也能拍到窗口内容；多窗口纵向拼图，无窗口写占位图），不再抓整个桌面（F-024：整屏截图会把用户其他窗口内容带进仓）；旁边的 `*.windows.txt` 只记录 `RELAY:*` 标题（首行只记总数），其他可见窗口标题属个人隐私面不入仓；`Copy-RelayEvidence` 另复制 `plans/`（含 `resume_from` 的提案体），dogfood 逐目录复制渲染夹具/spawns/work（复核 R1-05/R1-03/R1-07）。

## 文件与函数清单

| 入口 | 一句话职责 |
|---|---|
| `New-RelayPsmuxAdapter` | 装配九键 adapter；`launch/probe/stop` 实现真实 psmux，`suspend/resume` 固定拒绝，`emit_observation` 固定空列表。 |
| `Get-RelayPsmuxSessionName` / session、pane helpers | 生成可预测 session 名，并用全等 session 行、单 pane 信息与屏幕指纹形成精确观测。 |
| `Read/Write-RelayPsmuxHandle` | 以 `<HandleRoot>/<session_id>.json` 两阶段写 registry，供跨宿主进程续接 probe/stop。 |
| `New-RelayHostContext` | 新建或打开 run，准备 inbox 与四键 `host-state.json`，注入 adapter、时钟、spawner 和证据选项。 |
| `Invoke-RelayHostTick` | 按固定顺序摄入 tmp/proposal、调用 Runner tick、拉起节点、触发一次性编排并计算终止条件。 |
| `Invoke-RelayHost` / `Get-RelayHostOutcome` | 运行有界 tick 循环，逐 tick 输出 `[relay-host] tick=...`；出口由 `Get-RelayHostOutcome` 判定：全成 0、done 但有非 succeeded 节点 3、超限 2。 |
| `Export-RelayTimeline` / `Save-RelayScreenshot` / `Copy-RelayEvidence` | 导出事件表、`RELAY:*` 窗口截图（PrintWindow·不抓桌面）与窗口标题清单，并复制终态证据包（含 `plans/`）。 |
| `relay-agent-tool.ps1 checkpoint` | 从 `RELAY_RECEIPT` 取得七字段身份链，校验后两阶段写 `checkpoint.json.tmp`。 |
| `relay-agent-tool.ps1 result` | 先写带身份头的 handoff 和脱敏限长 tail，再校验并两阶段写 `result.json.tmp`。 |
| `relay-agent-tool.ps1 propose` | 补算 plan hash、校验 proposal，并写入 run inbox；允许无 receipt 时走 `RELAY_RUN_ROOT`。 |
| `relay-worker-entry.ps1` | 注入 receipt/run/attempt/tool 环境，清继承标记，切到 work 目录并启动可见 `claude|codex`。 |
| `run-dogfood.ps1` | 渲染 blocked/decision 夹具，装配真实 psmux 与 headless spawner，循环执行、回收并复制证据。 |
| `Invoke-RelayBackendPreflight.ps1` | 用 P1 句柄、P2 可见、P3 可交互、P4 probe、P5 回收与 P6 陷阱留痕评估后端。 |
| `Invoke-LateResultCheck.ps1` | 用 A/1 旧 receipt 生成合法迟到 result，经真实 Runner 入口验证 stale 拒收与三份状态哈希不变。 |

## 事件与文件流

1. Runner 先写不可变 `launches/<launch_id>.json`；adapter 以 receipt 的 `session_id` 拉起窗口，并写 `psmux-handles/<session_id>.json`。
2. worker 只写 `attempts/<node>/<attempt>/checkpoint.json.tmp`、`result.json.tmp`、`handoff.md`、`session-tail.txt`；结构化 JSON 先写 `.partial` 再原子改名。
3. 宿主摄入 checkpoint 时先移到私有 `.host-read-<guid>`，摄入 result 时直接交 Runner；无论接受或拒绝，随后都改名为原逻辑路径的 `.consumed-<ticks>`，避免重复摄入。
4. orchestrator/replanner 把 `proposal-v<N>.json` 写到 `<run>/inbox/`；宿主按文件名排序，经 `Submit-RelayProposal` CAS 摄入后同样改名 `.consumed-<ticks>`。
5. Runner 追加 `plan_proposed/plan_activated/launch_receipt/checkpoint_accepted/result_accepted/...` 事件并更新投影；宿主不复制判定逻辑。
6. 证据包为 `events.jsonl`、`relay-state.json`、`active-plan.json`、`authority.json`、`host-state.json`、`launches/`、`psmux-handles/`、`plans/`、`timeline.md`、`signature.txt`、`shots/`（png + 只含 `RELAY:*` 的 windows.txt），dogfood 另复制 `spawns/`、`work/` 与渲染夹具 `dogfood/`；`attempts/`（handoff/tail）不进证据。

## 测试与守卫

`run-relay-tests.ps1` 当前固定 15 套件；断言数为 2026-08-16 复核返工后主控亲跑终态：

| 套件 | 断言数 | 套件 | 断言数 |
|---|---:|---|---:|
| `relay-contract-schema.ps1` | 41 | `relay-contract-identity.ps1` | 29 |
| `relay-contract-transitions.ps1` | 89 | `relay-contract-redaction.ps1` | 19 |
| `relay-contract-failures.ps1` | 16 | `relay-runner-authority.ps1` | 59 |
| `relay-runner-ingest.ps1` | 45 | `relay-runner-failures.ps1` | 65 |
| `relay-runner-replay-blocked.ps1` | 18 | `relay-runner-replay-decision.ps1` | 23 |
| `relay-psmux-adapter.ps1` | 53 | `relay-psmux-real.ps1` | 14（默认 SKIP） |
| `relay-host-loop.ps1` | 35 | `relay-agent-tool.ps1` | 32 |
| `relay-contract-reason-coverage.ps1` | 1 个系统守卫（64 码） | — | — |

- reason 覆盖守卫扫描 `../contracts`、`../runner`、`../adapters`、`../host`；非字面 reason 未在精确白名单或生产 reason 未被真实 Assert 覆盖即失败。
- adapter 离线套件锁定九键、全等匹配、裸名 kill、无 `has-session`/输入 API/attach、首 probe running、阶段1 失败清理（kill + ClientStopper）、launcher 抛异常收敛、stop 空列表∧进程活照样 kill、环境恢复与参数；host 套件锁定摄入顺序、拒收也 consumed、spawner 去重、状态行、paused 节点出口 3、以及宿主/worker 入口/dogfood 包装三文件无问答/`suspend/resume`/`send-keys` 路径。
- 真实套件只有 `RELAY_REAL_TERMINAL=1` 时才起可见窗口；未设置时必须打印 `SUITE SKIP relay-psmux-real ...` 且总清单统计 `SKIPPED: 1`。

## 已知限制 / backlog

- F-002 仍 open：psmux 没有宿主推送通道，`emit_observation` 为空；F-009 已把旧 `window_activity` 方案替换为屏幕指纹，但 agent 长时间思考而不输出仍可能显示为 idle，只影响终端维展示。
- attached 归零时只记 `client_lost=true`，P1 不自动重开窗口；`suspend/resume` 仍是 `not-used-in-p1`。
- orca 记录项未收口：`--focus` 会超时（F-004），`terminal close` 可报 `tab_not_found` 但实际退出、需另行复核（F-005），可见性只有 app 内证据、无 OS 标题全等证（F-006）；本卡只做原语级 4/5 对比。
- F-010 记录的 psmux 秒级 CLI/probe 时延仍存在；宿主默认 5 秒 tick 与 90/30 秒期限是本机负载实测折中，不代表长时稳定性结论。
- 复核遗留 backlog（F-023）：宿主 `.consumed-*` 无轮转、dogfood spawner 同步阻塞 tick、Runner 提交临时名与 worker `.tmp` 同名竞态——留完整流水阶段。
- 两场 dogfood 各只跑通一次（blocked run5→返工后 run6 重取、decision run2）；多线并发、非 psmux 后端、真实业务任务、通用 DAG/reviewer/quota 恢复、长时稳定性均未覆盖；decision 挂起期间的 `frozen_by` 直接快照缺（F-019，run-dogfood 已加 state-at-decision 快照，下轮补）。
