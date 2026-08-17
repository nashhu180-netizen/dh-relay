# DHR_03 复核报告 — 第一轮（R1）

## 头部

- **复核身份**：account4 / glm-5.2 / headless 无人值守会话 / 2026-08-15
- **复核对象**：dh-relay 模块 DHR_03 卡「接真实可见 psmux + 阻塞接力 dogfood」，工作树 `D:\MyFiles\ai-workflow\dh-crew\.dh-worktrees\DHR_03`（分支 wt/DHR_03）
- **复核范围（钉定）**：`6361b8d..12e1353`（卡内提交链 ef54c0f → 6c4694b → e7c8584 → 12e1353）
- **漂移说明**：复核进行中主控在同一工作树推进了批D 提交 `8a0fcbc`（decision run2 + F-017~F-019）。本报告主体按钉定版 12e1353 复核（关键内容用 `git show 12e1353:` 取钉定版亲验），漂移 `12e1353..8a0fcbc` 单列一节。两版引用行号已逐一比对，本报告所引行号在两版一致。
- **方法**：阅读序 = AGENTS.md 复核 worker 段 → workspace 四件套（brief/task_plan/findings/progress）→ design/01 验收口径 + as-built → 变更集全文（git diff 逐文件 + 关键文件全文精读）→ 离线测试亲跑 → 证据文件逐项交叉核对（签名亲自重算、事件数与 timeline 对账、哈希比对脚本语义核对）。
- **约束遵守**：全程只读（未改/未建/未删仓库文件，本报告为唯一例外写入）；未设 RELAY_REAL_TERMINAL、未跑 run-dogfood.ps1、未跑 preflight、未 git commit；密钥/凭据值未写入本报告任何位置。

### 跑过的命令及结果摘要

| 命令 | 结果 |
|------|------|
| `pwsh tools/relay/tests/run-relay-tests.ps1` | `RELAY ALL PASS (SKIPPED: 1)` — 15 套件全绿（real 套件按预期 SKIP，runner 明示 SKIPPED: 1）；reason 覆盖守卫 64 码。注意：在 HEAD=8a0fcbc 工作树跑（含 F-017/F-018 新断言，adapter 49 断言、agent-tool 32 断言） |
| `pwsh tools/relay/tests/relay-psmux-adapter.ps1` | SUITE PASS，ASSERTIONS 49 |
| `pwsh tools/relay/tests/relay-host-loop.ps1` | SUITE PASS，ASSERTIONS 32 |
| `pwsh tools/relay/tests/relay-agent-tool.ps1` | SUITE PASS，ASSERTIONS 32 |
| 只读 git（`log`/`status`/`diff`/`show`/`--no-pager diff`） | 取钉定版内容与漂移 diff，无写操作 |
| pwsh 探针（ConvertFrom-Json/Get-FileHash 临时会话内验证） | 验证签名口径、observation reason 全空、PS7 `-AsHashtable -DateKind String` 可用性 |

## 发现表

