<!-- dh:v1 · review.md — 验收。🔴 收尾填。三区：独立复核区 → AI 提交区 → 人类签名区，物理隔离。 -->
# review — DHR_26 树外 DSH Host Plugin 与 rc.7 现场侦察

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

> 两轮均为**机器强制只读**形态派出，复核者原文见文末附录，施工者不得改其结论正文。

**第一轮·独立复核**（fresh-context、机器只读、未参与实施；全面排查：目标范围漂移 / 行为回归 / 边界权限安全 / 证据缺口 / 过度设计）

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|
| claude-grok / **grok-4.5**（经本机 CLIProxyAPI 网关，只读；未参与实施） | 全面排查：原样透传 / 降级契约 / 冻结隔离 / 原型污染 / 测试形状 / 是否砍过头 / 目录安装 vs 去 Cordis import 的设计取舍 | **2 P1**（权威落点 README 仍教用已被证伪的目录安装；真 fixture 强制读取挡不住 link 安装的模块解析失败）+ **6 P2**（unlisted 的 `getRun` 无行为测试、`normalizeFixtureList` 形态覆盖不全、`unwrapExports` 复刻测试脆、absence-probe 几无行为测试、probe 断言偏弱、`fixture_hash` 被施工者误判为死代码）+ 3 NIT。结论：有条件通过 | e:E-013 | E-013（派出当时未走 dh dispatch，事后补登记） |

**第二轮·增量复核**（另派 fresh-context、未参与实施、不继承第一轮会话上下文的独立实例）

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|------|
| codex-ninth / **gpt-5.6-sol**（`--sandbox read-only`，OS 级机器强制只读；不同后端、不同模型、不同会话） | 对抗式交叉评估：第一轮修法是否真成立 / 证据能否支撑 DM1·DM4a·DM5a·版本基线·侦察落档 / 只读红线与凭据 / 范围越界与砍过头 | 核实成立：`ctx.provide` 公开性与 fiber 生命周期语义、两种装法转录逐字节相同、镜像与权威落点逐字节一致、真转录与 fixture 一致、只读边界与原型污染防护、版本基线证据链。**新发现 0 P0 / 4 P1 / 3 P2**：①最终 `ctx.provide` 实现缺「注册后卸载」动态证据；②转录校验器可把缺失 detail 判成 IDENTICAL；③侦察落档缺类型定义位置；④evidence 总索引仍发布被推翻的 tgz-only 结论；P2：契约测试可绕、漂移检查非逐字节且自述的契约测试不存在、包内 overlay 注释自相矛盾 | changes-requested（首审）→ 见返工收敛 | e:E-014 | E-014 |
| codex-ninth / gpt-5.6-sol（同形态，**第 1 次收敛复检**，与首审不同会话） | 只核 4 P1 + 3 P2 的修法是否收敛、是否引入新问题 | 判 0 P0。P1-A（卸载清理）、P1-C（类型定义位置）、P2-2（漂移逐字节）、P2-3（overlay 注释）**已收敛**；P1-B（校验器）、P1-D（过期结论）、P2-1（文件枚举）**部分收敛**，另点出 2 条新 P2（枚举可被子目录绕过、包外探针证据没存退出码） | changes-requested → 见返工收敛第 3 轮 | e:E-015 | E-015 |
| codex-ninth / gpt-5.6-sol（同形态，**第 2 次收敛复检 / 终检**，独立会话） | 只核第三轮返工的 4 条遗留项与新引入问题 | 判 0 P0 / 2 P1 / 4 P2。四条遗留项均判「部分收敛」，剩余 P1 为①校验器顶层信封未封闭且 `detail_fixtures` 顺序放宽 ②零上下文入口（brief）与验收摘要仍写着旧事实（接线/复核未做、旧变异数量、"待回填"）。均已在第 4 轮机械修完并复跑对照 | 见返工收敛第 4 轮 | e:E-023 | E-023 |

**返工收敛**

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|------|--------------|----------------------|---------|
| 1（对轮 1 发现，2026-08-18） | 2 P1 | ①README 漂移 → `materialize.ps1 -Force` 回灌 + 新增 `check-drift.ps1`；②link 安装解析失败 → **从根上修**：去掉唯一外部依赖，改 `apply(ctx,config)` + `ctx.provide('relayPilot', api)`，两种装法转录逐字节相同（E-009） | 是 |
| 2（对轮 2 首审，2026-08-20） | 4 P1 + 3 P2 | ①卸载清理 → 新增包外探针（E-017 三态）+ 真 Cordis 生命周期探针（E-016 判 CLEANED）；②校验器自证 → 期望清单外部化 + 磁盘重算 hash，变异对照全判 DIFF（E-018）；③侦察落档 → findings 补类型定义位置与官方声明样板；④evidence 索引 → 重写为六批总表并标注被推翻的结论；P2 三条：契约测试改为 files 派生 + 禁四种写法（变异 harness 见红，E-019）、漂移检查改逐字节覆盖两包（E-021）、overlay 注释改正。全量 41/41（E-020） | 部分——第 1 次收敛复检判 4 项收敛、3 项部分收敛 |
| 3（对第 1 次收敛复检，2026-08-20） | 2 P1 + 2 P2 | ①校验器改为**从磁盘独立重建整份期望 snapshot 后逐键比对**（含 schema、完整 diagnostics、probe 信封、派生 hash、探针探的 run 是否真缺/真有），新增 `transcript-mutation-check.mjs`；②批内 README 逐条纠错（`target-web` 加 superseded 提示、`smoke-rc6/rc7` 把 disable 结论改成「禁用后未注册」）、progress **append-only 追加纠错条**、findings/各批「仍缺失」刷新；③运行时文件枚举按 `files` 递归展开 + 磁盘全覆盖断言；④包外探针三态证据重采，带命令 / stdout / stderr / 退出码 | 部分——终检判 0 P0，仍留 2 P1 |
| 4（对终检，2026-08-20） | 2 P1 + 4 P2 | ①校验器**封闭顶层信封键集**、`detail_fixtures` 改顺序敏感、期望名按 basename 归一、`expectedDetails` 改 null-prototype；变异对照扩到 **1 正控 + 12 变异全红**；②契约枚举扩到 `.mjs/.js/.cjs`、排除项只在包根生效，变异 harness 扩到 **9 条全红**（新增 `lib/test/` 与 `.cjs` 两条）；③brief / findings §4 / visual_map / 本表的旧事实与旧数字全部刷新 | 是——本轮所有点名项均已机器复跑对照，无 open P0/P1 |

**需求复核结论**：approved（本卡完成条件 6 条逐条挂到 E-002~E-022，见「完成条件逐条挂证据」；无范围漂移——Client 面板、v1 投影、三态裁定均未触碰）｜证据 E-016~E-022｜由 主会话（Claude Opus 5）核对｜派出=e:E-015

**教训复核结论**：过（命中候选见 `lesson_candidates.md`：①测试只跑自造 fixture、真数据灭树；②「测试全绿」≠「断言在咬」，断言必须过变异；③把正确性押在安装拓扑上）｜由 主会话｜派出=e:E-015

## 第 4 路·一致性复核（横向：本次动的口径 vs 同类路径既有定义）

<!-- dh:consistency-review:v1 task=DHR_26 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|---------|-------------|------|---------|
| 两份 Read Model 的字段与语义（`relay.pilot-read-model/v1` / `relay.pilot-run-list/v1`） | DHR_25 的 `src/read-model/schema.mjs` 与 `testdata/fake/*.json`（唯一真源） | 一致 | 无需处置 —— Host 原样透传、不派生不校验，逐字段由 E-018 的磁盘重算 hash 钉住 | e:E-025 |
| 「分堆与排序只读源头 `group`」架构约束 | DHR_25 CLI 侧的两条镜像断言与变异测试 | 一致 | 无需处置 —— Host 不读 `group`、不分堆不排序；该约束的跨客户端验证按 DevPlan §4.2 归 DHR_49（P4-DM6），本卡不承接 | e:E-025 |
| 服务注册与卸载语义 | DSH 自身注册 `appExit` 的写法（`ctx.provide("appExit", host.exit)`，`dsh-cmdline/lib/index.js:29`） | 一致 | 无需处置 —— 本插件用同一个公开 API，生命周期同由 `ctx.fiber.effect` 托管（E-016 实测 dispose 后服务消失） | e:E-025 |
| fixture 读取口径 | DHR_25 CLI 的 fixture 加载（显式路径、不扫描目录） | 一致 | 无需处置 —— Host 同样只读配置点名的文件，`package-contract` 禁 `readdir/glob`（E-019 变异体覆盖） | e:E-025 |
| DSH 版本基线口径 | DevPlan §2.3「一切 DSH 结论必须标注所在版本」 | 一致 | 无需处置 —— 四批证据各自标注 rc.6 / rc.7，且实测两版转录逐字节相同 | e:E-025 |

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：对实现有没有 100% 信心？没有就逐条列 gap。

