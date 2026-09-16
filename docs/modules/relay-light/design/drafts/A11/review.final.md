<!-- dh:v1 · R 开发后复核；只读核验，不代表验收、verify、D-start 或远端动作授权。 -->
# RLT-A-11 · R 开发后复核与机械核验（review.final）

- 复核人：reviewer2#1（fresh，未参与本事件任何起草/审核）；日期：2026-09-16
- 对象：`git diff origin/master`（基线 `bd118f6`）下的 design/01、DevPlan 与新建 `design/evidence/11-交叉审核记录-RLT-A11-产物兜底与验收续发.md`；C2-audit 报告 `review.promotion.md`（APPROVE）作参考，本报告全部结论均由本棒独立重跑/独立比对得出
- 合同：Issue #37 正文（含【扩界】子条与「扩界记录」节，`gh issue view 37` 实测）、`dispatch/README.md` 允许路径、`task_plan.md` R 节、`decisions.md` O-001～O-005、`decision.1.md` 批准逐字文本

## 结论

**APPROVE**。R 节全部机械脚本原样执行通过；Issue #37 验收口径（含扩界条）逐条 PASS；A151～A158 归属、总账算术、20 词口径、H10 不动、RLT_24 allowed-paths 逐字不变、路径与夹带检查、单测回归全部成立。P1=0，P2=1（progress.md 两条 DONE 时间戳倒挂，属记录异常，不影响实质）。本结论不代替 PR/CI/合并、verify 或人验。

## 逐项意见

| 编号 | 级别(P1/P2) | 位置（文件:行/节） | 问题 | 依据 | 整改动作 |
|---|---|---|---|---|---|
| R-1 | P2 | `drafts/A11/progress.md:302,306` | C2 DONE 记 `ts=23:58`、C2-audit DONE 记 `ts=23:40` 且位于其后——audit 声称完成早于 coder 收口，时序倒挂。实质核验不受影响：audit 报告所引行号与脚本输出（`PROMOTE` 24 MATCH、`EVIDENCE_…_OK 6 5 24`、R 脚本 OK）只能在晋级后文件上成立，本棒重跑结果逐字一致，证明 audit 核验的即当前状态。 | progress.md DONE 记录；本棒重跑 R 机械脚本与共用完整性脚本均退出 0 | 无需整改；建议编排知悉 DONE 时间戳填写口径（开工 ts vs 收口 ts） |

### ① R 节机械脚本原样执行（命令 / 退出码 / 输出摘要）