| ID | 级别 | 文件：行 | 问题 | 复现/证据 | 建议 |
|----|------|---------|------|-----------|------|
| R1-01 | P2（钉定版为 P1，HEAD 已修） | tools/relay/adapters/psmux-adapter.ps1:112（钉定版 probe） | 钉定版 probe `exact.count-eq0` 直接判 `terminal_state='exited'`：psmux 客户端偶发连不上服务器（列表空/"no server running"）时把活会话判 exited → Runner `exit-without-result` 暂停，属 fail-open | E-013 decision run1：A 会话 pane pid 活、attached=1 仍被判 exited 暂停（F-017）；8a0fcbc 已加 ProcessProbe 联合判据（diff 亲验 + 离线 49 断言含 listgone 用例） | 已修（HEAD 无需动作）；后续可给 probe_error 加区分 reason（如 `psmux-list-inconsistent`）以便排查 |
| R1-02 | P2 | tools/relay/host/relay-worker-entry.ps1:20 | 未给 `-ConfigDir` 时无条件 `Remove-Item Env:CLAUDE_CONFIG_DIR`：若用户真设了**非空**的他账号 CLAUDE_CONFIG_DIR，会被剥掉导致 claude 落回默认配置（F-012 只需清"空值"场景；run-dogfood.ps1:34 的"仅空值才删"才是安全写法） | 代码对照：worker-entry L20 `else{Remove-Item ...}` vs run-dogfood L33-34 空值守卫删 | worker-entry 改成与 run-dogfood 相同写法：仅 `IsNullOrWhiteSpace` 时才删，非空值报错或透传 |
| R1-03 | P2 | tools/relay/host/run-dogfood.ps1:124 | `Copy-Item -LiteralPath (Join-Path $renderDir '*')`：`-LiteralPath` 不展开通配符 → 渲染夹具目录从未拷入 evidence；且 `-ErrorAction SilentlyContinue` 吞掉失败，静默缺证据 | evidence/blocked、evidence/decision 目录列表均无 `dogfood/` 子目录（亲验）；`-LiteralPath`+`*` 语义在 PowerShell 文档明确不匹配 | 改 `-Path`（展开通配）或枚举子目录逐项 `-LiteralPath` 拷；去掉 SilentlyContinue，失败至少打印告警 |
| R1-04 | P2 | tools/relay/host/relay-host.ps1:93 | 宿主 done 判定不含 paused/pause_reason 检查：launch 失败或节点被 pause 时 active/ready/pending 可同时为空 → 裸 `Invoke-RelayHost` 返回 0（done），调用方若不自行核对节点态会静默把失败当成功 | F-014 实证（run2：launch-not-attached 后宿主判"无事可做"返 0）；run-dogfood L113-118 exit 3 兜底仅在 dogfood 路径生效 | done 条件加"无 paused/非 succeeded 节点"或在返回值带 `failed` 标志由调用方判 |
| R1-05 | P2 | tools/relay/host/relay-host.ps1:129（Save-RelayScreenshot） | 每次截图同时把**全部可见窗口标题**（EnumWindows+IsWindowVisible+GetWindowText）写入 `*.windows.txt` 入 evidence：实测文件含微信、WeMail、Obsidian、Edge 个人页签、"3_云端部署账号.md - Typora"等与本任务无关的个人隐私信息 | evidence/{blocked,decision}/shots/*.windows.txt 亲验（凭据扫描零命中，但窗口标题属隐私面） | 白名单化：只记录标题含 `RELAY:` 前缀的窗口；或全量标题仅入本地日志不入 evidence；至少在 README 声明该字段隐私属性 |
| R1-06 | P3 | tools/relay/tests/relay-host-loop.ps1:77 | 宿主禁词静态扫描只覆盖 relay-host.ps1 + relay-worker-entry.ps1 两个文件，缺 run-dogfood.ps1；模式缺 `send-keys`（task_plan B4⑪ 要求三文件）。run-dogfood 目前仅注释提及 send-keys 未调用，暂无实际风险 | L77 `-Path` 列表与 Pattern 亲验；grep run-dogfood.ps1 无 send-keys 实调用 | 扫描列表补 run-dogfood.ps1，Pattern 补 `send-keys\|paste-buffer\|load-buffer` |
| R1-07 | P3 | workspace/DHR_03/progress.md（E-012 措辞）+ evidence 拷贝清单 | E-012 声称"A/2 的 launch 记录 resume_from（launches/L-0003.json）"不实：L-0003.json（receipt）schema 无 resume_from 字段；该字段实际在 plans/relay-plan.v2.proposal.json 与 inbox/proposal-v2.json.consumed-*，且 plans/ 未在 evidence 拷贝清单中 | 亲验 launches/L-0003.json 12 键无此字段；grep resume_from 命中在 plans/ 与 inbox/；evidence 目录无 plans/ 子目录 | 修正 E-012 措辞指向真实文件；evidence 拷贝清单加 plans/（提案文件是接力语义核心证据） |
| R1-08 | P3 | tools/relay/host/relay-host.ps1:33（摄入改名） | 拒收/已摄入文件改名 `.consumed-<ticks>` 永不清理，长跑（数千 tick × 多文件）下 inbox 目录无界增长；tick 计数作后缀保证不撞名，但无轮转 | L33 `[IO.File]::Move($Path,$destination,$true)` 亲验；dogfood 实跑 46/62 tick 规模尚小 | run 结束时由 run-dogfood 归档清理 consumed 文件，或宿主加按数量轮转 |
| R1-09 | P3 | tools/relay/host/run-dogfood.ps1:74-77 | spawner 用同步 `WaitForExit`（SpawnTimeoutSeconds=900s）阻塞宿主 tick 循环：orchestrator/replanner 实测 54~299s，期间 tick 完全停摆，probe/idle 判定与 deadline 时钟全部顺延 | L74 `$inner=...claude -p...`、L77 `WaitForExit` 亲验；H2 日志 tick 间隔分析（decision run 46 tick/62s 平均但含长尾） | 改异步：spawner 派进程后立即返回，用进程句柄表在后续 tick 轮询退出码；或至少把 spawn 移出 tick 主循环 |
| （附注A） | P3 待核 | tools/relay/adapters/psmux-adapter.ps1:99-101 | launch 阶段1（等会话出现）超时返回 `psmux-new-session-failed` **不 kill 客户端进程**：若客户端卡死而会话终将出现，留孤儿客户端窗口；阶段2/3 均有 kill，仅此处语义依赖"会话未出现则客户端自亡"假设 | newfail 磁带模式只断言 reason，未断言客户端进程被回收 | 阶段1 超时分支按 client_pid 尝试 Stop-Process（best-effort），并在套件断言 |
| （附注B） | P3 待核 | tools/relay/adapters/psmux-adapter.ps1（默认 ClientLauncher 实现） | 默认 ClientLauncher 用 `Start-Process -ArgumentList`（数组拼接引号规则脆弱）：当前 argv 无空格路径安全；若 node_id/brief 路径含空格或引号可能拼错。当前 dogfood 配置不可触发，标待核 | 源码亲验：`Start-Process -FilePath $cmd -ArgumentList $argv` 形态 | 改用 ProcessStartInfo.ArgumentList（与默认 Exec 一致）或加含空格路径的离线用例 |

## 漂移节（12e1353..8a0fcbc，非本卡验收范围、仅记录）

- **adapter probe/stop 加固**（R1-01 修复）：probe 缝注入 `$processProbe`，列表缺席且 pane 进程活 → `probe_error psmux-command-failed`（有界，ProbeMaxConsecutiveFailures 兜底）；stop 确认要求 `$paneGone` 联合判据。离线 49 断言含 listgone/execfail 用例，亲跑绿。
- **agent-tool F-018**：decision_required 无 -Note 时默认 `progress_note="checkpoint <status>"`；套件 32 断言含该用例。
- **run-dogfood 决策态快照**（F-019）：decision 等待分支拷 relay-state.json 为 `state-at-decision-<event_id>.json`。
- **decision run2 证据**：签名 11 条亲验一致、三段 checkpoint 内容（working→decision_required q=zh/en→working "user chose zh"）在 .dh-runtime attempts 亲验、late-result-check L1~L5 全 PASS。
- 评估：漂移内容质量与钉定版一致，无新发现问题（除 R1-05 隐私面在 decision 证据同样存在）。

## A–H 逐项结论

| 项 | 结论 |
|----|------|
| A 契约与范围 | **PASS**。`git diff 6361b8d..12e1353 -- tools/relay/runner tools/relay/contracts` 仅 relay-params.psd1 +3 行（Idle 5/Stop 30/Attach 90，与 K-16 定值一致）；禁改路径（psmux-launch/dispatch*/dh-loop/protocol/tests/dh-crew/.dh-runtime）零触碰；authority 套件 diff 仅 K-16 允许的五键→八键+逐键点名一条；无 scope 外文件 |
| B psmux adapter | **PASS（钉定版带 R1-01）**。九键外形与 fake 逐键排序比对一致；存在性只靠 list-sessions `-ceq` 全等（无 has-session/`=name`/attach，源码双重静态断言亲验）；launch 失败清理=阶段2/3 全 kill、阶段1 无会话可杀语义自洽（附注A 待核）；指纹判据规避 launching→idle 非法边（对照 transition-matrix.json，首活一律 running）；registry `.tmp-<guid>`+Move 原子、单写者、内存副本与磁盘一致；注入缝 Exec/Clock/WindowProbe/ClientLauncher(/ProcessProbe) 完备 |
| C 宿主循环 | **PASS（带 R1-04/R1-08）**。tick 七步顺序与 K-9 逐行吻合；checkpoint host-read 私有名规避 Runner tmp 撞名（relay-store L25 证实撞名真实）；拒收也 consumed、套件断言不重摄；spawner 一次性守卫正确（replanner 按 generation、orchestrator 三条件）；禁词亲自 grep：host/worker-entry 无 question/options/answer/send-keys 调用 |
| D agent 侧工具 | **PASS**。身份链只出自 RELAY_RECEIPT（propose 例外有注释+RELAY_RUN_ROOT 定位+fail-closed 测试）；两段写原子、无 .partial 残留断言；handoff 头过 Test-RelayHandoffHeader、tail 先脱敏（FAKE123→`<REDACTED:api_key>`）后限长；F-013 修复彻底（checkpoint tried 可选、result 空列表为 `[]` 而非 `[null]`）；exit 3 仅对固定消息、exit 4 对校验失败 |
| E worker-entry 与 run-dogfood | **PASS（带 R1-02/R1-03/R1-09）**。argv 经 pwsh -File + ArgumentList，路径含空格/中文安全；run-dogfood 进程启动即清继承 env（安全写法）；证据凭据扫描（sk-/api_key/Bearer/password/secret）**零命中**；exit 3 兜底（非 succeeded 节点）有效 |
| F 测试守卫 | **PASS（带 R1-06）**。15 套件独立（GUID 临时目录、不碰 .dh-runtime）；无恒绿断言（`Assert-True $true` 类模式扫描零命中）；real 套件 SKIP 正确且 runner 明示；authority 八键断言 diff 亲验为唯一改动；reason 守卫扩根+Test-Path 守卫合理，host reason 全字面通过（64 码） |
| G 证据一致性 | **PASS（带 R1-03/R1-05/R1-07）**。blocked signature.txt 11 条**亲自重算**与非 observation 事件精确匹配；events 52 = timeline 54-2 表头；shots 6 对 png+windows.txt 文件名含 event_id 且内容含 RELAY 行；late-result-check L1~L5 全 PASS、三文件 sha256 前后相等；preflight 5/5 且 P4 states=running,running,running 与首活判据一致；H2 tick 计数 46/62 与日志 grep 计数一致 |
| H 文档一致性 | **PASS**。adapters/README、host/README 与代码一致（无 attach、指纹判据、90/30 定值、tick 七步）；task_plan K-4/K-5/K-16 修订与实现对齐；findings F-001~F-016 状态自洽（F-017~F-019 属漂移范围）；E-012 措辞不实见 R1-07 |

