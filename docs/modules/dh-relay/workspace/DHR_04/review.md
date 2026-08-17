<!-- dh:v1 · review.md — 验收。🔴 收尾填。三区：独立复核区 → AI 提交区 → 人类签名区，物理隔离。 -->
# review — DHR_04 隔离/禁改/落点守卫

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

> 本卡复核由 **dh-relay stage0 接力**驱动（`D:\relay-stage0`，冻结自 `tools/relay/ @34df46a`）。每棒独立 psmux 会话、独立账号配置目录、启动命令不含 resume/continue，施工者不复核自己的卡。
> **实际走了四趟施工 + 九轮换人复核**，超出模板预设的两轮——原因见下方「返工收敛」与 `findings.md` F-007。全部复核原文在 [`review-logs/`](./review-logs/)，run 现场在 `D:\relay-run-DHR_04\evidence\`。

**逐轮总表**（施工者与复核者零重叠；每一轮均亲跑复现，不采信上游自述）

| 轮 | 复核者（账号/会话） | 复核对象 | 结论 | 记录 |
|---|---|---|---|---|
| review1 | 默认账号 · Opus 5（`RELAY-DHR04-20260816215716` L-0002） | 首次施工批 A~D | `changes-requested` P1=1 | [review1.md](./review-logs/review1.md) |
| review2 | account9 · deepseek（同 run L-0003） | 核 review1 + 独立砸 | `changes-requested` | [review2.md](./review-logs/review2.md) |
| review3 | 默认账号 · Opus 5（`…-REWORK-…` L-0002） | 返工六项 | `changes-requested` P0=0 P1=0 P2=1 P3=3 | [review3.md](./review-logs/review3.md) |
| review4 | account9 · deepseek（同 run L-0003） | 核 review3 + 39 条路径变体穷举 | `changes-requested` P1=1（R3-01 升 P1） | [review4.md](./review-logs/review4.md) |
| review5 | 默认账号 · Opus 5（`…-REWORK2-…` L-0002） | 二次返工五项 | `changes-requested` P1=2 | [review5.md](./review-logs/review5.md) |
| review6 | account4 · glm-5.2（`…-REVIEW6-…` L-0001） | 核 review5 + 独立砸 | `changes-requested` P1=3 | [review6.md](./review-logs/review6.md) |
| review7 | `~/.claude-grok` · grok（`…-REVIEW34-…` L-0001） | 三次返工（主控施工） | **`approved`** P0=0 P1=0 P3=4 | [review7.md](./review-logs/review7.md) |
| review8 | account4 · glm-5.2（`…-REVIEW8-…` L-0001） | 核 review7 + 独立砸 | **`approved`** P0=0 P1=0 P3=4 | [review8.md](./review-logs/review8.md) |
| review9 | `~/.claude-grok` · grok（`…-REVIEW9-…` L-0001） | 收口前小修 + **范围裁决独立判断** + 可收口性 | **`approved`** P0=0 P1=0 P3=1 · 明判**可收口** | [review9.md](./review-logs/review9.md) |

> 换人纪律实证：三次返工（`b770a4b` / `621b3e8` / `bfe6fee`）由**主控主会话**施工，故 review7/review9 改派 grok（前三趟的施工者，但未参与这三笔）、review8 用 glm-5.2；**建者与复核者在每一轮都零重叠**。review6 与 review8 因 account9 余额耗尽（`402 Insufficient Balance`）与宿主挂死各重派过一次，成果未重跑。

**返工收敛**

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|------|--------------|----------------------|---------|
| 1（返工） | P1=1 | `..` 不消解可绕过守卫 → `Get-RelayPolicyPath` 遇 `..` 段 throw；配三模式红测。另修内部 `./`、补误杀护栏红测、补受限写现场、`-Mode all` reason 一致性、退出码四态契约 | 是（review3/4 一致确认六项真修好） |
| 2（二次返工） | P1=1 | 非相对路径（绝对/盘符/盘符相对/`~`/UNC/verbatim）在 landing 静默放行 → 同款 throw + 三条红测钉 exit 3 | 是（review5/6 一致确认真修好） |
| 3（三次返工） | P1=3 | 清单条目形态（NUL / 孤立 CR / git 引号 / JSON 非字符串条目）静默放行 → 拆分改 `[\0\r\n]+`、控制字符与引号 throw、JSON 条目类型守卫 | 是（review7/8 均 `approved`） |
| 4（收口前小修） | P1=0 | **超 3 轮说明**：本轮无 open P0/P1，是对 P3 的收尾——修主控自己引入的 `~user/` 回归、补引号两侧与优先级三层断言、订正账本口径。**不属"返工收敛"轮次**，故未违反 ≤3 轮约束 | 是（review9 `approved`） |

> **为什么会有四趟**：`findings.md` F-007 记明——第 3、4 趟基本整趟花在**清单解析面**上，而该面不属本卡目标与三条机器证（实施提示逐字要求「只消费正式设计字段的**纯守卫**」）。一个未被验收覆盖的无界输入面撞上「任一放行 = P0/P1」红线，构成不收敛的复核循环。已整面收窄另立 `DHR_22`，并经 review9 独立判定该裁决成立、三条机器证不受损。

**需求复核结论**：由 review9 承接（终轮 brief 明确要求逐条核 DevPlan `#### DHR_04` 三条机器证的覆盖态）——**三条全部「已覆盖」**，逐条证据见其「可收口性」表；结论 `approved`，明判「本卡可以收口」。｜派出=log:`review-logs/review9.md`

