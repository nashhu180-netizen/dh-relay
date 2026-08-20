<!-- dh:v1 · review.md — 验收。🔴 收尾填。三区：独立复核区 → AI 提交区 → 人类签名区，物理隔离。 -->
# review — DHR_27

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

<标准档必做。这是收口审里“代码/实现”复核那一块（verify 总审还含完成条件/证据/DoD/人验）。两轮总量不减：①施工批次检查点前移的小审合集 → ②收口换另一个 agent 做增量复核。结论登记为证据。派出证据：派发复核时先 `dh dispatch` 在 progress 唯一合法账本落 review-dispatch/session-run 行；整个单元格/派出=值只能由 `e:E-xxx`、`log:非空路径` token 与分隔符组成，任何散文/畸形残留都不算；路径含空格写 `log:"logs/review run.log"`。>

**第一轮·批次小审合集**（施工批次检查点前移；每批 fresh subagent / Codex 只看本批 diff 与证据，专挑：目标范围漂移·行为回归·边界权限安全·证据缺口·隐性逻辑·过早收口·流程被跳过[没先规划/没读该读 ref/没汇报]）

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|
| fresh subagent batch1-reviewer（独立会话，未参与实施） | 批 1：freeze.test.mjs + freeze-v1-run.mjs + testdata/v1 | approved；P2×1（批 1"全量绿"验证时点需注明在 project.test.mjs 落盘前——已在 progress 澄清）；P3×3（HOST_PATH 正则偏窄 / source_files 路径正则写法怪异 / manifest 幽灵排除条目 relay-state.json.tmp——三条均已当场修复并重冻结复验）；行为回归/只读性/manifest 闭合/泄露 均查过无发现 | e:E-006 | E-019 / E-020 |
| fresh subagent batch2-reviewer（独立会话，未参与实施） | 批 2：project-v1.mjs + project.test.mjs + load.mjs/main.mjs 增量 | approved；P2×2（labels 路径零测试覆盖 / ghost 节点与空 progressTimes 分支无测试——已补 6 条测试转绿）；P3×6：空值 flag 退出码不一致（已修：空串=usage error exit 2）、操作员字段主机路径注入通道（已修：HOST_PATH_ANYWHERE 子串扫描+点名拒绝）、重复 flag 后者覆盖（登记为已知行为）、attention.since=undefined 时报错定位不友好（fail-close 正确，留待真实出现）、top_attention_summary 取首条非最高severity（当前无实际分歧，登记）、loadV1RunDir 不校验 run_id 一致性（低风险登记）；映射诚实性/无中生有/零fs零时钟/客户端不推导/行为回归 均查过无发现。**复核者自首**：曾在仓内临时落 err.txt 并随即删除（净状态无变化），已改用 scratchpad——登记为复核侧纪律偏差，无实害 | e:E-010 | E-021 |
| fresh subagent batch3-reviewer（独立会话，未参与实施） | 批 3：evidence/v1 全部证据 + P4 主报告 | approved；P3×2 证据保鲜（报告 manifest 时间戳过时 / frozen-vs-live 对比文件被后续修复改陈旧——已修：报告 §2.1 补三次冻结哈希稳定说明、对比文件补时序附注并用现行代码复算回 f542818f 原值）；独立抽查 10 项报告断言全部吻合（503 快照逐行全等、canonical e73ce2de 独立重算、冻结/活源哈希、测试计数、DHR_26 verify SHA、DM 锚点、CM4 写法、延后未掩盖失败、转录与 JSON 吻合、CM6a grep 复扫） | e:E-015 | E-024 |

