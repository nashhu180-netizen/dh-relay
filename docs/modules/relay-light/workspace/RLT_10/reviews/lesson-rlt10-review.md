<!-- dh:v1 · lesson 路复核 — RLT_10 -->
# lesson-rlt10-review — RLT_10 教训复核

- **身份**：`rlt10-review2`（RLT_10 复核者，normal Recipe 三路之 lesson 路）
- **模型自报**：Devin · SWE-2 Max
- **复核对象**：`wt/RLT_10` @ `b796991`；教训库 `docs/modules/dh-relay/knowledge/教训库-候选.md`（候选-1~候选-87 全量通读）；本卡 `lesson_candidates.md`
- **只读声明**：本路只读不改代码；lesson 结论只写事实与级别。

## 输入清单

- `dispatch/README.md`、`dispatch/review.md`、`brief.md`、`task_plan.md`、`progress.md`（证据账本）、`findings.md`、`decision.1.md`、`lesson_candidates.md`、`check.C1.md`/`check.C2.md`/`check.C3.md`
- 教训库候选区全文（87 条，逐条对照四主题：测试入口 / 退出码透传 / SUITE SKIP / 标准库约束）
- 实读 `relay-light-log.ps1`、`test_relay_log.py`（含 skip 归因 `:3839`/`:3855`）、`run-relay-tests.ps1` diff

---

## 一、相关教训条目核对（遵守 / 重犯）

### 测试入口

| 条目 | 判定 | 事实 |
|---|---|---|
| 候选-39 · 新增测试文件须证明被默认 runner 拾取（对比用例数增量/清单命中） | **遵守** | `$suites` 是显式清单（恰为该教训来源卡的同型坑）；B3 先取入口缺席 RED（E-B3-002：登记前全量 `relay-light-log` 零命中），登记后 E-B3-005 在全量输出第 740 行命中 `=== relay-light-log.ps1 ===`、第 1000 行 `RELAY ALL PASS (SKIPPED: 1)`；分项用例数经 E-B3-008 校正为 141+7 |
| 候选-58 · 新测试过 runner 拾取 + 终态屏障两道门 | **遵守（拾取半）/ N/A（异步半）** | 本卡无异步 driver/轮询对象，终态屏障维度无对应物；runner 拾取维度同上 |

### 退出码透传

| 条目 | 判定 | 事实 |
|---|---|---|
| 候选-82 · EAP=Stop 不得吞 native 非零，须以真实终态确认 | **遵守** | `relay-light-log.ps1:3` 显式 `$PSNativeCommandUseErrorActionPreference=$false`——正是该教训的落地形态；非零经 `$LASTEXITCODE` 透传：E-B3-003 隔离证假 `python` exit 7 → 壳 exit 7；check.C3 用 `/bin/false` 独立复现 exit 1。两份 unittest 输出不捕获不重写 |

### SUITE SKIP

| 条目 | 判定 | 事实 |
|---|---|---|
| 候选-74 · skip 不是豁免是记账——条数与去向写进结论 | **遵守** | 缺解释器分支恰一行 `SUITE SKIP relay-light-log (python/python3 missing)` + stderr 0 字节 + exit 0（E-B3-003，checker 复现）；runner 既有 `SUITE SKIP *` 计数把它计为 `(SKIPPED: 1)` 而非 pass，结论原样带计数；unittest 内 `skipped=2` 归因写明为既有 A114/`decision_mode` 缺口（`test_relay_log.py:3839`/`:3855` 的 `@unittest.skip("F-002 ... 超出本卡 allowed-paths")`），非本卡新增豁免 |
| 候选-38 · 入口探测分「可解析/可执行/可拉起」三层；`Get-Command` 须 `-CommandType` 限定 | **基本遵守，踩到未覆盖的新机制** | 壳用 `Get-Command <exe> -CommandType Application` 取 `.Source`（符合该条 ③ 的平台限定）；但首跑踩到该条未写明的第四层——多 PATH 命中返回 `CommandInfo[]`（详见下「应登记项 1」） |

### 标准库约束

| 条目 | 判定 | 事实 |
|---|---|---|
| 候选-6 · 钉边界的断言必须配变异对照 | **遵守** | A16 用例先注入 `rlt10_fake_third_party` 变异取 RED（E-B2-002，断言如实列出越界名），随即撤销未提交；B3 薄壳同样做了假解释器/无解释器两探针 |
| 候选-45 · 变异点须在「该保护唯一负责的场景」 | **遵守** | 变异注入收集模块集合——AST 静态检查是 stdlib 边界的唯一防线，无其它层可接住；红的来源核对无误 |
| 候选-9 · 零外部依赖要靠契约测试钉死 | **遵守（精神）** | A16 正是该条倡导的「零 bare import」契约测试形态（静态、可复算、带失败清单） |

