# RLT_18 workflow-final lesson review-round-1

2026-09-25 · reviewer#lesson-r1（fresh，未参与本卡施工与任何批审）· 审查对象：`git diff origin/master...HEAD`（基线 `5ab3bba`，HEAD `691d7d1`）· 对应 `dispatch/workflow-final.md` lesson 路：对照 `docs/modules/relay-light/knowledge/`（若存在）、`docs/modules/dh-relay/knowledge/教训库-候选.md` 与本卡 `lesson_candidates.md`，判已知坑复发与新教训登记。

## 结论

PASS — 无 open P0/P1。五个点名已知坑中：三个零复发且按既有纪律正确执行（CI 浅克隆基线、dotted 单测入口、后台进程回收/残留）；一个以新形态复发一次并被批内复核当场捕获闭合（`__pycache__`）；一个（prompt 排队）以 Claude 侧变体出现并已登记为候选 L-04。本卡新暴露教训 L-01~L-04 已登记、表述可复用，L-03 随整改提交保鲜为示范做法。发现 1 条 P2（候选-34 级复发未在教训账留痕）与 3 条 P3，均为可补强的登记/格式项，不阻塞。

## 发现

| ID | 级别 P0/P1/P2/P3 | 位置 文件:行 | 事实 | 建议整改 |
|---|---|---|---|---|
| LES-1 | P2 | `lesson_candidates.md`（缺登记）；复发现场 `check.batch-3.md` F-1~F-8、`check.batch-2.md` O-2 | dh-relay 教训**候选-34**「证据转录必须由脚本现场采集写入，不得手抄/摘要——手抄在独立复核复算时才会露馅」在本卡 batch-3 以完整形态复发：批三初审 FAIL 的 F-1~F-8 共 8 条全部是手工转录与 raw 的偏差——被 poll log 证伪的「短暂 h12-stage python 08:08:30/08:08:50 存在」断言、无据时刻「08:12:14」「8:57」、引文失真「3m 14s」（raw 实为 3m 35s）、行级引用错位、「排队形态」无留存直接证据；batch-2 O-2 的证据头日期笔误（标 2026-09-25、实生成于 2026-09-24）同族。整改 `e144dac` 后文字已与 raw 逐字一致（round-2 PASS），但 `lesson_candidates.md` 未把这轮复发登记为候选-34 的复发实例——按 miner「撞本区跳过」规则不另立 L-xx 是对的，然而复发信号（对候选-34 升格属加权证据）在本卡教训账上零记录。 | 在 `lesson_candidates.md` 加一行复发注记（例：「L-R1：候选-34 于 batch-3 证据转录复发，8 条见 check.batch-3 F-1~F-8，整改 e144dac」），供 miner 聚合；后续同类卡教训账建议固定设「已知候选复发登记」位。 |
| LES-2 | P3 | `lesson_candidates.md`（缺登记）；现场 `check.batch-1.md` P1-1、`progress.md` E-106；措辞差 `dispatch/README.md` vs `task_plan.md` §1.3 | 已知坑「`__pycache__` 不得新增」复发 1 次：batch-1 一次未登记 `python3 -c` AST sanity 探针未带 `PYTHONDONTWRITEBYTECODE=1`，import 编译生成 `tools/relay-light/__pycache__/`，被 §1.1 审计第 4 条捕获并整改闭合（`b6bd264`）。措辞口径有出入：`task_plan` §1.3 写「每条命令带」、dispatch README 写「每条测试命令带」——按前者口径该探针本在字面内仍漏执行（候选-13「写下不等于生效」形态），按后者口径是规则范围缺口（一次性探针非测试命令）。两种读法指向同一补强点，但教训账无登记。本棒复核当前树：`git status --porcelain --ignored` 与 `find` 均无 `__pycache__`/`*.pyc`，无遗留。 | 择一：① `lesson_candidates.md` 加候选 L-05「每条 python 调用（含一次性 `-c`/`-m` 探针）都带 `PYTHONDONTWRITEBYTECODE=1`，不只测试命令」；② orchestrator 在下张卡 dispatch 环境事实把措辞统一为「每条 python 调用」并消 README/task_plan 措辞差。 |
| LES-3 | P3 | `lesson_candidates.md:13` | 文件末行残留 builder 骨架期模板句「plan 阶段暂无候选」，与上方已登记的 L-01~L-04 直接矛盾。 | 删除或改写为现况表述。 |
| LES-4 | P3 | `lesson_candidates.md:6-11` | footer 字段口径声明含「分类」，L-01~L-04 均无分类标签（编码陷阱/行为流程/领域知识等）；footer 要求「证据一律 repo-relative」，L-02 引「red.txt」、L-03 引「raw/pgrep-selfmatch.txt」「evidence/workflow-final-remediation-1」均为 workspace 相对路径而非 repo-relative，L-03 正文内嵌 pane 应答原文（含幻 PID 3787534）贴 footer「不抄 pane/mtime/运行日志细节」边界。注：既往卡（DHR_30 等）同用三列表格、分类亦非强制列，故按 P3 不按违约处理。 | 补分类标签；证据引用改 repo-relative 全路径或在文件头注明「路径相对本工作区」；L-03 的 pane 引句属触发现场本体可保留，运行期细节（PID）可删减。 |

