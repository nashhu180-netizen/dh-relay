<!-- dh:v1 · review.md — 验收。🔴 收尾填。三区：独立复核区 → AI 提交区 → 人类签名区，物理隔离。 -->
# review — DHR_29

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

<标准档必做。这是收口审里“代码/实现”复核那一块（verify 总审还含完成条件/证据/DoD/人验）。两轮总量不减：①施工批次检查点前移的小审合集 → ②收口换另一个 agent 做增量复核。结论登记为证据。派出证据：派发复核时先 `dh dispatch` 在 progress 唯一合法账本落 review-dispatch/session-run 行；整个单元格/派出=值只能由 `e:E-xxx`、`log:非空路径` token 与分隔符组成，任何散文/畸形残留都不算；路径含空格写 `log:"logs/review run.log"`。>

**第一轮·批次小审合集**（施工批次检查点前移；每批 fresh subagent / Codex 只看本批 diff 与证据，专挑：目标范围漂移·行为回归·边界权限安全·证据缺口·隐性逻辑·过早收口·流程被跳过[没先规划/没读该读 ref/没汇报]）

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|
| fresh-context-cp1 | Store / state / Store tests / 契约批次 1 | `changes-requested`：P0=结果/隔离工件脱敏不完整；P1=恢复、schema 校验、身份链、终态污染、fresh attempt、并发 seq；P2=反例与账本不足。 | e:E-007 | E-008 |
| fresh-context-cp2（会话内 scout 实例，侦测型降级·非机器只读；未参与实施，派出/回收 git 基线比对零差异） | 批次 2：store/{store,state}.mjs 重写、store.test.mjs、as-built §3.5、workspace 账本 | `approved`：无阻塞缺陷；独立复现 21/21 + 四闸（hash 一致）；5 组变异实证全红无空绿；范围无漂移。P2×1=批次 1 §4b 四值裁决未落账（→F-005 已收敛）；P3×6（→F-006 四修两不修）。 | e:E-011 | E-012 |

**第二轮·增量复核**（**另派 fresh-context、未参与实施且不继承或注入第一轮会话上下文的独立 agent 实例，可只读仓内已落账的第一轮记录；模型/账号可同，不得复用同一会话**；核全程 + 核各批小审记录 + 查收口增量 diff；按类型叠加：SQL→pytest 契约 / 前端→截图比对 / 安全→security skill）

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|------|
| fresh-context-round2（会话内 scout，侦测型降级·非机器只读；未继承第一轮会话、可只读仓内一轮记录） | 全卡增量：收敛批 diff、两轮小审闭环核销、边界与指纹、空绿扫尾 | 核 CP1/CP2 结论：F-002~F-006 逐分句真实闭环、F-005/F-006 收敛有据；新发现 R2-1~R2-4 四条 P3 观察（R2-1 raw result-kind 绕终态锁移交 DHR_51→F-011，余者→F-010）。 | `approved`：判定次序重排无新洞；指纹独立复算一致；5 组变异实证全红。 | e:E-014 | E-018 |
| | | | | | |

**有效单测·变异点登记**（`task_type`=重核/常规 的卡必填；轻量与存量无类型卡不适用。**重核卡的变异点必须由轮 2 复核实例选点并登记，施工方自报即红**——机器闸 R31 逐字段校验，选点质量另归人验 H 项。判据只认「改坏必红」，不做覆盖率。）

| 变异点锚点(生产代码 path:line) | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人(重核须=轮2实例) | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| <待收口填> | <待收口填> | <改条件/改返回值/改边界> | <待收口填> | <待收口填> | <待收口填> | <待收口填> | <待收口填> | <断言失败/未变红/构建错误> |

> `语义类别` 三选一：`改条件` / `改返回值` / `改边界`——构建错误、语法错误不算语义变异，填进来即红。
> `施加后结果` 三选一：`断言失败` / `未变红` / `构建错误`——**只有 `断言失败` 算通过**；`未变红` 正是「这条测试无效」的证据。
> 锚点必须是本卡 diff 内的**生产代码**文件并带行号；落在测试文件或 diff 之外一律红（改坏测试不证明测试有效）。
> `施加 hash` / `还原 hash` 为 40 位十六进制且两者不得相同（相同 = 没真还原过）。字段留空或写占位等同缺失。

**返工收敛**（有 open P0/P1 → 修 → 重跑证据 → 复核者再过；最多 3 轮；3 轮不收敛则停，摆给用户决断）

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|------|--------------|----------------------|---------|
| 1 | | | |