### 横向相关条目

| 条目 | 判定 | 事实 |
|---|---|---|
| 候选-2/候选-7 · oracle 不得来自被测对象（自证循环） | **遵守** | A80 的 111 ID 白名单为测试内硬编码字面量；复核者已机械比对与 design §11 第一列**完全相等**（双向差集为空），非以程序输出生成期望值 |
| 候选-1 · 每个原因码/分支都要有断言钉住 | **遵守** | A94 以 §3.5 二十规则行（非 unique ID）逐行盘点差集为空，每行触发方锁精确编号 |
| 候选-34 · 证据手抄必在独立复算时露馅 | **小规模重犯** | E-B3-004 把薄壳分项记成「`test_relay_log` 148 项 + `test_install_skill` 4 项」（实为 141+7，合计 148 对、分项错），被 check.C3 独立复跑逮到；更正按该条处方执行——E-B3-008 verbatim 复跑、历史证据不改写、复审 PASS |
| 候选-13 · 写下教训不等于教训生效 | **佐证观察** | 候选-34 尚处「待裁决」即在 RLT_10 小规模复发，给该条添一实例（记录区存在 ≠ 写证据时自动执行 verbatim 纪律） |
| 候选-50 · 外部配置路径缺省即失败 | **遵守** | 测试经 `env_for_home`/`run_cli` 注入 HOME/USERPROFILE 与 `--config-dir`，无对本机真配置的隐式依赖 |
| 候选-68/49 · 终态证据以最终提交为基线 | **遵守** | E-B3-003 为「最终版复验」；CONSTRUCTION_DONE 在全部施工 commit 落盘后发出 |

## 二、`lesson_candidates.md` 该登记未登记项评估

现状：候选表为空行；B1/B1恢复/B2/B3 各批记「本批无」，B3 附 Get-Command 多命中现场记录；F-001 明示「留在 findings 不重复包装成教训」。

| # | 级别 | 事项 | 评估 |
|---|---|---|---|
| L-1 | P3 | **Get-Command 多 PATH 命中数组化应升正式候选** | B3 首跑真踩：`Get-Command python3 -CommandType Application` 在 `/usr/bin/python3`+`/bin/python3` 双命中下返回 `CommandInfo[]`，`& <数组>` 字符串化为 `'python3 python3'` 失败；修复 `(…\|Select-Object -First 1).Source`（E-B3-003 最终版证据）。这是候选-38 探测族未写明的新机制（38 的三层之后还有「单命中假设」层），对任何「Get-Command 选解释器」的薄壳都可复用。当前仅以散文挂「本批无」行尾，不占候选行——建议登记（裁决时可并入候选-38 或独立成条） |
| L-2 | P3 | **F-001 值得登记一条预防侧候选** | 触发形可复用：「oracle 要求的行为落在 allowed-paths 闭集之外」——验收↔路径闭集自洽性缺口，属候选-4/候选-42 文档传导家族但判据不同（那两条查引用存在/目标↔口径，本条查口径↔允许路径）。本卡是流程按设计工作的正例（W 盘点提前捕获→BLOCKED→decide→用户裁决 A→合同同步→转绿），教训价值在把「计划自洽互查」固化成派活前机械检查。exec「只留 findings」的选择可辩护，但规则可迁移，建议登记候选供裁决 |
| L-3 | P3 | **E-B3-004 误记应登记为候选-34 重犯佐证** | 不需新候选（病灶已被候选-34 精确覆盖），但值得一行「重犯记录→候选-34」：分项计数凭记忆写错、复核复算逮到、verbatim 更正——完整复演该条因果链；同时可作候选-13 的实例。登记价值在裁决时给候选-34 添证据权重 |

## 三、逐条结论

- 四主题相关既有教训：**无系统性重犯**。候选-34 有一次小规模复发（证据分项误记），发现与更正路径均按该条处方执行，属于「教训仍待裁决期间的已知陷阱再踩」而非违犯已生效规则。
- 登记完整性：`lesson_candidates.md` 形式合规（各批明示「本批无」+ 现场记录），但 L-1/L-2/L-3 三事项有登记价值而未占候选行——均为 P3 级完整性建议，不构成施工缺陷。

## 结论

**APPROVE_WITH_NITS**

相关教训条目均被遵守（候选-39/82/74/38/6/45/9/2/1 逐条核对有落点证据）；唯一重犯形为候选-34 小规模复发且已按处方闭合。三条登记建议（L-1~L-3）留待教训 miner/用户裁决。本路不做验收裁决。