**教训复核结论**：本卡未设独立 lesson_review 棒（该棒由 `DHR_13` 建设，尚未实现）。教训候选逐条落 `lesson_candidates.md`，形态类观察落 `controller-notes.md` C-01~C-08，并已由主控转写为模块 backlog `DHR-BL-1/2/3/6`。｜派出=log:`controller-notes.md`、`../../backlog.md`

## 第 4 路·一致性复核（横向：本次动的口径 vs 同类路径既有定义）

<!-- dh:consistency-review:v1 task=DHR_04 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|---------|-------------|------|---------|
| 允许集两个自有内容根（`.dh-relay/`、`docs/relay/`） | `dev_plan/P2-完整流水-开发方案.md` §2.2 复用与禁改边界表 | 一致 | 无需处置 | e:E-004 e:E-005 |
| 落点反例形态（`docs/modules/<模块>/relay/`、`workspace/<卡>/relay/`） | `design/02-完整流水-产品设计与验收.md` B9 行 + 决策 10（D21 两个自有内容根） | 一致 | 无需处置 | e:E-005 |
| reason 码风格与返回形状 | `tools/relay/contracts/relay-schema.ps1` 的 `New-RelayValidationOk/Error` | 一致 | **有意差异**→`as-built/relay-policy.md#7-改这块之前要知道的` | e:E-014 |
| legacy 根只读口径 | `design/02` 决策 10 + DHR_09 卡（`.dh-runtime/relay/` 双根 discovery、resume 硬拒） | 一致 | 无需处置 | e:E-005 e:E-026 |
| 守卫输入形态（清单从哪来、由谁保证） | `design/02` 决策 1 + `#### DHR_12`（宿主原子生成 authority snapshot） | **不一致** | **遗漏待修**（`findings.md` F-007 → 已立 `DHR_22`） | e:E-036 · log:`review-logs/review9.md#范围裁决是否成立` |

