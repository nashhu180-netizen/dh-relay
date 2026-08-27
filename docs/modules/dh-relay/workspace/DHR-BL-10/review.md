<!-- dh:v1 · review.md — 验收。🔴 收尾填。三区：独立复核区 → AI 提交区 → 人类签名区，物理隔离。 -->
# review — DHR-BL-10

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

<标准档必做。这是收口审里“代码/实现”复核那一块（verify 总审还含完成条件/证据/DoD/人验）。两轮总量不减：①施工批次检查点前移的小审合集 → ②收口换另一个 agent 做增量复核。结论登记为证据。派出证据：派发复核时先 `dh dispatch` 在 progress 唯一合法账本落 review-dispatch/session-run 行；整个单元格/派出=值只能由 `e:E-xxx`、`log:非空路径` token 与分隔符组成，任何散文/畸形残留都不算；路径含空格写 `log:"logs/review run.log"`。>

**第一轮·批次小审合集**（施工批次检查点前移；每批 fresh subagent / Codex 只看本批 diff 与证据，专挑：目标范围漂移·行为回归·边界权限安全·证据缺口·隐性逻辑·过早收口·流程被跳过[没先规划/没读该读 ref/没汇报]）

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|
| codex CLI · `codex exec -s read-only` · 只读沙盒 · 未参与实施（施工=zcode GLM-5.3/Flash） | 工作树 7 份未提交改动全量，基线 master=f04d797 | **approved-with-P2**（0 个 P0/P1）：R1 P2 新增断言全为 `-DryRun`、未覆盖实拉分支且 E-009 沙盒已清只剩自述；R2 P2 大小写派发语义确实改变但无回归断言。另逐条列出 6 处核过无问题的点（允许路径、命令行逐字、`switch` 无 default 的风险论证、默认值、密钥、F-001 结论） | log:review-logs/review-round1.codex.md | E-004~E-010 |
| codex CLI · `/codex` 插件 · 只读 · `--fresh` 独立 thread（附加路径：技术裁定复核） | 主控自行裁定的「大小写派发」四条技术论断（自裁自实施自验收，链条闭合需外部砸） | 裁定 1/2 **成立**（自写复现实测）；裁定 3 **部分成立**——「教训被套到错误形状」说过头，真错是 `else` 不完备而非算子选错；裁定 4 **部分成立**——真实调用方用 `-NoExit`，该形态下 `throw` 不终结进程，psmux 会观察成 `idle`，**未真正 fail-closed** | log:review-logs/review-verdict.codex.md | E-018~E-022 |

**第二轮·增量复核**（**另派 fresh-context、未参与实施且不继承或注入第一轮会话上下文的独立 agent 实例，可只读仓内已落账的第一轮记录；模型/账号可同，不得复用同一会话**；核全程 + 核各批小审记录 + 查收口增量 diff；按类型叠加：SQL→pytest 契约 / 前端→截图比对 / 安全→security skill）

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|------|
| — 不适用 | — | — | **N/A**：本卡 `task_type=normal`，按 AGENTS.md 宪章#5 的 normal 配方**只做代码轮 1**（代码轮 2 须由用户点名才加），用户未点名。非降级、非跳过。实际独立复核路数为 **4 路**（代码轮 1 + 技术裁定 + 需求 + 教训），高于 normal 的 3 路要求 | — | — |

**有效单测·变异点登记**（`task_type`=重核/常规 的卡必填；轻量与存量无类型卡不适用。**重核卡的变异点必须由轮 2 复核实例选点并登记，施工方自报即红**——机器闸 R31 逐字段校验，选点质量另归人验 H 项。判据只认「改坏必红」，不做覆盖率。）

| 变异点锚点(生产代码 path:line) | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人(重核须=轮2实例) | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| tools/host/relay-worker-entry.ps1:31 | `zcode --prompt` → `zcode --invalid` | 改条件 | zcode dry run prints prompt-form command without launch | pwsh -NoProfile -File tools/tests/relay-agent-tool.ps1 | 10EE818DDC8013DB411A6B4405F447AD587CCAB49CB630C0B6A36E0B2621F6BF | 1E68D66B593DFF74ED4FBE6410494C44B97C00C7BE348CFC539264B6EAF52853 | codex（代码轮1，选点）/ zcode-Flash（施加与还原） | 断言失败 |

> 本卡 hash 口径 = 文件内容 SHA256（64 位十六进制），非 git commit sha——施工 worker 无提交权（返工轮1 主控裁定）；两值不同证实真还原（`git diff tools/host/relay-worker-entry.ps1` 已核回到变异前 6 行改动形态）。

