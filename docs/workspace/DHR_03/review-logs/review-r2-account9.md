# DHR_03 第二轮独立交叉复核报告（review-r2-account9）

## 头部

- 复核者：account9（headless，fresh context，未参与 DHR_03 实施，未见过第一轮复核结论）
- 复核时间：2026-08-15（本会话）
- 范围：DHR_03 全量 diff `6361b8d..HEAD`（6 commits：批A～批E），对抗清单 0 + A～H
- 视角：对抗性复核——对每条"resolved"与"fail-closed"声明默认怀疑，尝试构造反例
- 约束执行：只读（唯一写文件=本报告）；未起真实终端、未设 RELAY_REAL_TERMINAL、未跑 run-dogfood/preflight；变异实验在临时副本+备份恢复下进行，结束时工作树干净

### 执行过的命令与结果

| 命令 | 结果 |
|---|---|
| `pwsh -NoProfile -File tools/relay/tests/run-relay-tests.ps1` | `RELAY ALL PASS (SKIPPED: 1)`；15 套件全绿（41/29/89/19/16/59/45/65/18/23/49/14SKIP/32/32 + reason 覆盖 64 码） |
| 变异实验 M1：去掉首 probe 恒 running（F-015 修复） | `FAIL first probe after launch reports running even when screen is quiet (F-015)`，ASSERTIONS 49 / SUITE FAIL (1) |
| 变异实验 M2：去掉空列表时 pane 进程交叉核对（F-017 修复） | `FAIL session missing from list while pane process alive is a probe error, not exited`，SUITE FAIL (1) |
| 变异实验 M3：改回 `attach -t`（F-016 修复） | 3 红：`launch command order` / `adapter never runs new-session or attach through exec` / `adapter never calls attach (F-016)`，SUITE FAIL (3) |
| 变异后恢复 | `RESTORE OK: adapter byte-identical to original`；`git status --porcelain` 仅剩实施方既有的未跟踪 `review-logs/`（非本次产生） |
| `git diff --name-only 6361b8d..HEAD` 禁改路径扫描（psmux-launch/dispatch*/dh-loop/tools-protocol/tools-tests/dh-crew/.dh-runtime） | 0 命中；全部 151 个变更文件落在 `tools/relay/` 与 `docs/modules/dh-relay/` |
| 只读核对：transition-matrix.json / relay-runner.ps1 / relay-host.ps1 / run-dogfood.ps1 / relay-worker-entry.ps1 / relay-agent-tool.ps1 / evidence 三件套互证 | 详见下文 |

## 发现清单