- **有信心的**：DM1（原样透传，E-018 磁盘重算 hash + 三条变异对照）、DM4a（安装/禁用/启用/卸载四态，E-003 E-006 E-007 E-016 E-017）、DM5a（只读五方法、出参 JSON clone、内部深冻结、无活对象穿越，41/41 单测 + `plugin-shape` 专项）、版本基线（E-004 E-005 E-012 两份前快照互证）。
- **仍存的 gap（已如实登记，不影响本卡终点）**：
  1. 生命周期证据分两层取得——**profile 内 disable/enable** 走 DSH 真实 boot（E-003 E-006 E-007），**注册后 dispose** 走真 Cordis 的进程内探针（E-016）。二者是同一条 `ctx.fiber.effect` 释放路径的两个取证角度，但不是同一次运行里连续观测的。
  2. 侦察落档中的 Client 事实（`dsh.client` / `exports['./client']` / 扫描锚点 / 类型定义位置）是读安装树与官方包声明得到的，尚未由一个真跑起来的 Client bundle 反证——那正是 DHR_49 要做的事。
  3. `check-drift.ps1` 是收口必跑的**采集命令**，不是自动闸；没接进单测（已在脚本头写明，不再宣称有闸）。

**设计契约传导声明**：

- 契约无变化：本卡产物全部在 `<experiment-root>`（仓外一次性 Pilot），未触碰 `docs/modules/dh-relay/design/` 任一契约；Read Model 两份 schema 由 DHR_25 冻结，本卡只消费不修改。

**需求对齐证据**（证明"真实/低成本场景里是否满足需求"）：

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论 |
|---|---|---|---|
| 不 fork 上游，就能给 DSH 装上一个能读 Relay 数据的后台外挂 | 在 DevPlan 指定的独立 `DSH_HOME` + `web` profile 上：`dsh plugin --profile web add .\src\dsh-host` → `dsh --profile web --patch .\src\dsh-host\probe.patch.yml` → 终端打出一行 `[relay-pilot-host-ready]`，退出码 0、stderr 空 | E-007 E-009 E-022 | 满足（DSH 上游零改动） |
| 外挂拿到的就是 DHR_25 那份数据，一个字都没改 | 同上转录 → `verify-transcript.mjs` 带外部期望清单核对：list 与 5 份 detail 逐字段一致、`fixture_hash` 从磁盘重算相符；三条变异体（掏空 / 改 hash / 篡改字段）全部判 DIFF | E-018 | 满足 |
| 装得上也卸得干净 | 装着跑包外探针 → `present:true` 退 1；`dsh plugin remove` 后跑同一探针 → `present:false` 退 0；装回 → `present:true` 退 1；另在真 Cordis 上注册→dispose→服务消失 | E-016 E-017 E-006 | 满足 |
| 升级到锁定的 rc.7 并说得清升级前后差了什么 | `npm install -g @deepseek-ai/dsh@0.1.0-rc.7`；前后快照对差：195→195 包、added=0 / removed=0 / changed=186（全为自家包同步升版）、安装根未变；两份升级前快照（B-10 预采 + 本卡实采）逐包互证 | E-004 E-005 E-012 | 满足 |
| 给下一张卡（DHR_49）留下能照着开工的侦察结论 | `findings.md` 登记 `dsh.client` 声明形态、`exports['./client']` 产物形态、profile 扫描锚点（`ctx.baseUrl`）、类型定义位置（4 个 `.d.ts` 及关键类型名）、官方样板 `@deepseek-ai/dsh-api-gateway` 逐字声明、`--patch` 与 profile 安装的适用边界 | findings §5/§6/§13/§14 | 满足 |

> 本卡不含 UI/交互/可视化产出（面板归 DHR_49），故无截图类证据；需求境证据形态为**真实终端转录 + 可一键复跑的命令序列**（见 `evidence/round2-lifecycle/README.md`「怎么复跑」）。

**完成条件逐条挂证据**：

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---------|------|-------------|------|
| 1 | P4-DM1：不修改 DSH 上游即可加载 Host Plugin；`ctx.relayPilot` 在 DSH 进程内可调用，两份 schema 原样透传，Host 不二次加工、不推导状态 | AI 代码证 + 本机实跑 | E-002 E-007 E-009 E-018 E-022 | 是 |
| 2 | P4-DM4a：Host Plugin 可安装/卸载；上游有显式启用/禁用机制则验证；卸载后服务与事件注册清理 | 本机实跑 | E-003 E-006 E-007 E-016 E-017 | 是 |
| 3 | P4-DM5a：Host 只传普通 JSON，不传 Cordis 活动对象；DSH RC 私有类型不进 Read Model | AI 代码证 + 本机实跑 | E-009 E-018 E-020（plugin-shape / fixture-store 专项断言） | 是 |
| 4 | 本机 DSH 由 rc.6 升 rc.7，前后留快照；证据链写明用的哪份前快照；版本漂移时作废预采并重采 | 本机 | E-004 E-005 E-012 | 是（证据链＝B-10 预采前快照 ∧ 本卡实采前快照（二者逐包一致）+ 本卡升级后快照） |
| 5 | `findings.md` 登记 `dsh.client`、`exports["./client"]`、profile 扫描锚点、类型定义位置、`--patch` 与 profile 安装边界，作为 DHR_49 开工输入 | AI | findings §5/§6/§13/§14 | 是 |
| 6 | 本卡只登记事实，不裁定 DSH 桌面轨三态 | 主会话/用户 | 全卷无三态标签（轮 2 复核专项核过，仅 review brief 中作为禁止项出现） | 是 |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态 | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|----------|--------|-------|---------|-------------|---------|-----------|-----------|----------------|------------------|---------------------|
| 树外 Host Plugin 可加载且服务可调用 | DSH 真实 boot 转录 + 退出码 | machine | P4-DM1 | 等价覆盖 | 退出码 0 ∧ stderr 空 ∧ 单行转录 ∧ 校验器判 IDENTICAL | pass（E-007 E-009 E-022） | dsh 0.1.0-rc.7 · Node v24.12.0 · Win11 | verify-transcript 带外部期望清单、hash 从磁盘重算 | 非 Windows 平台未验；Client 侧不在本卡 | pilot-v1 | — | — |
| 安装 / 禁用 / 启用 / 卸载后服务注册清理 | 包外探针三态 + 真 Cordis 注册→dispose | machine | P4-DM4a | 等价覆盖 | 装着 present:true 退 1（正控）∧ removed present:false 退 0 ∧ dispose 后 ctx.get 为 undefined | pass（E-003 E-006 E-007 E-016 E-017） | 同上 | 包外探针独立于被测包；正控排除恒假 | disable 与 dispose 非同一次运行内连续观测 | pilot-v1 | — | — |
| 只传普通 JSON，无活对象 / RC 私有类型 | 静态契约测试 + 运行时断言 | machine | P4-DM5a | 等价覆盖 | 运行时文件零 bare import（四种写法全禁）∧ 出参 JSON clone ∧ 内部深冻结 ∧ 无 route/event/timer/process | pass（E-019 E-020） | 同上 | 变异 harness 5/5 见红 | 未做 fuzz | pilot-v1 | — | — |
| rc.6 → rc.7 版本基线与差异 | 前后快照对差 | machine | 版本基线 | 等价覆盖 | 两份前快照逐包一致 ∧ 后快照 changed=186 全为自家包 ∧ 安装根未变 | pass（E-004 E-005 E-012） | rc.6 → rc.7 | B-10 预采件为独立第三方快照 | 仅 npm 全局渠道 | pilot-v1 | — | — |
| 侦察落档足以让 DHR_49 开工 | 文档事实登记 | machine（事实登记）+ human（够不够用，归 DHR_49 开工闸） | 侦察落档 | 等价覆盖 | 五类事实齐备且路径在本机可核 | pass（findings §5/§6/§13/§14） | dsh 0.1.0-rc.7 | 轮 2 复核独立核过路径属实 | 未由真跑起来的 Client bundle 反证 | pilot-v1 | — | — |