<五路复核里的需求路与教训路（E4 / E5），结论单独登记；结构闸只查登记位填了没、不判语义对错。>
**需求复核结论**：有漂移（已同日收敛）｜证据(E-018/E-019/F-009)｜由 fresh-context-req（会话内 scout，侦测型降级）｜派出=e:E-015。漂移四处+P2 计数漂移全部闭环：P1 fixture Oracle 复验测试落地；F-042 ajv 权威进审计闸；指名更正与 done<=total 归属走指纹批更正；§4b 计数改 16/新增 12 附对账式。

**教训复核结论**：过（L-001 成立并按复核建议改写为「工具事实+指向既有规则」；库候选-3/-6/-11/-14 本卡实践已遵循、候选-12 登记新实例；新候选 N-1 指纹盲区/N-2 派生缓存取舍/N-3 侦测型降级范式入 lesson_candidates.md）｜命中条目：候选-12 复发实例（F-005）｜由 fresh-context-lesson（会话内 scout，侦测型降级）｜派出=e:E-016

## 第 4 路·一致性复核（横向：本次动的口径 vs 同类路径既有定义）

<标准档必做。防"改了 A 处口径、没改同义的 B 处"长成跨路径不一致。逐行列出扫了哪些同类路径；**禁空表**——"全部一致"也要逐行写明扫了什么，只写"看过没问题"= 空过。表头/枚举逐字锁定 harness-core design/12 §六，dh-check 会检查它（A12/A13）。
 **本区必须是 `##` 二级标题、独立于「独立复核区」**——`裁决` 列若落进独立复核区切片，会被 R11 语义闸的 `conclusionTokens` 当成"复核轮结论"，使"两轮结论全待定"的弱复核被误判已达标（实测可复现，见 34-DH_44 findings F-003）。降级为 `###` 子节会重新打开这个洞。>

<!-- dh:consistency-review:v1 task=DHR_29 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|---------|-------------|------|---------|
| checkpoint 拒识不留痕 vs result 隔离留痕（B11 分野） | `reason-codes.md` §四、`compat-matrix.md` §4b、as-built relay-core §3.5、`store.mjs` appendCheckpoint/appendResult、v1 `tools/runner/relay-runner.ps1:220-274` | 不一致（checkpoint schema description 仍写「按 B11 隔离」） | 遗漏待修→findings F-007（已随指纹批更正为 resolved；reason-codes/as-built 同批对齐） | e:E-017 |
| 迟到判定挂 seq（K-2） | `store.mjs` issued_seq/currentReceipt、`state.mjs` seq 排序回放、`relay.event.v2.schema.json` seq 语义、v1 attempt 整数序 | 一致 | 无需处置（OPEN-POINTS K-2 已加 ✅ 结账指针，F-008） | e:E-017 |
| structured 脱敏口径 | v1 `tools/contracts/relay-redaction.ps1` 四规则、`store.mjs` redactStructured、AGENTS 宪章#6、as-built §3.5 | 一致（四类 pattern 逐字对齐并扩展对象键分支） | 无需处置 | e:E-017 |
| 终态按 receipt 记账 / lifecycle 守卫身份定义 | `store.mjs` appendCheckpoint / appendResult / emitEvent 三处守卫 | 一致（同一套 currentReceipt 身份定义；附观察：同 receipt 异内容冲突同样不留痕，仅 checkpoint 侧文档明示） | 有意差异→relay-core/contracts/compat-matrix.md#4b-checkpoint_rejected | e:E-017 |
| 错误码形态（协议码 vs 进程内异常前缀） | `reason-codes.md` 全集、`store.mjs` 抛出的 E_SCHEMA_INVALID/E_EVENT_LOG_CORRUPT/E_STORE_CORRUPT/E_RUN_NOT_FOUND/E_BAD_VALUE | 不一致（人读侧无边界声明） | 遗漏待修→findings F-008（已修：reason-codes §四后补边界声明，resolved） | e:E-017 |
| §4b 四值裁决 vs OPEN-POINTS / v1-gap-disposition | `OPEN-POINTS.md` K-1/K-2、`v1-gap-disposition.md` G1~G6 | 一致（无同题异答；K-1/K-2 原未销账已回填 ✅ 指针，F-008） | 无需处置 | e:E-017 |

