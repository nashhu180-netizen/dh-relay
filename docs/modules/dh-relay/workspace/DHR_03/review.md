<!-- dh:v1 · review.md — 验收。🔴 收尾填。三区：独立复核区 → AI 提交区 → 人类签名区，物理隔离。 -->
# review — DHR_03 接真实可见 psmux 并完成阻塞接力 dogfood

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

**第一轮·批次小审合集**（施工批次检查点前移；每批 fresh 小审只看本批 diff 与证据）

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|
| account4 / glm-5.2 · headless `claude -p`（CLAUDE_CONFIG_DIR=~/.claude-account4）· 未参与实施（施工=codex 批A/B + 主控 opus 批C/D） | 全量 `6361b8d..12e1353` 钉定 + 漂移节 `..8a0fcbc`；A~H 逐项 + 离线 15 套件亲跑 + 签名亲自重算 + 证据交叉核对 | **R1-01 P1（钉定版 probe fail-open·HEAD 8a0fcbc 已修）**；P2×4：R1-02 worker-entry 无条件删非空 CLAUDE_CONFIG_DIR / R1-03 `Copy-Item -LiteralPath '*'` 致 dogfood 夹具从未拷入证据 / R1-04 宿主 done 含 paused 节点仍返 0 / R1-05 windows.txt 记录全部窗口标题=个人隐私面；P3×5：R1-06 静态扫描漏 run-dogfood+send-keys / R1-07 E-012 措辞不实（resume_from 不在 receipt）+plans/ 不进证据 / R1-08 consumed 文件无轮转 / R1-09 spawner 同步阻塞 tick；附注 A（阶段1 超时不 kill 客户端）/B（Start-Process 拼参脆弱）；结论 **approved-with-P2（HEAD 口径 0 P0/P1）** | log:`review-logs/review-r1-account4.md`（+ `.headless.log`）| E-017 |

**第二轮·增量复核**（另派 fresh-context、未参与实施的独立 agent 实例；施工会话不得参与）

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|------|
| account9 / deepseek · headless `claude -p`（CLAUDE_CONFIG_DIR=~/.claude-account9）· 与轮1 不同账号/不同会话、未读轮1 报告（轮2 报告 23:27 落盘时轮1 报告尚未写出，二者并行、无先后注入）· 对抗视角 | 全量 `6361b8d..HEAD(8063b3e)`；对抗清单 0+A~H；三支变异实验 M1/M2/M3 复现（各恰被对应断言逮红）；禁改路径扫描 0 命中 | 独立复现轮1 之外的：**R2-01 P2** 阶段1 两条失败路径不杀客户端 / **R2-02 P2** stop 空列表判 unknown-session 与 probe F-017 不对称 / **R2-03 P2** adapter.launch 抛异常穿透宿主 tick / **R2-04 P2** dogfood 回收 stop 失败永不重试；P3：R2-05（=R1-02）/ R2-06（=R1-07 + shots 计数）/ R2-07 截图 event_id 前缀复用 / R2-08 exit-3 无离线回归 / R2-09 Runner 提交 tmp 与 worker `.tmp` 同名竞态；F-009/013/015/016/017 修复"未构造出反例" | **approved-with-P2**（0 P0/P1） | log:`review-logs/review-r2-account9.md`（+ `.headless.log`）| E-017 |