## 已知坑复发核查（逐项）

| 已知坑（来源） | 判定 | 依据 |
|---|---|---|
| CI 浅克隆基线（README 环境事实④：钉 SHA + `cat-file -e` + `git fetch --depth=1` 兜底 + 失败 `self.fail` 不 skip） | **未复发——按纪律正确实现** | `test_relay_log.py:8533-8560` `fetch_baseline_text`（钉 `RLT18_BASELINE_SHA="5ab3bba"`、探测、fetch 兜底、返回 None）；两调用点 `:5612`（SKILL UD-2 基线 RED）与 `:6408`（adapter 基线 RED）均 `self.fail` 非 skip |
| `__pycache__` / PYTHONDONTWRITEBYTECODE | **复发 1 次（新形态），批内捕获闭合** | 见 LES-2；本棒实测当前树为空 |
| dotted 单测入口 | **未复发** | 全部证据命令为 `cd tools/relay-light && python3 -m unittest test_relay_log[.Class]` 或 `discover -s . -p 'test_*.py'`（E-101~106/E-201~205/E-305/E-401~406） |
| prompt 排队（`herdr-派活操作.md` codex 侧既有记录） | **以 Claude 侧变体出现，已登记** | L-04：claude 侧为「排队预览 `❯` 按序处理＝排队即送达」，与 codex 侧「滞留输入框不提交需 send-keys enter」语义不同，属互补非重复登记；orch ghost tick 同族现象已如实记异常 |
| 后台进程回收 / 进程残留 | **未复发为缺陷；实测暴露的存活核缺陷已登记** | L-03（pgrep `-f` 自匹配，含落地写法、Windows 对称、`test_c1_1` 真进程三段实测 `evidence/workflow-final-remediation-1/`）；探针 tab/watch 进程零残留（check.batch-3 #7、E-305、`raw/cleanup-verify.txt`） |
| 打桩纪律（herdr/时钟一律打桩、不真 sleep） | **未违犯** | `FakeHerdr` 脚本化、`FakeClock` 离散事件调度，全套件 <30s；`test_c1_1`（`test_relay_log.py:6494-6536`）用真 pgrep 属机制实测（`skipUnless` linux+pgrep 存在），打桩对象（herdr/时钟）不在其内，carrier `sleep 5` 是夹具进程非测试等待 |
| 其他候选条抽检（候选-13/27/34/49/52/64/65/68/88/89/90） | **候选-34 复发（LES-1）；候选-13 以 LES-2 小形态再现；候选-52 被遵守；其余未见相关形态** | 候选-52「派活事故落账」：batch-3 的 codex 模型切换、ghost tick、pane 原文未保存均如实记入 evidence/findings——该教训实际被执行；候选-65「派单不写死复核基线」：workflow-final 派单钉 diff 基线 `5ab3bba` 而以 HEAD 为审侧、两路复核自报 HEAD（r1 `eef097e`/r2 `5a1b216`），相符 |