> `定义是否一致` 二选一：`一致` / `不一致`。
> `裁决` 三选一：`无需处置` / `有意差异` / `遗漏待修`——`有意差异` 必带理由落点指针 `有意差异→<文档#锚点>`（否则下一个人会当 bug 再"修"回去）；`遗漏待修` 必在 `findings.md` 有对应条目。
> `派出证据` 沿用 R27 既有文法（`e:E-xxx` / `log:路径`），派发时先 `dh dispatch` 落 progress 账本、再引用；不新造 token。

## AI 提交区　⚠️ This is not human approval

<由 AI 填。标完成前的自检，到不了"已验收"。>

**Confidence Challenge**：对实现有没有 100% 信心？没有就逐条列 gap。
- F-011 open（P3）：raw `appendEvent` 可投递终态 kind 绕过终态守卫——运行期封堵移交 DHR_51，库层不单独堵（两轮复核均判非本卡阻塞）。
- 全部复核均为会话内 scout 实例（侦测型降级·非机器只读），补偿控制=派出/回收 git 基线比对零差异 + 实例身份显式登记（E-011/E-014~E-017）；CP2/轮 2 的沙箱 FS 只读限制使测试复现走 hub 子进程或静态互证，已在各自报告如实声明。
- 人验（用户对话确认）尚未发生——本区之后的一切结论止步「待验收」。

**设计契约传导声明**（diff 涉 design 切面时，收口时只保留一条；精确语义以 harness-core design/10 §三为准。创建期不预选）：

- 契约同步：relay-core/contracts/compat-matrix.md#4b（四值裁决+计数对账）、relay-core/contracts/reason-codes.md#四（B11 分野+内部码边界）、relay-core/contracts/OPEN-POINTS.md#K-1-K-2（结账指针）、relay-core/contracts/v1-gap-disposition.md#progress（done<=total 归属更正）、relay-core/contracts/relay.run-state.v1.schema.json#state_signature 与 relay-core/contracts/relay.checkpoint.v2.schema.json#receipt_id（指纹批 description 更正，基线同批重生成 hash=970b5460…）

**权威文档看护声明**（仅当本次 diff 命中 `authority-docs.manifest.json` 的 `watch`、且权威文档确实无需同步时使用；把下面示例移出代码围栏并写具体理由，最终只能保留一条有效声明）：

```markdown
- 文档无需改：<本次变化为何不影响该权威文档的具体理由>
```

**需求对齐证据**（证明"真实/低成本场景里是否满足需求"；UI/交互/可视化任务必须挂截图证据，完整本地服务太贵时可用 mock 路由 / 组件级浏览器 / 静态 HTML 预览）：

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| 单 Run 账本可复算（B6/B11 基线三条 + 加固断言） | 用户在仓内跑 `cd relay-core && npm test`，观察 23/23 全绿；其中 P1 fixture 复验测直接消费 v1 Oracle fixtures | E-009 / E-013 / E-019 | 满足 |
| 崩了能重建（openStore 恢复语义） | 强杀模拟 = 重开进程调 `openStore`：跨重启幂等/冲突判定成立、损坏账本 fail-closed 反例全红转绿 | E-009 / E-012 | 满足 |
| 契约批次 1 六项 + K-1 方向裁决落账 | 读 compat-matrix §4b 结账句、OPEN-POINTS K-1/K-2 ✅ 指针、audit 新闸输出 | E-010 / E-013 / E-019 | 满足 |

**完成条件逐条挂证据**（创建期先从 brief 每条预填 # / 完成条件 / 谁验；收口时补 progress 的 Evidence ID 和达成结论）：

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---------|------|-------------|------|
| 1 | 基线三条：幂等/冲突终态拒绝/迟到隔离（含 P1 fixture 复验不弱于 v1） | machine | E-005 / E-009 / E-019 | 是 |
| 2 | 加固断言：N 次回放同签名；快照+增量 ≡ 全量逐字节 | machine | E-009（切点矩阵 ×3 轮） | 是 |
| 3 | 四条实现期约束反例：F-037 全集 / F-070 done<=total / F-081 labels / 脱敏宪章#6 | machine | E-005 / E-009 / E-019 | 是 |
| 4 | K-2 反例：attempt 字典序与 seq 相反按 seq 判 | machine | E-005（z-attempt/a-attempt 反例）+ P1 fixture 复验测 | 是 |
| 5 | 契约修订批次 1 六项 + 三份基线同批重生成 | machine | E-006 / E-010 / E-013 / E-019（K-3 结构闸 + F-042 ajv 权威 + §4b 裁决 + 指名/归属更正，hash=970b5460…） | 是 |
| 6 | K-1 方向裁决落账（产生者已定、P7 未冻结） | machine | E-006（schema $comment + enum）+ OPEN-POINTS K-1 ✅ 指针 | 是 |

