# RLT_18 workflow-final requirement（UD-3）· review-round-2

2026-09-25 · reviewer#requirement-ud3-r2（fresh，未参与本卡任何施工、批审与复核，未参与 r1）· 审查对象：整改提交 `401defb`（`evidence/ud3-h12/H12.md` 文字 + coder-u2 remediation-1 signal），上一轮 review `review.workflow-final.requirement.ud3.review-round-1.md`（FAIL，`fd95815`）· 权威：task_plan §5.6（:343-370）、晋级后 design/01 HC-RL-H12 v2、decisions.md UD-3~UD-8（用户裁决，只核落地忠实）、dispatch/README.md 允许路径。

## 结论

**PASS** — 上一轮 open P1（RQ-U3-1）与两个 P2（RQ-U3-2/3）逐条闭合；四个 P3 全部按建议整改到位；整改提交 `401defb` 只改 H12.md 文字与自身 signal，未动 `raw/`、`fixture/`、`probe-briefs/`；所有新补事实均在 raw/ 原文或 git 记录核到出处，无新引入 P0/P1/P2。仅余 1 个新 P3（数值精度口径提示，不阻塞人判）。

## 发现

| ID | 级别 | 位置 文件:行 | 事实 | 建议整改 |
|---|---|---|---|---|
| RQ2-U3-1 | P3 | `H12.md:31` | `T1′−T0′ ≈ 12.6 分钟` 以 T0′=17:03 分钟精度锚点取上界：17:15:39.040−17:03:00=12.65；raw 实际只钉住首轮检查在 17:03 分内（pane-watcher-o-1.txt 捕获 17:03、dialog 输出落款 5:03 PM、poll `o=done/2512` 自 17:03:51 起），真实区间 ≈11.7–12.6 分钟。断言方向（偏离 §5.6 预期 ≈8–9 分钟）在区间任一端都成立，且该值即 r1 建议值；但按字面 12.6 是乐观端点。 | 可改「≈11.7–12.6 分钟（T0′ 仅分钟精度）」或维持现状并在人判时知悉；不阻塞。 |

## 上一轮逐条闭合核对

- **RQ-U3-1（P1）闭合**：`H12.md:38` 新增「覆盖组合声明」，逐字含 §5.6 要求句「阶段级 × Codex watcher、编排级 × Claude watcher 组合未实测」，并给同构理由。同构性本身已对 adapter 核实：两侧同一套 过滤 pgrep → `status --json` → watch-down → 读 pane 末行判补 Enter 流程（adapter-claude-code.md:91 / adapter-codex.md:93 逐字同构，且各含「阶段级与编排级同一套」）；差异仅 notify 目标与报信原文（`watch-down stage RLT18U:C#1`→lead vs `watch-down plan plan`→orch，raw/pane-watcher-s-t3.txt、pane-watcher-o-t3.txt 逐字）；节拍写法确按 kind 分（claude `run_in_background sleep 600` adapter-claude-code.md:83；codex 前台 `sleep 600`+`timeout_ms=660000` adapter-codex.md:85），不按层级——声明如实。
- **RQ-U3-2（P2）闭合**：`H12.md:53` 补登 lead 输入框草稿并改中性归因。三处草稿逐字核到：lead `check watch-down pane w4B:p1X still running`（pane-lead-t3.txt:77、transcript-lead.txt:77，均在 :76/:78 边框线之间、其后无回应回合）、watcher-s `keep watching, next round`（pane-watcher-s-t3.txt:77，文件捕获 17:18）与 `stop watching, this is enough evidence`（transcript-watcher-s.txt:77，17:31）——三个 :77 行号全部准确。「键入者不可考（用户/driver send-keys/客户端建议不可区分）」取代原「用户键入」断言，与 raw 可判性一致。
- **RQ-U3-3（P2）闭合**：`H12.md:31` 补标 `T1′−T0′ ≈ 12.6 分钟`（T0′=watcher-o 首轮检查 17:03）并注明与 §5.6 预期 ≈8–9 分钟的偏差及成因（`Continue` 轻推使节拍迟至 17:06:53 武装、该侧间隔拉长至 ≈14 分钟 17:03→17:17、启动伪影）；`:32` 显式标 `T3′−T1′ ≈ 1.4 分钟`。数值抽核：T3′ 发送落在 poll 行 35→36（17:16:56→17:17:21 orch done/2509→working/2522，逐字核到），T1′=17:15:39.040 → T3′−T1′≈1.3–1.7 分钟，≈1.4 成立；A 侧 :18/:52 已改 `T1−T0 ≈ 2.1–2.4 分钟`（T0≈17:07 首轮回合结束 17:07，逐字 `Baked for 11s · done 17:07`；17:09:08.584−~17:06:5x–17:07:0x≈2.1–2.4 ✓）并补 `T3−T1 ≈ 8.7–8.9 分钟`（T3≈17:17:5x–17:18 → 8.79–8.86 ✓，「~88%」of 10min 上限算术正确）。
- **RQ-U3-4（P3）闭合**：四处引用逐一复核——①:17 改为「535995 见 t1-close.txt 逐字（该文件 post-close 仅列 535995，:7 核到）；544623 见 poll 行 12 起」（poll 行 12=17:07:14 首次出现 544623 ✓）；②:19 缺席窗口改「行 17–38」（行 38=17:18:12 恰为 561980 出现于行 39 之前的末行；行 17–38 内 watchpy 仅含 535995/544623/560184，均无阶段级 python ✓）；③:31 改「行 32 起仅剩 544623，行 35 起为空」（行 32=17:15:40 `watchpy=544623`、行 35=17:16:56 `watchpy=` 空，逐字核到 ✓）；④:33 改「poll 行 35→36」（orch 转变恰在 17:16:56→17:17:21 ✓）。
- **RQ-U3-5（P3）闭合**：`H12.md:54` 限定为「重演观察窗内（17:01 起）driver 未写任何 fixture 账本行」，并注明建账 5 行系 16:57 setup 阶段写入——setup-fixture.txt（16:57:32，5 个 `## add` 节）与 fixture/relay_log.jsonl 末行 seq5 16:57:32.985 逐字一致；探针全部 ≥17:01 才启动（watch 循环 17:01:49、brief 投递 17:03:11-12），归因成立。
- **RQ-U3-6（P3）闭合（按「接受现状+如实披露」路径）**：`H12.md:64` 新增「无 raw 落物项」清单；反向核：raw/ 全文 grep `538717`/`538714`/`660000`/`17:06:53` 零命中；agents-final.txt 为 `cli:agent:list` 关前快照（五探针仍在列、mtime 17:31，cleanup-close.txt:1 关 tab 始自 17:31:57）；`:12` 同步加内联注。附带旁证成立且有意外的加强点：包装进程 544623 消失于 poll 行 34（17:16:31）→35（17:16:56）之间，恰与「17:06:53+600s=17:16:53」吻合——无 raw 的 17:06:53 起点获独立旁证。
- **RQ-U3-7（P3）闭合**：`H12.md:51` 改「两次均未改 brief，未注入与实验内容相关的提示」，不再绝对化。

