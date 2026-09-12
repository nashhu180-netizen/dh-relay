<!-- dh:v1 -->
# lesson_candidates — RLT_05

## 候选（施工期追加，W 阶段不预判结论）

| ID | 触发现场 | 可复用规则候选 | 状态 |
|---|---|---|---|
| L-001 | RLT_05 Batch 1/4：三档 reviewer 集合与两类配置损坏由替换/损坏输入 TOML 证明（E-011/E-012）；A99 以「同二进制换配置产出不同 X 长度」双 sha256 证（E-081，B4 小审/heavy-r1 各复算同值 `90707b7e…`） | 配置驱动行为的测试应替换输入配置而非临时改生产源码，才能证明“改配置、不改核心” | evidence-registered(E-011, E-012, E-081, test_plan_x_rounds_length_and_ids_come_from_the_loaded_config) · not-adopted |
| L-002 | RLT_05 B 计划冻结（F-007：A62 schema 与 A73 superseded 分属独立 oracle）；Batch 2 实证：placeholder 三键输出掩盖 A128/A73 fixture 在 close/depends_on 列真实差异（B2-F8+E-035），A73 独立判别矩阵 E-034 | status schema 与 superseded 差分应分属独立 oracle，避免一个大快照掩盖 owner 边界 | evidence-registered(F-007, B2-F8, E-034, E-035) · not-adopted |
| L-003 | RLT_05 Batch 1：task_plan 只对「R 实例集合检查」写豁免（无 R/零 reviewer 不触发），design §3.5 的映射行却把「recipe 值非法」并列归入同一 HC | 同一 HC 的豁免范围在计划与设计文本间不一致时，施工不得自行选边缩小范围；按最保守叠加实现（豁免严格按其适用对象，取值合法性不放宽）并在 findings 逐条登记，交主控裁决 | evidence-registered(E-012, B1-F1) · not-adopted |
| L-004 | RLT_05 Batch 1：旧 CLI 测试原先直接跑子命令；`--config-dir` 契约一旦落地，任何未显式传该 flag 的测试都会走真实用户 HOME 的五情形 resolver | 引入「必须显式给定来源」的配置契约时，测试 helper 必须统一注入受控来源，并单独用合成 HOME 覆盖默认解析分支，否则用例结果依赖开发机真实安装状态 | evidence-registered(E-008, E-010, fixture#1) · **判重裁决=merge 为库候选-50 子款**（decider E-097；增量=合成 HOME 覆盖默认解析分支） |
| L-005 | RLT_05 Batch 1 rework R1：`plan_loaded` 的 `config_dir=`/`plan=` 原先「缺则补、有则留」，于是调用方可用伪造/重复/冲突 token 污染来源字段（F-B1-PLAN-LOADED-PROVENANCE） | 「来源/证明类字段」（实际读取的配置、实际处理的输入）在写入侧必须**无条件重建**而非补全：调用方同名输入一律不作真源，重建值必须来自 resolver 等权威事实；配一条「伪造/重复/冲突均被覆盖」的断言 | evidence-registered(E-017, E-021, E-022) · not-adopted |
| L-006 | RLT_05 Batch 1 rework R1：`recipe` 合法性原实现取决于「当前配置里有没有这一档」，于是替换配置即可扩张合法档位（F-B1-RECIPE-ENUM） | 被验收项冻结为**闭集枚举**的取值，其成员必须由代码中的显式闭集把关，不能委托给可替换的外部配置；配置只提供各成员的取值，不决定成员集合本身 | evidence-registered(E-017, E-020) · not-adopted |
| L-007 | RLT_05 Batch 2：design §10.3 的 status 样张来自比 §10.2 账本更晚的状态（§10.2 末尾 C1 尚未 `node_start`），且 §10.1 的 plan 摘录缺少 C2/R1/F1 的 agent 行、直接 lint 会被 A75/A47 拒 | 「逐行对齐样张」类 oracle 必须先证明 fixture 自洽：摘录型样张要补齐到可解析/可 lint 的最小闭包，并显式登记补了哪几行、替样张补了哪些续写行，否则 oracle 要么无法运行、要么被悄悄改写成实现自己的形状 | evidence-registered(E-032, E-033, B2-F1, B2-F2) · not-adopted |
| L-008 | RLT_05 Batch 2：完整 status 投影一落地，就暴露出旧 A128/A73 差分 fixture 的两个 plan 其实还在 `close` 列上不同（placeholder 三键输出掩盖了它） | 弱化输出的占位实现会让「等价 fixture」长期带伤通过；替换占位实现后必须先跑全量回归并按 oracle（此处 A73 的「唯一允许差异」）重校 fixture，而不是把新差异当回归修掉 | evidence-registered(E-035, B2-F8) · not-adopted |
| L-009 | RLT_05 Batch 2 rework R1：同一个 `_result_document()` 被顶层 `last_stage_result`（合同三键）与 `stages[].result`（合同五键）复用，测试还把顶层按五键断言 —— 错的是 oracle，绿测因此长期掩盖 schema 违约（F-B2-LAST-RESULT-SCHEMA） | 同一数据结构出现在两个层级、而各级冻结键集不同时，序列化必须**按层级分开函数**，不能让「字段更全」的那个同时服务两处；对应的正向键集断言也须逐层各写一条，否则一条过宽断言会同时掩盖两层 | evidence-registered(E-042, E-045, fixture#10) · not-adopted |
| L-010 | RLT_05 Batch 3：三条 RLT_03 旧 fixture 显式依赖「旧实现错误接受」——例如 `by` 派生**不经**写入者校验、未关节点就写 `stage_result`、`agent_launch orchestrator#1` 合法（E-058） | 给既有模块补「写入者/时序」类守门时，旧测试里凡以「不做该校验」为主题的那几条必然转红；它们不是回归，而是新合同的判别证据。处理方式是**按新合同重写该主题**（保留仍有效的断言方向，删掉已废前提），并在 fixture 表逐条登记旧用途/改动/原 HC-ID | evidence-registered(E-058, fixture#11–#13) · not-adopted |
| L-011 | RLT_05 Batch 3：`current_stage` 的「全部节点已关、实例未关」窗口在 design 中未定义，而 A106 的分路正依赖此窗口能读到结果（B3-F2） | 当「当前对象」的派生规则只覆盖了「还有未关节点」的情形时，补一个只覆盖缺口窗口的兜底（而非改写主规则）能让主路径 oracle 保持逐字不变；兜底必须写明依据 ID 与副作用（此处：`stage_close` 后回到 `null`/`none`），交复核裁决 | evidence-registered(E-056, B3-F2, E-059) · not-adopted |
| L-012 | RLT_05 heavy 复核：design §11 A99 证法原文「`git diff` 对 relay_log.py 为空」在整卡未提交 WIP 期**结构性不可达**；task_plan 冻结「两次运行间 sha256 相同」替代并获 B4 小审与 heavy-r1 追认（F-B4-R05） | 验收证法不得依赖在取证时点可能不成立的状态语义（提交态/工作树 diff）；改用等价证法时必须显式登记替换并经复核追认，同时在合同原文侧留下修订事项防止收口被当缺证 | evidence-registered(F-B4-R05, heavy-code-r1-devin.md §4, batch4-review-opus.md) · not-adopted |
| L-013 | RLT_05 全程：旧行为已正确允许的新断言无法给出实现前红，task_plan 冻结「登记 late-added discriminator（写明旧行为/实际编号/判别对象），不伪造红」；实际执行见 B2-F10（A44 词表）、E-076 ×3、E-058 改名承接 | 「实现前即绿」的用例不能伪造红来冒充判别力；按冻结格式登记为 late-added discriminator，由复核者用定向 mutation/对读补证判别力（本卡实证：B4 小审 M1–M4 + 代码轮2 双域变异） | evidence-registered(task_plan 施工共通约束, B2-F10, E-076, E-058, heavy-code-r2-devin.md §3) · not-adopted |

> L-001 Batch 1 触发现场：三档 reviewer 集合与两类配置损坏均由**替换/损坏输入 TOML**证明（E-011、E-012），生产源码未为取证改动；A99 的两次运行同 hash 证明仍归 Batch 4。

> 判重注记（heavy 教训路 F-HLS-02）：L-004 与库内候选-50（测试对家目录默认配置的隐式依赖→强制注入）疑似同族；本条增量=「用合成 HOME 逐一覆盖默认解析分支」，收口时建议并入候选-50 或标其子款，由教训收口裁。

> 重蹈/近失记录（heavy 教训路 F-HLS-05，供候选库维护者点名）：①候选-87「机器强制只读须先探沙盒」次日即重蹈——B1/B2 小审 reviewer 动态全部 `bwrap RTM_NEWADDR` NOT_RUN，处置演进为 hash-matched 可写快照重派+主控源 worktree 复跑（E-026/E-047/E-048），该快照降级路径比候选-87 原文更具体；②候选-2/7「oracle 自证循环」近失——B2 顶层 `last_stage_result` 五键断言把错误实现锁成 oracle（F-B2-LAST-RESULT-SCHEMA），被 fresh 小审逮住 rework 闭合；③候选-45/46「判别力/唯一负责」近失——F-B3-A89-BRANCH-EVIDENCE 断言先命中 unknown-stage 分支，R1 改用已知未 start 实例+E-065 mutation 复证。

> heavy 的 lesson review 必做。施工者只追加事实与证据，不得自行判定 `lessons-absent`、Binding 或最终采纳。
