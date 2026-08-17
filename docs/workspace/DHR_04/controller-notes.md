# 主控手记 — DHR_04 stage0 自举首跑

> 本文件只由**主控**写，施工/复核棒不碰（避免与任务树里的 `progress.md` 抢同一个文件）。
> 记的是「用 relay 开发 relay」这个形态本身暴露的事，不是卡内实现问题。

## 现场坐标

| 项 | 值 |
|---|---|
| stage0 驱动器 | `D:\relay-stage0`（冻结自 `tools/relay/` @ `34df46a`，`STAGE0.md` 声明永不手改） |
| 接力包装 | `D:\relay-run-DHR_04\run-card-relay.ps1` + `briefs\{build,review1,review2}.md` |
| run 现场 | `D:\relay-run-DHR_04\runs\<run_id>\`，证据 `D:\relay-run-DHR_04\evidence\<run_id>\` |
| 任务树 | `D:\MyFiles\ai-workflow\dh-crew\.dh-worktrees\DHR_04`（branch `wt/DHR_04`） |
| 首个 run_id | `RELAY-DHR04-20260816215716`（2026-08-16 21:57 起） |
| 棒与账号 | `build`=grok(`~/.claude-grok`) → `review1`=默认账号(Opus) → `review2`=account9(deepseek) |

### 四趟 run 一览

| 趟 | run_id | 棒与账号 | 结果 |
|---|---|---|---|
| 1 首跑 | `RELAY-DHR04-20260816215716` | build=grok / review1=Opus / review2=deepseek | `changes-requested` P1=1 |
| 2 返工 | `RELAY-DHR04-REWORK-20260816233839` | fix=grok / review3=Opus / review4=deepseek | 六项真修好；R3-01 升 P1（→R4-01）；review4 因 C-04 被误判 `interrupted_unknown` |
| 3 二次返工 | `RELAY-DHR04-REWORK2-20260817095138` | fix2=grok / review5=Opus / review6=**额度耗尽未跑成** | 五项真修好；新开 3 条 P1（见下） |
| 3' review6 续跑 | `RELAY-DHR04-REVIEW6-20260817104420` | review6=**account4/glm-5.2**（换账号重派） | `exit=0`，核 review5 无一条不成立 + 新增 R6-01 |

> 第 3 趟的 `Copy-RelayEvidence` 因主控强杀宿主未执行，现场由主控手工复制进 `evidence/RELAY-DHR04-REWORK2-20260817095138`。

## 观察账（形态问题，非卡内问题）

| ID | 级别 | 事实 | 影响 | 建议去处 |
|---|---|---|---|---|
| C-01 | P2 | **worker 在新工作树里被 Claude Code 的「是否信任此文件夹」启动弹窗挡住**，`--dangerously-skip-permissions` 不覆盖该弹窗。relay 侧看到的只是 `terminal_state=running`（屏幕有输出），**没有任何"我在等人"的信号**——worker 还没跑起来就静默挂着，要等 30 分钟 stall 阈值才会暴露。主控靠 `capture-pane` 肉眼发现，手工在三个账号的 `<CONFIG_DIR>/.claude.json` 预置 `projects["<worktree 路径>"].hasTrustDialogAccepted=true` 后 `send-keys Enter` 解开。 | 一卡一树 = 每张卡的第一棒都必然撞一次；无人值守下会白等半小时 | relay 的 worker 入口应在 launch 前把目标 `WorkDir` 预置为已信任（或 preflight 检查），落 `DHR_08`（profile 执行边界）或 `DHR_09`（宿主生命周期）；先记本条备查 |
| C-02 | P3 | 心跳纪律必须写进 brief：Runner 只认 `checkpoint` 当进展，屏幕输出不算（`StallThresholdSeconds=1800`）。三份 brief 都加了"每做完一个编号步骤就报一次"。 | 长批次会被误判卡死 | 若进通用 brief 模板，归 `DHR_10`/`DHR_11` |
| C-03 | P3 | 包装脚本 + 3 份 brief 仍是本卡手写（同 IHSR_05 RB-4）。本次已把"逐节点 profile 映射"抽成 `$profiles` 哈希表，换卡只需改 briefs 与 worktree 路径。 | 每卡固定成本 | `DHR_10`（标准流水节点模板）承接 |
| C-04 | P2 | **主控 brief 的写法把一棒写失联了（主控自身教训）**：为绕开 `DHR-BL-4` 的假红，三份复核 brief 里都放了「清 `RELAY_*` 再跑全量」的命令。意图是"在新开子进程里跑"，但写法没说死；返工趟 `review4`（deepseek）把 `Remove-Item Env:RELAY_*` 执行在**自己的 shell** 里 → 自毁 relay 身份 → `relay-agent-tool` 按设计 exit 3 → **全程零 checkpoint**（attempt 目录 0 文件；同 run 的 `fix`=9、`review3`=6 正常，证明 launch/env 注入无缺陷）→ 30 分钟后被判 `stall-threshold-exceeded`、标 `interrupted_unknown` 挂起 → 宿主退出，**relay 侧再也收不回这一棒**。该棒实际全程存活并交出了 39 条路径变体穷举的高质量复核，成果只因它自己 `git commit` 才留住。中途它还额外卡在一个 `rm -rf` 权限确认框上（主控核过是删其自建的两个具名 TEMP 目录，放行）。 | 一次白跑 40 分钟 + 结果差点全丢；且这条绕过要写进**每一份** brief，属周期性风险 | 根治=修 `DHR-BL-4` 本体（已上调为高优先级）；在那之前 brief 必须写死"新开子进程执行、禁止在自己 shell 里清 env"。检测/标签问题归 `DHR-BL-1`（已补该实证） |

| C-05 | **P1（形态）** | **额度耗尽在 stage0 下完全无信号。** 第 3 趟 `review6`（account9/deepseek）拉起 30 秒后即 `API Error: 402 Insufficient Balance`，进程仍活、屏幕不再变化。relay 侧只看到 `review6=idle/working`——与"在思考"完全同形。若无人盯屏，要等满 30 分钟 `StallThresholdSeconds` 才会被判 `interrupted_unknown`，且判完这一棒的现场也就废了。主控靠 `capture-pane` 肉眼发现。 | 无人值守下每次撞额度都白烧 30 分钟；且 stage0 无 fallback，撞上即整趟停 | design/02 决策已把「高置信 quota 识别 + 预登记 fallback」放进 **`DHR_08`**（B5 验收），本条是它的**首个真实现场证据**，不另立卡；检测/标签面归 `DHR-BL-1`。**新蓄水 `DHR-BL-5`** 记「stage0/P1 现役无 quota 通道」这一过渡期缺口 |
| C-06 | P2 | **DHR-BL-1 第三次踩，这次在同一趟里。** 第 3 趟 `fix2` 棒（grok）中途卡在 `rm -rf "$TEMP/dhr04-mh-mut"` 的权限确认框上，relay 侧同样只显示 `fix2=idle/working`。主控核过删的是它自己为 M-H 变异建的具名 scratch 目录（路径确定、在 `TEMP` 下），`send-keys Enter` 放行后正常续跑。 | 累计：C-01 启动信任弹窗、C-04 `rm -rf` 确认框、本条 `rm -rf` 确认框——**三次全靠人肉 `capture-pane` 发现** | `DHR-BL-1`（已补本条实证） |
| C-07 | P3 | **`DHR-BL-2` 这次提前堵住了。** 换 account4 接 `review6` 前，主控先往 `~/.claude-account4/.claude.json` 写 `projects["D:/…/.dh-worktrees/DHR_04"].hasTrustDialogAccepted=true`，该棒**未撞启动弹窗**。反证 BL-2 的修法（launch 前幂等预置）确实有效、且成本极低。 | 正面证据，支持 BL-2 按原方案落 `DHR_08`/`DHR_09` | `DHR-BL-2` |
| C-08 | P3 | **包装脚本单节点 phase 踩 PowerShell 拆平坑**：`$nodeSets.review6 = @(@('review6',…))` 单元素会被 PowerShell 解包成 4 个字符串，`foreach` 拿到的是 `'review6'` 而非数组，报 `Cannot find path '…\briefs\v'`。须写 `@(,@(…))`（一元逗号）。 | 与教训库既有条目「`return @()` 解包成 null 须 unary comma」同族；`DHR-BL-3`/`DHR_10` 做通用包装时会再遇 | `DHR-BL-3` → `DHR_10` |

## 第 3 趟（二次返工）汇合裁决 · 2026-08-17

> 本节是**主控裁决的权威记录**。两份复核原文在 `review-logs/review5.md`、`review6.md`；本节记的是主控看完两份之后的判断与依据，换会话接手直接读这一节，不要从两份 review 重推。

**两轮结论**：review5（Opus）判 `changes-requested P0=0 P1=2 P2=0 P3=2`；review6（glm-5.2，与 review5 不同账号不同会话）**逐条独立重跑 review5 的每一条结论，无一条不成立**，并新增一条同族 P1，判 `P0=0 P1=3 P2=0 P3=4`。

**五项二次返工（R4-01/R4-02/R3-02/R3-03/R4-03）两轮一致确认真修好**，回归面干净、范围零漂移（6 笔提交恰 5 文件）、断言 56→63、覆盖闸 70、全量 `RELAY ALL PASS (SKIPPED: 1)`、E-008 自举 EXIT=0。**本轮没有任何一条翻案。**

### 裁决表

| 发现 | 级别 | 裁决 | 依据 |
|---|---|---|---|
| **R5-01** NUL 分隔清单被粘成一条超长路径，前缀落在 doc_root 即整坨放行 | **P1** | **修** | 与 R4-01 同款静默放行；且**波及 `dev-isolation` 主模式**，而 E-008 用的正是该单模式 |
| **R5-02** git 引号形态在 landing 一律 EXIT=0 | **P1** | **修** | review4 记的「方向 fail-closed」只在 dev-iso/content 成立；**⑤「只写文档不加固」所依据的前提实测不成立** |
| **R6-01** 纯 CR（U+000D）分隔同样被粘成一条 | **P1** | **修** | review6 独立发现，与 R5-01 同族但独立可复现 |
| **R6-02** JSON 分支无条目类型守卫（null/int/嵌套均静默降级成 `unclassified-path`） | P3 | **一并修** | 同一条线的第三个入口；不一并收就会留活口 |
| **R5-03** not-relative 消息的路径原文没有断言钉住 | P3 | **修** | M5-F/M6-F 双方独立复现无红；R3-03 的加固只落实了 dotdot 半边 |
| **R5-04** `~` 判据比语义宽，`~$xxx.docx` 等 Office 锁文件会让整份清单 exit 3 | P3 | **修**（收窄成 `^~($\|[\\/])`） | 方向 fail-closed 不误放，但会让后续卡的机器证被一个临时文件卡死 |
| **R6-03** `-Mode all` 顶层 reason 事实恒 `multi` | P3 | **放行**，记 `findings.md` | 非缺陷，是 review5 表述不准 + reason 语义观察精度问题；violations 逐条族码已足够 |
| **R3-04** 受限写只覆盖一个象限 | P3 | **已于第 3 趟放行**，已记 `findings.md` F-004 | review1 原始要求「证明越权写真的失败」已满足并经 review4 独立验真 |

**根因一句话**：路径**内容**不规范（`..`、非相对）已经堵死，但路径**清单条目**不规范整条线没设防——已知四个入口（NUL / CR / git 引号 / JSON 非字符串条目）全部通向静默绿章。

**修法（两轮一致建议，主控采纳）——拒绝，不剥离**：`Read-RelayPolicyPathFile` 一次拆分覆盖 `[\0\r\n]+`；`Get-RelayPolicyPath` 对控制字符与前导/尾随双引号 `throw`；JSON 分支加条目类型守卫；各配红测钉死 exit 3。理由：半剥（只 `Trim('"')`）盖不住 `\xxx` 八进制，完整反转义越界；**调用方喂错时应该拿到红，而不是绿章**——这样 fix2 handoff 那句「正确做法在调用方」才立得住。

### 主控探针（不采信复核自述，主控亲跑复现）

用工作树里的现役 CLI 直接跑，`-Mode landing` 补 `-BeforePath`：

| 探针 | 实测 | 判定 |
|---|---|---|
| 对照：裸 `.dh-runtime/relay/new.json` → landing | `EXIT=1` | ✅ 正常拒 |
| R5-02：`".dh-runtime/relay/\346\226\260.json"`（git 引号）→ landing | **EXIT=0** | ❌ 成立 |
| R5-01：`docs/…/findings.md\0.dh-runtime/relay/new.json\0` → landing | **EXIT=0** | ❌ 成立 |
| R5-01：同上 → **dev-isolation** | **EXIT=0** | ❌ 成立（**E-008 用的就是这个模式**） |
| R6-01：同上但用纯 `\r` 分隔 → landing / dev-isolation | **EXIT=0 / EXIT=0** | ❌ 成立 |

三条 P1 全部由主控独立复现，非采信。

### 给第 4 趟的止损线（主控 2026-08-17 定）

前三趟每一趟都确认「上一趟真修好」，但每趟又开出新一类（`..` → 非相对形态 → 清单条目形态）。第 4 趟的修法是**按构造封闭一整类**（拒绝所有非规范清单条目形态），不是逐个枚举。

**止损判据**：若第 4 趟的两轮复核**仍能在同一片区域（守卫的输入面）开出新类**，则**停止打补丁**，回头与用户重议本守卫的输入契约设计（例如：改由调用方提供结构化清单、或把「清单读取」整个移出守卫职责）。不得靠继续加 throw 分支无限追。

### 第 4 趟状态

**未开工**——brief 未写、未派工。恢复时从本节裁决表直接写 `briefs/fix3.md` + `review7.md` + `review8.md`，driver 加 `rework3` phase（账号：fix3=grok / review7=默认 Opus / review8=account4-glm；**account9 余额耗尽，暂不可用**）。

## 与验收的关系

本 run 的过程证据**不作为 H3/H4 的验收证据**——design/02 审核 S5 已定死自举验收卡必须「与 relay 实现无关」，用 relay 开发 relay 属循环论证。这里的记录只当**开发过程留痕与 backlog 来源**。