> `语义类别` 三选一：`改条件` / `改返回值` / `改边界`——构建错误、语法错误不算语义变异，填进来即红。
> `施加后结果` 三选一：`断言失败` / `未变红` / `构建错误`——**只有 `断言失败` 算通过**；`未变红` 正是「这条测试无效」的证据。
> 锚点必须是本卡 diff 内的**生产代码**文件并带行号；落在测试文件或 diff 之外一律红（改坏测试不证明测试有效）。
> `施加 hash` / `还原 hash` 为 40 位十六进制且两者不得相同（相同 = 没真还原过）。字段留空或写占位等同缺失。

**返工收敛**（有 open P0/P1 → 修 → 重跑证据 → 复核者再过；最多 3 轮；3 轮不收敛则停，摆给用户决断）

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|------|--------------|----------------------|---------|
| 1 | | | |

<五路复核里的需求路与教训路（E4 / E5），结论单独登记；结构闸只查登记位填了没、不判语义对错。>

**需求复核结论**：**有漂移**（RQ-1 P1 / RQ-2 P2 / RQ-3 P2，三条均已收敛：RQ-1 经用户 2026-08-27 对话点选授权并回填 backlog+brief；RQ-2 重写完成条件 6 并新增 6b；RQ-3 补 provenance）｜证据(E-023~E-028)｜由 codex CLI · `/codex` 插件 · `--fresh` 独立 thread｜派出=log:review-logs/review-requirement.codex.md

**教训复核结论**：**有违反 → 已收敛**｜命中条目：候选-1 / 候选-5 / 候选-6 / 候选-12（四条共同指向「第 34 行实拉分支无直接断言与变异对照」，返工轮 4 已补 sentinel stub 断言 + 变异红相位）；候选-11 判遵守；另独立抽查 F-010 巡检 6 处判分类可信、判主控对 F-009 的反驳成立、判 findings 编号偏差应归入候选-4 而非新立候选｜由 codex CLI · `/codex` 插件 · `--fresh` 独立 thread｜派出=log:review-logs/review-lessons.codex.md

## 第 4 路·一致性复核（横向：本次动的口径 vs 同类路径既有定义）

<标准档必做。防"改了 A 处口径、没改同义的 B 处"长成跨路径不一致。逐行列出扫了哪些同类路径；**禁空表**——"全部一致"也要逐行写明扫了什么，只写"看过没问题"= 空过。表头/枚举逐字锁定 harness-core design/12 §六，dh-check 会检查它（A12/A13）。
 **本区必须是 `##` 二级标题、独立于「独立复核区」**——`裁决` 列若落进独立复核区切片，会被 R11 语义闸的 `conclusionTokens` 当成"复核轮结论"，使"两轮结论全待定"的弱复核被误判已达标（实测可复现，见 34-DH_44 findings F-003）。降级为 `###` 子节会重新打开这个洞。>

<!-- dh:consistency-review:v1 task=DHR-BL-10 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|---------|-------------|------|---------|
| `-Cli` 枚举派发口径（大小写敏感 + 非匹配 fail-closed） | `tools/host/relay-worker-entry.ps1` 第 31 行（dry-run 分支） | 一致 | 无需处置 | e:E-023 |
| 同上 | `tools/host/relay-worker-entry.ps1` 第 34 行（实拉分支） | 一致 | 无需处置 | e:E-024 |
| 同上 | `tools/host/run-dogfood.ps1:17` `-WorkerCli` ValidateSet | 一致（同集合 claude/codex/zcode，默认值仍 claude） | 无需处置 | e:E-006 |
| 「输入校验失败」退出码口径 | `tools/host/relay-agent-tool.ps1:128`（`exit 4`） | 一致（本卡 default 分支同用 4） | 无需处置 | log:review-logs/review-verdict.codex.md |
| 字面匹配 / 枚举派发的大小写敏感性 | `tools/host/` + `tools/adapters/` 全库同类算子（`-eq/-ne/-in/-notin/-ceq/-cin/-cne`） | 一致 | 无需处置——已敏感 36 处；约 30 处不敏感但为 null/整数/布尔/空串/单字符比较、无枚举语义；**风险性不敏感 0 处**；5 处 `'not-used-in-p1'` 字面量误报 | e:E-017（F-010；教训复核独立抽查 6 处判分类可信） |
| 同上 | `Invoke-RelayBackendPreflight.ps1:117` 的 `-like "$name|*"` | 不一致（不敏感通配） | 有意差异→两侧同源于 session-name 语境、非冻结枚举或派发；F-010 列为范围外观察，教训复核判「合理、非漏报」 | e:E-017 |