**业务化五段展示区**

- 要证明啥：不改 DSH 上游、只装一个树外后台外挂，DSH 进程内就能拿到 DHR_25 冻结的两份 Relay 数据；装得上、卸得干净；本机 DSH 已升到锁定的 rc.7 且说得清差异。
- 期望值：DSH 启动后打出一行 `[relay-pilot-host-ready]` 转录，内容与磁盘 fixture 逐字段相同（含 5 条 run 的列表 + 5 份详情，`0006`/`0007` 无详情按契约返回 null）；卸载后服务真的消失；rc.7 现场与升级前差异有据。
- 实际值：转录退出码 0 / stderr 空 / `fixture_hash = 67fb18b3…`（**五轮完全一致**：rc.6 冒烟、rc.7 冒烟、目标机 tgz、目标机目录安装、2026-08-20 复跑）；包外探针 remove 后 `present:false` 退 0、装回退 1；真 Cordis 上 dispose 后服务复归 undefined；rc.6→rc.7 包对差 195→195 / changed=186 全为自家包。
- 差没差：没差。十二条转录变异对照与九条契约变异对照全部见红（各带一条正控），说明这些「没差」是被断言咬住的，不是碰巧。
- 证据局限：①全部在 Windows 单机 npm 全局安装形态下取得，未跨平台；②Client 侧（面板、bundle 构建）完全不在本卡，DSH 能不能当日常工作台本卡不回答；③disable 与 dispose 两条清理路径分别取证，非同一次运行内连续观测。

**风险放行账表**

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|-------|---------|------|------|------------|---------|---------|
| 无 | — | — | — | — | — | — |

**材料齐没齐**：brief / task_plan / progress(证据账本 E-001~E-022) / 两轮独立复核记录 / review 都有了？ [x]
**as-built 更新了没**：本卡产物全在仓外一次性 Pilot 实验区，未触碰 `tools/` 生产代码与任何现役子系统 → N/A [x]

→ 当前状态：**已验收**（2026-08-20 用户对话确认，见人类签名区确认记录）

---

## 人类签名区　✅ 凭你在对话里的确认解锁

> 本卡的验收口径**全部是机器证**（DevPlan §3.2 DHR_26 六条完成条件里没有人判结果项——「DSH 到底能不能用」的三态裁定按 §2.3 归 DHR_27 由你人判收敛，本卡明令不得贴标签）。
> 所以这里的人类闸**不是让你判对错，是让你看过证据后授权收口**。你想亲手验，下面给了可照抄的命令序列。

### 目的一：确认「不 fork 上游也能给 DSH 加东西」这件事在你机器上真的成立

本工作区交付：一个树外 Host 插件（两种装法都能装）、它在 DSH 进程内暴露的 `ctx.relayPilot`、以及五轮逐字节一致的转录证据（E-002 E-007 E-009 E-018 E-022）。

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| 插件真能在你的 DSH 里跑起来并读到 DHR_25 的数据 | 复制 `evidence/round2-lifecycle/README.md`「怎么复跑」里的 probe 三行（设两个环境变量 + `dsh --profile web --patch .\src\dsh-host\probe.patch.yml`） | 终端打出一行 `[relay-pilot-host-ready]`，`fixture_hash` 是 `67fb18b3…`，退出码 0 | [ ] |
| 卸得干净 | 同文件里包外探针三态那六行 | remove 后 `present:false` 退 0；装回 `present:true` 退 1 | [ ] |

### 目的二：确认版本基线与交给下一张卡的侦察结论你认

本工作区交付：rc.6→rc.7 升级前后快照与对差（E-004 E-005 E-012）、`findings.md` 的树外插件与 Client 侧事实（§5/§6/§13/§14）。

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| 版本基线口径你认 | 看 `evidence/smoke-rc7/README.md` 的对差表 | 195→195 包、无增删、186 个自家包同步升版、安装根未变 | [ ] |
| 侦察结论够 DHR_49 开工 | 看 `findings.md`「侦察落档补齐」一节 | 你认为下一张卡照着能动手（不够就在对话里说缺什么，本卡补） | [ ] |

---

- 确认记录：2026-08-20 用户在对话里通过 AskUserQuestion 点选「**认可，执行本地收口**」——AI 先给出七段收口汇报 + 机器证据摘要（五轮转录一致、包外探针三态带退出码、真 Cordis dispose 后服务消失、rc.6→rc.7 包对差、41/41 单测、转录变异 13/13、契约变异 9/9），用户在此基础上授权本地收口（代签 verify + 精确路径合入本地 master + 工作区回填），并明确**不 push**。同一轮用户还点选「合并后删 agent/dhr26-host-pilot 与 wt/DHR_26-dsh-host-pilot 两条分支，agent/dhr49-client-pilot 原地封存」。
- verify 提交 SHA：<收口提交后回填>
- 签名：hyf（chat-confirm 代签）　　时间：2026-08-20

→ 解锁状态：**已验收**（随后回 DevPlan 任务表销户）

> 铁律：没有对应的 `verify(dh-relay): DHR_26 …` git 提交，本卡不许标"已完成"。

### 确认记录（append-only，每次人验确认追加一行）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---------|--------|----------------------|----------------------|-------------------------------|---------------|--------------------------------|
| 2026-08-20 | hyf | DHR_26 releasePacket（机器证据摘要 + 两块核验表 + 零风险行） | 工作区提交 397f83b（收口前最后一次复跑） | fixture_hash=67fb18b3… 五轮一致；41/41 单测；转录变异 1 正控+12 全红；契约变异 9 全红；漂移 27 文件内容一致 | P4-DM1 / P4-DM4a / P4-DM5a / 版本基线 / 侦察落档 | 通过 |

---

## 附录一 · 第一轮复核原文（claude-grok / grok-4.5，2026-08-18 晚，未删改）

# DHR_26 Host Plugin — 独立复核结论（只读）

核验范围：仓内镜像 `docs/modules/dh-relay/workspace/DHR_26/artifacts/.../dsh-host`、权威落点 `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\src\dsh-host`、真 fixture `testdata/fake`、本机已装 `@deepseek-ai/cordis@4.0.1` / `cordis-plugin-loader`。单测在权威落点实跑：**28/28 PASS**。

---

## A. 正确性

### P1 — 权威落点 README 仍教人用目录安装，与已证实的硬失败矛盾
- **位置**：`dh-relay-p4-pilot/relay-control-pilot/src/dsh-host/README.md:42`（权威落点） vs 仓内镜像同文件 `:43-52`
- **事实**：`diff` 显示两边**只有 README 不同**。仓内已改成 `npm pack` + tgz，并有 “Do not install the source directory” 警告；权威落点仍是 `dsh plugin ... add .\src\dsh-host`。`evidence/target-web/link-install-failure.txt` 与 findings 12d 已证明该路径稳定 `ERR_MODULE_NOT_FOUND`（`@deepseek-ai/cordis`）。
- **为什么是问题**：任务卡真源是仓外权威落点；按那里的 README 操作会复现整树加载失败。findings/progress 写「README 已改」对镜像成立，对可跑环境不成立（需 `materialize.ps1 -Force`）。
- **建议**：重新 materialize；或把「镜像与权威落点必须同内容」做成接线检查项。