**第二轮·增量复核**（**另派 fresh-context、未参与实施且不继承或注入第一轮会话上下文的独立 agent 实例，可只读仓内已落账的第一轮记录；模型/账号可同，不得复用同一会话**；核全程 + 核各批小审记录 + 查收口增量 diff；按类型叠加：SQL→pytest 契约 / 前端→截图比对 / 安全→security skill）

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|------|
| fresh subagent e2-round2-reviewer（独立实例/会话，≠三个批次小审，未参与实施，不继承施工会话上下文，只读仓内落账记录） | 全程（批 1~3 + 五路轮 1 修复的增量 diff + 报告与证据） | 核第一轮：批 1/批 2/E4/E14 结论全部认可（抽查修复逐条落盘属实）；批 3 一处出入——其 f45d2626 观察实为最终代码含末尾 LF 口径的正确值，主会话 E-024 的「瞬时代码态」归因写反（换行符记账差异，内容零漂移）。新发现 P3×3：①F-010 处置解释事实性错误（已改正：对比文件+findings+progress 三处补正，防误导 DHR_50 诚实差额核对）②故意反样例存在目的未被测试钉住（已修：cli.test exit-3 负例清单加一行）③报告测试计数与审计行号陈旧（已刷新+审计文件补保鲜注）。CM3/CM6a/B1/DM 锚点/H1H4 未代填/注入通道/正则归一 均独立复算查过无发现 | approved（P3×3 全部当场处置收敛） | e:E-023 | E-025 |

**返工收敛**（有 open P0/P1 → 修 → 重跑证据 → 复核者再过；最多 3 轮；3 轮不收敛则停，摆给用户决断）

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|------|--------------|----------------------|---------|
| 1（批次小审 ×3 + E4 + E14） | 0（全程无 P0/P1；P2×3 + P3 若干） | P2/P3 逐条修复或登记：补 6 条测试、正则统一拓宽、EXCLUDED 反幽灵、注入扫描、brief/review 更正；重冻结 ×2 + 全量 159/159 + 零写入复验 ×2（E-019~E-022/E-024） | 是 |
| 2（E2 fresh 增量） | 0 | P3×3 当场处置：证据归因改正、反样例钉进 exit-3 清单、报告计数刷新；全量重跑 159/159（E-025） | 是 |

<五路复核里的需求路与教训路（E4 / E5），结论单独登记；结构闸只查登记位填了没、不判语义对错。>

**需求复核结论**：有漂移（P2×1 + P3×3，全部已处置：P2 停点履行记录=progress「流程自认」行已存在并补指针；P3①In scope 枚举缺口登记 F-006 留用户裁决 ②evidence/ 落点误标已更正 ③解锁状态行已改真实状态；Out-of-scope 六项零越界、结果零失真、H1/H4 未代填均获确认）｜证据(E-016)｜由 subagent-e4-requirement（fresh，未参与实施）｜派出=e:E-016

**教训复核结论**：跳过（库空——教训库仅候选区条目，无在册正式教训；`dh gate` E5 判 N/A）｜命中条目：无｜由 主会话核验 gate 输出｜派出=e:E-018

## 第 4 路·一致性复核（横向：本次动的口径 vs 同类路径既有定义）

<标准档必做。防"改了 A 处口径、没改同义的 B 处"长成跨路径不一致。逐行列出扫了哪些同类路径；**禁空表**——"全部一致"也要逐行写明扫了什么，只写"看过没问题"= 空过。表头/枚举逐字锁定 harness-core design/12 §六，dh-check 会检查它（A12/A13）。
 **本区必须是 `##` 二级标题、独立于「独立复核区」**——`裁决` 列若落进独立复核区切片，会被 R11 语义闸的 `conclusionTokens` 当成"复核轮结论"，使"两轮结论全待定"的弱复核被误判已达标（实测可复现，见 34-DH_44 findings F-003）。降级为 `###` 子节会重新打开这个洞。>