> 第 3 行「有意差异」说明：`verdict` 走 `New-RelayValidationOk/Error` 的标准形状，但**守卫层的 `throw` 码**（`policy-path-*`、`policy-list-entry-not-string`）刻意不走该通道——它们表示「输入根本没资格进入判定」，与「判定结果为违规」是两件事，对应退出码 3 与 1 的分野。代价是这些码不进覆盖闸采集面（见 `findings.md` F-006），故必须靠套件断言保证覆盖。
> 第 5 行「不一致」说明：本卡实现的守卫**自己读文件并推断清单边界**，与「只消费正式设计字段的纯守卫」不一致。此为执行中暴露的面归属错误，已整面收窄另立 `DHR_22`，经 review9 独立判定不影响本卡三条机器证。

> `定义是否一致` 二选一：`一致` / `不一致`。
> `裁决` 三选一：`无需处置` / `有意差异`（必带 `有意差异→<文档#锚点>`） / `遗漏待修`（必在 `findings.md` 有对应条目）。

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：对实现有没有 100% 信心？没有就逐条列 gap。

- **没有 100% 信心，四条 gap 逐条交底**：
  1. **守卫的输入面不属本卡且已知有残留**（最大一条）。`U+2028`/`U+2029`/`U+0085` 在文本清单与 JSON 字符串条目两条腿上仍会粘连（`findings.md` F-007）。**不修的理由不是"改不动"，是"在这一面上有些修复本身是错的"**——它们是 NTFS 合法文件名字符，自动当分隔符拆会误伤真文件名。整面收窄已立 `DHR_22`。经 review7/8/9 三轮独立判 P3 不阻塞，review9 另判该裁决成立、三条机器证不受损。
  2. **两条 reason 码在 CLI 生产路径不可达**：`module-relay-folder` / `workspace-relay-folder` 依赖 marker 探针，而 CLI 对 `landing`/`all` 恒传 `$null`。纯函数层可达且有断言，CLI 层未接真实探针——留给接探针的卡（沿用 review1~9 一致的 P3 判定）。
  3. **受限写联证只覆盖一个象限**（`findings.md` F-004）：证了「未授权 + 环境拒写」，缺「授权路径在同一受限现场仍可写」的对照腿。review1 的原始要求（证明越权写真的失败）已满足，且经 review4 独立验真（非管理员会话、真 `UnauthorizedAccessException`、`/deny`→`/grant` 变异恰红 2 条）。主控裁决放行。
  4. **本卡的自举取证不构成 H3/H4 证据**：本卡用 relay 开发 relay，属循环论证，design/02 审核 S5 已定死自举验收须与 relay 实现无关。相关记录只作开发过程留痕（`controller-notes.md`）。
- **有信心的部分**：三条机器证的判定逻辑经 85 条断言 + 九轮换人复核 + 逐轮变异探针验牙；三条 P1 的封闭用**返工前同一批探针文件**做前后对照（EXIT 由 0 → 1/3），非重新构造的证据。

**设计契约传导声明**（收口时只保留一条）：

- 契约同步：`docs/modules/dh-relay/as-built/relay-policy.md`（本卡新建；退出码契约与拒绝优先级另在 `tools/relay/policy/Invoke-RelayPolicyCheck.ps1` 头部注释冻结，二者须同步改）

**需求对齐证据**（证明"真实/低成本场景里是否满足需求"）：

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| B9 守卫真的拦得住 | 在真实临时 Git 仓里按合成 authority snapshot 写一条授权路径 + 一条未授权路径，取前后快照与 `git status`，再分别用纯函数与 `-File` 黑盒 CLI 判定 | E-004 E-006 E-013 | **满足**——四者结论全等；`src/alpha/a.ts` 放行、`src/beta/other.ts`（精确文件 scope 的同目录兄弟）拒；`icacls /deny` 现场下越权写真的抛 `UnauthorizedAccessException` 且策略结论与之一致 |
| 守卫不误杀合法落点 | 同一仓内放 run 前已存在的 `docs/modules/alpha/relay/` 与合法模块 `docs/modules/relay/`，确认二者均放行 | E-005 E-012 | **满足**——两条谓词对合法模块均 `False`、landing `ok=True`；护栏经变异 M-B（段位判定退化为 `-contains`）恰红两条证明有牙（review1/2 在同一变异下无红，实证护栏是返工时才补上的） |
| 守卫能被后续卡直接接线 | 按 as-built 第 3 节的三条推荐命令生成裸路径清单，**零预处理**直喂 `-Mode dev-isolation` | E-032 E-040 | **满足**——17 条目 EXIT=0。反证同在：`git status --porcelain -z` 直喂会报 3 条假违规（E-031），故该命令已从推荐中移除并补断言钉住 |

