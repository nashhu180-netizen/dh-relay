<!-- progress.md — 施工日志 + 证据账本 -->
# progress — Issue #86

> 例外：现役 sole writer 规定 progress 仅当前 batch coder 写；本卡用户明确将过程文档委托文档 agent，本文件由 builder#docs 按实际事件回填，不记 pane 状态/轮询/通知。

## 日志 (Log)

| 时间 | 事件 | 说明 |
|---|---|---|
| 2026-09-28 | plan 进场 | builder#docs（rlt86-docs，w4K:t2/p2）核 cwd/branch/status：branch `docs/issue-86-document-agent`，HEAD `e92b5356df0026be28abd84176a621870fb562c7`，工作区干净；读 AGENTS、草案及独立审核记录 |
| 2026-09-28 | 会话迁移 | 用户指示「放当前space，不开新space」：会话原地迁入 w4K（本会话 w4K:t2/p2），旧 w3H/w4S 登记过期；execution_strategy 按实时 ID 登记 |
| 2026-09-28 | 实施方案精简 | 用户修正：document 为新角色不新增 phase（九值闭集由 test_install_skill 冻结，不改测试代码）；沿用文档所属现有 phase；`path=document-<请求id>`；自有 verdict=SYNCED，READY/SYNCED 不得当 PASS |
| 2026-09-28 | plan 落盘 | 本目录 task/task_plan/execution_strategy/progress/findings/review/lesson_candidates 七件 + 草案末尾范围调整注记；watcher（w4K:t3/p3 rlt86-watch）与 plan-reviewer（w4K:t4/p4 rlt86-plan-review）已由编排启动，swe-2-high 经 argv 核验 |
| 2026-09-28 | 分工再冻结 | 用户确认：skill 由 Codex 写、过程记录由文档 agent、Codex 另评过程记录效果；task/task_plan/review 已预留主会话效果原评区（准确性/遗漏/及时性可接续性/交接纠错负担/可得耗时用量），文档 agent 只转录不代判，用户人判不预签 |
| 2026-09-29 | plan-review 回填 | 独立 reviewer（rlt86-plan-review）结论 READY_FOR_DOCUMENT，P0/P1=0，F-R1 P2 已被主会话采纳（task.md roles.toml 收紧为不动）、F-R2/F-R3 P3 记信息项；本棒只转录登记，未写正式 PASS；另引改动前结构基线 E-003 |
| 2026-09-29 | 附注纠正 | 上行「实施方案精简｜用户修正」来源误记：document 角色/path/verdict 方案为 **Codex 主会话提供**（非用户原话），用户冻结的是分工/模型/space；原记录保留不删，权威区分见 review.md 确认记录（同 plan-confirm-1.json residual P3） |
| 2026-09-29 | 计划正式 PASS | plan-reviewer 核对转录后发可路由 PASS：转录忠实、roles.toml 收紧闭合 F-R1、来源区分正确（E-004） |
| 2026-09-29 | batch=1 施工 | Codex 主会话改 AGENTS.md + SKILL.md + 双 adapter 四件产品文档（新增 opt-in document 分工，九 phase 不变）；`test_install_skill.py` 19 tests OK；无代码/配置/测试代码改动（E-005）；batch-review 未开始 |
| 2026-09-29 | 缺证反例演练 | 获授权 probe（request=missing-source）：指定来源不存在 → BLOCKED reason=missing_evidence（F-011）；预期反例闭环，非真实阻塞；未补造跨平台通过 |
| 2026-09-29 | batch-review 回填 | 独立 reviewer（rlt86-batch-review）round-1 READY_FOR_DOCUMENT，P0/P1=0，F-B1/B2/B3 P3（E-006）；F-B1 措辞已由 Codex 修订（E-007）；本棒只转录登记，未写 PASS |
| 2026-09-29 | batch 正式 PASS | batch-reviewer 核对转录后发可路由 PASS：F-B1 纯措辞修订核毕、修订候选复跑 19 tests OK（E-008）；workflow-final 两路已派审、审查中 |
| 2026-09-29 | 效果原评转录 | Codex 主会话过程文档委托效果原评转录入 review.md 预留区（E-009）：分工可行但本次未证明更快/更省；非用户人判，不据此判试跑成功 |
| 2026-09-29 | workflow-final 回填 | 两路 round-1 均 READY_FOR_DOCUMENT、P0/P1=0（E-010/E-011），待原 reviewer 核对转录；F-C1 主会话保留未修；F-L1 已在草案尾注旁追加更正（原文保留）；F-L2 如实记 knowledge 目录不存在；F-L3 落 lesson_candidates L-01；Codex 效果 addendum 已转录 |
| 2026-09-29 | 收口回填 | workflow-final 两路原 reviewer 核对转录后均发可路由 **PASS**（E-013/E-014）；Codex 效果原评+addendum 转录经其本人确认 MATCH（E-015）；验收靶/返工/DA 覆盖/状态统一为真实态——全复核 PASS、F-C1 开放、未 commit/push、CI pending、Issue open、用户人判待判、不标整卡完成 |