<!-- dh:consistency-review:v1 task=<task-id> -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|---------|-------------|------|---------|
| 主机路径扫描正则：三份已拓宽副本互比 | scripts/freeze-v1-run.mjs vs test/freeze.test.mjs vs test/project.test.mjs | 一致 | 无需处置 | e:E-017 |
| 主机路径扫描正则：cli.test.mjs 第四份副本 vs 三份拓宽副本 | test/cli.test.mjs `hostPath` vs 上述三份 | 不一致 | 遗漏待修 | e:E-017 |
| 主机路径扫描正则 vs 权威校验 isAbsoluteHostPath | src/read-model/schema.mjs vs 各扫描正则 | 不一致 | 遗漏待修 | e:E-017 |
| v1 消费文件清单 | src/read-model/load.mjs vs scripts/freeze-v1-run.mjs vs test/freeze.test.mjs | 一致 | 无需处置 | e:E-017 |
| 状态→分组映射：源头单点推导 | src/read-model/project-v1.mjs GROUP_BY_STATUS vs src/render/text.mjs（group 直读 + SECTION_OF_GROUP 固定合并） | 一致 | 无需处置 | e:E-017 |
| run_status 产出值 vs 词表 | src/read-model/project-v1.mjs vs src/read-model/schema.mjs STATUS_VALUES | 一致 | 无需处置 | e:E-017 |
| 报告 CM 口径 vs §4.1 定义 | design/evidence/10 §1 vs dev_plan/P4 §4.1 | 一致 | 无需处置 | e:E-017 |

> 两条「遗漏待修」对应 findings **F-009**，均已当场修复并复验（cli.test 正则同步拓宽 + 五处扫描正则补 `/mnt/ /var/ /etc/`；DHR_25 故意反样例 host-path-locator.json 获显式豁免并注明理由；159/159 绿、源目录零写入复验）。复核者另记正面事实一笔：渲染端无第二套分组推导；其「projector 直接 import schema isAbsoluteHostPath」的观察为中间态，终态为 projector 内 HOST_PATH_ANYWHERE 子串正则（前缀检查不适用于散文字段，见 progress 批 2 修复行）。

> `定义是否一致` 二选一：`一致` / `不一致`。
> `裁决` 三选一：`无需处置` / `有意差异` / `遗漏待修`——`有意差异` 必带理由落点指针 `有意差异→<文档#锚点>`（否则下一个人会当 bug 再"修"回去）；`遗漏待修` 必在 `findings.md` 有对应条目。
> `派出证据` 沿用 R27 既有文法（`e:E-xxx` / `log:路径`），派发时先 `dh dispatch` 落 progress 账本、再引用；不新造 token。

## AI 提交区　⚠️ This is not human approval

<由 AI 填。标完成前的自检，到不了"已验收"。>

**Confidence Challenge**：对实现有没有 100% 信心？没有就逐条列 gap。
- 映射表（v1 → Read Model 的 nodeStatus/runStatus/group）是本卡自定语义，测试钉住了行为但语义对不对最终要 P5 冻协议时复核——已如实写进主报告 §4 交 P5。
- 冻结 fixture 与活投影字节级不等（source_refs provenance 哈希，设计使然，F-003 已登记、语义级对证全等）——不算 gap，但读者若只看 file_sha256 会误判，报告里已解释。
- v1 现场只有一条「全绿完结 run」，映射表的 failed/waiting/unknown 分支只有合成输入覆盖、无真实现场样本——已在测试里合成覆盖，如实声明。

**设计契约传导声明**（diff 涉 design 切面时，收口时只保留一条；精确语义以 harness-core design/10 §三为准）：

- 契约无变化：本卡 dh-relay 仓内 diff 仅为 design/evidence 报告（证据类，非契约正文）、workspace 工作区件与 DevPlan 机械状态回填；Read Model 契约在仓外 Pilot 且本卡未改其语义（只加 v1 投影适配层）。

**权威文档看护声明**（仅当本次 diff 命中 `authority-docs.manifest.json` 的 `watch`、且权威文档确实无需同步时使用；把下面示例移出代码围栏并写具体理由，最终只能保留一条有效声明）：

```markdown
- 文档无需改：<本次变化为何不影响该权威文档的具体理由>
```