> `定义是否一致` 二选一：`一致` / `不一致`。
> `裁决` 三选一：`无需处置` / `有意差异` / `遗漏待修`——`有意差异` 必带理由落点指针 `有意差异→<文档#锚点>`（否则下一个人会当 bug 再"修"回去）；`遗漏待修` 必在 `findings.md` 有对应条目。
> `派出证据` 沿用 R27 既有文法（`e:E-xxx` / `log:路径`），派发时先 `dh dispatch` 落 progress 账本、再引用；不新造 token。

## AI 提交区　⚠️ This is not human approval

<由 AI 填。标完成前的自检，到不了"已验收"。>

**Confidence Challenge**：对实现有没有 100% 信心？没有就逐条列 gap。

- **没有 100%**。本卡同一行代码的方案被**连续三次实测推翻**：主控原案 `switch`（不敏感）→ 复核推翻 → `switch -CaseSensitive`+`throw` → 复核推翻（`-NoExit` 下不退进程）→ 主控开 `exit 4` → 施工实测再推翻（`-File` 形态下 `exit` 也不退）→ 定稿 `[Environment]::Exit(4)`。教训：PowerShell 的进程终结语义随 launcher 形态而变，**必须按真实 launcher 形态实测**（L-006）。
- **gap 1（已登记 F-013，open，转 backlog）**：成功路径尾部 `exit $code`（`relay-worker-entry.ps1:35`）在 `-NoExit -File` 形态下**同样不终结进程**。这是本卡之前就存在的行为，claude/codex 两条分支同样如此，靠 psmux adapter 回收 pane。本卡未修，范围外。
- **gap 2（已在 provenance/README 声明）**：e2e 复跑用的是 `pwsh -NoProfile -File`（**无 `-NoExit`**），与生产 launcher 形态不完全一致。协议交棒行为（checkpoint/result/handoff）与形态无关，差异只在进程是否自行终结，即 gap 1。
- **gap 3**：`relay-psmux-real` 套件需真实终端窗口，本卡全部回归中始终为 SKIP（16 套件唯一 skip）。zcode 分支未经过真实 psmux pane 端到端验证。
- **gap 4（已登记 F-005，open）**：`as-built/relay-psmux-host.md` 的「测试与守卫」计数表仍是旧快照（写 15 套件/32 断言，现势 16 套件/42 断言），超本卡步骤 7 的两行范围未改。

**设计契约传导声明**（diff 涉 design 切面时，收口时只保留一条；精确语义以 harness-core design/10 §三为准。创建期不预选）：

- 契约同步：<仓库相对路径#稳定锚点>
- 契约无变化：<非占位理由>

**权威文档看护声明**（仅当本次 diff 命中 `authority-docs.manifest.json` 的 `watch`、且权威文档确实无需同步时使用；把下面示例移出代码围栏并写具体理由，最终只能保留一条有效声明）：

```markdown
- 文档无需改：<本次变化为何不影响该权威文档的具体理由>
```

**需求对齐证据**（证明"真实/低成本场景里是否满足需求"；UI/交互/可视化任务必须挂截图证据，完整本地服务太贵时可用 mock 路由 / 组件级浏览器 / 静态 HTML 预览）：

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| H1（完成条件 7）· zcode 这一棒是不是真按 relay 协议交了棒 | 主控在真实 relay 夹具下以 `relay-worker-entry.ps1 -Cli zcode` 拉起一棒 zcode worker，worker 自 `RELAY_RECEIPT` 取身份、经 `relay-agent-tool.ps1` 写 checkpoint 与 result 并交棒；主控在对话中展示七份工件全文、退出码与三条互相咬合的来源时间线 | E-011（首跑）/ E-025~E-028（provenance 复跑） | **待人验** |
| 完成条件 9/10 · 非规范大小写入参必须 fail-closed 且不拉起任何 CLI | 自动化：sentinel stub 三家 CLI + 真实 launcher 形态（`-NoExit -File`）传 `-Cli CLAUDE`/`CODEX`，断言进程真退出 ∧ 退出码=4 ∧ claude/codex sentinel 均未落盘；配变异对照（去掉 `-CaseSensitive` 必红） | E-023/E-024 | 满足（机器证，不进人验） |