**返工收敛**（有 open P0/P1 → 修 → 重跑证据 → 复核者再过；最多 3 轮）

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|------|--------------|----------------------|---------|
| 1 | 0（两轮均无 open P0/P1；R1-01 P1 在轮1 进行中已由 8a0fcbc 修掉并被轮1 亲验） | 主控一次性合并处理两轮 P2/P3：R2-01/附注A（阶段1 失败 kill-session + 可注入 ClientStopper 停窗口进程）、R2-02（stop 空列表∧pane 活→照样 kill 确认）、R2-03（launchCommand/clientLauncher/registry 落盘抛异常→`psmux-command-failed`）、R2-04（dogfood stop 有界重试 3 次 + 收尾列未回收会话）、R1-02/R2-05（worker-entry 只删空值 CLAUDE_CONFIG_DIR）、R1-03（证据拷贝改逐目录 + 不吞错）、R1-04/R2-08（`Get-RelayHostOutcome` 纯函数·`Invoke-RelayHost` done-with-paused 返 3·host-loop 套件 paused 用例）、R1-05（windows.txt 只记 RELAY:* + 已入仓 18+4 份就地清洗；preflight 写法同改）、R1-06（静态扫描加 run-dogfood + send-keys/paste-buffer/load-buffer）、R1-07/R2-06（E-012 措辞更正 + `Copy-RelayEvidence` 加 plans/）、R2-07（dogfood 截图名加 tick 序号）、附注B（默认窗口启动器改 ProcessStartInfo.ArgumentList）；**转 backlog**：R1-08 consumed 无轮转、R1-09 spawner 同步阻塞（有意设计·README 已述）、R2-09 Runner 提交 tmp 同名竞态（涉 Runner core，本卡"只扩不改"）——记 findings F-022；重跑：离线 `RELAY ALL PASS (SKIPPED: 1)`（adapter 53 / host-loop 35 / agent-tool 32）、真实套件 14/14、adapter 级 preflight 5/5、**dogfood blocked run6**（新代码路径全量重取 A3 证据·E-018）；主控 E10 备料自查又逮 F-024（整屏截图隐私面）→ 截图改 PrintWindow 只拍 RELAY 窗口、38 份旧 PNG 全删、preflight 5/5 与 **blocked run7**（E-020）重取 | 是（0 open P0/P1；P2 全修、P3 修 5 转 3；F-024 主控自查修） |

**需求复核结论**：A3/A4/A7 三条机器证均满足，且轮1/轮2 独立复算签名、复现变异探针、核对迟到结果哈希后均判"证据链可信、未发现可伪造点"；H1 用户判通过、H2 判「有条件值得：先跑真实业务任务再定」（2026-08-16 对话）｜证据 E-012→E-018→E-020（run7 现役）/E-014/E-006+E-011｜由 主控(opus) 汇总 + 轮1 account4 + 轮2 account9｜派出=log:review-logs/review-r{1,2}-*.md

**教训复核结论**：L-001～L-004 保留；本轮新增候选 L-005「失败分支清理要按"资源已创建时刻"逐条对表（阶段1 客户端已起但会话未现→漏 kill）」、L-006「进仓证据的窗口/进程枚举类文件先按白名单过滤（隐私面），不能事后靠扫描凭据兜底」｜由 主控(opus)，素材来自轮1 R1-05/轮2 R2-01｜派出=n/a（主会话）

## 第 4 路·一致性复核（横向：本次动的口径 vs 同类路径既有定义）

<!-- dh:consistency-review:v1 task=DHR_03 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|---------|-------------|------|---------|
| psmux adapter 六动词返回形状 / 9 键 | `adapters/fake-adapter.ps1` + `adapters/README.md` v1 契约 | 一致（离线套件"adapter has exactly nine keys"+ launch 返回 `session_id`/`handle`、probe `terminal_state/probe_error`、stop `exited_after_ms` 同形） | 无需处置 | E-006/E-011 |
| psmux 会话拉起（清 PSMUX_SESSION / 重名 fail-closed / 退出码） | dh-crew `dispatch-launch.ps1` `Invoke-PsmuxNewSession`（只读参考·不调用） | 不一致：dh-crew 走 `new-session -d` + 另开 attach 客户端；relay 改为窗口拥有会话（`new-session -s` 非 -d·不调 attach），因实测 psmux `attach -t` 无视目标（F-016） | 有意差异（dh-crew 侧多会话共存时同样会踩 F-016，已记 backlog 提示） | E-011 |
| 宿主循环对 Runner 的调用面 | `as-built/relay-runner.md` 入口清单（只调不复制判定） | 一致（宿主只调 New/Open-RelayRun、Submit-Relay{Checkpoint,Result}File、Submit-RelayProposal、Invoke-RelayTick、Get-RelayReadyNodes、Start-RelayNodeAttempt、Read-RelayEvents；`git diff 6361b8d..HEAD -- tools/relay/runner` 为空） | 无需处置 | 复核轮1/轮2 A 项 |
| 新增 params 键 | `as-built/relay-contracts.md` 参数表 | 一致（三键已补进 relay-contracts.md/relay-runner.md 参数行；authority 守卫迁八键 K-16） | 无需处置 | E-006 |

