# review.requirement — RLT_24 开发后复核 · 需求方向

复核人：rlt24-review2（devin swe-2-max，fresh，非施工者）· node=R2
判据来源：`dispatch/R-review-requirement.md`；oracle 原文逐字以 design/01 §3.2 L221、§3.4 L257/L301–328、§11.1 L1210/L1335–1338、§12 L1367–1368 与 DevPlan「#### RLT_24」L448–462 为准。

## 结论

APPROVE（P1=0，P2=0）

## 逐条判据

| # | 判据 | 结论 | 级别 | 依据（文件:行 / 命令输出） | 整改动作 |
|---|---|---|---|---|---|
| 1 | 问题是否真被解决（F-004：关失败无处可写、无发现手段） | PASS | — | `resource_close` 为第 20 事件词且属控制事件（`relay_log.py:31-59`：`EVENTS` 实测长度 20、在 `CONTROL_EVENTS`、不在 `AGENT_EVENTS`）。失败关闭可写可定位的 §12 链路我独立复跑通过：fixture 账本 seq4/seq5 两条 `outcome=failed reason=herdr%20workspace_not_found` 行 lint 0、按 seq 与解码 `object_id` 各唯一命中（见复跑记录 R-1/R-2）。写入者归属实跑：`monitor#1` 写 `object_type=pane` rc=0、`orchestrator#1` 写 `pane` 被 `HC-RL-A85` 退 2（R-4）。已裁决口径变化：`decisions.md` 第 1 行把「编排空间→F 首节点」降为写入者纪律，C4 以 seq5@F1 实证执行；设计正文与 wire format 未改。此为已知残余风险（decisions.md 自记），不影响「可写、可定位、可取证」主命题成立。 | 无 |
| 2 | A157 取证可信（两类空间各一例、实跑/打桩标注、失败行合法、检索真实、处置不冒称、零误触） | PASS | — | `evidence/A157-stage-workspace.md` 与 `A157-orchestrator-workspace.md` 各一例、均明确标注**实跑**；原始 stderr（`evidence/raw/herdr-close-*.stderr.txt`）为真实 `workspace_not_found` JSON。fixture 账本合法性我重跑 `lint` rc=0 `lint: ok`（R-1）。seq/object_id 检索我自行脚本复跑：seq4↔`rlt24-c4-stage-probe`@C1、seq5↔`rlt24-c4-orch-probe`@F1，各恰一行（R-2）。处置两例均写「待人工处理」，无冒称已处置。我重跑 `herdr workspace list` 现仍为同一组 6 个在用 id（w15/w2B/w2C/w2E/w2F/w2G），探针 id 不在其中，零误触声明与现场一致（R-5）。阶段空间记 C1（C#1 首有效节点）、编排空间记 F1（F#1 首有效节点）的写入者纪律对应关系可由 `evidence/fixture/relay_plan.md` 节点表逐行核出。 | 无 |
| 3 | A158 兼容证据（71 行字节不变、新实现 lint 0、与旧实现 status --json 稳定字段一致） | PASS | — | 我复跑：`sha256sum` 工作区账本与 `git show master:` 版本同为 `3cd08fdc…40b`，71 行（R-6）。新实现对 `rlt12-win-01` lint rc=0 `lint: ok`（R-7）。旧实现（`git show master:` 物化 `/tmp/rlt24-req-review/relay_log_base.py`）与新实现对同一份复制计划各跑 `status --json` 均 rc=0：键集合双向差为空、逐字段比较零差异，唯一排除键 `agents[].idle_seconds` 两侧对称存在（R-8）。 | 无 |
| 4 | 非目标守住（不改设计/DevPlan/skill/herdr、不补记历史账本、不扩资源类型、不新增 status --json 字段） | PASS | — | `git diff master --name-only` 仅 `tools/relay-light/relay_log.py`、`test_relay_log.py`、`workspace/RLT_24/**`；对 design/、dev_plan/、skill/、install_skill.py、as-built/、`relay/**` 的 diff --stat 为空；历史账本 sha256 同 master（R-6/R-9）。`CLOSE_OBJECT_TYPES={workspace,pane,worktree}`、`CLOSE_OUTCOMES={ok,failed}`（`relay_log.py:105-106`），无新增资源类型。status --json 键集与 master 实现完全相等（R-8），未新增字段。 | 无 |
| 5 | 验收 ID 映射（A2/A155～A158 各有可核验证据指针，不以「设计已冻结」冒充「已实现」） | PASS | — | A2→E-C1-03（`test_a2_all_twenty_events_in_legal_runtime_contexts`，我复跑 ok）；A155→E-C1-01/02（8 用例我复跑全 ok）；A156→E-C2-01/02（2 用例复跑 ok，另我用全新输入直跑 CLI：`failed` 缺 reason 与 `ok` 带 reason 各退 2 且账本字节不变，R-3）；A157→E-C4-01..05 + evidence 两件（lint/检索/herdr list 我均复跑）；A158→E-C3-01..04 + 3 用例（我复跑 ok，89.5s 14 用例全 OK）。无「冻结当实现」的空头指针。 | 无 |