### P2 — `detail-unlisted` 的「仍可通过 `getRun` 读到」契约没有行为测试钉住
- **位置**：`fixture-store.mjs:193-195, 219-224`；`fixture-store.test.mjs:31-46`；README 对 `detail-unlisted` 的说明
- **事实**：真 fixture 下 `fake-run-0003/0004` 确为 unlisted，且 `getRun` 实测能返回；但测试只断言 diagnostics 里有它们，**从未断言** `getRun('fake-run-0003'|'0004')` 非 null。有 detail 的断言只覆盖了 list 内的 `0001/0002/0005`。
- **为什么是问题**：这是本轮明确写下的降级契约一半；回归时若有人改成「只暴露 listed details」或过滤 `details`，现有测试仍绿。
- **建议**：补一条：unlisted 的 `getRun` 返回原样 detail；listed+missing 返回 `null`。

### P2 — `normalizeFixtureList` 的 delimiter 形态测试覆盖不全（风险低于 brief 担心的 `:`）
- **位置**：`fixture-store.mjs:97-118`；`fixture-store.test.mjs:76-79`
- **事实**：win32 上 `path.delimiter` 是 `;`，不是 `:`。我用真绝对路径（含 `D:\...`）和 relative+`;` 拼接实测均可加载。测试只覆盖了 `\n` 与 JSON 数组串，**没覆盖** `path.delimiter` 拼接，也没覆盖绝对路径串。
- **为什么是问题**：`:` 注入在 Windows 上不是真风险；真风险是「路径本身含 `;`」或文档/环境变量误用 `:` 当分隔符。当前实现按平台 delimiter 是对的，但回归网没钉住。
- **建议**：加一条 `DETAIL_FIXTURES.join(path.delimiter)` 与一条绝对路径 JSON 数组；文档写明「不要用 `:`，用数组 / JSON / 平台 delimiter / 换行」。

### NIT — snapshot 信封字段不是 fixture 派生，但 `fixture_hash` 不含 diagnostics
- **位置**：`fixture-store.mjs:197-206`
- **事实**：`list`/`details` 经 `cloneJson` 原样放入；测试 `passes the real list and detail models through byte-identical` 成立。信封额外有 `schema_version` / `fixture_hash` / `list_fixture` / `detail_fixtures` / `diagnostics`。`fixture_hash` 只哈希 `{list, details}`，不含 diagnostics——与「诊断是加载注释」一致。
- **建议**：若对外承诺 hash 代表「可见快照全体」，需写清不含 diagnostics；否则保持现状即可。

### （未升为问题）原样透传 / 冻结隔离 / `__proto__`
- **原样**：未见排序重排 runs、补默认 `group`、字段改名或 list↔detail 交叉改写；旧自动发现与关联断言已不在源码中（`package-contract` 还禁止 `readdir/glob`）。
- **隔离**：内部 `deepFreeze` + 出参一律 `cloneJson`；`getRun` 两次调用引用不同；活对象 / 非 plain prototype 在 `readJsonFile` 被 `isPlainJson` 拒绝。
- **`__proto__`**：`details = Object.create(null)` + `Object.hasOwn`；专项测试存在且通过。

### （未升为问题）diagnostics 语义
- `detail-missing`：list 有、detail 配置无 → 保留 list 行，`getRun→null`
- `detail-unlisted`：detail 有、list 无 → 仍进 `details`
- 二者独立、无交叉校验；与真 fixture（list: `0005,0007,0002,0001,0006`；detail 文件映射 `0001/0002/0005/0003/0004`）一致。缺文件 / 坏 JSON / 错 schema / 重复 detail `run_id` 仍 fail-fast——合理，不算漏降级。

---

## B. 测试形状

### P1 — 真 fixture 强制读取挡住了「合成 fixture 全绿、真数据灭树」，但**挡不住**本轮新发现的 link 安装解析失败
- **位置**：`test/real-fixtures.mjs:12-23`；对比 `evidence/target-web/link-install-failure.txt`
- **事实**：缺 fixture root 会硬抛，不再 skip；28 测均走真数据。这能复发阻断「list/detail 非 1:1 却 throw」。但 `@deepseek-ai/cordis` 在 `link:` 真路径下解析失败是**安装拓扑**问题，单测进程根本不 import Cordis（`package-contract` 只做源码字符串断言）。
- **为什么是问题**：同类「测试绿、目标机灭」会换皮重来。
- **建议**：至少其一——(a) 改零依赖 `provide`（见 D）；(b) CI/接线脚本显式跑一次 `dsh plugin add <dir>` 并断言失败或禁止；(c) materialize 后 diff 镜像与权威落点。

### P2 — `unwrapExports` 复刻测试有用但脆
- **位置**：`test/probe.test.mjs:7-18, 37-46`；上游 `cordis-plugin-loader/lib/index.js:736-741`
- **事实**：复刻内容与本机 loader **逐行一致**（`default ?? exports`，再处理 `__esModule`）。它能钉住「不要 `export default apply`」。若上游改 unwrap 语义，测试不会红，生产却可能再丢 `inject`。
- **建议**：注释钉上 loader 版本/commit；或在能解析到 `@deepseek-ai/cordis-plugin-loader` 的环境改为 import 真函数；保留「`probeModule.default === undefined`」作为不依赖上游的硬钉。

### P2 — `absence-probe` 几乎无行为测试
- **位置**：`absence-probe.mjs`；测试仅在 `package-contract.test.mjs` 做「无 default / 有 apply」静态检查
- **事实**：`probe.test.mjs` 覆盖了 appExit 缺失、成功转录、错误退出；absence 的 present/absent 分支、250ms timer disposer、以及「故意不 inject relayPilot」均无单测。
- **建议**：用 fake `ctx.get` 测 `present:false→exit 0` / `present:true→exit 1`，不需要真 DSH。

### P2 — 若干断言偏弱
- **位置**：`probe.test.mjs:75` `assert.ok(payload.diagnostics.length > 0)`；未断言 `detail-missing`/`detail-unlisted` 集合
- **建议**：与 `fixture-store` 测试对齐，钉死 `0007/0006` missing 与 `0003/0004` unlisted。

### （判断）能否挡住同类复发
- **能挡**：真 fixture 非 1:1、probe default 导出丢 inject、缺 appExit、无 directory walk、包内不带第二份 Cordis dependency 声明。
- **不能挡**：目录 `link:` 安装的模块解析；absence-probe 行为回归；权威落点文档漂移。

---

## C. 过度设计 / 冗余 / 是否砍过头

### P2 — `canonicalJson` / `sha256Canonical` / `fixture_hash` **并非无消费者**（不宜当死代码砍）
- **位置**：`fixture-store.mjs:49-56, 200, 215`；`probe.mjs:12, 61, 66, 70`；`scripts/verify-transcript.mjs:3, 47, 72`；证据 `transcript-report.json` 的 `fixture_hash`
- **事实**：hash 进入服务 API、probe 转录、三轮证据对拍（rc6/rc7/target-web 均为 `67fb18b3…`）。`canonicalJson` 还被 verify-transcript 用来做字段级同一判定。
- **建议**：保留；若嫌「Pilot 过重」，可把 hash 标成证据辅助字段，但不要当无引用删除。

### NIT — 其它轻微过剩
- `RelayPilotService` 对 repository 的薄委托层：合理边界。
- `absence-probe` 的 250ms `setTimeout`：与「Host 不注册 timer」不冲突（probe 是证据 overlay），但 Host 主路径确实干净。

### （判断）有没有砍过头
- **没有**。删掉全目录 walk、自动挑 list、7 字段交叉断言——与真 fixture 及「原样透传」一致；留着会再次灭树。
- **该留且仍在的**：schema_version 校验、list `run_id` 非空、detail 重复 `run_id` fail-fast、坏 JSON / 读失败码。
- **可加但不算砍过头**：list 内重复 `run_id` 目前静默透传（我构造重复 `0005` 时只多一行 list、无诊断）。按「透传」哲学可接受；若要可观测性，可加 `list-duplicate-run-id` 诊断而非 throw。

---

## D. 设计问题：目录安装 vs 去 Cordis import

