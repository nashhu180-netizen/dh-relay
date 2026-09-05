<!-- dh:v1 -->
# review — DHR_72

## 独立复核区

**第一轮·批次小审合集**

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|---|---|---|---|---|
| `/root/dhr72_code_review1_retry`（fresh、只读） | 当前施工 diff 与 B-38 边界 | P0=0、P1=0、P2=1 | e:E-7209 | 静态审：持续观测/Result 出口/现役 stop-host_lost-recovery 方向正确；P2=比例守卫只覆盖列名的 fixture/回归配置，不能表述成全局生产入口防护。 |

**第二轮·增量复核**

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|---|---|---|---|---|---|
| `dhr72_code2_0905`（Herdr fresh、只读） | `master@084a00d...eb89e61` 全程与收口增量 | P0/P1=0、P2=1：比例守卫只守列名 fixture 参数，不能表述为全局生产默认值守卫；生产持续观测与五出口方向一致。独立选择 `workflow-driver.mjs` idle/done 提前 return 变异点。 | approved；有效单测由主会话按其选点补红→绿后闭合 | e:E-7223 | 变异后指定用例 exit=1（`timeout:working checkpoint`）；还原后 1/1、exit=0，生产 Git blob 与候选一致。 |

### 有效单测·变异点登记

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人 | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| relay-core/runtime/workflow-driver.mjs:397 | idle/done 分支持续轮询 → 写完 missing-Result Attention 后插入 `return` | 改条件 | `initial idle remains observable until later working records a checkpoint` | `node --test --test-concurrency=1 --test-timeout=60000 --test-reporter=spec --test-name-pattern="initial idle remains observable until later working records a checkpoint" test/dhr72-continuous-observation.test.mjs` | fba0ac031801c1636d29a1fb16d851fe8eb33e84 | 505ff9454863bd319429b33c27e5ca2d3cf7ae69 | `dhr72_code2_0905`（Herdr fresh、只读） | 断言失败 |

### 返工收敛

| 轮次 | open P0/P1 数 | 处理 / 证据 | 是否收敛 |
|---|---|---|---|
| 1 | 2（需求 #6/#7）+ 2（一致性 Receipt/review 脱节） | #7 已由 E-7223 选点与主会话红→绿闭合；Receipt 角色脱敏整改 21 文件/10 文件名，复跑 dry-run 0/0；review 脱节由本次落账闭合。#6 仍须候选入 master 后以 H 回填 DHR_74。 | 部分收敛；剩余 1 个跨 merge 的 H 闸，不在 E10 前伪清零。 |

**需求复核结论**：`dhr72_req_0905`｜派出=e:E-7224｜P0=0、P1=2；#7 已闭合，#6 的 DHR_74 R31 必须等 DHR_72 候选入 master 后回填，当前仍未满足。
**教训复核结论**：`dhr72_lessons_0905`｜派出=e:E-7225｜P0/P1=0、P2=2；L-7201 保留，另由 E6 miner 去重并回流 prompt 提交/native-exit 候选；Receipt 只主张“最终证据根已脱敏”，不反推“原值从未短暂落盘”。

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_72 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| Herdr prompt / Enter 回退 | DHR_72 runner 1 条 | 一致 | 有意差异：只局部接住 native 非零、最多两次 Enter、每次 5s 验真 | e:E-7226 |
| DHR_35 / DHR_72 真实 runner | DHR_72 runner 1 条；DHR_35 只作来源边界 | 一致 | 有意差异：DHR_72 禁止 submit-result，只证明 checkpoint，不替代 DHR_35 | e:E-7226 |
| Receipt / Attempt 脱敏 | 脱敏器 1 个、历史失败实录 7 组 + run6 | 整改后一致 | 初审 P1：裸 launch Receipt 被误标 `att~`；现按字段归一 `rcpt~`，21 文件/10 文件名修正，dry-run 0/0 | e:E-7226 |
| checkpoint → running 状态折叠 | driver 与 DHR_69 回归 2 处 | 一致 | 真实 working 才 checkpoint，随后折叠回 running | e:E-7226 |
| `package.json` 测试登记 | DHR_75/76/72 各 1 组 | 一致 | 三组均保留在同一 test 入口 | e:E-7226 |

**一致性复验结论**：`dhr72_consistency_0905` 对 Receipt/Attempt P1 窄复验 `RECHECK PASS`；review 脱节项由 E-7229 本次回填闭合。