## 整改合规与新问题

- **路径约束**：`git show 401defb --stat` = `H12.md`（24 行改动）+ `DONE.workflow-final.ud3.coder-u2.remediation-1.md`（1 行），未动 `raw/`、`fixture/`、`probe-briefs/`；后续 `9ab27b5`、`4703c0d` 仅 orchestrator 登记 execution_strategy.md；`git status` 干净。
- **新事实溯源**：整改新增断言全部核到出处或如实标注无出处（见上）；未发现伪造、夸大或语义翻转。
- **非目标复验**：raw/ 全文 `stage-stalled`/`stalled` 零命中（编排侧无 stall 提示仍成立）；fixture 账本末行止于 16:57 setup（watch/watcher/探针全程未写账）。
- **poll log 边界**：入库 2540 行，真实数据止于行 70（17:31:42），行 71（17:32:08）起 `?` 噪声至尾行 10:54:12——与 :63「17:32 以后为噪声」「入库行未改动」一致（「最后观测追加行 10:55:03」指已丢弃的未入库漂移行，文件 mtime 10:55 与 kill 时点吻合，属 r1 已接受的观测性陈述，非本次新增）。

## 人判支撑判断（派单专项）

证据现在**可以支撑**用户对 H12 v2 做人判：两段时延区间（A 侧 T3−T1≈8.7–8.9 分钟 ≈ 上界 88%、B 侧 T3′−T1′≈1.4 分钟对照）、B 侧 ~14 分钟启动伪影间隔及其成因、覆盖组合缺口声明、两次完成性轻推与三处未提交草稿的完整介入清单、无 raw 落物项清单——人判所需的全部披露项均已就位且可回查 raw 原文；「人判结论」格仍留空（:82），只取证不判的边界守住。遗留人判权衡点（不改变 PASS）：watcher 自主续拍两侧均需一次人工轻推才走起；T1′−T0′ 精度见 RQ2-U3-1。

## 核查范围与方法

- **RELAY_RECEIPT preflight**：`env | grep '^RELAY_'` 无命中 → 正常复核面。
- **范围**：`a6773e7..HEAD` 内 UD-3 证据链，聚焦 `401defb` 整改（H12.md 文字 diff 全量逐行核）；方法为不信摘要、承重断言回 raw/ 原文逐字抽核 + git 记录反查。
- **核过的 raw**：agent-status-poll.log（行 12/17/32/34/35/36/38/39/70/71/2540）、t1-close.txt、t1p-close.txt、pane-watcher-s-t3.txt、pane-watcher-o-1.txt、pane-watcher-o-t3.txt、pane-lead-t3.txt、transcript-lead.txt、transcript-watcher-s.txt、nudge-1.txt、watcher-o-dialog.txt、setup-fixture.txt、cleanup-close.txt、agents-final.txt、fixture/relay_log.jsonl；adapter-claude-code.md:83/91、adapter-codex.md:85/93（同构声明）。
- **本轮未重核**（继承 r1 已核结论）：探针 argv/model gate、派单原文比对、H12-① 引用、全量回归结果——整改未触及这些面。

## 范围外发现

- 无新增。r1 范围外项（tab/pane 载体词漂移→F-013、Codex 稳态节拍 ≈10.5–11 分钟、watcher 自主续拍观察、前置豁免一致性）维持原登记。