### 倾向：**方案 2 的精神，但用公开 API `ctx.provide`，不要直接依赖 `ctx.reflect.provide`**

核验依据：
- `Service` 构造函数本质就是 `ctx.reflect.provide(name, self, check)`（`cordis/src/service.ts:57`）。
- **`ctx.provide` 是 Context 公开接口**：`reflect.ts` 把 `provide` mixin 到 ctx（`this.mixin('reflect', ['get', 'set', 'provide', ...])`），并有完整 JSDoc；DSH 自己注册 `appExit` 用的就是 `ctx.provide("appExit", host.exit)`。
- 施工者担心的「`ctx.reflect` 是否稳定」：直接摸 `reflect` 才偏实现细节；**`ctx.provide` 才是文档化公开面**。

| 方案 | 代价 | 收益 |
|---|---|---|
| **1. 只改文档锁 tgz** | 丢掉 `link:` 源码安装的即时改码循环；且**当前权威 README 还没改上**；后续 Client/联调每次 pack | 代码不动；与现有 `extends Service` / `super(ctx,'relayPilot')` 合同一致 |
| **2. `apply(ctx,config)` + `ctx.provide('relayPilot', api)`，去掉唯一外部 import** | 改 `index.mjs` 形态；改 `package-contract.test.mjs`（现钉 `super(ctx, 'relayPilot')` 与「恰好一个 `@deepseek-ai/cordis` import」）；更新 findings/task_plan 里「公开入口=Service」的表述；不再继承 Service 的 init/check/tracker（本 Pilot **未使用**） | **零外部依赖** → `link:` 与 tgz 都能跑；更严格满足「不把 Cordis 打进包 / 不出现第二份框架身份」；安装拓扑不再靠 fallback 农场巧合 |
| 3. 其它（peerDep Cordis / NODE_PATH / 手写解析钩子） | 易引入第二份身份或脆弱路径约定 | 不推荐 |

**为什么不选 1 做长期态**：本卡已证实「无 Cordis 依赖 + 靠 profile fallback」**只在物理拷贝进 profile 树时成立**。用文档掩盖安装器与 Node ESM 真实路径规则，会在下一张卡（Client、联调）继续咬人。Pilot 阶段保留 Service 子类的仪式感，换来的是永久失去目录安装开发循环——不划算。

**任务卡 / 合同怎么办**：把钉死点从「必须 `extends Service`」改成「必须暴露 `ctx.relayPilot`，生命周期随 fiber 卸载清理，零 route/event/timer/写命令，返回脱离 JSON」。`package-contract` 改为断言：运行时文件 **零** `@deepseek-ai/*` import，且源码含 `ctx.provide('relayPilot'`（或等价）。

**对后续阶段**：Client 卡若仍要高频改 Host，tgz-only 摩擦会放大；零依赖 `provide` 一次修掉根因。

若短期必须冻代码只收口：方案 1 可作**临时**门禁，但应标为已知债，并把权威落点 README 同步列为 P1。

---

## 施工者自述里不实 / 不同意之处

1. **「README 已改并加警告」** — 仅对仓内 `artifacts/.../README.md` 为真；**权威落点 README 仍是目录安装**（`diff` 可证）。progress 19c / findings 12d / target-web README 的表述过度乐观。
2. **「`canonicalJson` / `sha256Canonical` / `fixture_hash` 目前没有任何消费者」**（复核题设）— **不同意**。消费者包括 `fixtureHash()`、`probe` 转录、`verify-transcript.mjs`、三轮 evidence 对拍。
3. **「真修法 = `ctx.reflect.provide`」** — 方向对，API 选得偏。应倾向公开的 **`ctx.provide`**；`reflect.provide` 是 Service 内部实现。施工者「未见文档承诺」不成立：`Context` 接口对 `provide` 有正式文档，且 `appExit` 已在用。
4. **`progress.md` 顶部「目标机接线…未执行」** 与同文件 19b–19e（web profile 全套通过）**自相矛盾**；`brief.md` 仍写「做关联一致性检查」「目标机证据仍为 missing」——与本轮实现/证据不符（brief 过期，不是代码谎报）。
5. **「搬入四个证据采集件」略混** — `scripts/` 下是 3 个采集脚本；`absence-probe.mjs` 是包内插件 overlay，不是 scripts 采集器（README 自己也这么表了）。
6. **同意且核实为真的部分**：28/28；真 fixture 非 1:1（missing `0006/0007`，unlisted `0003/0004`）；probe 去 default 导出与 loader `unwrapExports` 机制；`appExit` 必要性；link 安装失败根因（真实路径向上找 `node_modules`）；tgz 后 target-web 转录 `IDENTICAL`。

---

---

## 附录二 · 施工者对第一轮的逐条处置（2026-08-18 晚；复核结论正文未改动）

| 复核项 | 级别 | 处置 |
|---|---|---|
| 权威落点 README 仍教目录安装 | P1 | **已修**。当时 materialize 早于改 README，未回灌。已 `materialize.ps1 -Force` 重铺；且因根因已修，该 README 现在两种装法都推荐，禁令段落取消。 |
| 真 fixture 强制读取挡不住 link 安装解析失败 | P1 | **已从根上修**（采纳复核建议 (a)）。见下「设计问题」。 |
| `detail-unlisted` 的 `getRun` 契约无测试 | P2 | **已补**：`an unlisted detail stays reachable through getRun`，并对 `fake-run-0003` 做整份 deepEqual。 |
| `normalizeFixtureList` 形态覆盖不全 | P2 | **已补**：新增 `path.delimiter` 串、绝对路径数组、绝对路径 delimiter 串、绝对路径 JSON 数组共 6 种形态对拍同一 hash。 |
| `unwrapExports` 复刻测试脆 | P2 | **部分采纳**：保留复刻（它是唯一能钉住"别写 default 导出"的手段），并保留不依赖上游的硬钉 `default === undefined`；同时把该断言扩展到全部运行时文件。未做「import 真函数」——那会重新引入 bare import，与本轮零依赖结论冲突。 |
| `absence-probe` 几无行为测试 | P2 | **已补**：新增 `test/absence-probe.test.mjs`，覆盖 present/absent 两分支的退出码与转录、缺 appExit 的抛错、以及 disposer 取消待决检查。 |
| probe 断言偏弱 | P2 | **已补**：改为钉死 `detail-missing = {0006,0007}`、`detail-unlisted = {0003,0004}`。 |
| `fixture_hash` 并非无消费者 | P2 | **接受纠正**。是施工者在 brief 里的错误题设；findings 已改，未删除任何相关代码。 |
| `progress.md` 顶部与 19b–19e 自相矛盾 | — | **已修**：顶部「当前状态」重写，并注明该节随施工更新、时间线只追加。 |
| `brief.md` 过期（关联一致性检查 / 目标机证据 missing） | — | **已修**。 |
| 「搬入四个证据采集件」措辞混 | — | **接受**：`scripts/` 下是 3 个采集脚本，`absence-probe.mjs` 是包内 overlay。README 表述本就正确，progress 措辞已在本轮说明中区分。 |
| list 内重复 `run_id` 静默透传 | 建议 | **未做**，记为可选增强。按「原样透传」哲学，重复由上游负责；若要可观测性可加 `list-duplicate-run-id` 诊断而非 throw。 |

### 设计问题的处置：采纳方案 2，并采纳复核对 API 的修正

复核指出施工者「`ctx.reflect` 是否稳定」的顾虑站不住：`provide` 本就 mixin 到 context（`cordis/lib/index.js:735-741`），`ctx.provide` 才是公开面，DSH 自己的 `appExit` 就这么注册。**核实成立，施工者判断有误。**

已改：`index.mjs` 去掉唯一的 `import { Service } from '@deepseek-ai/cordis'`，改为 `apply(ctx, config)` + `ctx.provide('relayPilot', api)`。契约测试同步从「恰好一个 cordis import + `super(ctx,'relayPilot')`」改成「运行时文件零 bare import + `ctx.provide('relayPilot'`」。