> `定义是否一致` 二选一：`一致` / `不一致`。`裁决` 三选一：`无需处置` / `有意差异` / `遗漏待修`。

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：对实现有没有 100% 信心？没有就逐条列 gap。
- 无 100% 信心处逐条：① decision 挂起期间 `frozen_by=[A]` 只有事件顺序证（C 在 A result 后才 launch）+ DHR_02 回放套件，缺当场 state 快照（F-019·已加快照代码待下次跑）；② psmux 秒级时延与本机 herdr 高负载绑定，Attach 90/Stop 30 是本机折中，长时稳定性未测；③ blocked 连续三次通过（run5/run6/run7·前 4 次分别逮 F-013/F-014/F-015/F-016）、decision 一次通过（前 1 次逮 F-017/F-018），"长期稳定"仍未证；④ psmux `list-clients` 记账不稳、`attach -t` 失效属上游缺陷，绕行而非修复；⑤ orca 仅原语级/派活体验对比（4/5、F-020），未做 adapter 级；⑥ decision run2 的截图因 F-024（整屏截图含用户其他窗口内容）已删除，A4 机器证不依赖截图（事件/checkpoint/timeline 完整），H1 若要看 decision 现场图需用户再答一次 run3。

**设计契约传导声明**（收口时只保留一条）：

- params 追加三键（IdleAfter 5 / Stop 30 / Attach 90）已传导至 `as-built/relay-contracts.md`、`as-built/relay-runner.md`、首份 `as-built/relay-psmux-host.md`；后端仍 psmux，**不**提议修订设计决策 7（orca 4/5·F-004~F-006/F-020）。

**需求对齐证据**：

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| A7 后端 preflight（psmux adapter 级） | 主控跑 `Invoke-RelayBackendPreflight -Backend psmux -Level adapter` → 五判据 pass + 截图 | E-006（首取）/ E-011（窗口拥有会话后重取 5/5）+ `relay-psmux-real.ps1` 14/14 | 满足 |
| A3 blocked 接力（真实 psmux + 真实 agent） | 主控跑 `run-dogfood -Scenario blocked` → 事件签名精确子序列 + 迟到 A1 stale + 截图/时间线互证 | E-020（run7·现役·0 人工·A3 子序列精确·late-result-check L1~L5·截图只含 RELAY 窗口；run5/run6 E-012/E-018 同结论） | 满足 |
| A4 decision 挂起（用户回答一次） | 主控跑 `run-dogfood -Scenario decision`，用户在窗口回答一次 → 冻结/继续/零 resume + 人工动作数=1 | E-014（run2·人工 1·B 在挂起期间完成·C 在 A result 后拉起·suspend/resume 0·静态扫描 0） | 满足（frozen_by 直接快照缺·F-019） |
| H1/H2 | 对话展示截图 + 时间线 + H2 对照表 | E-020/E-014 shots+timeline、`evidence/H2-对照表.md` | 人验通过（H1 通过 / H2 有条件值得：先跑真实业务任务再定） |