## 总结论

**approved-with-P2**

理由：

1. **验收口径 A3/A4/A7/H1/H2 全部达成且有证据链**：blocked 与 decision 两轮 dogfood 全链跑通（A 阻塞→决策→C 冻结→B 成功→A/2 resume_from→done），签名/事件/时间线/截图/迟到结果哈希比对逐项亲验一致，preflight 5/5，离线 15 套件全绿（在 HEAD 亲跑）。
2. **唯一 P1 级问题（R1-01 钉定版 probe fail-open）已在卡内漂移提交 8a0fcbc 修复**并有 49 断言与 decision run2 证据覆盖——若以当前 HEAD 验收，无 P0/P1 遗留。**双口径声明：若严格按钉定版 12e1353 验收，R1-01（活会话被误判 exited 导致节点静默暂停）构成 rework-required 项**；本报告按"卡最终态=HEAD"口径给出 approved-with-P2。
3. 剩余 P2 四项（R1-02 env 误伤、R1-03 证据缺夹具、R1-04 宿主静默返 0、R1-05 窗口标题隐私面）均有明确修复路径且不阻塞验收口径；P3 五项+两附注属健壮性/文档改进。
4. 安全红线核查：凭据零入工件（亲扫证据目录）、密钥值未出现在任何被复核文件、禁改清单零触碰。

REVIEW-R1-DONE