实测（`evidence/zero-import/`）：此前必然失败的 `dsh plugin --profile web add ./src/dsh-host` **目录安装现在退出码 0**，且与 tgz 装法的 probe 转录**逐字节相同**；两种装法下 disable/enable 与 `--dump-config` 均通过；40/40 单测（materialize 后零环境变量）。

### 尚未处置

- 第二轮换人交叉评估（本轮只做了第一轮）。
- verify 收口与用户签收。

---

## 附录三 · 第二轮复核原文（codex-ninth / gpt-5.6-sol，read-only 沙盒，2026-08-20，未删改）

## 1. 核验形态

- 全程只读，未创建或修改文件。
- 实跑只读测试：

  ```text
  node --test \
    src/dsh-host/test/package-contract.test.mjs \
    src/dsh-host/test/plugin-shape.test.mjs \
    src/dsh-host/test/probe.test.mjs \
    src/dsh-host/test/absence-probe.test.mjs
  ```

  结果：24/24 PASS。

- 未跑完整 40 例：`fixture-store.test.mjs:139-172` 会创建、写入并删除临时文件，不符合本轮只读约束。已有 `evidence/zero-import/host-tests.txt` 声称 40/40，但本轮未复跑这部分。
- 实跑 `check-drift.ps1`：报告 20 个文件同步；另用 SHA-256 逐文件对拍，仓内镜像与仓外权威落点确实为 `20/20、DIFF=0`，当前逐字节一致。
- 独立解析 `zero-import` 转录并与固定的 `runs-active.json`、5 份 detail fixture 对拍：list、details、文件名集合及 detail key 集合均一致。
- 五份 probe 转录 SHA-256 完全相同。
- 实跑 `dsh --version`：`0.1.0-rc.7`。
- 独立比较 B-10 预采件与本卡 rc.6 JSON 快照：194 个内置包逐项一致；本卡快照多出的第 195 个仅为主包 `@deepseek-ai/dsh@0.1.0-rc.6`。
- 静态核对本机 Cordis rc.7：`ctx.provide()` 确实由当前 fiber 的 effect 托管，disposer 会删除 service store。
- 无法核验：真实 DSH 进程内“服务已注册后再卸载”的动态清理。现有证据没有覆盖最终 `ctx.provide` 实现的该路径。

## 2. 逐条结论

### A. 第一轮修法

#### P1 — 最终 `ctx.provide` 实现的卸载清理没有机器证据

- **位置**：
  - `artifacts/.../dsh-host/index.mjs:75-76`
  - `evidence/zero-import/absence-disabled.txt:1`
  - `artifacts/.../dsh-host/disable.patch.yml:1-2`
  - `evidence/zero-import/README.md:30-38`
  - `findings.md:12,49`
- **事实**：Cordis 实现层面，`provide()` 的生命周期逻辑成立：本机 `cordis/lib/index.js:799-822` 把注册放进 `fiber.effect()`，disposer 删除 store。  
  但 `zero-import` 的 `present:false` 是 Host 以 `disabled:true` 启动时取得的，此时 Host 根本没有执行 `apply()`，只能证明“禁用后未注册”，不能证明“已经注册的服务被卸载清理”。该批证据没有 `dump-after-remove`，也没有包外 absence probe。已有 remove dump 来自改成 `ctx.provide` 之前的实现，而且 dump 只能证明配置树里没有插件行。
- **为什么是问题**：DM4a 明确要求“卸载后服务与事件注册得到清理”。当前只有源码机制依据和未注册状态证据，没有最终实现的动态卸载证据。
- **建议**：增加一个不随 Host 包卸载消失的外部 probe，或在真实 Cordis context 中执行插件 fiber 的注册→卸载，并断言 `ctx.get('relayPilot') === undefined`；保留命令、退出码和转录。

#### P2 — “零 bare import”契约测试可被多种写法绕过

- **位置**：`test/package-contract.test.mjs:41-55`
- **事实**：正则只识别字面量静态 `import`/`from`。它不识别 `import(expr)`、`createRequire()`、`require()`、字符串拼接等方式；运行文件列表也是手写的四个文件。
- **为什么是问题**：当前源码确实没有这些绕法，但测试没有真正钉死“运行时零外部依赖”这一安装拓扑契约。
- **建议**：用 JS parser 检查所有 import/call expression；至少禁止动态 import、`createRequire`、非 `node:` require，并从 manifest/exports 自动枚举运行文件。

#### P2 — 漂移检查并非它声称的逐字节门禁，且不存在所称契约测试

- **位置**：
  - `check-drift.ps1:37-59`
  - `progress.md:49,58,75`
- **事实**：当前两棵树经独立 SHA-256 对拍确实逐字节相同；脚本也会比较文件集合和内容。但脚本先按 UTF-8 解码并归一化 CRLF，因此不同字节可能被判为相同。测试目录内没有任何对 `check-drift.ps1` 的引用，施工者所称“新增一条契约测试”未找到。
- **为什么是问题**：当前漂移已修复，但自动回归闸的强度被表述得过高，且未接入测试套件。
- **建议**：直接哈希原始字节；新增真实测试或明确把它登记为必须单独执行的收口命令。

### B. 证据与验收结论

#### P1 — `IDENTICAL` 校验器可以把缺失 detail 判成一致

- **位置**：`scripts/verify-transcript.mjs:46-65,76-89`
- **事实**：
  - 待核 fixture 名单来自转录自身的 `snapshot.detail_fixtures`。
  - 若该数组为空，`detailChecks.every(...)` 自动为 true。
  - 空 diagnostics 会使 `degrade_honoured` 自动为 true。
  - `detail_missing_returns_null` 只要不是明确的 `false` 就通过。
  - 不检查 `snapshot.details` 是否有未声明的额外 key。
- **为什么是问题**：一个只带正确 list、但删除全部 details/diagnostics 的转录也可能得到 `IDENTICAL`，会误导 DM1 验收。
- **建议**：从独立配置或固定清单传入预期 fixture 集合；检查文件名与 detail key 精确集合、预期 missing run 集合、无额外 detail，并重算 `fixture_hash` 和摘要字段。

  补充事实：本轮独立使用固定的五份 detail 清单核对后，现存 `zero-import` 转录本身确实与 fixture 一致；问题在校验器的证明能力，而非当前转录内容。

#### P1 — 侦察落档缺少明确要求的类型定义位置

- **位置**：`findings.md:10-14,54-56`
- **事实**：已记录 `dsh.client.platform`、`exports["./client"]`、`ctx.baseUrl` 扫描锚点、bundle wrapper 和 `--patch`/profile 边界；但没有登记“类型定义位置”。本机实际相关位置包括：

  ```text
  @deepseek-ai/dsh-client-modules/lib/types/client/manifest.d.ts
  @deepseek-ai/dsh-client-modules/lib/types/client/index.d.ts
  @deepseek-ai/dsh-client-modules/lib/types/index.d.ts
  ```

- **为什么是问题**：这是任务卡明确要求交给 DHR_49 的开工输入；brief 明示缺项则 DHR_49 不得开工。
- **建议**：在 `findings.md` 登记精确包名、文件路径、关键类型名，并附一个官方 client 包的具体 `package.json` 声明实例。

#### P1 — evidence 总索引仍发布已经被修复推翻的安装结论

- **位置**：`evidence/README.md:3,21-31`
- **事实**：总索引没有登记 `zero-import/` 批次，仍写“目录安装装不起来”“目标机必须装 tgz”，且“仍缺失”仍写两轮复核。最终代码和 `zero-import/README.md` 已证明目录安装、tgz 安装均可运行。
- **为什么是问题**：证据入口给出的当前操作结论是错误的，并隐藏了第一轮修复后的关键证据，足以误导验收和 DHR_49。
- **建议**：增加 zero-import 批次，并明确标记 target-web 的 tgz-only 结论已被后续修复取代。

#### P2 — 版本基线事实已经补齐，但 `findings.md` 仍写未核

- **位置**：
  - `progress.md:59,69-77`
  - `findings.md:47`
- **事实**：B-10 预采件与本卡 rc.6 快照已经逐包对拍，结果符合施工者记录；前后快照及安装布局也完整。但 `findings.md` 仍写“B-10 预采文件是否存在/未漂仍未核”。
- **为什么是问题**：同一卡片内事实登记互相矛盾。
- **建议**：把已核关系和实际采用的前快照写回 `findings.md`。