| ID | 级别 | 文件:行 | 问题 | 复现/证据 | 建议 |
|----|------|---------|------|-----------|------|
| R2-01 | P2 | `tools/relay/adapters/psmux-adapter.ps1:101`（launch 阶段1） | 阶段1 两条失败路径不杀客户端进程：`catch{return psmux-command-failed}` 与超时 `return psmux-new-session-failed` 均直接返回，而窗口进程已由 clientLauncher 以非 -d 方式启动——会话晚到仍会建成，成为无 handle 登记的 orphan 可见窗口（其余 5 条失败分支：collision 前未启动、ambiguous/阶段2 两分支/title 失败/指纹失败均 kill-clean，唯独这两条漏了） | 代码走读：catch 出现在任何 kill 语句之前；阶段2 同样的 catch 就有 `[void](Invoke-RelayPsmux $exec @('kill-session','-t',$name))` 而阶段1 没有。离线套件无覆盖：fake 的 execfail 模式在首查（client 启动前）就失败，构造不出"client 已起、轮询中途 list-sessions 抛错"的磁带 | 两条 return 前补 kill-session + 短轮询确认（与阶段2 同构）；或在离线套件加"阶段1 中段失败必 kill"断言 |
| R2-02 | P2 | `tools/relay/adapters/psmux-adapter.ps1:115`（stop） | stop 的 `$exact.count-ne1 → unknown-session` 无 ProcessProbe 交叉核对，与 probe 的 F-017 修复不对称：负载下 list-sessions 偶发为空（"no server running"，E-013 已实测发生）时，活会话被 stop 判"不存在"→ Runner 记 stop-failed 后继续，窗口存活成 orphan | 代码走读：probe 同场景走 `pane_pid 存活 → probe_error psmux-command-failed`，stop 直接 return。套件 sticky 模式只覆盖 kill 后不消失（超时 fail-closed），未覆盖"kill 前列表为空" | stop 空列表且 pane 进程仍活时按有界重试（ProbeMaxConsecutiveFailures 语义）或返回 `psmux-command-failed` 而非 unknown-session |
| R2-03 | P2 | `tools/relay/runner/relay-runner.ps1:123` + `tools/relay/host/relay-host.ps1:82` | `$launched=& $Run.adapter.launch ...` 无 try/catch：adapter 内 `clientLauncher`（Start-Process psmux，psmux 不在 PATH 时抛 Win32Exception）或 `& $launchCommand` 抛异常 → 穿透宿主 tick 直接杀掉 host 循环，而非设计中的 `launch-failed` pause。probe/stop 均有 catch-all fail-closed，唯独 launch 没有 | 代码走读：L123 调用无保护；fake 套件 `launch-fail.json` 只覆盖"返回 ok=$false"，无"抛出异常"用例 | Start-RelayNodeAttempt 包 try/catch → 转 `launch-failed` pause；或 adapter.launch 外层补 catch 转 `@{ok=$false;reason='psmux-command-failed'}`（与 probe/stop 对齐） |
| R2-04 | P2 | `tools/relay/host/run-dogfood.ps1:102-103` | succeeded 节点回收 `[void]$stopped.Add($node.session_id)` 在 `adapter.stop` 结果**之前**：stop 失败（F-017 同类瞬态或超时）永不重试（session 已在 HashSet 里），窗口/会话残留且无告警；节点已 succeeded → 末轮 exit 0，残留不可见 | 代码走读：注释"回收一次"确为 at-most-once 设计，但失败分支只 Write-Host 一行；F-017 已证 stop 路径存在同类瞬态 | stop 失败时记 warning 并在收尾汇总列出未回收 session；或失败后从 HashSet 移除重试一次 |
| R2-05 | P3 | `tools/relay/host/relay-worker-entry.ps1:20` vs `tools/relay/host/run-dogfood.ps1:34` | CLAUDE_CONFIG_DIR 清理谓词不一致：worker-entry 未给 `-ConfigDir` 时**无条件** Remove-Item（连继承到的非空故意值也删）；run-dogfood 只删空白值。将来若以 env 指定另一账号 config 启动 worker 窗口，身份会被静默切回默认账号 | 两处代码对比；当前唯一调用方（LaunchCommand 不带 -ConfigDir，继承值为空）不受影响 | 统一谓词：非空保留、仅空白删除（与 run-dogfood 对齐） |
| R2-06 | P3 | `docs/modules/dh-relay/workspace/DHR_03/progress.md` E-012 | 两处账目与证据不符：① "shots/ 3 张拉起 + 2 张回收前"——实际 6 张（3 拉起 + 3 before-stop，多出 A2 before-stop）；② "A/2 launch 记 resume_from（launches/L-0003.json）"——receipt 共 13 键**无 resume_from 字段**，resume_from 只在 plan v2 提案体，且 evidence 未复制 plans/，证据包内无法直接核验该声明 | `ls evidence/blocked/shots/` 计 6 个 png；`cat launches/L-0003.json` 逐字段核对；`.dh-runtime/relay` plan v2 有 `resume_from={A,1}` | 更正 E-012 两处表述；或将 plan 提案体纳入 Copy-RelayEvidence 清单（顺带补 F-019 快照同理） |
| R2-07 | P3 | `evidence/blocked/shots/` 命名 | 事件号 000037 同时用作 `B1-before-stop` 与 `A2-launch` 两图前缀（同一次 node 循环、同一 last-event 快照）；"文件名含 event_id" 的 event_id 并非每图唯一，按文件名排序会乱 | `ls`：`...-000037-...-S-0002-before-stop.png` 与 `...-000037-...-S-0003.png` 并存；events.jsonl 000037=`launch_receipt|A|2`，两图皆在其后、000038 之前捕获（无歧义，仅前缀复用） | 截图文件名追加单调序号或 tick 计数，保证唯一可排序 |
| R2-08 | P3 | `tools/relay/host/run-dogfood.ps1:113-115` | F-014 修复（有 paused/非 succeeded 节点时 exit 3）无离线回归测试：host-loop 套件只覆盖"全 succeeded → done → 返回 0"，exit-3 分支仅真实 dogfood 演示过；且宿主层 done 判定含 paused 节点时返回 0 属有意分工（wrapper 兜底），该分工无测试锁定 | 套件清单核对：15 套件无 run-dogfood 相关；host-loop 32 断言无 paused-node 用例 | 抽纯函数（如 `Test-RelayDogfoodExitCode`）入离线套件 |
| R2-09 | P3 | `tools/relay/runner/relay-store.ps1`（Write-RelayJsonAtomic tmp=`"$Path.tmp"`）× `relay-runner.ps1:273` | Runner 提交 checkpoint.json/result.json 的临时名 `checkpoint.json.tmp`/`result.json.tmp` 与 worker 两阶段写**同名**：worker 在宿主 Move 之后、Runner 提交窗口内新写入的 tmp 会被 Runner 的 atomic 写覆盖（该次 checkpoint/result 静默丢失，worker 可重写；宿主侧 `.host-read-<guid>` 只解决摄入竞态，不解决提交竞态） | 命名链核对：agent-tool 写 `checkpoint.json.tmp` → host Move `.host-read-<guid>` → Runner Write-RelayJsonAtomic 落 `checkpoint.json`（tmp=同名）；result 同理（agent-tool 用 `.tmp-<guid>` 创建新文件，但 Runner 提交仍写 `result.json.tmp`） | Runner 提交临时名改 `.runner-tmp-<guid>`（与 Write-RelayJsonCreateNew 一致），或提交前探测同名文件存在则并入摄入 |
| R2-10 | P3 | `docs/modules/dh-relay/workspace/DHR_03/evidence/blocked/timeline.md` 等 | （更正·非发现）timeline 无截图引用属预期（E-012 亦未声称 timeline 含图），撤回复核途中一度怀疑的"timeline 少引用 1 图"；真正账目问题集中在 R2-06 | 实测两 timeline 均 0 处 shots 引用 | — |