**需求对齐证据**（证明"真实/低成本场景里是否满足需求"；UI/交互/可视化任务必须挂截图证据，完整本地服务太贵时可用 mock 路由 / 组件级浏览器 / 静态 HTML 预览）：

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| P4-H1：CLI+SSH 足以作独立正式控制面 | 用户以「盯一条真实历史接力」场景：看 `relay-pilot project <活 run> → show/list` 的真实终端转录（run 概要/接力计划表/触发/用时全屏可读），核对 fixture hash 与零写入证据 | E-013 | 满足（用户 2026-08-20 点选「够，认可」） |
| P4-H4：值得继续建 Relay Runtime | 用户读主报告（CM 结论 + v1 缺口清单 + DM 延后登记）判断继续投入是否值得 | E-014 | 满足（用户 2026-08-20 点选「值得，继续」） |
| CM3 场景路径（机器侧需求境）：真实 v1 现场投影全链一次跑通 | `freeze-v1-run → project(冻结+活) → show/list/hash`，前后快照对证 | E-002 / E-012 / E-013 | 满足 |

**完成条件逐条挂证据**（创建期先从 brief 每条预填 # / 完成条件 / 谁验；收口时补 progress 的 Evidence ID 和达成结论）：

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---------|------|-------------|------|
| 1 | 机器证：P4-CM3——冻结 v1 fixture 与活 v1 现场只读投影成功，源文件零写入（前后 hash 对证） | AI | E-002 / E-005 / E-012 / E-013 | 达成 |
| 2 | 机器证：P4-CM6a（B-11 由 CM6 拆分）——截至本卡收口，CLI 主线全程不引入 Relay 运行写权、不 fork DSH；审计范围 = DHR_25 / DHR_27 变更范围（`src/cli/`、`src/read-model/`、`src/render/`、`testdata/`） | AI | E-011 | 达成 |
| 3 | **机器证**：[design/02 B1 子集](../../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)（只取「legacy 根只读、零新写」子命题，B1 全项不在 P4 关闭）：`.dh-runtime/relay/` 零新写。 | AI | E-012 | 达成 |
| 4 | **机器证 · 延后登记**：主报告中 CM4 显式登记为「延后（DHR_50）」、DM 组登记为「事实截至本卡、三态未收敛」；不得写成通过、N/A 或省略（延后不得掩盖失败，§4.5）。**主报告必须含可 grep 锚点 `DM-deferred-facts:`**，其值三选一并附清单：`dm-failures-present`（已有 DM 失败 / 止损命中，逐条列出）/ `stoploss-not-triggered`（已有 DM 事实、止损未命中）/ `no-dm-facts-yet`（桌面轨尚无事实）。（B-11 复审回写） | AI | E-014 | 达成 |
| 5 | 人判：P4-H1 / P4-H4——向用户展示真实终端转录、fixture hash、CLI 输出、版本与实耗；用户判断 ①CLI+SSH 是否足以作为一条独立、正式的控制面 ④当前体验是否值得继续建 Relay Runtime | 人 | E-013 / E-014 | 达成（H1「够，认可」+ H4「值得，继续」，2026-08-20 对话点选） |