**完成条件逐条挂证据**（创建期先从 brief 每条预填 # / 完成条件 / 谁验；收口时补 progress 的 Evidence ID 和达成结论）：

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---------|------|-------------|------|
| 1 | `-Cli zcode -DryRun` 打印三个注入环境变量 + `zcode --prompt` 形态命令行，不真拉起 | AI | E-004 | ✅ |
| 2 | `-Cli` 非法值仍被 ValidateSet 拒绝 | AI | E-004 | ✅ |
| 3 | claude / codex 两条分支命令行逐字不变 | AI | E-004（代码轮1 逐字核过） | ✅ |
| 4 | `run-dogfood.ps1 -WorkerCli zcode` 参数校验通过 | AI | E-006 | ✅ |
| 5 | `run-relay-tests.ps1` 全量 16 套件 `RELAY ALL PASS` | AI | E-007/E-016/E-022；**主控 4 次独立复跑均绿** | ✅ |
| 6 | 生产代码与 as-built 的**新增行**不含凭据值 / token 值 / zcode 安装绝对路径 | AI | E-008；主控独立复跑命中数=0 | ✅ |
| 6b | 工件散文中的检索**模式字面量**不计为命中 | AI | F-004 / RQ-2 口径澄清 | ✅ |
| 7 | 真实拉起一棒 zcode worker，写出 checkpoint 与 result 且 Runner 收得到 | **人** | E-011 + E-025~E-028（provenance 三线咬合） | **待人验** |
| 8 | F-001（v1 Oracle 面是否覆盖宿主层）有明确结论 | AI | F-001（反证三链）；需求复核判「是」 | ✅ |
| 9 | `-Cli` 派发大小写敏感且非法值 fail-closed：真实 launcher 形态下退出码=4 且不拉起任何 CLI | AI | E-023/E-024（sentinel stub + 变异对照） | ✅ |
| 10 | 第 31 行与第 34 行两处 default **各自**有直接断言，不靠代码同构推定 | AI | E-023（31 行）/ E-024（34 行） | ✅ |

**验收项元数据表**（每条稳定验收项一行；机器项填「事实证明方式」、人判项填「最终裁决者」，复合观察点拆两行共享稳定 ID。协议全文见 design/05，字段协议细化归 DH_30）：

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|----------|--------|-------|---------|-------------|---------|-----------|-----------|----------------|------------------|---------------------|
| {…} | | | | | | | | | | | | |

**业务化五段展示区**（人验项证据先走这五段；原始断言/完整日志退为可追溯附录，只写 `npm test ✅`/"我跑过了" 不算人验展示）：

- 要证明啥：{…}
- 期望值：{…}
- 实际值：{…}
- 差没差：{…}
- 证据局限：{…}

**风险放行账表**（可豁免风险登记；红线——数据口径 / 两轮复核 / 未收敛 P0P1 / 生产迁移上线 / 权限安全 / 流程完整性——原则上不许进本表。权限安全唯一窄例外须按 design/05 §二③在同一风险行完整登记 `RISK-PRIVATE-OWNER-SECRET-DISPLAY` 与全部条件；缺一仍硬拦。被接受项须反查到 findings/backlog/验收池的存活记录）：

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|-------|---------|------|------|------------|---------|---------|
| {…} | | | | | | |

> 私有凭据窄例外不是“任意 Git 文件可存凭据”：marker 与闭集内各 key 必须唯一，只登记仓库相对配置路径；任何公开/共享/可见/受众/群聊、未知 key、非白名单持久副本或其它红线均不适用。marker 一旦出现即严格校验，无 marker 的密钥/凭据风险仍硬拦。放行只能 `risk-accepted`；未轮换 finding 保持 open，轮换后改 resolved 时同一风险行追加唯一的 `rotation-completed=true rotated-at=YYYY-MM-DD`，完成日不得在未来。

> 无风险时：**范围/影响/期限/恢复/去处 各列留空或 `—`/`无`**（接受人写 `无` 或留 `{…}` 都行，结构闸只看描述列不看接受人）——这样判 0 风险、不触发 R24。反之：只要风险描述列填了实质内容，就算真已接受风险（接受人写什么、甚至没填，都计入），首行须写"带风险放行"、不能写"端到端验收通过"。

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [x] —— brief（含允许路径与完成条件 1~10）、task_plan（worker 粒度 9 步）、progress（E-001~E-028 证据账）、review-briefs 6 份、review-logs 4 份（代码轮1 / 技术裁定 / 需求 / 教训）、findings F-001~F-018、lesson_candidates L-001~L-006、evidence/e2e 含 provenance
**as-built 更新了没**：本批触及的子系统，其 `as-built/<子系统>.md` 已覆盖更新到最新现状？（没动子系统现状可 N/A） [x] —— `as-built/relay-psmux-host.md` 第 9/57 行已同步 `claude|codex|zcode` 并注明 zcode 走 headless 一次性形态。**但该份的「测试与守卫」计数表仍是旧快照（F-005 open）**，超本卡范围未刷新，移交收口裁量。