**完成条件逐条挂证据**（创建期先从 brief 每条预填 # / 完成条件 / 谁验；收口时补 Evidence ID 和达成结论）：

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---------|------|-------------|------|
| 1 | 【机器证·B9①】变更前后路径集 + 回归命令证明 P2 生产代码只改 `tools/relay/`，dh-crew 代码与 active state 零改动，dh-crew run-all 行为不受影响 | AI | E-008 E-016 E-017 E-032 E-040 | **是**（review9 独立复跑核过：17 文件全在 `tools/relay/` 与本卡 workspace 内；`-AffectedBy … -ListOnly` → `SUITE COUNT: 0`） |
| 2 | 【机器证·B9②】合成 authority snapshot + 受限写环境 + 前后快照 + `git diff`/`git status` + 独立检查交叉证明内容写入 ⊆ 允许集；卡授权业务代码路径可写、未授权路径拒绝 | AI | E-004 E-006 E-013 | **是**（review9 逐条亲跑十条相关断言全绿 + CLI 复跑对照） |
| 3 | 【机器证·B9③】模块下新建带 relay marker 的文件夹即失败、legacy 根新写失败；"run 前已存在同名目录"与"合法模块 `docs/modules/relay/`"两条不误杀反例成立；Git/用户级/CLI/psmux 副作用分账可观察 | AI | E-005 E-012 | **是**（review9 逐条亲跑九条相关断言全绿 + CLI legacy 双模式 EXIT=1、两条不误杀 landing EXIT=0） |

**验收项元数据表**（每条稳定验收项一行）：

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|----------|--------|-------|---------|-------------|---------|-----------|-----------|----------------|------------------|---------------------|
| 开发期隔离守卫拦得住越界生产改动 | 套件断言 + 对本卡真实 diff 自查 | machine | B9-1 | **等价覆盖** | 变更路径集判定与 `git diff --name-only` 一致；**且以 dh-crew 官方受影响面机制证明零受影响面**（`-AffectedBy … -ListOnly` → `SUITE COUNT: 0`），替代耗时 2h43m 且有已知 OOM 风险的全量 run-all | E-008/E-032 EXIT=0（17 条目零预处理）；E-016 `SUITE COUNT: 105` 含 relay 行 0；E-017 `SUITE COUNT: 0` | pwsh 7 / Windows 11；stage0 @34df46a | 本卡 CLI 与纯函数互为独立路径 | dh-crew run-all 不在本卡跑（属 DHR_20 组合）；**守卫输入面归 DHR_22** | v1 | machine（确定性脚本，无 AI 判断） | Runner 无关——由主控与 review9 各自独立执行 |
| 业务仓内容写入 ⊆ 允许集且授权代码路径可写 | 真实临时 Git 仓联证（快照 + git status + 纯函数 + CLI + 受限写现场） | machine | B9-2 | **等价覆盖** | 五者结论全等；受限写以 `icacls /deny` 建真现场，越权写须真的抛异常 | E-004 / E-006 / E-013 全 pass；变异 M-C（`/deny`→`/grant`）恰红 2 条证明非恒真 | 同上；**非管理员会话**（`net session` 失败），DACL 真实生效 | `-File` 黑盒 CLI 与 dot-source 纯函数分别判定 | 真实 authority snapshot 由 DHR_12 生成，本卡只用合成夹具；**受限写只覆盖一个象限**（F-004，主控裁决放行） | v1 | machine | 同上 |
| 落点守卫命中非规范落点且不误杀两条正例 | 套件正反例断言 + CLI 黑盒复跑 | machine | B9-3 | **等价覆盖** | 命中/放行逐条与 B9 原文对齐 | E-005 / E-012 全 pass；变异 M-B（段位判定退化 `-contains`）恰红两条不误杀断言 | 同上 | 段位判定与 marker 探针两条独立路径 | 跨模块留档唯一性归 DHR_19/DHR_20；**`module-relay-folder`/`workspace-relay-folder` 两码在 CLI 生产路径不可达**（marker 探针恒 `$null`，纯函数层可达且有断言） | v1 | machine | 同上 |