## AI 提交区

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| DHR_72 持续观测 | DSH-off Codex 启动→首次 idle→真实 working→checkpoint | E-7221：run6 exit=0，4 条 `checkpoint_recorded`、2 条 alive observation、0 Result；证据根事后不可逆脱敏并 dry-run=0 | 满足；只证明 DHR_72，不替代 DHR_35 |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | 首次 `idle` 后 driver 继续轮询；真实 `working` 后写 checkpoint 并折叠回 `running`。 | AI | E-7231（专属 8/8）；E-7227 生产变异红→绿 | 是 |
| 2 | 长期 idle 写 `waiting_human`/Attention，不自动结束；首次 idle 后 host 消失仍能走 `host_lost` 对账。 | AI | E-7219（专属 8/8，含长期 idle 与 host_lost） | 是 |
| 3 | committed、stop、host_lost、Attempt 已终态、actor-closed/lease-lost 五出口各有独立用例，退出后无追加事件。 | AI | E-7219（五出口与写入失败边界） | 是 |
| 4 | 冻结四条语义 skip 全部解除并按现役 Receipt-bound 语义改写；定向套件 55/55、0 skip。 | AI | E-7231：55/55、0 skip/0 fail | 是 |
| 5 | DSH-off、冻结 Codex Profile 的真实实录含脱敏 `checkpoint_recorded`；撞启动停摆最多重试三次并留给 DHR_73。 | AI | E-7221：run6 checkpoint=4、Result=0、DSH=0；最终证据根 dry-run=0 | 是 |
| 6 | poll 与配对超时的比例守卫能拦截参数违规；变异该守卫得到断言失败；master R31 对 DHR_74 清零。 | AI | E-7207 守卫 20→5 exit 非零；E-7222 当前 master 仍有 DHR_74 R31 | 部分；须 DHR_72 入 master 后回填 H |
| 7 | 第二轮 fresh 复核者登记生产代码变异点，施加后指定测试断言失败。 | AI | E-7223：fresh 选点；主会话变异 exit=1、还原 1/1 exit=0、Git blob 一致 | 是 |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 持续观测与 checkpoint | 定向 fake 测试 + 真实脱敏实录 | machine | DHR72-AF | 等价覆盖 | 见 brief #1/#5 | E-7219、E-7221 pass | wt/DHR_72@eb89e61 + 收口整改 | fake + Herdr | DHR_35 P6-M1 不覆盖 | v1 | test | user-D-start-E10 |
| 五出口/语义回归 | 定向五文件套件 | machine | DHR72-BE | 等价覆盖 | 见 brief #2-#4 | E-7219：55/55、0 skip/0 fail | wt/DHR_72@eb89e61 | fixtures | 启动停摆归 DHR_73 | v1 | test | user-D-start-E10 |
| 比例守卫与 DHR_74 回签 | 守卫变异断言失败 + master R31 | machine | DHR72-H | 部分 | 见 brief #6 | 守卫已在 `master@13c072d` 红→绿；清洁 master 仍报 DHR_72 `anchor-outside-diff` 与 DHR_74 `mutation-table-missing` | `master@64fd712` | dh check | scanner 在主干无任务分叉时只对账未提交 diff，且未实现 H 跨卡传递；不补表伪造、不改状态绕闸 | v1 | test | user-E11 |

<!-- dh:mutation-transfer:v1 direction=out producer=DHR_72 consumer=DHR_74 producer-acceptance=DHR72-H consumer-acceptance=DHR_74-R31 source=13c072db4bcc8f7b5d575fc7b0bb0e648fbcdd8a parent=084a00d9d673844e71d09e205a96a1c9b744f006 diff-sha256=0ec7f5a8db2f4cb11d709bad880b239b305821db79b7787eb766bf09c5f34393 source-review=docs/modules/dh-relay/workspace/DHR_72/review.md source-format=legacy-v1 mutation-sha256=fca3640849aa5ecfb637ec159f5477caa55d5166b3501c576519e4d10fee728b anchor=relay-core/runtime/workflow-driver.mjs:389 depth=1 -->

→ 当前状态：**待验收。E11 已认可，squash `13c072d` 已入 master，主干回归全绿；机器证 H 的守卫/变异已入主干，但清洁 master 上 scanner 仍报 DHR_72 `anchor-outside-diff` 与 DHR_74 `mutation-table-missing`，故未生成 verify，任务树保留。**

### E10 放行证据包（releasePacket-DHR72-v1）

- **展示版本**：`wt/DHR_72@428f21e`；后续提交只修正机器可读 review/allowed-path 锚点，不改变生产实现、测试或真实 F。
- **机器证据摘要**：专属 8/8、poll 守卫 1/1、冻结五文件 55/55（0 skip/0 fail）；真实 run6 保存 4 条 `checkpoint_recorded`、2 条 alive observation、0 Result，DSH=0。生产提前 return 变异 exit=1（`timeout:working checkpoint`），还原后 1/1、exit=0、Git blob 一致。
- **复核摘要**：代码二轮 P0/P1=0、P2=1；需求初审 P1=2，其中生产变异已闭合，H 保留到 master；教训 P0/P1=0、P2=2，E6 回流候选-82/83；一致性两项 P1 均整改，Receipt/Attempt 原复核者 RECHECK PASS。
- **证据卫生**：全卡 redactor dry-run files_changed=0/files_renamed=0；结构化原 Receipt/Attempt UUID 与 `receipt_id:att~` 均零命中。这里只证明最终证据根已脱敏，不反推原值从未短暂落盘。
- **未满足项 / 硬停点**：`master@13c072d` 已包含 H 守卫与可反查变异证据。未提交工件回填在场时，DHR_72 R18/R31 曾清零；提交后的清洁 `master@64fd712` 上，scanner 因“主干无任务分叉时只对账未提交变化”对 DHR_72 报 `anchor-outside-diff`，同时对 DHR_74 仍报 `mutation-table-missing`。清洁主干实时体检为 4 failure：DHR_75 R18/R31、DHR_72 R31、DHR_74 R31。不给 DHR_74 补造变异表，不把 DHR_72/DHR_74 状态改为已完成绕过 R31。
- **E11 确认范围**：若用户明确认可，下一步只授权本地 squash/合入 master、合入后重跑 DHR_72 相关回归与 `dh`、按真实 H 结果机械回填 DHR_74，并在全仓强闸允许时生成对应 verify；若强闸仍拒绝则如实保留任务树与未签状态。不含 push、deploy、环境/生产写入、DHR_73、DHR_35 或范围外 R18/R30/R31 整改。

## 人类签名区

### 目的：确认 DHR_72 的真实 checkpoint 证据边界

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| 本卡真实实录 | 查看脱敏 DSH-off Codex 实录与机器证边界 | 认可它只证明 DHR_72，不替代 DHR_35 | [x] |

---

- 确认记录：2026-09-05 用户在对话中对 releasePacket-DHR72-v1 明文“认可”；仅授权该包列明的本地收口链。
- verify 提交 SHA：待 E12。
- 签名：用户 E11 明文确认（2026-09-05）。