**完成条件逐条挂证据**（创建期预填自 brief；收口时补 Evidence ID 和结论）：

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---------|------|-------------|------|
| 1 | 【机器证·A3】事件序列严格为 v1/A attempt1 blocked→handoff ack→exact exit→v2+B→B done→A attempt2 fresh；旧 A result 通过 Runner 真实摄入入口提交，保持内容合法但携带旧身份链，只产生 stale event，不用测试桩直接改 active state。 | AI | E-020（先前 E-012/E-018 同结论） | 达成 |
| 2 | 【机器证·A4】decision fixture 的原 session 保持可交互；用户在该 session 回答一次后 agent 自然继续，Runner 未读取/转发回答、未调用 resume；依赖节点在后续有效 checkpoint/result 前冻结，无依赖并行节点继续。要求用户再去 Runner 操作则 A4 失败。 | AI | E-014 | 达成 |
| 3 | 【机器证·A7】`tools/relay/adapters/psmux*` 自己实现 `launch/probe/suspend/resume/stop/emit_observation`，可组合现有 psmux/tmux 原语但不假定旧 `tools/psmux-launch.ps1` 已提供完整 handle；preflight 证明 receipt.launch_id 与新 adapter 返回的完整唯一 session handle 1:1、界面 `visible=true` 且 `interactive=true`、probe 全值匹配，按该 handle 回收后在 evidence 记录的有界期限内确认为 `exited`。仅后台 session、PID/标题/前缀猜测或平台无关 stop 命令均失败。 | AI | E-006/E-011 | 达成 |
| 4 | 【人判·H1/H2】向用户展示真实截图、checkpoint/状态/receipt 时间线和未覆盖范围；decision 正常路径必须记录人工动作数=1，且时间线证明 Runner 未介入回答。对照表按统一口径记录用户显式确认/回答/重启动作数、面向用户的状态通知数，以及 blocked→fresh A 的可见步骤与事件 hop 数，由用户判断是否符合直觉、是否值得进入完整流水阶段。 | 人 | E-020/E-014/H2-对照表 | 达成（用户 2026-08-16 对话判：H1 通过 / H2 有条件值得） |

**验收项元数据表**：

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|----------|--------|-------|---------|-------------|---------|-----------|-----------|----------------|------------------|---------------------|
| A3 真实 blocked 接力事件序列 + 迟到 stale | dogfood blocked 事件签名断言 + `Submit-RelayResultFile` 真实入口 | machine | DHR03-A3 | 等价覆盖 | 签名精确子序列 + 三文件哈希不变 | pass（E-020 run7 签名含 A3 子序列精确 + late-check L1~L5；run5/run6 同结论） | pwsh 7 / Win11 / psmux / wt/DHR_03 | 事件流 + 截图互证 | | relay/v1 | machine-suite | controller-run |
| A4 decision 原 session 可交互 + 冻结/继续 + 零 resume | dogfood decision 事件/快照 + adapter.calls + 静态扫描 | machine | DHR03-A4 | 等价覆盖（frozen_by 以 launch 顺序 + DHR_02 回放证·直接快照缺 F-019） | 快照 frozen_by + calls 计数 + 扫描 0 命中 | pass（E-014：B result 在决策/恢复事件之间、C launch 在 A result 后、suspend/resume 0、扫描 0） | 同上 | 事件流 + 截图 + 用户动作计数 | 回答内容 Runner 不读（无法也不应取证） | relay/v1 | machine-suite | controller-run |
| A7 psmux handle 1:1 / visible / interactive / probe 全值 / 有界 exited | `Invoke-RelayBackendPreflight -Level adapter` + `relay-psmux-real.ps1` | machine | DHR03-A7 | 等价覆盖 | 五判据 JSON pass + EnumWindows 标题全等 + 期限毫秒 | pass（E-011 preflight-psmux-adapter.json 5/5：P2 3759ms、P5 107ms；real 14/14） | 同上 | user32 窗口枚举 + psmux list-* 全等 | orca 只做原语级对比 | relay/v1 | machine-suite | controller-run |
| H1 接力体验是否符合直觉 | 用户看截图/时间线/在窗口回答 | human | DHR03-H1 | 等价覆盖 | 用户对话点选 | pass（2026-08-16「符合直觉，通过」） | 同上 | 用户 | decision run2 现场图因 F-024 已删（用户知情后仍判通过） | relay/v1 | human | user-confirm |
| H2 与常驻主控对照是否更顺滑、值得进完整流水 | H2 对照表 | human | DHR03-H2 | 等价覆盖 | 用户对话点选 | pass·方向决策「有条件值得：先跑真实业务任务再定」（2026-08-16） | 同上 | 用户 | 对照组引用既有记录不重跑 | relay/v1 | human | user-confirm |