## 复跑记录

| # | 命令 | 结果 |
|---|---|---|
| R-1 | `python3 tools/relay-light/relay_log.py lint --plan docs/modules/relay-light/workspace/RLT_24/evidence/fixture --config-dir tools/relay-light/skill` | rc=0，`lint: ok` |
| R-2 | 自写脚本逐行解析 `evidence/fixture/relay_log.jsonl`，按 seq 与 `urllib.parse.unquote` 解码 `object_id` 双向检索 | seq4→`rlt24-c4-stage-probe`@C1、seq5→`rlt24-c4-orch-probe`@F1，各恰命中 1 行 |
| R-3 | /tmp 复制 fixture 上直跑 `add resource_close`：`outcome=failed` 无 `reason`、`outcome=ok` 带 `reason` | 各 rc=2 `HC-RL-A156`，前后账本 sha256 `afeae931…` 不变 |
| R-4 | 同上：`monitor#1` 写 `object_type=pane outcome=ok`；`orchestrator#1` 写 `pane` | rc=0；rc=2 `HC-RL-A85`（writer 归属正确） |
| R-5 | `herdr workspace list`（只读） | 在用 id 仍为 w15/w2B/w2C/w2E/w2F/w2G 六个，与证据声明一致，探针 id 不在其中 |
| R-6 | `sha256sum docs/modules/relay-light/relay/rlt12-win-01/relay_log.jsonl` 与 `git show master:…` | 同为 `3cd08fdc88e9d51be16997ad9dc1bd92fc89f3c00796345e0a0b3a229a5ed40b`，71 行 |
| R-7 | `lint --plan docs/modules/relay-light/relay/rlt12-win-01`（新实现） | rc=0，`lint: ok` |
| R-8 | `git show master:tools/relay-light/relay_log.py`→`/tmp/rlt24-req-review/`；旧/新实现对同一 rlt12-win-01 副本各跑 `status --json`，脚本比键集与逐字段 | 均 rc=0；键集双向差为空；稳定字段零差异（唯一排除 `agents[].idle_seconds`，两侧对称） |
| R-9 | `git status --porcelain`；`find tools/relay-light -name __pycache__ -o -name "*.pyc"`；对禁改目录 `git diff master --stat` | 全部为空/干净 |
| R-10 | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayResourceCloseTests test_relay_log.RelayResourceCloseBackwardCompatTests` | Ran 14 tests，OK（89.5s） |

所有命令均带 `PYTHONDONTWRITEBYTECODE=1`；临时文件在 `/tmp/rlt24-req-review/`，未入仓。

## 范围外发现

- F-C1-01 已在 findings.md 登记且仍 open：skill（SKILL.md/adapter）与 as-built 未收录 `resource_close`，属本卡允许路径之外的转派项，收口时须由编排评估派单同步——本路只复核不施工，此记为范围外遗留。
- 「编排空间→F 首有效节点」的机器校验缺口经 `decisions.md` 第 1 行用户裁决降为写入者纪律；design/01 §3.4 L257 措辞与实现可计算边界之间的字面差已在 decisions.md 记为已知风险，若后续复核/验收要求设计层对齐，需另起 A 事件，非本卡范围。

## X1 定向回核

复核人：rlt24-review2（devin swe-2-max，fresh，非施工者）· node=X1 · 范围 `git diff 407b4c0..5551624`（代码轮 1 REVISE 引发的返工），按 review.md「三路并行说明」对差异定向回核，不沿用返工前结论。

结论：**APPROVE**（P1=0，P2=0）

| # | 回核判据 | 结论 | 依据（文件:行 / 命令输出） |
|---|---|---|---|
| X1-1 | A158 需求证明力保持或增强：基线不再随 master 漂移，CI 门禁环境仍可取证，失败不静默 skip | PASS（增强） | `test_relay_log.py` 新 `baseline_impl()`：`BASELINE_SHA=b41cd2d9e48814c93352f969a085971a60546565`——我实测该 SHA 同时等于本地 `master`、`origin/master` 与 `git merge-base HEAD master`，即 dispatch/README L12 钉的本卡基线；`git show <sha>:tools/relay-light/relay_log.py | grep -c resource_close`=0，基线确为旧实现，非自我比较。取基线链路 `cat-file -e` 探测 → `git fetch --depth=1 origin <sha>` → `git show <sha>:<path>`；fetch 仍不可得时 `self.fail` 带 fetch rc 与 stderr 摘要，无 skip 路径（`test_relay_log.py:7720-7750`）。钉死 SHA 同时闭合 R1 的 P2：本卡合入后 master 含 `resource_close`，若仍以 `master` 为名取基线必退化为自我比较——固定 SHA 使比较对象永久留在 19 词时代，证明力不随 master 前移而衰减。CI 侧证明力由 `evidence/X1-ci-shallow-clone.md` 逐字记录支撑（见复跑记录 X1-R2 复核）。 |
| X1-2 | 非目标与允许路径仍守住 | PASS | `git diff 407b4c0..5551624 --name-only` 仅 `test_relay_log.py` + `workspace/RLT_24/{evidence/X1-ci-shallow-clone.md,findings.md,lesson_candidates.md,progress.md}`，全在允许闭集；X1 零改动 `relay_log.py`（无新增 `status --json` 字段之虞）。全分支 `git diff master --name-only` 仍仅 `relay_log.py`/`test_relay_log.py`/`workspace/RLT_24/**`；rlt12-win-01 账本 sha256 复跑=`3cd08fdc…40b` 不变；`find tools/relay-light -name __pycache__ -o -name '*.pyc'` 空、`git status --porcelain` 干净（X1-R1）。 |
| X1-3 | X1 证据可信（实跑/非假绿） | PASS | `evidence/X1-ci-shallow-clone.md` 逐字记录 `/tmp/rlt24-ci-sim` 复刻 `actions/checkout@v4` 形态：`fetch --depth=1`+detached FETCH_HEAD、`rev-list --count HEAD`=1、`master`/`origin/master`/基线对象均 rc=128（P1 故障原样复现）；覆盖 X1 版测试文件后 3/3 OK，且跑后 `.git/shallow` 增含 `b41cd2d`、`cat-file -t` =commit——证明走的是测试内 fetch 回退路径而非对象碰巧在库的假绿。findings.md X1 节诚实登记残余边界：本地路径型 origin 在基线 SHA 不再是 ref 尖后默认拒发按 SHA fetch，此时测试 `self.fail` 响报而非假绿——CI（GitHub，allowReachableSHA1InWant + 基线恒为 master 可达祖先）无障碍，残余边界仅影响假想的「本地路径 origin + 基线非尖」场景，不构成缺陷。 |

### 复跑记录（X1）

| # | 命令 | 结果 |
|---|---|---|
| X1-R1 | `git rev-parse master` / `origin/master` / `git merge-base HEAD master`；`git show b41cd2d:…/relay_log.py \| grep -c resource_close`；`git cat-file -e <sha>:<path>`；`sha256sum rlt12-win-01/relay_log.jsonl`；`git diff --name-only 407b4c0..5551624` 与 `git diff master --name-only`；`find … __pycache__`；`git status --porcelain` | 三者同=`b41cd2d…`；基线 `resource_close` 计数 0；对象在库 rc=0；账本 sha256=`3cd08fdc…40b` 不变；X1 diff 与全分支 diff 均不出允许路径；无 `__pycache__`；porcelain 干净 |
| X1-R2 | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayResourceCloseBackwardCompatTests`（定向，不重跑全量） | 退出 0，`Ran 3 tests in 16.209s` **OK**——本地对象在库走 `cat-file -e` 直通路径 |

所有命令均带 `PYTHONDONTWRITEBYTECODE=1`；未写任何临时文件入仓。