| # | 命令（task_plan.md R 节原样） | 退出码 | 输出摘要 |
|---|---|---|---|
| 1 | R 节 python3 机械脚本（L260-348，含 A2 精确例外、按卡验收行、20 词四处一致、allowed-paths 守门与全部内存反例） | 0 | `A2_EXACT_EXCEPTION_CARD_OWNER_20_WORDS_AND_RLT24_SCOPE_OK ['HC-RL-A151'..'HC-RL-A158']` |
| 2 | `rg -n '20 个|20 词' "$D"` | 0 | 7 命中：L21 修订行、L99 §1.3、L237 §3.3、L299 §3.4 批准新句、L1198 总账、L1210 A2 行、L1427 §15 |
| 3 | `git diff --stat` | 0 | 2 files changed, 61 insertions(+), 17 deletions(-)（design/01、DevPlan） |
| 4 | `git ls-files --others --exclude-standard` | 0 | 19 项：drafts/A11/** 18 份 + 新建 evidence/11 一份 |
| 5 | `git diff --check` | 0 | 无输出 |
| 6 | planning-event 目标核验：`test -f` evidence/11 + `rg -q` 两锚点 | 0 | 文件存在；`<a id="review-rlt-a11">` @L15、`<a id="understanding-rlt-a11">` @L50 |
| 7 | C2/C2-audit 共用完整性脚本（L130-211，本棒独立重跑） | 0 | `EVIDENCE_STRUCTURE_AND_FOUR_DELETION_PROBES_OK 6 5 24`；四种内存删项反例均拒 |
| 8 | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log` | 0 | `Ran 203 tests in 735.904s — OK`；跑前跑后 `find tools -name '__pycache__' -o -name '*.pyc'` 均空（无新增） |

### ② Issue #37 验收口径逐条（含【扩界】条）

| # | Issue 验收条 | 判定 | 证据 |
|---|---|---|---|
| A | §12 表含兜底类行，且与真计划实际产出清单对照无遗漏类别 | PASS | design/01 L1370 兜底行在表尾；`git ls-files` 实测 monitor-*=6、RLT_21 done.*=15、RLT_12 evidence=4；候选 §1.1 清单 8+29+14=51 路径逐类映射，未点名三类（派单/done 等工作区文件/evidence 目录）恰由兜底行承接 |
| B | 职责分层口径落盘并回链 `HC-RL-H10`，措辞能让后续做 H10 人判的人拿对尺子 | PASS | §12 末段（L1374）落「账本=接力现场 / workspace+git+Issue=施工现场」，显式回链 `HC-RL-H10` 并给人判尺子（「只凭账本能否还原接力现场」），`commit=` 定位顺手旁注、squash 失效不破约 |
| C | A151~ 续发的验收 ID 在包内唯一、无复用，且被 RLT_23/RLT_24 卡片正确引用 | PASS | 脚本断言新增 ID 恰为 A151～A158 连续、AI/H 表内无重复；候选 OWNER 清单 8 行与新增集合精确相等；DevPlan RLT_23（L438）逐 ID 列 A151～A154、RLT_24（L453）逐 ID 列 A155～A158，删除反例被拒 |
| D | 文件头新增可解析 `dh:planning-event:v1 id=RLT-A-11 stage=A-adjust` 声明并附审核回链 | PASS | design/01 L8 声明行含 id/stage/artifact/review/understanding 字段，与 L6/L7 先例格式同构；`review=`/`understanding=` 锚点均在 evidence/11 实定位（L15/L50），且 evidence 含 `dh:planning-evidence:v1 event=RLT-A-11`（L17） |
| E | 机械核验：验收 ID 行集合相对 master 只增不改；【扩界】A2 唯一例外（原 A2 与基线逐字一致、新 A2 与批准行逐字一致、其余旧行含 H10 逐字不变） | PASS | 脚本实测：master 原 A2 与冻结基线逐字一致、新 A2 与 `decision.1.md` §1.3 批准行逐字一致、其余全部旧行逐字未变；「改他行」「A2 写歪」两类反例均被拒 |
| F | 【扩界】RLT_24 卡合同同步（目标/非目标/变更范围三句改写为「实现并验证已冻结设计」；allowed-paths 行逐字不变） | PASS | DevPlan L450/452/454 三句均已改写且与 master 不同；`allowed()` 整段（允许路径行 + 三条路径）与 master 逐字相同，未加 design/01 |

### ③ 一致性逐项

- **A151～A158 ↔ 两卡「验收口径」行**：逐 ID 对照通过（脚本 + 目视：RLT_23 行含且仅含 A151/152/153/154；RLT_24 行含且仅含 A155/156/157/158）。
- **§11 总账 148 算术**：实测表行 AI=133、H=15、合计 148 = 旧 140 + 新增 8（A2 保号替换不增条目）；沿革句逐件登记 A-06/A-08/A-09/A-11。
- **§15 沿革**：L1427「验收 ID 稳定性」行含 RLT-A-11 续发与 A2 修订例外句，退役清单不增。
- **§12**：兜底行（L1370）、职责分层段（L1374 含 H10 回链）、两类终端空间「删失败怎么办」两格（L1367–1368，逐字=decision.1 §2.4 提案）均在位。
- **20 词口径**：§1.3（L99）、§3.3（L237）、§3.4（L257 新控制事件行 + L299 批准沿革句 + L301 wire format 段）、A2（L1210）互洽；§3.4 无「仍是那 19 个词」残留（旧句残留反例被拒）；全文 `19 个/19 词` 仅存 3 处且均限定（L301「当前实现仍为 19 词」、L320「A85…19 词时代口径」、L1210「原 19 词加…」）。控制事件 10 + agent 事件 10 = 20，计数成立。
- **planning-event 声明**：可解析且 review=/understanding= 锚点在 evidence/11 可定位（见①#6）。
- **RLT_24 allowed-paths**：与 master 逐字相同（脚本断言 + diff 复核）。

### ④ 不误述两卡状态

DevPlan 任务表 RLT_23（L112）、RLT_24（L113）仍为「未开始」；B-012「下一步」句与 B-011 调整条均写「收口前 RLT_23/RLT_24 不开工」；evidence/11 §五停止线明写「不代表 D-start/验收/verify、A151～A158 单测尚未编写运行、当前实现仍为 19 词」。无把规划完成写成已开工/已验收/已 verify 的表述。

### ⑤ 夹带与路径

`git status --short`：`M` design/01、`M` DevPlan、`??` drafts/A11/、`??` evidence/11 一份——全命中 dispatch 允许路径四类，无越界。`git diff --unified=0` 全量 hunk 逐条归属候选 B-block：design/01 仅文件头（L8/10/21）、§1.3（L99）、§3.2（L221）、§3.3（L237）、§3.4（L257/299–328）、§11（L1198/1210/1331–1338）、§12（L1367–1374）、§15（L1427）；DevPlan 仅顶部下一步句（L21）、RLT-A-11 调整条（L49）、两卡验收口径行（L438/453）与 RLT_24 三句（L450/452/454）。无多余路径或 hunk。

### ⑥ 实现未改回归

`test_relay_log`：203 用例全过、735.904s、OK（本事件未改 `tools/` 一字节，`git diff` 与 untracked 清单均不含代码路径）；`PYTHONDONTWRITEBYTECODE=1` 生效，跑前跑后 `__pycache__`/`*.pyc` 均为零。

## 范围外发现

无新增。`findings.md` 已登记 W1-F-001（RLT_24 未来路径合同口径）、C1c-F-001（A85/A68/A89 枚举陈旧，留后续规划事件）、C1c-F-002（DevPlan 历史卡「19 词」原样保留）——三项均为有意保留的已知事项，本事件不处理。

> 停止线：本 APPROVE 仅为 R 节点开发后复核结论；不等于 D-start、PR 创建、CI 通过、合并、verify、验收或 RLT_23/RLT_24 开工。