## 新教训登记核查（`lesson_candidates.md` L-01~L-04）

| 候选 | 触发现场（git log 核落盘批次） | 表述可复用性 | 判定 |
|---|---|---|---|
| L-01 终态过滤 | batch-1（`4b4b95c`）`_watch_present_agents` | 规则「读投影先过滤终态再消费」+ 不做的后果（给已结束实例再开线程）明确 | 合格 |
| L-02 FakeClock 双坑 | batch-2（`0f9686f`）`test_a83_1`/`12c`/`12d` 红漂移 | 两条可操作规则（用例先 `advance_to(0)` 锚定、重试落点按执行时刻+sleep 推算） | 合格 |
| L-03 pgrep 自匹配 | batch-3（`fe1cf00`）H12-② 实跑 + driver 复现 | 触发机制、落地写法、Windows 对称写法、实测证据（`pgrep-self-exclusion.txt`）齐全；整改 `41c29ed` 同步改写候选把修复形态写进教训——**教训随整改保鲜，示范做法** | 优秀 |
| L-04 Claude 探针行为 | batch-3（`fe1cf00`）H11/H12 各 pane | 两条实测行为 + 探针设计规则（排队即送达、勿把输入框 `❯` 当未送达） | 合格 |

**未登记缺口** = 发现 LES-1/LES-2。另两项评估为不够成条、维持现状合理：codex 会话模型中途切换（GPT-5.6-Sol→GPT-6-Luna，来源未定，evidence 已记异常）；`FakeClock.enter` 线程 ident 复用隐身修复（`41c29ed`，与 L-02 同族可并入，不另立）。

## 核查范围与方法

- preflight：`env | grep RELAY` → 无任何 `RELAY_*`，按正常 single-task 流程执行。
- 对照集：`docs/modules/relay-light/knowledge/`（本棒确认不存在）；`docs/modules/dh-relay/knowledge/教训库-候选.md` 候选-1~90 全读，重点核与本卡相关条（候选-13 写下不等于生效、-27 时钟、-31/-48 绿结论条件、-34 手抄转录、-49/-68 终态证据、-52 派活事故落账、-64/-65/-67 派活闭环、-88 等待须有接收者、-89/-90 撞名分层）；`herdr-派活操作.md` 与 `主控派活备忘-20260902.md` 中 prompt 排队既有记录用于 L-04 判重；本卡 `lesson_candidates.md` 全文 + `git log -p` 核各条落盘批次与 `41c29ed` 的 L-03 保鲜改写。
- 复发核查：`check.batch-1/2/3.md`、`progress.md` 证据账本、`findings.md`、各批 evidence 命令行（PYTHONDONTWRITEBYTECODE 出现率）、`task_plan.md` §1.3 测试纪律、`test_relay_log.py` 基线获取实现（`:8533-8560`）与两处调用点、`test_c1_1` 真进程测试。
- 本棒实测：`git status --porcelain --ignored | grep __pycache__` → 空；`find` 全树无 `__pycache__`/`*.pyc`。
- 边界：不重复 code-round1 职责——其实现级结论（C1-1/C1-2 闭合、`41c29ed`）仅作 L-03 登记完整性的输入采信；既往卡格式惯例抽核 `DHR_30/lesson_candidates.md`。

## 范围外发现

- `origin/master` 已漂移至 `13d477b`（`evidence/workflow-final-remediation-1/path-audit.txt` 已标注）；收口 rebase/合入属 orchestrator 与用户闸，不属本路。
- `findings.md` F-008：第二条 `coder#1 -> done` 来源未定——进程内重发候选已由 code-round1 整改闭合，其余候选（短命重拉未被 20s 轮询采到等）悬置；维持 findings 登记，不构成教训结论。
- `dispatch/README.md`「每条测试命令」与 `task_plan.md` §1.3「每条命令」的措辞差（LES-2 已引）——若 consistency 路未逮可由其同库收口。