**验收项元数据表**（每条稳定验收项一行；机器项填「事实证明方式」、人判项填「最终裁决者」，复合观察点拆两行共享稳定 ID。协议全文见 design/05，字段协议细化归 DH_30）：

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|----------|--------|-------|---------|-------------|---------|-----------|-----------|----------------|------------------|---------------------|
| 冻结 v1 fixture 成功且白名单过滤干净 | freeze 测试 4 条 + 全量安全扫描 | machine | DHR27-CM3-freeze | 等价覆盖 | 测试全绿 = fixture 存在、零主机路径、manifest 自洽全覆盖 | pass（E-003/E-004） | Win11 / Node v24.12.0 | node:test 断言独立于冻结脚本实现 | 仅冻结主投影对象一条 run，另两条未冻结 | v1 | test-runner | DevPlan-DHR_27 |
| 活 v1 现场只读投影成功、源文件零写入 | 前后整树快照哈希比对（503 文件）+ manifest 基线复验（41 文件） | machine | DHR27-CM3-live | 等价覆盖 | 快照逐行全等 = 零写入；投影 exit 0 + schema 自校验 = 投影成功 | pass（E-005/E-012/E-013） | Win11 / Node v24.12.0 | PowerShell Get-FileHash 与 node crypto 两套独立哈希实现 | Linux SSH 侧未重复 v1 投影（跨终端一致性已由 CM2 在 fake fixture 上证得） | v1 | script | DevPlan-DHR_27 |
| CLI 主线无写权、不 fork DSH（CM6a） | 写 API / fs 面 / DSH 引用三向 grep + 端到端只读测试 | machine | DHR27-CM6a | 等价覆盖 | 范围内零写 API、唯一 fs=readFileSync、零 DSH import；同版本切点=E2 轮 2 在当前工作树（159/159 同盘面）复扫三向 grep；同调用链切点=静态 grep 与运行时整树快照双通道覆盖同一 `bin/relay-pilot.mjs` 调用链 | pass（E-011 + E-025 复扫 + project.test「read-only end to end」） | Win11 / Node v24.12.0 | grep 静态扫描与运行时树快照两路独立 | 审计不覆盖 src/dsh-host（CM6b 范围） | v1 | script | DevPlan-DHR_27 |
| legacy 根零新写（design/02 B1 子集） | 与 CM3-live 同一快照对证 | machine | DHR27-B1-subset | 等价覆盖 | `.dh-runtime/relay/` 文件集与内容前后不变 | pass（E-012） | Win11 / Node v24.12.0 | 同上 | 只证本 Pilot 无副作用，不承接 B1 全项 | v1 | script | DevPlan-DHR_27 |
| 主报告延后登记合规 | grep 锚点 + 人工核对三选一取值与清单 | machine | DHR27-DM-deferred | 等价覆盖 | `DM-deferred-facts:` 可 grep、值=stoploss-not-triggered、CM4 记延后 | pass（E-014） | — | dh-check R29 报告侧无新失败 | 清单时效截至落盘时刻，此后桌面轨新事实归 DHR_50 附录 | v1 | grep | DevPlan-DHR_27 |
| H1：CLI+SSH 足以作独立正式控制面 | 用户查看真实转录/哈希/版本/实耗后对话表态 | human | DHR27-H1 | 等价覆盖 | 用户对话明确表态即裁决 | 通过（「够，认可」，2026-08-20 AskUserQuestion 点选） | 本对话 | 用户本人 | 主观体验判断，无机器 oracle | v1 | human-judgement | 用户对话确认 |
| H4：值得继续建 Relay Runtime | 用户结合主报告结论对话表态 | human | DHR27-H4 | 等价覆盖 | 用户对话明确表态即裁决 | 通过（「值得，继续」，2026-08-20 AskUserQuestion 点选；进 P5 最终放行另行确认） | 本对话 | 用户本人 | 投入决策，无机器 oracle | v1 | human-judgement | 用户对话确认 |

**业务化五段展示区**（人验项证据先走这五段；原始断言/完整日志退为可追溯附录，只写 `npm test ✅`/"我跑过了" 不算人验展示）：