**业务化五段展示区**：

- **要证明啥**：在写任何 P2 生产代码之前，先立一个**默认拒绝**的机器护栏，让后面 18 张卡的每一次改动都必须先过它——证明改动没越出 dh-relay 的开发边界、没往业务仓乱写、没在模块目录下自建 relay 文件夹。
- **期望值**：越界改动被判 fail、授权范围内改动被判 pass、两条容易误杀的合法情形（run 前已存在的同名目录、名字就叫 `relay` 的合法模块）不被误伤；且这套判定**自己能对自己的改动生效**（本卡 diff 喂给自己 EXIT=0）。
- **实际值**：85 条断言全绿；全量 16 套件 `RELAY ALL PASS (SKIPPED: 1)`；覆盖闸 `covered: 70`；本卡自举 EXIT=0（17 条目、零预处理）；九轮换人复核末三轮均 `approved`、零 open P0/P1。
- **差没差**：**没差**。三条机器证经 review9 逐条独立复跑判「已覆盖」。
- **证据局限**（四条，逐条已在 Confidence Challenge 展开）：① 守卫的**输入面**不属本卡且已知有 Unicode 行终止符残留 → 已立 `DHR_22`；② 两条 reason 码在 CLI 生产路径不可达（marker 探针未接）；③ 受限写联证只覆盖一个象限；④ 本卡是「用 relay 开发 relay」，其过程记录**不作 H3/H4 验收证据**（循环论证），只作开发留痕。

**风险放行账表**：

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|-------|---------|------|------|------------|---------|---------|
| 无 | — | — | — | — | — | — |

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [x]　（8 件套齐；复核记录 9 份在 `review-logs/`；证据账本 E-001~E-040）
**as-built 更新了没**：本批触及的子系统，其 `as-built/<子系统>.md` 已覆盖更新到最新现状？ [x]　（本卡新建 `as-built/relay-policy.md`，含接线用法、退出码契约、拒绝优先级、已知边界与改动注意事项）

→ 当前状态：**待验收**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

> **本卡人验栏为空**：DHR_04 的三条验收口径在 DevPlan 里全部登记为「机器证」，人判项 H3/H4/H5 由 `DHR_21`/`DHR_17` 承接，本卡不认领。按 H=0 双谓词收口——谓词 A（无人判结果项、无 open 方向项、无待认险风险项）与谓词 B（全部稳定项已分类、机器项均有等价 pass 证据、不可豁免项均满足）须同时成立，收口时机器推导后填在下方，**AI 不得自写"无需人判"**。
> 用户仍需在对话里做一次 E11 确认（"已查看证据，认可执行本地收口"）才解锁 verify 代签。

### 谓词核验（收口时回填）