→ 当前状态：**待验收**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

<核验清单由 AI 从 brief 的"人验"条目预生成，每条"AI/用户做什么 → 对话展示/应该看到什么 → 用户判断什么"，≤5 分钟点完。
 AI 可以代执行命令行、浏览器、截图、日志、对数等验证动作，但必须在对话框完整、真实展示关键证据（命令/操作、退出码/状态、关键输出或截图、完整日志/证据落点）；只报 `✅` 或"我跑过了"不算人验。
 你查看 AI 展示的证据或亲自核验后，AI 会在对话里只问一次：是否“已查看证据，认可执行本地收口”。默认本地收口授权包包含本任务的精确本地 squash、合入复验、verify、DevPlan/workspace 回填与任务 worktree/branch 清理；任务 SESSION 只由显式命令处理；不包含 push、deploy/发布/重启、环境或生产操作、下一张卡。你可以明说“只确认人验 / 暂不收口 / 保留工作树”缩窄。确认后 AI 连续执行 E11~E13，不再逐项追问，你全程不碰 git。
 没有你的对话确认，AI 永远不得碰本区。最高危（生产上线/迁移）建议你本人敲 git，不走代签。
 ——按"目的分块"组织：先写业务目的（覆盖哪条人验项），再写本工作区在这目的下交付了什么，最后列核验表；一个目的一块，多 H 项时比平铺清单好读。>

### 目的一：证明 zcode 真的能按 relay 协议交棒（覆盖 H1 = 完成条件 7）

本工作区交付：`-Cli zcode` 成为 relay v1 的合法第三 executor CLI，可在真实 run 里被派活并按协议写 checkpoint / result。挂 E-xxx（收口回填）。

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| H1 zcode 这一棒是不是真交了棒，而不是"跑完就没了" | AI 在对话里展示：真实 run 的 `result` 全文、`checkpoint`、`handoff` 身份头、worker 进程 exit code，以及**三条互相独立的来源时间线**（OS 进程账 / zcode 仓外会话日志元信息 / 工件 written_at）咬合关系 | result 含 `result_status=succeeded` 与本棒身份（node_id=A / attempt_id=1 / launch_id=L-0001 / session_id=S-0001）；checkpoint 有实际进度内容；exit code=0；三条时间线 ③∈①⊂② 自洽，静态伪造无法同时满足 | **[x] 通过** |

--------|--------|----------|------|
| {H?} | | | [ ] |

---

- 确认记录：**AskUserQuestion 点选**（2026-08-27）——用户选「已查看证据，认可执行本地收口」。同日另有一次点选裁决 RQ-1「接受，补进需求」（授权大小写 fail-closed 行为变更），以及开工前一次点选确认档位（标准档 · normal）与接线形态（只接 headless 位）。
- verify 提交 SHA：<AI 代打后回填；`git log --grep="^verify"` 可查>
- 签名：hyf（chat-confirm 代签）　　时间：2026-08-27

→ 解锁状态：**已验收**（随后各任务回 DevPlan 任务表销户）

> 铁律：没有对应的 `verify(<模块>): <任务ID列表> …` git 提交，本批任务不许标"已完成"。

### 确认记录（append-only，每次人验确认追加一行｜协议见 design/05 §九 协议三）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---------|--------|----------------------|----------------------|-------------------------------|---------------|--------------------------------|
| 2026-08-27 | hyf | DHR-BL-10 本地收口授权包（squash 合入本地 master + 集成复验 + verify + 回填 + 删树；不含 push / 不含生产操作） | 工作树 `wt/DHR-BL-10` 最终态（11 份已跟踪文件改动 + 3 个新增未跟踪目录 evidence/ · review-briefs/ · review-logs/，基线 master=f04d797） | e2e provenance 三线咬合（pid=45680 · 14:01:49.608Z→14:04:07.370Z · exit 0；rollout `model-io-sess_011c9160-…` mtime 14:04:01.199Z；checkpoint 14:03:12.446Z / result 14:03:45.103Z）＋ 全量回归 `RELAY ALL PASS (SKIPPED: 1)`（主控 4 次独立复跑） | H1；完成条件 1~10 | **通过** |


