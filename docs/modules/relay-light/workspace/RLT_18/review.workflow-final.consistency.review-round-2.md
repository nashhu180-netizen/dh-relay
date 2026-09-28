# RLT_18 workflow-final consistency review-round-2

2026-09-24 · reviewer#consistency-r2（fresh，未参与本卡任何施工、批审与 r1 复核）· 对象：consistency r1 整改 `4c3eef5`（HEAD `2fe613e`），核上一轮 CS-1 是否闭合、P3 未修理由是否成立、顺带改的 C2-1 与 lesson_candidates 是否一致且无新问题。基线 `origin/master`=`5ab3bba`（已漂移 `13d477b`，复核以任务钉死基线为准）。

## 结论

PASS — 无 open P0/P1。CS-1 闭合；CS-2/CS-3 未修理由成立；C2-1 与 lesson_candidates 整改忠实于原复核建议、未引入新矛盾。

## 发现

| ID | 级别 P0/P1/P2/P3 | 位置 文件:行 | 事实 | 建议整改 |
|---|---|---|---|---|
| CS-1 | 闭合 | `tools/relay-light/skill/SKILL.md:347` | 原断言「120 秒空闲上报由程序负责」已删，现文为「状态变化通知、30 秒 `get` 轮询、20 分钟 tick 由程序负责」——与 design/01 §3.6（485–489）冻结的三项程序职责逐项对应（状态变化 prompt 通知 / 每 30 秒 `herdr agent get` 轮询 / 每 20 分钟 `[relay-light] tick`），与实现常量 `WATCH_POLL_SECONDS=30`/`WATCH_TICK_SECONDS=1200`（relay_log.py:3526-3527）一致。「空闲上报」全仓零残留（仅 `test_relay_log.py:5610` 的 `assertNotIn` 防再犯断言与本卡评审/progress 记录语境命中）；其余「120 秒」命中处（SKILL.md:40 watcher 行、:333 single-task monitor 节拍、两 adapter :168/:170、dispatch/monitor.md）均为 single-task 人肉 monitor 节拍，归属正确不再自相矛盾。`test_a83_13` 已补 `assertNotIn("空闲上报")` 防再犯（r1 建议落地）。 | 无需动作。 |
| CS-2 | 维持 P3·未修成立 | `task_plan.md:68`/`:134` | 计划内文存活核仍为早期 `pgrep -f` 形态，交付 adapter 为加固形态。task_plan 属冻结计划档不回写，漂移方向为增强（`--level stage` + 排己过滤）且两次增量均经复核登记（P2-C、C1-1/`41c29ed`）——r1 判「无需动作」的理据本轮复核成立。 | 无需动作。 |
| CS-3 | 维持 P3·未修成立 | `evidence/batch-3/probe-briefs/lead-*.md:19` | 探针派单携带整改前存活核属冻结历史证据，不回改；与现行 adapter 文本不同步属时序必然。理据成立。 | 无需动作。 |

## 整改一致性核查（C2-1 / lesson_candidates）