| 谓词 | 判据 | 结论 |
|------|------|------|
| A · 人验栏为空 | 无人判结果项 ∧ 无 open 方向决策项 ∧ 无待认险风险项 | **成立**——DevPlan `#### DHR_04` 三条验收口径全部登记为「机器证」，无人判项（H3/H4/H5 由 `DHR_21`/`DHR_17` 承接，本卡不认领）；无 open 方向决策项（`~user/` 边界与输入面收窄两处均已由用户 2026-08-17 拍板）；风险放行账表为空 |
| B · 放行资格 | 全部稳定验收项已分类 ∧ 机器项均有等价 pass 证据 ∧ 不可豁免项均满足 ∧ 无未验证项 | **成立**——三条稳定项（B9-1/2/3）均已分类为 machine 且覆盖态「等价覆盖」，各有 pass 证据与独立 oracle；无权限红线类不可豁免项（本卡不触远端 push / ACL，那属 B16/H5）；无「未验证」项。`findings.md` 中 F-001~F-007 全为 P3 观察记录，无 open P0/P1 |

### 证据展示（E10 备料，供用户查看后确认）

| 看什么 | 展示形式 | 通过标准 | 结果 |
|--------|---------|----------|------|
| 守卫真拦得住 / 真不误杀 | 对话里贴套件关键断言输出 + 真实临时 Git 仓联证的结论 | 违规路径判 fail、授权路径与两条不误杀反例判 pass | [x] `ASSERTIONS 85 / SUITE PASS`；`src/alpha/a.ts` 放行、`src/beta/other.ts` 拒；合法模块与预存同名目录均 `ok=True`；受限写现场越权写真的抛 `UnauthorizedAccessException` |
| 零回归 | 对话里贴 `run-relay-tests.ps1` 末行 | `RELAY ALL PASS (SKIPPED: 1)` | [x] rebase 到最新 master 后复跑仍为该末行，`covered: 70` |
| 换人复核成立 | 对话里贴各棒的账号/会话身份与结论 | 实例/会话可区分且均非施工者 | [x] 九轮，账号跨 Opus / deepseek / glm-5.2 / grok；施工者与复核者每轮零重叠；末三轮 review7/8/9 均 `approved`、P0=P1=0 |
| 三条 P1 真封闭（前后对照） | 对话里贴**返工前同一批探针文件**复跑的 EXIT 值 | 由 EXIT=0（静默放行）转为非 0 | [x] NUL / 孤立 CR / git 引号三形态，`dev-isolation` 与 `landing` 全部由 0 → 1 或 3 |
| 范围裁决站得住 | 对话里贴 review9 对「三条现象该不该划给 `DHR_22`」的独立判断 | 复核者独立读 DevPlan 与 B9 原文后判裁决成立，且三条机器证不受损 | [x] review9 逐条判「成立」，并实测同一输入在结构化清单下现象消失或被正确重新定性 |

---

- 确认记录：**chat-confirm**。主控在对话里逐项展示证据后（三条机器证覆盖态、85 断言 / 全量绿 / 覆盖闸 70、九轮换人复核账号与结论、三条 P1 的返工前后 EXIT 对照、范围裁决经 review9 独立判定成立、四条 gap 逐条交底、谓词 A/B 判据），用户于 2026-08-17 答复「**认可**」。
- verify 提交 SHA：见 `git log --grep="^verify(dh-relay): DHR_04"`
- 签名：hyf（chat-confirm 代签）　　时间：2026-08-17

→ 解锁状态：**已验收**

> 铁律：没有对应的 `verify(dh-relay): DHR_04 …` git 提交，本卡不许标"已完成"。

### 确认记录（append-only，每次人验确认追加一行）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---------|--------|----------------------|----------------------|-------------------------------|---------------|--------------------------------|
| 2026-08-17 | hyf（chat-confirm） | DHR_04 隔离/禁改/落点守卫（`tools/relay/policy/` + 套件 + as-built + 9 份复核记录） | 候选 `5eebda1`（rebase 至 master 后） | `ASSERTIONS 85 / SUITE PASS`；`RELAY ALL PASS (SKIPPED: 1)`；`covered: 70`；E-008 自举 17 条目 EXIT=0；review7/8/9 均 approved P0=P1=0 | B9-1, B9-2, B9-3 | **通过** |