**业务化五段展示区**：要证明啥=一次性编排 agent + 确定性 Runner 能在真实可见终端里把活接下去（阻塞→重编排→新会话续跑；挂起→人答一次→继续）；期望值=blocked 0 人工、签名精确 10 段、迟到结果拒收；decision 人工 1、B 不受影响、C 等 A；实际值=blocked run5/run6/run7 三次一致（E-012/E-018/E-020·run6/7 多几条 worker 自愿 checkpoint、A3 子序列不变）、decision run2 完全一致（E-014）；差没差=不差；证据局限=各一次通过、本机高负载、frozen_by 快照缺、psmux 上游缺陷靠绕行。

**风险放行账表**：

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|-------|---------|------|------|------------|---------|---------|
| | | | | | | |

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [x]（两轮报告已落账 review-logs/·E-017）
**as-built 更新了没**：`as-built/relay-psmux-host.md` 首份 + `relay-runner.md`/`relay-contracts.md` 补行？ [x]

→ 当前状态：**全验收通过**（机器项全绿·两轮复核 0 open P0/P1·返工收敛·H1 通过·H2 方向决策=有条件值得·Risk-Count=0）

---

## 人类签名区　✅ 凭你在对话里的确认解锁

### 目的一：H1 接力体验人判（真实 psmux 演示）

本工作区交付：真实可见 psmux 终端 + 两场 dogfood（blocked 重编排 / decision 挂起）。

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| H1 自动弹出、原会话自然继续、Runner 不介入回答、依赖调度、退出与 fresh 恢复是否符合直觉；能否随时看清真正干活的 agent | 查看 AI 在对话里展示的截图（文件名含 event_id）、`timeline.md`、session 身份、decision checkpoint、依赖冻结/无依赖继续、后续 checkpoint/result、v1/v2 plan、ack/exit/fresh 事件摘要；decision 场景你在原窗口回答一次 | 你判"符合直觉"且人工动作数=1（decision）/0（blocked） | [x] 通过（用户 2026-08-16 对话点选「符合直觉，通过」；blocked run7 人工 0 / decision run2 人工 1） |

### 目的二：H2 与常驻主控巡检并排对照

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| H2 接力 PoC 是否更顺滑、是否值得进入完整流水阶段 | 查看 `evidence/H2-对照表.md`（人工动作数 / 通知数 / blocked→fresh A 可见步骤与事件 hop 数 / 未覆盖范围） | 你在对话里给判断（值得 / 不值得 / 有条件） | [x] **有条件值得**（用户 2026-08-16 对话点选；条件=「先跑真实业务任务再定」→ 记方向决策账：下一卡先用一张真实任务走一遍接力，再决定是否全量进完整流水） |

---

- 确认记录：用户 2026-08-16 凌晨对话 AskUserQuestion 三连点选——H1「符合直觉，通过」/ H2「有条件值得」（条件：先跑真实业务任务再定）/ 「已查看证据，认可执行本地收口」（本地收口授权包：verify 代签 → squash 合入本地 master → DevPlan 销户 → 清 worktree；不含 push）
- verify 提交 SHA：见 master `verify(dh-relay)` 提交（DevPlan DHR_03 卡回填）
- 签名：用户对话确认（AI 代签）　时间：2026-08-16

→ 解锁状态：**已确认·本地收口执行中**

### 确认记录（append-only，每次人验确认追加一行）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---------|--------|----------------------|----------------------|-------------------------------|---------------|--------------------------------|
| 2026-08-16 凌晨 | 用户（对话点选） | E9 七段汇报 + E10 证据展示（A7/A3/A4 机器证 + H2 对照表 + 未覆盖范围 + F-024 说明） | wt/DHR_03 @ 5affde6 | E-020 run7 signature 13 段 + late-check L1~L5；E-014 decision 签名 11 段；preflight 5/5；离线 15 套件绿；两轮复核 0 open P0/P1 | DHR03-A3 / DHR03-A4 / DHR03-A7 / DHR03-H1 / DHR03-H2 | 通过（H2 为方向决策：有条件值得·先跑真实业务任务再定；无风险放行项，Risk-Count=0） |