## 证据账本 (Evidence Ledger)

| 证据 ID | 类型 | 内容 | 路径 | 命令 / 结论 |
|---|---|---|---|---|
| E-001 | check | 进场基线核对：branch/HEAD/工作区状态 | 本行（原始输出在会话） | `git rev-parse --abbrev-ref HEAD` = `docs/issue-86-document-agent`；`git rev-parse HEAD` = `e92b535…`；`git status --short` 空 |
| E-002 | doc | 草案与独立审核记录已读，P1 处置（协议约束非硬门、原始产物边界、不新增复核轮）已纳入本卡合同 | `dev_plan/drafts/issue-86-document-agent.md`、`issue-86-document-agent-review.md` | 人工阅读核对 |
| E-003 | test | 改动前结构基线：`test_install_skill.py` 19 tests OK（pre-change baseline only，不是新能力通过证据）；producer=Codex main | `evidence/baseline-install-test.json` | `python3 -m unittest discover -s tools/relay-light -p test_install_skill.py` → exit 0 |
| E-004 | review | 计划正式 PASS：转录确认（mapping/范围收紧/来源区分全部 faithful），verdict=PASS 可路由 plan 阶段 | `evidence/plan-confirm-1.json` + `DONE.plan-review.reviewer-confirmed-1.md` | plan-reviewer#1 transcription_confirmation |
| E-005 | test | batch=1 施工证据：四产品文档候选 sha256 登记；`test_install_skill.py` 19 tests OK（exit 0）；summary 声明九 phase 不变、无代码/配置/测试代码改动；limits：结构测试不证明程序硬门 | `evidence/batch-1-codex.json` + `DONE.batch.codex-1.md`（READY） | producer=Codex main |
| E-006 | review | batch-review round-1：READY_FOR_DOCUMENT，P0/P1=0；独立复跑 19 tests OK、四文件候选 hash 逐字相符、docs-only 守住；F-B1/B2/B3 P3 | `evidence/batch-review-1.json` + `DONE.batch-review.reviewer-1.md` | batch-reviewer#1（fresh） |
| E-007 | test | F-B1 修订证据：SKILL.md 新 sha256 `70b87ca…`（其余三件不变），19 tests OK；followup 声明措辞修正 | `evidence/batch-1-codex-revision.json` | producer=Codex main |
| E-008 | review | batch=1 正式 PASS：转录确认 faithful、F-B1 修订核毕、修订候选复跑 19 tests OK、F-B3 事实纠正登记正确 | `evidence/batch-confirm-1.json` + `DONE.batch-review.reviewer-confirmed-1.md` | batch-reviewer#1 transcription_confirmation |
| E-009 | eval | Codex 主会话对过程文档委托的五维原评 + judgment + not_claimed | `evidence/codex-record-effect.json` | producer=Codex main；scope 声明非用户人验 |
| E-010 | review | workflow-final 一致性路 round-1：READY_FOR_DOCUMENT，P0/P1=0；四候选 hash 相符、19 tests 独立复跑、四方一致性核毕；F-C1 P2 | `evidence/final-consistency-1.json` + `DONE.workflow-final.consistency-1.md` | reviewer#consistency（fresh） |
| E-011 | review | workflow-final 教训路 round-1：READY_FOR_DOCUMENT，P0/P1=0；重犯扫描（候选-34/11 复犯一次，其余应用未重犯）；F-L1/L2/L3 | `evidence/final-lesson-1.json` + `DONE.workflow-final.lesson-1.md` | rlt86-final-lesson（fresh） |
| E-012 | eval | Codex 效果原评 addendum：F-L1 暴露重复副本漏扫，加重核对负担、不改变原评结论 | `evidence/codex-record-effect-addendum.json` | producer=Codex main |
| E-013 | review | workflow-final 一致性路转录确认 PASS：转录 faithful、F-C1 开放如实保留、候选 hash 无漂移 | `evidence/final-consistency-confirm-1.json` + `DONE.workflow-final.consistency-confirmed-1.md` | reviewer#consistency（原 reviewer） |
| E-014 | review | workflow-final 教训路转录确认 PASS：F-L1 更正核毕、L-01 登记一致、无越界宣称 | `evidence/final-lesson-confirm-1.json` + `DONE.workflow-final.lesson-confirmed-1.md` | rlt86-final-lesson（原 reviewer） |
| E-015 | eval | Codex 本人确认效果原评与 addendum 转录忠实（MATCH ×2，非人验） | `evidence/codex-effect-confirm.json` + `codex-effect-addendum-confirm.json` | producer=Codex main |

## 2026-09-29 收口续做（Codex 主会话直接记录）

用户已取消默认文档 agent 分工，并授权合入 master、同步双设备多 agent skills、关闭任务。已对 AGENTS / SKILL / 双 adapter 明确默认原责任方直接写、无需 document 配置/SYNCED；`git diff --check`、19 项 `test_install_skill.py`、skill-creator `quick_validate.py` 均 exit 0。本次后续复核/CI/合入/安装证据以实际结果追加，不沿用旧候选 PASS 冒充新候选通过。