- **C2-1（code-round2 P2，本棒顺带修）**：`HerdrClient._run`（relay_log.py:3540-3547）弃 `text=True` 改字节级 `capture_output` + `stdout.decode("utf-8", errors="replace")`——正是原复核建议的首选方案，且与本仓 `_git_readonly`（:874-888）字节级惯例对齐；非 UTF-8 字节 → replace → `json.loads` 失败 → `_agent_status` 返回 None（失聪但线程不死，C1-2 屏障语义不变），UnicodeDecodeError 路径消除。`fetch_baseline_text`（test_relay_log.py:8549-8566）的 `git fetch`/`git show` 同步去 `text=True`、`blob.stdout.decode("utf-8")` 严格解码——坏基线显见 UnicodeDecodeError（test error）而非 mojibake 空洞通过，与建议一致。`cat-file -e` 两call本就无 `text=True`、stdout 未消费，无遗漏。新增 `test_c2_1_herdr_client_reads_bytes_decodes_utf8`/`test_c2_1_baseline_fetch_reads_bytes_decodes_utf8` 断言 `text`/`encoding` kwarg 缺席 + 行为两端（UTF-8 正常解析 / 坏字节后果），red.txt 证实三新断言在旧实现上 FAILED（RED 有效）。
- **lesson_candidates（LES-1/3/4，lesson 路 P2+P3）**：①LES-1 新增「已知候选复发登记」表，L-R1 记候选-34 于 batch-3 F-1~F-8 复发——候选-34 原文已核（`docs/modules/dh-relay/knowledge/教训库-候选.md:282`，行为流程，手抄转录主题一致），复发事实与 check.batch-3.md F-1~F-8、整改 `e144dac`、round-2 PASS 逐条相符；②LES-3 骨架残句「plan 阶段暂无候选」已删；③LES-4 全条补分类列（编码陷阱/领域知识/行为流程，与 footer 字段口径一致）、证据引用改 repo-relative 全路径、L-03 幻 PID 运行期细节删减为「幻 PID」。LES-2 未动理由（dispatch README/task_plan 措辞统一属 orchestrator 域）成立。
- **progress.md**：wf2 里程碑与 E-407~E-411 证据行与 diff/证据文件逐字相符（red 3 failures / green 68 / regression 285 / pwsh ALL PASS / 路径审计），P3 未修逐条理由已登记；sole-writer 约定满足（remediation coder 自写一条 wf 里程碑，同 wf 前例）。
- **范围纪律**：path-audit.txt 证实变更仅 `relay_log.py`/`test_relay_log.py`/`SKILL.md`/`lesson_candidates.md` + 本批证据 + progress，全在允许路径闭集；SKILL.md vs 上一提交恰 1 hunk（:347），UD-2 另两处零改；design/、adapter、execution_strategy 未动。

## 核查范围与方法

- **CS-1 四面核对**：SKILL.md:347 现文逐字读；design/01 §3.6（480–491）三项冻结行为比对；实现常量与 `run_watch`/HerdrClient 消费路径（`wait`/`get`/`prompt`→`_run`→`_agent_status`，签名 `tuple[int, str]` 不变）走读；两 adapter 无该职责枚举句、watch 调用/重启循环/存活核未改（本棒 `git diff 691d7d1..HEAD` 两 adapter 零 hunk）。
- **残留扫描**：`grep -rn "空闲上报" tools/ docs/` → 交付面零命中（仅断言与评审语境）；`grep "120 秒"` 全部命中逐处归属核对；`grep "text=True"` relay_log.py 零命中（生产侧 `_git_readonly`/HerdrClient 均字节级）。
- **证据↔raw**：green.txt 68 tests OK 与本棒独立复跑（`cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.WatchTests test_relay_log.SkillAdapterTests test_relay_log.SkillCoreDocTests` → 68 OK，4.006s）一致；red.txt 三条失败均为新断言在旧实现的预期失败；regression-python.txt 285=266+19 与 r1 的 283=264+19 +2 新用例自洽；regression-pwsh.txt RELAY ALL PASS（SKIPPED:1 基线豁免同前）。
- **计数自洽**：focused 68 = WatchTests 42 + SkillAdapterTests 14 + SkillCoreDocTests 12（r1 的 66 + 本棒 2 新 C2-1 用例）。
- **preflight**：`env | grep '^RELAY_'` → 无任何 `RELAY_*`（RELAY_RECEIPT 缺席），按正常 single-task 流程执行；`__pycache__`/`*.pyc` 审计空（`git status --porcelain --ignored` + `find` 双查）；`git status` 工作树干净，整改已落 `4c3eef5`+`2fe613e`。

## 范围外发现

- `test_relay_log.py` 其余 `text=True` 调用点（`run_cli` :195、`test_c1_1` pgrep :6509/:6520/:6532、A158 族 :7986/:8011/:8038）与 C2-1 同族但不在其登记范围，属存量口径非本棒新引入；CI `relay-light-python` 仅 ubuntu-latest（UTF-8 locale），非活雷。若下张卡收口跨平台测试口径可一并核。
- `origin/master` 漂移 `13d477b`（含 `13d477b` 本卡的 SKILL 触发条件修订 #67）——收口 rebase/合入属 orchestrator 与用户闸门。
- F-008（第二条 `coder#1 -> done` 来源未定）维持悬置登记，不属本路。