**验收项元数据表**（每条稳定验收项一行；机器项填「事实证明方式」、人判项填「最终裁决者」，复合观察点拆两行共享稳定 ID。协议全文见 design/05，字段协议细化归 DH_30）：

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|----------|--------|-------|---------|-------------|---------|-----------|-----------|----------------|------------------|---------------------|
| Store 幂等/冲突/隔离判定 ≥ v1（B6/B11） | `npm test` 23/23；P1 fixture 三件两序复验；CP2/轮2 独立复现 | machine | DHR_29-BASE | 等价覆盖 | v1 relay-runner/identity 行为为 Oracle，判定不弱于 v1 | pass（E-019） | node>=18 win32 本仓 worktree | tools/tests/fixtures/results/* | 多 store 同 root 归 DHR_51 lease | v2（批次 2 后） | — | — |
| 状态可全量重建且签名可复算（P5-M3 支撑断言） | 切点矩阵 deepEqual×3；openStore 重算自愈 | machine | DHR_29-REPLAY | 等价覆盖 | 快照+增量 ≡ 全量逐字节即等价 | pass（E-009/E-019） | 同上 | CANONICALIZATION.md JCS 口径 | elapsed_seconds 恒 0（源头计量归宿主层） | relay.run-state/v1 | — | — |

**业务化五段展示区**（人验项证据先走这五段；原始断言/完整日志退为可追溯附录，只写 `npm test ✅`/"我跑过了" 不算人验展示）：

- 要证明啥：这本账「崩了能重建出一模一样的状态」——单 Run 的每步都只追加一行、状态从账重放算出、签名任何人可复算。
- 期望值：同一事件账无论回放多少次、从哪个快照切点续放，`state_signature` 逐字节相同；强杀后 openStore 重建出相同签名。
- 实际值：23/23 测试全绿，其中切点矩阵覆盖 0..N 每个切点 ×3 轮独立复算全部逐字段相等；openStore 对半行/坏行/seq 断档/外来 run/schema 违规五类损坏一律拒绝而非带伤重建。
- 差没差：与验收口径无差；需求复核曾报四处漂移，已全部闭环并留 F-009/E-019 轨迹。
- 证据局限：复核均为会话内 scout（侦测型降级），测试复现依赖 hub 子进程或三方记录互证；lease/多写者语义在 DHR_51 才存在，本卡无法证。

**风险放行账表**（可豁免风险登记；红线——数据口径 / 两轮复核 / 未收敛 P0P1 / 生产迁移上线 / 权限安全 / 流程完整性——原则上不许进本表。权限安全唯一窄例外须按 design/05 §二③在同一风险行完整登记 `RISK-PRIVATE-OWNER-SECRET-DISPLAY` 与全部条件；缺一仍硬拦。被接受项须反查到 findings/backlog/验收池的存活记录）：

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|-------|---------|------|------|------------|---------|---------|
| {…} | | | | | | |

> 私有凭据窄例外不是“任意 Git 文件可存凭据”：marker 与闭集内各 key 必须唯一，只登记仓库相对配置路径；任何公开/共享/可见/受众/群聊、未知 key、非白名单持久副本或其它红线均不适用。marker 一旦出现即严格校验，无 marker 的密钥/凭据风险仍硬拦。放行只能 `risk-accepted`；未轮换 finding 保持 open，轮换后改 resolved 时同一风险行追加唯一的 `rotation-completed=true rotated-at=YYYY-MM-DD`，完成日不得在未来。

> 无风险时：**范围/影响/期限/恢复/去处 各列留空或 `—`/`无`**（接受人写 `无` 或留 `{…}` 都行，结构闸只看描述列不看接受人）——这样判 0 风险、不触发 R24。反之：只要风险描述列填了实质内容，就算真已接受风险（接受人写什么、甚至没填，都计入），首行须写"带风险放行"、不能写"端到端验收通过"。

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [x]
**as-built 更新了没**：`as-built/relay-core.md` §3 目录树、§3.5 Store 语义与已知边界、§5 五道闸数字、§8.4 移交三条处置、§8.5 F-042 状态均已更新到批次 2 后现状 [x]

→ 当前状态：**已验收**（2026-08-22 用户对话确认，见下方签名区）

---

## 人类签名区　✅ 凭你在对话里的确认解锁

<核验清单由 AI 从 brief 的"人验"条目预生成，每条"AI/用户做什么 → 对话展示/应该看到什么 → 用户判断什么"，≤5 分钟点完。
 AI 可以代执行命令行、浏览器、截图、日志、对数等验证动作，但必须在对话框完整、真实展示关键证据（命令/操作、退出码/状态、关键输出或截图、完整日志/证据落点）；只报 `✅` 或"我跑过了"不算人验。
 你查看 AI 展示的证据或亲自核验后，AI 会在对话里只问一次：是否“已查看证据，认可执行本地收口”。默认本地收口授权包包含本任务的精确本地 squash、合入复验、verify、DevPlan/workspace 回填与任务 worktree/branch 清理；任务 SESSION 只由显式命令处理；不包含 push、deploy/发布/重启、环境或生产操作、下一张卡。你可以明说“只确认人验 / 暂不收口 / 保留工作树”缩窄。确认后 AI 连续执行 E11~E13，不再逐项追问，你全程不碰 git。
 没有你的对话确认，AI 永远不得碰本区。最高危（生产上线/迁移）建议你本人敲 git，不走代签。
 ——按"目的分块"组织：先写业务目的（覆盖哪条人验项），再写本工作区在这目的下交付了什么，最后列核验表；一个目的一块，多 H 项时比平铺清单好读。>

### 目的一：证明「崩了能重建出一模一样的状态」（覆盖卡面全部机器证 + 加固断言）

本工作区交付：单 Run 唯一写者 Store（追加事件账 / 确定性回放 / openStore 恢复 / 身份链与终态守卫），状态签名任何人可复算（E-005/E-009/E-019）。

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| 幂等/冲突/迟到隔离 ≥ v1 | 仓内跑 `cd relay-core && npm test`，看 23/23 全绿；P1 fixture 复验测直接消费 v1 Oracle 三件 | 全绿；隔离 ≥ result_stale、冲突码 ≥ CAS | [x] |
| 快照+增量 ≡ 全量、损坏 fail-closed | 同上套件内切点矩阵与五类损坏反例 | 每切点逐字节相等；损坏一律拒开 | [x] |

### 目的二：协议口子一次补齐且指纹可对账（覆盖契约修订批次 1 六项 + K-1 方向裁决）

本工作区交付：§4b 四值逐条裁决落账、K-1 产生者入冻结契约、F-042 ajv 权威闸 + K-3 结构闸进审计器、指名/归属更正（E-010/E-013/E-019）。

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| 裁决落账与计数对账 | 读 compat-matrix §4b 结账句（3+3+1+12=16 对账式） | 四值全显式不补、数字对得上 enum 实数 | [x] |
| 基线可复算 | `node tools/capability-baseline.mjs` | hash=`970b5460…` 与基线相符，改任一 schema 字即 exit 1 | [x] |

---

- 确认记录：2026-08-22 用户在对话内查看证据展示（23/23 测试 + 四闸输出 + capability_hash + 两轮复核与四路复核结论摘要）后明示答复「认可」——即「已查看证据，认可执行本地收口」；授权包=精确本地 squash 合入 + 合入复验 + verify 代签 + DevPlan/workspace 回填 + worktree/branch 清理；未缩窄。
- verify 提交 SHA：`5971d8d`（2026-08-22；`git log --grep="^verify"` 可查）
- 签名：hyf（chat-confirm 代签）　　时间：2026-08-22

→ 解锁状态：**已验收**（随后各任务回 DevPlan 任务表销户）

> 铁律：没有对应的 `verify(<模块>): <任务ID列表> …` git 提交，本批任务不许标"已完成"。

### 确认记录（append-only，每次人验确认追加一行｜协议见 design/05 §九 协议三）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---------|--------|----------------------|----------------------|-------------------------------|---------------|--------------------------------|
| 2026-08-22 | hyf | DHR_29 releasePacket（机器项两行全 pass + 五段展示 + F-001~F-010 resolved / F-011 open 移交 DHR_51） | wt/DHR_29 @ c44d392 + 批次1/2/收敛（impl squash 后主干复验 23/23 + 四闸全绿） | impl=7be0bae 的 store+contracts diff；capability_hash=970b54601ae582a5… | DHR_29-BASE, DHR_29-REPLAY | 通过 |