### C. 只读红线与安全

#### 通过（非问题）— 当前 Host 服务面未见写路径或活动对象泄漏

- **位置**：
  - `index.mjs:42-76`
  - `fixture-store.mjs:26-38,172-226`
  - `test/plugin-shape.test.mjs:37-63`
- **事实**：API 只有五个查询方法；返回值均为 JSON clone；内部 snapshot 冻结；未返回 Context、Fiber、disposer 或其他活动对象。Host 主路径未注册 route、event、timer 或 process handler。
- **建议**：保持现状。

#### 通过（非问题）— 原型污染防护成立

- **位置**：`fixture-store.mjs:172-183,220-223`；`test/fixture-store.test.mjs:154-172`
- **事实**：details 使用 null-prototype map，查询使用 `Object.hasOwn`；`__proto__` 被当作普通 run ID。静态实现成立，已有专项测试记录。
- **建议**：保持现状。

#### 通过（非问题）— 未发现凭据值或三态越权裁定

- **位置**：DHR_26 全部源码、治理工件及 evidence
- **事实**：未发现 token、密码、API key 值或私钥；dump 中只有 `DEEPSEEK_API_KEY` 环境变量名。存在任务所需的本机安装路径和用户名路径信息，但没有凭据值。除 review brief 自身外，未发现三态标签。
- **建议**：继续保持只记录变量名、不记录值。

### D. 漏做、越界与砍过头

#### P2 — remove overlay 自身仍留有已知不可执行的说明

- **位置**：`absence.patch.yml:1-2`；对照 `README.md:78`
- **事实**：patch 注释仍建议在 `plugin remove` 后运行，但 Host 包卸载后该 probe 自己也不存在；README 已明确说明这条路径会失败。
- **为什么是问题**：随包分发的操作提示自相矛盾。
- **建议**：删除“remove 后运行”的说明，或把 probe 移到包外独立证据插件。

#### 通过（非问题）— 未发现范围越界或砍过头

- **事实**：没有 Client 实现、`exports["./client"]`、Relay 写权、route 或 UI；侦察事实属于本卡明确交付。没有自行给出三态裁定。删掉自动发现和跨 fixture 推导后，schema 校验、坏 JSON、重复 detail run ID、原型污染防护仍保留。
- **建议**：保持 Host-only 边界。

## 3. 对第一轮与施工者自述的交叉评估

成立：

- `ctx.provide` 是公开 API，且实现层面的 fiber 生命周期语义与原 Service 注册方式等价。
- 去掉 Cordis import 后，当前目录安装与 tgz 安装转录逐字节相同。
- 仓内镜像与仓外权威落点当前确实逐字节一致。
- 当前转录经独立固定清单核验，list 与五份 detail 确实原样一致。
- 只读 API、普通 JSON 边界、`__proto__` 防护以及无 Host side channel 均成立。
- rc.6 前快照、B-10 预采件及 rc.7 后快照的版本证据链成立。

不成立或过度乐观：

- “运行时零 bare import 已被契约测试钉死”过度乐观；正则存在明显绕法。
- “新增 check-drift + 契约测试”中，脚本存在，但未找到所称契约测试；脚本也不是逐字节比较。
- “卸载后服务清理已实测”过度乐观；最终 `ctx.provide` 实现只验证了 disabled 启动时缺席，没有动态卸载机器证据。
- `transcript-report.json = IDENTICAL` 不能单独证明完整透传；校验器能对空 detail 集合误报一致。
- “侦察落档完成”不成立，缺类型定义位置。
- evidence 总入口仍保留被后续修复推翻的 tgz-only 结论。

## 4. 能不能进“待验收”

当前未发现 P0；仍有 4 个未清零的 P1：

1. 最终 `ctx.provide` 实现缺少已注册后卸载清理的机器证据，DM4a 证据不足。
2. `verify-transcript.mjs` 能把缺失 detail 判为 `IDENTICAL`。
3. DHR_49 必需的类型定义位置尚未落入 `findings.md`。
4. evidence 总索引仍发布错误的 tgz-only 当前结论，并遗漏最终修复批次。

DM1 的当前转录内容经独立核对成立；DM5a、版本基线和两种安装形态也有充分事实支撑。现阶段主要未闭合项是 DM4a 的最终实现生命周期证据，以及会误导验收/下一张卡的证据与侦察文档缺口。

---

## 附录四 · 第二轮第 1 次收敛复检原文（codex-ninth / gpt-5.6-sol，read-only 沙盒，2026-08-20，未删改）

## 1. 核验形态

- 动态复跑：
  - 权威落点 `node --test src/dsh-host/test/*.test.mjs`：41/41 PASS。
  - `check-drift.ps1`：两包共 26 个文件逐字节一致。
  - 用本机 rc.7 真 Cordis 做无落盘生命周期复现：注册后服务存在、fixture hash 正确、5 条 run；`await fiber.dispose()` 后立即及 250ms 后均为 absent。
- 现场只读核验：
  - Client 四份类型定义路径、内容均属实。
  - 本机确有 39 个包声明 `dsh.client`，均为 `platform=web` 且有 `./client` export。
  - `web` profile 中 absence-probe 只是 dependency，不在 `dsh.profile.bundles`。
  - Host 的 `scripts/` 不在 `package.json.files`，不会打包。
- 仅静态审：
  - `verify-transcript.mjs`、变异报告、包外探针三份转录、各批 evidence README。
  - 未重跑会改变 profile 的 remove/reinstall。
  - 变异 harness 会创建临时副本，按只读要求未重跑。
- 无法独立核验：
  - “第一版曾含 0x08”这一历史过程没有保留对应版本或原始失败件。当前两份相关文件均无非打印控制字节，正则是正常的 `/\bcreateRequire\b/`。
  - 转录校验器强制写 `--out`；只读环境中复跑在写报告阶段被拒绝，因此其结果按源码和已有报告核验。

## 2. 逐条判定

- P1-A：已收敛。
  - `ctx.provide` 确实由 fiber effect 持有。
  - rc.7 loader 在 entry 被 disable/remove/update 时最终调用 `fiber.dispose()`。
  - 生命周期复现证明已注册的真服务在 dispose 后消失，且无需等待 250ms。
  - 包外探针的前后正控排除了“探针恒报 false”或未加载：装着和装回均为 `present:true`，remove 后为 `false`。
  - 限制：三份转录只保存 stdout，没有保存所声称的退出码；`plugin remove` 证据也是下一次冷启动后的 absence，而不是在线热卸载转录。但源码路径与真 Cordis dispose 复现已覆盖核心清理语义。

- P1-B：部分收敛。
  - 原来的空 details 空真漏洞已堵住；磁盘重算 hash、期望文件集、detail key 集和缺失 run 集均有效。
  - 三个变异覆盖了 details 被掏空、hash 篡改和 detail 内容篡改。
  - 仍可误判 `IDENTICAL`：校验器不检查 `snapshot.schema_version`、完整 diagnostics、`payload.event/service`、外层 list/detail hash 与 schema、`detail_missing_run_id` 是否真是被探测的缺失项。例如只删除两个 `detail-unlisted` diagnostics，或把 `detail_missing_run_id` 改成任意值，其判定条件仍可全部为真。
  - 当前 DHR_25 真转录没有发现正常输入被误判 DIFF；但校验器不支持零 detail 或没有 missing-run 的其他合法 Host 配置。

- P1-C：已收敛。
  - 四个类型路径及登记内容与本机 rc.7 完全一致。
  - `@deepseek-ai/dsh-api-gateway` 的声明样板逐字属实，39 包统计属实。
  - 下一张 Client 面板卡仍需明确两个实施事实：具体 UI 挂载/扩展点，以及浏览器侧如何跨 Host/Client 边界读取 `ctx.relayPilot`。Host Context 服务不会自动出现在浏览器 Context；这属于下一卡需侦察的输入，不影响本次“类型定义位置”缺项已补齐。

