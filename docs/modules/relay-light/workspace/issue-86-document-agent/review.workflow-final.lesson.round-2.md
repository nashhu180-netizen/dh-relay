<!-- dh:v1 -->
# review — Issue #86 · workflow-final · lesson 路 round-2（增量核对）

- reviewer：`rlt86-final-lesson`（w4K:t7/p7，原 lesson reviewer，复用原独立 reviewer 会话的增量复核，未参与施工；本轮不走 document 转录，本报告自写）
- HEAD：`06b6e66e90d4bc96e03ac83a92950f6e764d074a`（merge origin/master）
- 增量基线：`e90375cb6f9e2b476663cc354c5551d453816d6a` → `06b6e66`；只审本卡九个变更文档，master 带入的 WFP 总表（`workflow-platform/wfp-p1-obd-p5/relay_plan.md`）不在本卡范围、未审。
- 环境：无 `RELAY_RECEIPT`，正常复核路径。

## 候选 SHA256（HEAD @ 06b6e66，九件）

| 文件 | sha256 |
|---|---|
| AGENTS.md | d4b0c9fe9199c1e0be8e4ccff3fbcc3d12dd1bf97de758b1012c750f5cfcf4ba |
| tools/relay-light/skill/SKILL.md | da0f52e71fe939f800d8a02fc32b50e55eca2f315450154296e2c805adbc3012 |
| tools/relay-light/skill/references/adapter-claude-code.md | 66ea8165d011d16a1e788ef12071b16ab18994c577969c260a9bb0b8d19f4f57 |
| tools/relay-light/skill/references/adapter-codex.md | 99e0eb5946fc95a34f306a0b7a9f702eda704d30718c9cde2b32a50eb07c6cf8 |
| dev_plan/drafts/issue-86-document-agent.md | b32bfd706a4ca355e5e0ef34e35fc09845410ff4fbb470dd631a91de9dd973e8 |
| workspace/issue-86-document-agent/task.md | 2f63048b816612aad9754793be3ccdb6b3d6521927a62c003dbaedbe68ef0272 |
| workspace/issue-86-document-agent/execution_strategy.md | 8f822f867b9cb6192a00b25568ef6ddc446b05a05e4b8aacabc476ab417a36ba |
| workspace/issue-86-document-agent/progress.md | 2776b523dfbd917ce2c3d87ae189072deacc1f2577fa6cd456036abceefc796c |
| workspace/issue-86-document-agent/review.md | d95fa2111a42caf5810182dfc11ef1e3e1174f1cebc72413172f970462568b85 |

## 独立核验事实

- **VF-1（范围）**：`git diff e90375c..06b6e66 --stat` 恰为本卡 9 件（4 产品 + 草案 + 4 workspace）+ WFP 总表（master 合并带入，排除）；无代码/配置/测试文件改动，roles.toml 与 `test_install_skill.py` 未动。
- **VF-2（默认行为四方一致）**：SKILL.md:373 新增「默认不启用」+ 374「仅按用户明确要求试验」；AGENTS.md:55 与双 adapter「文档 agent 派单」节首句同义——默认原责任方直接写、不要求独立实例/终端/标签页、不等待 SYNCED、缺配置不构成阻塞、仅用户明确指定试验才启用。四文件措辞细节不同但语义逐点对应，无矛盾。
- **VF-3（全文扫描无遗漏副本）**：对四产品文件 grep `document|文档 agent|代笔|SYNCED` 全部命中点逐一核——现存 15 处提及全部为「启用 document 时 / 含已启用的 document / 未启用…时 / 仅在用户明确指定」门控形态，无一处残留把 document 当默认或必需环节的表述。F-L1「更正须扫全部同文副本」教训本轮被应用（默认语义改动四方同步落地）。
- **VF-4（opt-in 合同未被削弱）**：启用态规则逐字保留——SYNCED≠PASS、READY_FOR_DOCUMENT→原 reviewer 核对→独立确认 signal 才放行、FAIL/REVISE 不得翻 PASS、RELAY_RECEIPT fail-closed、watcher 零写、model gate、四类恢复权威均不变；代笔合同只在启用时生效的边界表述清晰。
- **VF-5（错归因未重犯）**：新增内容中用户决定均以引号原话记录（「好的，那就不作为默认流程了」「现在的协议 做下修改下 不要求开独立的文档agent」「改完后 更新下 master 同步到两个设备多个agent的skill里面」「任务也关闭」），记录/补记动作如实归 Codex 主会话；未发现把主会话方案记为用户原话的新错归因。限制：原话真实性不可由本 reviewer 独立回放核验，仅能核内部一致性与归因形态。
- **VF-6（来源诚实 / 不超证据宣称）**：task.md 与 execution_strategy.md 同文块如实记「增量独立复核、最新 CI、远端合入和双设备同步尚待实际完成」；progress.md 记「不沿用旧候选 PASS 冒充新候选通过」；review.md「最新采用决定」明写不表示 DA-08 通过、不改变既有复核结论、不构成合并/安装完成证据、不据此推断远端状态。草案尾注「试跑后的采用决定」同口径并把「适合继续试用」降级为非当前建议。
- **VF-7（历史保留 / append-only）**：本轮全部为追加段——Codex 效果原评原表原样保留、F-L1 草案尾注更正标记保留、确认记录 append-only 追加；未删改历史结论。
- **VF-8（F-C1 不假装已修）**：findings F-012 仍如实标 P2 未修非阻断；本轮增量未触碰 adapter-codex 该段措辞（该 P2 依旧开放，本路不重复登记）。
- **VF-9（DA-08 / 关闭口径）**：结案口径为「试跑完成，用户决定不默认采用」；DA-08 未标减负验收通过；人类签名区未代签。关闭授权、合入、同步均以"待实际完成"登记，无超前宣称。
- **VF-10（测试）**：按派单说明不重跑；progress 记 `git diff --check`、19 项 test_install_skill、quick_validate 均 exit 0，本路仅核对「该声明存在且未冒充本轮独立证据」——属实（声明归主会话产出，非本次复核结论）。

## Findings

| ID | 级别 | 位置 | 事实 | 建议 |
|---|---|---|---|---|
| F-L2-1 | P3 | AGENTS.md:53 | RELAY_RECEIPT 分流句写「（含 document）」，缺「已启用/明确启用」限定——与 AGENTS.md:51「（含明确启用的 document）」、SKILL.md:344 及双 adapter「（含已启用的 document）」措辞不齐。无语义风险（未启用时该角色不存在），仅一致性毛边 | 后续顺手统一限定词；不阻断 |

无 P0/P1/P2。

## 结论

**PASS**（lesson 路，round-2 增量核对）。

依据：用户修订「document 非默认、仅明确试验启用」在四产品文档一致落地且全文无遗漏副本；opt-in 责任/信号/独立复核链条未被绕过；新增过程记录 append-only、归因与边界如实、未宣称 DA-08 减负通过或合并/CI/安装完成；F-L1 残留更正标记仍在位。P0/P1=0，P3×1（措辞毛边）。本结论只覆盖 lesson 路增量核对范围，不代表整卡验收、合并或安装完成。