## 对抗清单逐项结论（一行）

- **项0（F-009/013/015/016/017 "resolved" 挑战）**：三支变异实验 M1/M2/M3 各自恰被对应断言逮红、恢复后全绿（见命令表），F-015/F-016/F-017 的离线守卫有真牙；F-009 指纹判据由 adapter 套件指纹双向断言 + 真实套件 14 断言 + preflight P4 三方锁定；F-013 修复经"不带列表也能交棒且为空数组"断言验证，且我专门核查过 checkpoint 的 `-Tried`/`-Options` 同类路径（null 走省略键/缺 question 属 fail-closed 正确拒绝，非 F-013 同类）；blocked/decision 两份 signature 与 A3/A4 预期子序列逐项一致（blocked 11 行含尾行 `result_stale|A|1|stale-plan`），replay 套件 `exact equality` 双绿——**未能构造出任何"修复不覆盖 dogfood 失败路径"或"证据可伪造"的反例**。
- **项A（Runner 核心与禁改路径）**：`git diff 6361b8d..HEAD` 全量 151 文件均落在 tools/relay 与 docs/modules/dh-relay，禁改路径扫描 0 命中；runner 零 diff；contracts 仅 params 增三键（authority 套件八键断言为唯一迁移，K-16 合规）——通过。
- **项B（psmux adapter）**：九键形状与 fake 全等（套件断言）；存在性只走 list-sessions `-ceq` 全等（无 has-session/前缀/`-t =`，源码扫描+argv 扫描双断言）；窗口拥有会话全程不调 attach（M3 证实扫描真咬）；首 probe 恒 running 与指纹判据使 launching→running 为唯一可达首跳（matrix 无 launching→idle 边，套件显式断言 unlisted）；stop 确认要求"列表消失∧进程消失"才报 ok（无 ok 而活会话）；注册表两阶段写；六条注入缝（Exec/Clock/WindowProbe/ProcessProbe/ClientLauncher/LaunchCommand）生产默认值均在闭包内，无裸 Get-Date/UtcNow/Start-Process 绕过——**发现 R2-01/R2-02 两处 P2（阶段1 不 kill-clean、stop 失联判 unknown-session 不对称）**。
- **项C（宿主循环）**：K-9 tick 顺序与 host/README 逐条一致；拒收也 consumed（"rejected and still consumed"+"not ingested twice"双断言）；replanner 每 authority generation 一次、orchestrator 全程一次（host_state 字段持久化+套件断言）；done 判定对 paused 节点由 run-dogfood exit 3 兜底（F-014 修复在位，但无离线回归——R2-08）；静态扫描 host+worker-entry 无 question/options/answer/suspend/resume 引用（agent-tool 未扫因其含合法 Question/Options 参数，合理）——发现 R2-09 提交期 tmp 同名竞态（P3）。
- **项D（agent 工具）**：身份只取 RELAY_RECEIPT 七字段；两阶段写 `.partial→Move` 无残留（套件断言）；handoff 头/脱敏限长 tail/git snapshot 全有断言；F-013 修复完整（`@($Paths|Where-Object{$null-ne$_})`，checkpoint `-Tried` 用 null 省略键无同类问题）；propose 无 receipt 时 inbox 优先级 InboxDir→RELAY_RUN_ROOT→receipt 推导、全无则 fail-closed；exit 3（无 receipt）/exit 4（校验败）语义断言齐全——通过，无新增发现。
- **项E（入口/包装/注入/泄密）**：LaunchCommand argv 以数组直传 Start-Process（无 shell 拼接，空格/中文 brief_ref 无注入面）；spawner 同步阻塞 tick 是有意设计（headless spawner 秒级，README 已述）；证据复制不含 attempts/（handoff/tail 不外泄）、events 无密钥字段、work 为 worker 产物——未发现凭据外泄路径（progress_note 未脱敏属 worker 自律，P3 备注）——发现 R2-04/R2-05（P2/P3）。
- **项F（套件独立性与恒绿）**：15 套件全独立（临时目录+注入时钟，不碰 .dh-runtime）；恒绿逐条挑战：idle 用例覆盖双向（首 running→idle→保持 idle）、F-015/F-017 断言走真实分支（变异证实）、reason 覆盖守卫扫 4 个生产根且 64 码全为真实 Assert（无常量）、真实套件 SKIP 逻辑正确（SUITE SKIP 行 + SKIPPED: 1 统计）；唯一缺口=R2-08（run-dogfood exit 3 无离线覆盖）。
- **项G（证据互证/preflight）**：events/state/handles/shots/windows.txt 互证成立（host-state consumed 5 条×tick 46；A2 拉起 windows.txt 含 S-0002 与 S-0003 双窗口=多会话并存实证；000038 起 S-0003 observation 连续 running 与首 probe 语义一致）；签名/回放 exact equality 双绿；迟到结果 L1-L5 哈希不变（A3 覆盖）；preflight 5/5 与当前代码一致（P4 三次 running 可由"首 probe 恒 running+指纹变化"解释，非恒绿陷阱）；E-012 账目失真见 R2-06/R2-07。
- **项H（文档一致性）**：adapters/README 与代码语义逐句一致（裸名 kill/窗口拥有会话/指纹判据/90-30 定值）；host/README 与 K-9 一致；task_plan K-4/K-5/K-16 修订均已落到 findings/as-built 且与代码一致；F-002/F-019 保持 open 未被写成已决策；as-built 测试表断言数与 progress 终态记录一致——通过。

## 裁决

**approved-with-P2**

- 无 P0/P1。全部 5 条 findings.md 中 P1 resolved 项（F-009/013/015/016/017）经变异实验与逐分支走读，修复与守卫真实覆盖 dogfood 失败路径，未构造出反例。
- 本轮 4 条 P2 均为失败分支健壮性（R2-01 不 kill-clean、R2-02 stop 不对称、R2-03 launch 无 try/catch、R2-04 stop 失败不重试），触发概率低（需 psmux CLI 瞬态失败或二进制缺失），不改变验收口径（A3/A4 机器证与 H1/H2 人判材料本身无失真）；P3 主要为证据账目（E-012）与文档一致性，建议下轮或收口前顺手修。
- 证据链整体可信：replay 套件对两份正式证据 exact equality、截图/窗口标题/事件号互证、迟到结果哈希不变，未发现可伪造点。

REVIEW-R2-DONE