- P1-D：部分收敛。
  - 总索引的六批路由正确，明确指出 `target-web/` 的 tgz 结论已被 `zero-import/` 推翻。
  - 但批内文档仍直接发布旧口径：`target-web/README.md:9,26` 仍写“必须装 tgz”；`smoke-rc6/README.md:27`、`smoke-rc7/README.md:23` 仍把“禁用着启动、从未注册”写成“服务行真的被清掉”。
  - `progress.md:49` 仍声称新增了契约测试；`findings.md:52` 和 `progress.md:13` 仍写第二轮未做；`findings.md:92` 写 25 文件，而当前实际为 26。
  - 插件 README 和两份 absence patch 注释已经自洽。

- P2-1：部分收敛。
  - 当前根目录四个 runtime `.mjs` 均被扫描；动态 import、`createRequire`、`require()` 和未登记根文件的现有变异均能被挡住。
  - 当前正则无 0x08 等控制字符。
  - 仍有文件覆盖绕法：`RUNTIME_FILES` 只取 `files` 中直接以 `.mjs` 结尾的条目。如果以后加入目录或 glob，如 `"lib"`、`"dist/**"`，其中的 `.mjs` 不会被扫描；“包根每个 `.mjs`”断言也覆盖不到子目录。现有变异只测了根目录 `sneaky.mjs`。

- P2-2：已收敛。
  - `check-drift.ps1` 以原始字节 SHA-256 决定一致性，换行归一化只用于解释差异，不参与放行。
  - 覆盖 Host 与 absence-probe 两包；实跑结果为 26 文件逐字节一致。
  - 脚本已明确是收口采集命令而非自动契约测试。

- P2-3：已收敛。
  - Host 内 `absence.patch.yml` 只声明 disabled 用途，并明确 removed 应使用包外探针。
  - 包外 patch、README 与 package manifest 相互一致。

## 3. 新引入的问题

- P1 — 转录校验仍不是完整的 transcript 校验。
  - 位置：`src/dsh-host/scripts/verify-transcript.mjs:56-138`。
  - 事实：大量 probe envelope 字段和部分 snapshot 语义不参与最终结果。
  - 问题：篡改服务身份、schema、unlisted diagnostics 或实际探测的 missing run，仍可能得到 `IDENTICAL`。
  - 建议：从磁盘构造完整期望 snapshot 并严格比较；同时校验 event/service、所有派生字段及 probe 的 present/missing run 选择，或删除不准备校验的冗余字段。

- P1 — 过期结论仍可被绕过总索引直接读到。
  - 位置：`evidence/target-web/README.md:9,26`、`evidence/smoke-rc6/README.md:27`、`evidence/smoke-rc7/README.md:23`、`progress.md:49`。
  - 问题：批内 README 仍像当前操作指引，且旧 disable 证据继续被描述为清理证据。
  - 建议：在被推翻批次顶部加醒目的 superseded 提示；把 disable 结论改成“启动时未注册”；在 append-only 时间线追加明确纠错。

- P2 — runtime 文件枚举仍可由子目录或 glob 绕过。
  - 位置：`test/package-contract.test.mjs:19,50-52`。
  - 建议：展开 `files` 对应的实际打包文件集，递归扫描全部 shipped `.mjs`；增加 `lib/sneaky.mjs` 配合 `"lib"` 的变异。

- P2 — 包外探针证据未保存退出码。
  - 位置：`evidence/round2-lifecycle/absence-external-*.txt`。
  - 事实：文件只有 stdout JSON，README 中的 exit 0/1 无对应原始记录。
  - 建议：以后转录同时保存命令、退出码和 stderr；当前 `present` 三段证据及源码映射仍可核实。

## 4. 还剩什么

- P0：无。
- P1：
  - `verify-transcript.mjs` 仍存在可误判 `IDENTICAL` 的未校验字段和 diagnostics 路径。
  - evidence 批内 README 与 progress 仍发布已被推翻或已纠正的旧结论。

---

## 附录五 · 第二轮第 2 次收敛复检（终检）原文（codex-ninth / gpt-5.6-sol，read-only 沙盒，2026-08-20，未删改）

1. 核验形态

全程只读、未创建或修改文件。静态核对仓外权威实现、工件与证据；会写临时文件的 41 例测试及两个变异 harness 未复跑。已核存档结果：41/41、转录正控 + 10 变异全咬、契约 7/7 变异全咬、27 文件漂移检查一致。

2. 四条逐条判定

- P1-1：部分收敛。整份 snapshot 键集合、所有字段及已知 probe 信封字段均参与裁决，现有 10 个变异全部被捕获。但顶层 payload 没有计划外键检查，增加任意信封字段仍可判 `IDENTICAL`；`detail_fixtures` 被按无序集合比较，交换其顺序也可通过，而 Host 实际保留配置顺序。`diagnostics` 作为无序事实集合比较合理。
- P1-2：部分收敛。各批 README 的 tgz-only、disabled 与 removed 混淆已经纠正；progress 第 26 条明确承认契约测试从未存在，属于诚实追加纠错。但仍有当前口径冲突：`brief.md:16,39` 仍称 Windows 接线、两轮复核未做；`findings.md:12` 仍称只有静态生命周期证据；`review.md:19,26` 仍为“待回填”并记录旧的 3/10、5/7 变异数量；progress 证据账本 E-018/E-019/E-021 也保留旧数量。`task_plan.md` 明示为冻结施工图，其历史内容不算偷偷改写。
- P2-1：部分收敛。当前包内运行文件均为根目录 `.mjs`，未发现符号链接；现有形状已被递归枚举覆盖，7 个变异全部见红。但枚举只识别 `.mjs`，可漏掉 `type: module` 下的 `.js` 和 `.cjs`；`test/scripts/node_modules` 按任意层级目录名排除，因此 `lib/scripts/x.mjs`、`lib/test/x.mjs` 即使随 `files: ["lib"]` 发布也会漏检；未声明的目录符号链接也不会被根扫描发现。glob 条目主要会造成合法配置误报，而非静默逃逸。
- P2-2：部分收敛。三份新证据完整、自洽：installed `present:true / exit 1`，removed `present:false / exit 0`，reinstalled `present:true / exit 1`，均保存命令、stdout、空 stderr 和退出码。但 smoke-rc6、smoke-rc7、target-web、zero-import 下共 8 份旧 `absence-{disabled,enabled}.txt` 仍只保存 stdout，各自 README 却同时声称退出码 0/1。

未发现实际给出 DSH 桌面轨三态裁定；命中处仅为禁止性说明。

3. 新引入的问题

- P1 — `verify-transcript.mjs:101-147`：snapshot 封闭、顶层信封未封闭，且 `detail_fixtures` 顺序被放宽；可让已改变的转录仍显示 `IDENTICAL`。建议定义完整 payload 键集合，并按 Host 实际顺序比较 `detail_fixtures`。
- P2 — `verify-transcript.mjs:49,74,93,125`：Host 接受绝对路径或子目录路径，但输出 `basename`；校验器直接拿原始 `--expect-*` 比较，合法输出可能被误判 `DIFF`。建议按 Host 契约统一取 basename。
- P2 — `verify-transcript.mjs:74-81`：`expectedDetails` 使用普通对象，与 Host 对特殊 `run_id="__proto__"` 的 null-prototype 支持不一致，会误拒合法 fixture。建议使用 `Object.create(null)`。
- P2 — `package-contract.test.mjs:24-50`：递归修法留下扩展名、嵌套排除目录和符号链接盲区。建议按实际打包清单枚举，至少覆盖 `.mjs/.js/.cjs`，并只排除明确的根目录非运行区。
- P2 — 当前证据索引与验收材料仍引用旧变异数量和旧漂移文件数，和存档的 10、7、27 不一致。建议追加明确纠错条目，不改历史复核正文。

4. 还剩哪些 P0/P1

- P0：0。
- P1：2。
  1. 转录校验仍允许顶层计划外键及 `detail_fixtures` 重排后判 `IDENTICAL`。
  2. 零上下文入口和当前验收摘要仍发布“接线/复核未做”、旧变异数量及“待回填”等互相冲突的当前事实。
