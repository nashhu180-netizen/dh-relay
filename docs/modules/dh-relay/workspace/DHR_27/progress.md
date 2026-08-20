<!-- progress.md — 施工日志 + 证据账本。🟢 边做边记。这是"实际发生了啥"，容忍跑偏——路径偏了记这里，不回写任何计划文档。项目有 journal 时本文件代替 journal（不双写）。 -->
# progress — DHR_27

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|------|----|---------|------|--------|
| 2026-08-20 | 主会话(Opus) | 开工闸：用户对话确认三项——确认开工 / 不开 worktree / 委托按默认表；工作区 8 件套建立，DevPlan 状态回填「进行中」 | AskUserQuestion 三项点选；DevPlan §3.1 DHR_27 行 | S1 brief（已委托）+ S2 task_plan |
| 2026-08-20 | 主会话(Opus) | S2：现场侦察（v1 run 三条、结构与绝对路径风险）+ 11 条关键设计决策 + 三批施工步骤落 task_plan | task_plan.md「现场侦察结论」「关键设计决策」 | 批 1 施工 |
| 2026-08-20 | 主会话(Opus) | 批 1 TDD：先写 4 条失败测试（fixture 白名单、零主机路径、brief_ref 改写、manifest 结构/自洽/覆盖）→ 跑红 | E-001 | 写冻结脚本 |
| 2026-08-20 | 主会话(Opus) | 批 1 实现：`scripts/freeze-v1-run.mjs`（对源只读、fail-closed 扫路径、manifest 全量哈希基线）；冻结主投影对象 3 文件 + manifest | E-002 / E-003 | 全量回归 + 零写入首验 |
| 2026-08-20 | 主会话(Opus) | 批 1 验证：freeze 测试 4/4 绿；全量 136/136 绿（既有 testdata 安全扫描自动覆盖 v1 目录）；源目录 41 文件重哈希与 manifest 基线全等 | E-003 / E-004 / E-005 | 批 1 fresh 小审 |
| 2026-08-20 | 主会话(Opus) | 批 2 TDD：17 条投影测试先行（schema 有效性/确定性/映射表逐条/操作员字段拒缺省/零主机路径/source_refs 哈希+note/端到端只读）→ 跑红（模块不存在）；修正测试内一处 pause 优先级自相矛盾后再红 | E-007 | 实现投影器 |
| 2026-08-20 | 主会话(Opus) | 批 2 实现：`src/read-model/project-v1.mjs`（纯函数、零 fs、零时钟、输出自校验）+ `load.mjs` 加 `loadV1RunDir`（只读）+ CLI 加 `project` 子命令（四个操作员字段必填、缺则 exit 2 点名） | E-008 | 全量回归 |
| 2026-08-20 | 主会话(Opus) | 批 2 验证：投影测试 17/17 绿；全量 153/153 绿 | E-008 / E-009 | 批 2 fresh 小审 |
| 2026-08-20 | 主会话(Opus) | 批 3 活现场只读投影演示（仅一次）：前快照 503 文件 → project 活 run（detail+list）→ show/list/hash 渲染转录 → 后快照比对 RESULT: IDENTICAL；冻结投影 vs 活投影语义级全等（除 source_refs 外全字段），字节级差异=授权改写的 plan 文件 provenance 哈希（设计使然，见 F-003） | E-012 / E-013 | CM6a 审计 |
| 2026-08-20 | 主会话(Opus) | 批 3 CM6a 审计：范围内零写 API、唯一 fs 面 = load.mjs readFileSync、零 DSH 依赖（两处命中均为注释/反向断言）；范围外扫出桌面轨并行施工事实 → 记 F-001，不顺手处理 | E-011 | 主报告落盘 |
| 2026-08-20 | 主会话(Opus) | 主报告落盘 + 随即更新：施工期间 DHR_26 并行收口（15:59 verify `c90cf88` 用户签、16:01 销户留痕 `b64757b`），F-001 澄清为并行收口时序、主报告 §3 改按 DHR_26 正式登记的 DM1/DM4a/DM5a 事实列清单 | E-014；findings F-001 | review AI 提交区备料 |
| 2026-08-20 | 委托(S1 brief subagent) | brief.md + review.md 验收靶子预填完成；主会话逐字审：五条完成条件与 DevPlan 任务卡验收口径逐字一致，通过 | brief.md；review.md 完成条件表 | 批次小审回收 |
| 2026-08-20 | 主会话(Opus) | **流程自认（不伪装）**：brief「停下问人」补充条款（活现场演示前先展示计划命令）成文于 S1 委托期间，而批 3 演示在其回填前已执行——演示全程只读、零写入有前后快照双重对证，完整命令已写入主报告 §2.2 并将在对话汇报中展示；性质=工件回填时序错位，非隐瞒 | E-012 / E-013；主报告 §2.2 | E 收口段各路复核 |
| 2026-08-20 | 主会话(Opus) | E8 备料：review.md AI 提交区填毕（Confidence gap ×3、契约无变化声明、需求对齐证据 3 行、完成条件挂证据 5 行、验收项元数据 7 行、五段展示、风险账 0 风险） | review.md AI 提交区 | E2 轮 2 + E4/E14/E6 委托回收 |
| 2026-08-20 | 委托(批1小审 fresh subagent) | 批 1 小审回报：approved，P2×1 + P3×3；独立核了源哈希/只读性/manifest 闭合/扩展模式泄露扫描 | review.md 第一轮表；e:E-006 | 主会话修 P3 |
| 2026-08-20 | 主会话(Opus) | **P2 澄清（批 1 小审）**：批 1 的 136/136 全量绿（E-004）验证时点在 project.test.mjs 落盘之前，时序见本表批 1→批 2 行序；小审跑到的 project.test 红是批 2 TDD 的预期红（E-007），非批 1 回归 | E-004 / E-007 | — |
| 2026-08-20 | 主会话(Opus) | 修批 1 小审 P3×3：①冻结侧 HOST_PATH 拓宽（~/ $HOME %USERPROFILE% file:// ../，freeze 脚本 + freeze/project 两测试同步）②source_files 路径正则改显式否定盘符 ③EXCLUDED 改按实际存在过滤，测试加"无幽灵排除"断言；重冻结 + 全量 153/153 绿 + 源目录 41 文件重哈希仍全等 | E-019 / E-020 | 批 2/3 小审与 E4/E14/E6 回收 |
| 2026-08-20 | 委托(批2小审 fresh subagent) | 批 2 小审回报：approved，P2×2 + P3×6 + 复核者自首一条纪律偏差（仓内临时 err.txt 已删、无实害）；映射诚实性/无中生有/零fs零时钟等六维度无发现 | review.md 第一轮表；e:E-010 | 主会话修 P2/P3 |
| 2026-08-20 | 主会话(Opus) | 修批 2 小审：补 6 条测试（labels 双投影/CLI --label 合法+重复+畸形/ghost 节点→unknown→needs_you/空 progressTimes 回落 activated_at/空值 flag exit 2/操作员注入拒绝）；改 CLI 空值 flag=usage error、投影器加 HOST_PATH_ANYWHERE 操作员字段+labels 子串扫描（先试 schema isAbsoluteHostPath 复用，因其是前缀检查改用子串正则并**撤回对 schema.mjs 的导出改动**，DHR_25 冻结件保持零漂移）；全量 159/159 绿 | E-021 | E4/E6 登记 |
| 2026-08-20 | 委托(E4 需求复核 subagent) | E4 回报：有漂移（P2×1 + P3×3），Out-of-scope 零越界、结果零失真、H1/H4 未代填。处置：P2 停点履行记录——progress「流程自认」行成文于 E4 派出同时段（时序竞态），已存在即为履行记录；P3①变更范围枚举缺口登记 F-006（B-adjust 属计划层，随 E9 尾巴分流请用户裁决）②brief evidence/ 落点误标已更正 ③review 解锁状态行改真实状态 | review.md 需求复核结论行；findings F-006/F-007 | E14/批3 回收 |
| 2026-08-20 | 委托(E6 miner subagent) | E6 备料完成：5 条教训候选入 lesson_candidates.md（并行轨瞬时状态混入/语义层字节层对证二分/fail-closed 冻结范式/源头不记录不编造/新增流程约束无追溯力），已对教训库候选区去重；「自我印证风险」判不单独立候选（缓解已到位+既有候选覆盖） | lesson_candidates.md | 候选裁决随收口 lessons 提炼走 |
| 2026-08-20 | 委托(E14 一致性复核 subagent) | E14 回报：7 行横向比对，5 行一致（消费清单三副本/分组单点推导/run_status 词表/报告 CM 口径/三份拓宽正则互比），2 行遗漏待修 → 登记 F-009 | review.md dh:consistency-review 表；e:E-017 | 主会话修 F-009 |
| 2026-08-20 | 主会话(Opus) | 修 F-009：五处扫描正则统一补 `/mnt/ /var/ /etc/` + cli.test 第四份副本同步拓宽；拓宽让 DHR_25 故意反样例 host-path-locator.json（fictional /var/ 路径，本就为测校验器拒绝而存在）命中扫描——按存在目的显式豁免该文件（凭据扫描不豁免）；重冻结 + 全量 159/159 绿 + 源目录 41 文件重哈希仍全等 | E-022 | 等批 3 小审 → E2 轮 2 |
| 2026-08-20 | 委托(批3小审 fresh subagent) | 批 3 小审回报：approved，P3×2 证据保鲜；10 项报告断言独立抽查全吻合（含 503 快照逐行比对、canonical 独立重算、DHR_26 verify SHA、CM6a 复扫） | review.md 第一轮表；e:E-015 | 主会话修保鲜 |
| 2026-08-20 | 委托(E2 轮2 fresh subagent) | 轮 2 回报：approved，新 P3×3；核轮 1 各方结论全部认可（批 3 一处出入指向主会话 E-024 归因错误而非小审观察）；CM3/CM6a/注入/正则归一独立复算无发现 | review.md 第二轮表；e:E-023 | 主会话处置 P3×3 |
| 2026-08-20 | 主会话(Opus) | 处置轮 2 P3×3：①改正 f45d2626/f542818f 归因（末尾 LF 记账口径差，内容零漂移；对比文件追加 correction 节，F-010/E-024 补正——**接受轮 2 对主会话自己的更正，不辩解**）②反样例钉入 cli.test exit-3 清单 ③报告计数刷 23条/159、审计补保鲜注；全量 159/159；**两轮换人复核闭合、返工收敛表关账（0 open P0/P1）** | E-025 | E9 交付汇报 + E10 人验展示 |
| 2026-08-20 | 主会话(Opus) | 阶段汇报@批1、阶段汇报@批2、阶段汇报@批3+复核闭环——三次对话交付汇报已发（开工分流后/三批施工后/复核全闭环后各一次） | 对话记录 | E9 七段汇报 |
| 2026-08-20 | 主会话(Opus) | 阶段汇报@收口（E9 七段）+ E10 证据展示区已发；E11 用户四项答复：①H1 提出理解性追问（求解释「独立控制面」与判断方法）②H4 答「不确定」③**本地收口授权包：认可**（已记录，机械步骤不再重复问）④尾巴分流点选「入验收池」。**人判 H1/H4 未收敛 → 按 G13 停在待人验、不打 verify**；先答疑再请表态 | 对话记录；AskUserQuestion 答复 | 答疑 + 重新请 H1/H4 表态 |
| 2026-08-20 | 主会话(Opus) | 尾巴分流执行：F-012 入 dev-harness 验收池 `ACC-2026-08-20-01`；F-006 因 dh-relay 未注册验收池由 dev-harness 池代管 `ACC-2026-08-20-02`（注册缺口一并入池）；findings 两行改「遗留→验收池（已确认）」 | dev-harness/docs/acceptance/验收池.md | 等 H1/H4 表态后执行收口授权包 |
| 2026-08-20 | 主会话(Opus) | **人验收敛（E11 闭合）**：AI 答疑（「独立控制面」语义 + 三条判断问题 + H4 投入决策与暂不表态选项）后用户第二轮点选 **H1「够，认可」+ H4「值得，继续」**；review 人类签名区两目的块勾结果、确认记录表追加「通过」行、解锁状态改「已验收」；需求对齐/完成条件#5/元数据 H1H4 行同步收敛；主报告 §5 回填判断结果。真值表判定=**全验收通过**（全部结果项通过 ∧ 无方向闸 ∧ 无未验证项 ∧ Risk-Count 0） | review.md 人类签名区；主报告 §5 | E12 verify 提交 |
| 2026-08-20 | 主会话(Opus) | E12 前路径所有权审计：index 干净；工作树并行 WIP = `workspace/DHR_49/`（并行 session 已开工桌面轨 Client 卡，untracked）与本卡路径零重叠 → 按精确路径 stage（dev_plan P4 / workspace/DHR_27 / design/evidence/10），不碰 DHR_49 | git status 转录（对话内） | verify 提交 + E13 销户 |
| 2026-08-20 | 主会话(Opus) | E12 verify 提交 `252a131`（Verification: full，Risk-Count: 0，Verified-Via chat-confirm 两轮点选）；E13 销户：DevPlan DHR_27 行改「已完成 · 2026-08-20 / 252a131 · release_mode=full」、dh:status 现状块刷新、review verify SHA 回填；无 worktree 无需清树 | git log 252a131；DevPlan §3.1 | 本行随销户 docs 提交落盘，卡收口完毕 |
| 2026-08-20 | 主会话(Opus) | 修 F-010 证据保鲜：主报告 §2.1 补三次冻结哈希稳定说明；对比文件补时序附注并以现行代码复算冻结投影 file_sha256=f542818f（回到留档原值）、语义对证仍 IDENTICAL；批次小审轮 1 至此全部闭环（3/3 approved） | E-024 | 派 E2 轮 2 增量复核 |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|----|------|-----------|------|------|
| E-001 | test | `node --test test/freeze.test.mjs`（fixture 落盘前） | observed（4 条全红，ENOENT/断言失败） | TDD 跑红：测试先于实现钉住冻结契约 |
| E-002 | cmd | `node scripts/freeze-v1-run.mjs "D:\MyFiles\ai-workflow\dh-crew\.dh-runtime\relay\RELAY-IHSR05-RW-20260816113004" "testdata\v1\RELAY-IHSR05-RW-20260816113004"` | pass（frozen 3 files + manifest；source baseline 41 files hashed） | v1 fixture 冻结完成，manifest 记全量源哈希基线 |
| E-003 | test | `node --test test/freeze.test.mjs`（fixture 落盘后） | pass（4/4） | 冻结产物过白名单/零路径/改写/manifest 自洽四道断言 |
| E-004 | test | `node --test`（relay-control-pilot 全量） | pass（136/136，fail 0） | 无回归；testdata/v1 已进既有零凭据/零主机路径扫描面 |
| E-005 | cmd | 重哈希源 run 目录 41 文件 vs manifest.source_files（内联 node 脚本，见批 1 检查点） | pass（RESULT: IDENTICAL） | 冻结全程对源目录零写入（CM3 基线首验） |
| E-006 | review-dispatch | dh dispatch | observed | 复核派出：fresh-subagent-batch1｜批1小审：冻结v1fixture（freeze.test.mjs+freeze-v1-run.mjs+testdata/v1）只读复核 |
| E-007 | test | `node --test test/project.test.mjs`（实现前） | observed（ERR_MODULE_NOT_FOUND，17 条全不可跑） | TDD 跑红：投影契约先于实现钉住 |
| E-008 | test | `node --test test/project.test.mjs`（实现后） | pass（17/17） | 投影器满足映射表/确定性/诚实缺口/零路径/只读全部契约 |
| E-009 | test | `node --test`（relay-control-pilot 全量） | pass（153/153，fail 0） | 批 2 无回归 |
| E-010 | review-dispatch | dh dispatch | observed | 复核派出：fresh-subagent-batch2｜批2小审：v1投影器+project子命令（project-v1.mjs/load.mjs/main.mjs/project.test.mjs）只读复核 |
| E-011 | cmd | `evidence/v1/cm6a-audit.txt`（写 API / fs 面 / DSH 引用三向扫描转录，范围=src/cli+src/read-model+src/render+testdata） | pass（范围内 CLEAN） | P4-CM6a：CLI 主线无 Relay 运行写权、不 fork DSH |
| E-012 | cmd | `evidence/v1/live-tree-before.txt` vs `live-tree-after.txt`（`.dh-runtime\relay\` 整树 503 文件 path\|size\|mtime\|sha256 快照比对） | pass（RESULT: IDENTICAL） | P4-CM3 零写入 + design/02 B1 子集（legacy 根零新写） |
| E-013 | cmd | `evidence/v1/live-projection-{detail,list}.json`、`live-show.txt`、`live-list.txt`、`live-hash.json`、`frozen-vs-live-comparison.txt` | pass（投影 exit 0、渲染 exit 0、语义对证 IDENTICAL、canonical_sha256=e73ce2de…6688） | P4-CM3 活 v1 现场只读投影成功 + 冻结 fixture 忠实性 |
| E-014 | cmd | `docs/modules/dh-relay/design/evidence/10-P4-多控制面Pilot报告.md`；`Select-String "DM-deferred-facts:" <该文件>` | pass（主报告落盘；锚点值 stoploss-not-triggered + 清单；CM4 记「延后（DHR_50）」） | 延后登记完成条件 + H4 裁决材料落盘 |
| E-015 | review-dispatch | dh dispatch | observed | 复核派出：fresh-subagent-batch3｜批3小审：活现场演示证据+CM6a审计+P4主报告 只读复核 |
| E-016 | review-dispatch | dh dispatch | observed | 复核派出：subagent-e4-requirement｜E4需求复核：对回brief/验收清单查范围漂移与结果失真 |
| E-017 | review-dispatch | dh dispatch | observed | 复核派出：subagent-e14-consistency｜E14一致性复核：本卡碰到的口径在别处的兄弟定义横向比对 |
| E-018 | review-dispatch | dh dispatch | observed | 复核派出：subagent-e6-miner｜E6 miner：教训候选只读备料 |
| E-019 | test | `node scripts/freeze-v1-run.mjs …`（P3 修复后重冻结）+ `node --test`（全量） | pass（excluded 幽灵条目消失；153/153，fail 0） | 批 1 小审 P3×3 修复收敛、无回归 |
| E-020 | cmd | 重哈希源 run 目录 41 文件 vs 新 manifest.source_files（内联 node 脚本） | pass（RESULT: IDENTICAL — source untouched after re-freeze） | 重冻结仍零写入 |
| E-021 | test | `node --test`（批 2 小审修复后全量：+6 条新测试） | pass（159/159，fail 0） | 批 2 小审 P2×2 + P3×2 修复收敛、无回归 |
| E-022 | test | `node --test`（F-009 修复后全量）+ 源目录重哈希 vs 新 manifest | pass（159/159；SOURCE: IDENTICAL） | E14 遗漏待修 ×2 修复收敛、重冻结仍零写入 |
| E-023 | review-dispatch | dh dispatch | observed | 复核派出：fresh-subagent-e2-round2｜E2轮2增量复核：fresh-context未参与实施，核全程+核批次小审落账+查复核修复增量diff |
| E-024 | cmd | 现行代码重投冻结 fixture：file_sha256=f542818f…（**口径注：去末尾 LF 的 1526 字节；含 LF 全量 stdout=f45d2626，同一内容两种记账，轮 2 更正归因**）；语义对证（除 source_refs）IDENTICAL；`frozen-vs-live-comparison.txt` 补时序附注（后追加 correction 节）；主报告 §2.1 补三次冻结哈希稳定说明 | pass | F-010 证据保鲜修复收敛（解释以 correction 节为准） |
| E-025 | test | E2 轮 2 处置后全量 `node --test` + 反样例钉入 exit-3 清单 + 对比文件 correction 节 + cm6a-audit 保鲜注 + 报告计数刷新 | pass（159/159，fail 0） | 轮 2 P3×3 处置收敛；两轮换人复核闭合 |