- 要证明啥：一条你真实跑过的历史接力（RELAY-IHSR05-RW-20260816113004）能被命令行完整读出来——不启动 DSH、不写现场一个字节。
- 期望值：`project → show/list` 渲染出 run 概要、3 步接力计划、触发人、用时；dh-crew `.dh-runtime\relay\` 前后快照 503 文件全等。
- 实际值：详情页/列表页真实转录见主报告 §2.2 与 `evidence/v1/live-show.txt`、`live-list.txt`；快照比对 `RESULT: IDENTICAL`（两次独立验证：41 文件 manifest 基线 + 503 文件整树）；活投影 canonical sha256 `e73ce2de…6688`。
- 差没差：机器侧没差（CM3/CM6a/B1 子集全绿）；「这屏够不够用」（H1）与「值不值得继续」（H4）的判断权在你。
- 证据局限：真实样本只有一条全绿完结 run，映射表的 failed/waiting/unknown 分支由合成输入覆盖；Linux SSH 侧未重复 v1 投影（跨终端一致性已由 CM2 在 fake fixture 证得）；v1 不记录的四个字段（流程名/说明/触发人/触发方式）是投影时操作员补供的，source_refs 里有留痕。

**风险放行账表**（可豁免风险登记；红线——数据口径 / 两轮复核 / 未收敛 P0P1 / 生产迁移上线 / 权限安全 / 流程完整性——原则上不许进本表。权限安全唯一窄例外须按 design/05 §二③在同一风险行完整登记 `RISK-PRIVATE-OWNER-SECRET-DISPLAY` 与全部条件；缺一仍硬拦。被接受项须反查到 findings/backlog/验收池的存活记录）：

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|-------|---------|------|------|------------|---------|---------|
| 无 | — | — | — | — | — | — |

> 私有凭据窄例外不是“任意 Git 文件可存凭据”：marker 与闭集内各 key 必须唯一，只登记仓库相对配置路径；任何公开/共享/可见/受众/群聊、未知 key、非白名单持久副本或其它红线均不适用。marker 一旦出现即严格校验，无 marker 的密钥/凭据风险仍硬拦。放行只能 `risk-accepted`；未轮换 finding 保持 open，轮换后改 resolved 时同一风险行追加唯一的 `rotation-completed=true rotated-at=YYYY-MM-DD`，完成日不得在未来。

> 无风险时：**范围/影响/期限/恢复/去处 各列留空或 `—`/`无`**（接受人写 `无` 或留 `{…}` 都行，结构闸只看描述列不看接受人）——这样判 0 风险、不触发 R24。反之：只要风险描述列填了实质内容，就算真已接受风险（接受人写什么、甚至没填，都计入），首行须写"带风险放行"、不能写"端到端验收通过"。

**材料齐没齐**：brief / task_plan / progress(证据 E-001~E-025) / 独立复核记录（轮 1×3 批 + 轮 2 + E4/E5/E14/E6）/ review 都有了？ [x]
**as-built 更新了没**：本批触及的子系统，其 `as-built/<子系统>.md` 已覆盖更新到最新现状？（没动子系统现状可 N/A） [x] N/A——Pilot 为仓外一次性验证代码，未动本仓 tools/ 子系统现状（brief「触及子系统：无」）

→ 当前状态：**待验收**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

<核验清单由 AI 从 brief 的"人验"条目预生成，每条"AI/用户做什么 → 对话展示/应该看到什么 → 用户判断什么"，≤5 分钟点完。
 AI 可以代执行命令行、浏览器、截图、日志、对数等验证动作，但必须在对话框完整、真实展示关键证据（命令/操作、退出码/状态、关键输出或截图、完整日志/证据落点）；只报 `✅` 或"我跑过了"不算人验。
 你查看 AI 展示的证据或亲自核验后，AI 会在对话里只问一次：是否“已查看证据，认可执行本地收口”。默认本地收口授权包包含本任务的精确本地 squash、合入复验、verify、DevPlan/workspace 回填与任务 worktree/branch 清理；任务 SESSION 只由显式命令处理；不包含 push、deploy/发布/重启、环境或生产操作、下一张卡。你可以明说“只确认人验 / 暂不收口 / 保留工作树”缩窄。确认后 AI 连续执行 E11~E13，不再逐项追问，你全程不碰 git。
 没有你的对话确认，AI 永远不得碰本区。最高危（生产上线/迁移）建议你本人敲 git，不走代签。
 ——按"目的分块"组织：先写业务目的（覆盖哪条人验项），再写本工作区在这目的下交付了什么，最后列核验表；一个目的一块，多 H 项时比平铺清单好读。>

> 覆盖人验项（brief #5 原文）：**人判**：[design/05 §14 专属工作台产品面](../../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#14-专属工作台产品面) · P4-H1 / P4-H4：向用户展示真实终端转录、fixture hash、CLI 输出、版本与实耗；用户判断 ①CLI+SSH 是否足以作为一条独立、正式的控制面（与 DSH 并行、可配置替换，不是保底） ④当前体验是否值得继续建 Relay Runtime。（H2 / H3 涉 DSH，归 DHR_50。）——两个目的块合计覆盖此项。

### 目的一：证明 CLI+SSH 足以作为一条独立、正式的控制面（覆盖 P4-H1）

本工作区交付：v1 真实历史现场（零写入）到统一 Read Model 的只读投影，及 Pilot CLI 对冻结 v1 fixture 与活现场的真实渲染（证据挂 E-xxx，收口时回填）。

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| （人验项原文）**人判**：[design/05 §14 专属工作台产品面](../../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#14-专属工作台产品面) · P4-H1 / P4-H4：向用户展示真实终端转录、fixture hash、CLI 输出、版本与实耗；用户判断 ①CLI+SSH 是否足以作为一条独立、正式的控制面（与 DSH 并行、可配置替换，不是保底） ④当前体验是否值得继续建 Relay Runtime。（H2 / H3 涉 DSH，归 DHR_50。） | 该项由本块（H1）与目的二块（H4）两行分解执行 | 两块结果行均得到你的明确表态 | [x] 2026-08-20 两块均已表态 |
| P4-H1：CLI+SSH 是否足以作为一条独立、正式的控制面（与 DSH 并行、可配置替换，不是保底） | 查看 AI 在对话中展示的真实终端转录、fixture hash、CLI 输出、版本与实耗，然后作判断 | 真实 v1 run 投影后在 CLI 上可读且信息足以掌握任务状态；你在对话中明确表态「够 / 不够」 | [x] 用户 2026-08-20 点选「够，认可」（AI 先解释「独立控制面」语义与三条判断问题，用户理解后表态） |

### 目的二：判断这套体验是否值得继续建 Relay Runtime（覆盖 P4-H4）

本工作区交付：P4 主报告（CM 结论 + 截至本卡的 DM 事实登记 + 延后登记），作为 P5 的裁决材料（挂 E-xxx，收口时回填）。

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| P4-H4：当前体验是否值得继续建 Relay Runtime | 查看 AI 在对话中展示的真实终端转录、fixture hash、CLI 输出、版本与实耗，结合主报告结论作判断 | 主报告已落盘、延后登记如实；你在对话中明确表态「值得 / 不值得」继续建 | [x] 用户 2026-08-20 点选「值得，继续」（首轮答「不确定」，AI 补 P4 已证事实与暂不表态选项后表态；进 P5 的最终放行另行确认） |

---

- 确认记录：AskUserQuestion 点选（2026-08-20，两轮）：第一轮「认可，执行收口」（本地收口授权包）+ 尾巴分流「入验收池」，H1 追问、H4 不确定→AI 答疑后第二轮「H1 够，认可」+「H4 值得，继续」；人验收敛后才执行收口
- verify 提交 SHA：`252a131`（`git log --grep="^verify(dh-relay): DHR_27"` 可查）
- 签名：hyf（chat-confirm 代签）　　时间：2026-08-20

→ 解锁状态：**已验收**（随后回 DevPlan 任务表销户）

> 铁律：没有对应的 `verify(<模块>): <任务ID列表> …` git 提交，本批任务不许标"已完成"。

### 确认记录（append-only，每次人验确认追加一行｜协议见 design/05 §九 协议三）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---------|--------|----------------------|----------------------|-------------------------------|---------------|--------------------------------|
| 2026-08-20 | hyf | DHR_27 releasePacket（E9 七段汇报 + E10 业务化五段 + 机器证据摘要 + 零风险行） | 收口前最后一次全量复跑（159/159，E-025） | 活投影 canonical=e73ce2de…6688；503 文件快照 IDENTICAL×2；冻结 3 文件哈希三次冻结稳定；CM6a CLEAN | DHR27-CM3-freeze / DHR27-CM3-live / DHR27-CM6a / DHR27-B1-subset / DHR27-DM-deferred / DHR27-H1 / DHR27-H4 | 通过 |


