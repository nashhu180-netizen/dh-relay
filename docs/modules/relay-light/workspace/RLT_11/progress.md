# RLT_11 · Progress

## W1 · builder

- 2026-09-16：按 dispatch 建立四份工作区工件；C1/C2 均为可独立执行与验证的文档闭环。未执行 C 批，未修改教训库、设计、程序或 RLT_12 真计划。
- W1 只读核对：HEAD 与 `origin/master` 均为 `f6062c8`；候选库现有末号 87；设计 §12、§15 与 DevPlan §RLT_11 的来源已写进 `brief.md`／`task_plan.md`。候选号与现场回链须由 C2 施工时 fresh 核实。

DONE task=RLT_11 role=builder node=W1 status=OK ts=2026-09-16T15:47:08+08:00
  summary: brief 与分批 task_plan 已落盘，共 2 批
  artifacts: brief.md, task_plan.md, findings.md

DONE task=RLT_11 role=plan-reviewer node=W2 status=REVISE ts=2026-09-16T15:49:09+08:00
  summary: 8 条判据已核；独立 P1=1、P2=0，C2 教训原句保真与机械判据需整改
  artifacts: plan-review.md

DONE task=RLT_11 role=builder node=W1b status=OK ts=2026-09-16T15:51:00+08:00
  summary: 按 plan-review P1-1 整改 C2 原句锁定与完成判据
  artifacts: task_plan.md

DONE task=RLT_11 role=plan-reviewer node=W2b status=OK ts=2026-09-16T15:51:56+08:00
  summary: P1-1 闭合
  artifacts: plan-review.md

## C1 · coder — 真计划持久化退场核对

- 2026-09-16：以真计划 `rlt12-win-01`（`docs/modules/relay-light/relay/rlt12-win-01/`，账本 71 行）对照设计 §12（`design/01` 第 1319–1330 行）逐类核对「谁删／何时删／删失败怎么办」，产出 `docs/modules/relay-light/as-built/持久化产物退场核对.md`。
- 六类核对结果：三类「不删」产物（账本/计划、check、review/progress/findings）已实测在案保留；`decision.<n>.md` 因 0 条 `blocked` 未产生（仅设计声明）；阶段终端空间 wG/wH/wJ/wK/wM 的关闭有 5 条 `stage_close` 账本记录（已实测），pane 级与命令级证据未落盘；编排空间 wA 关闭与 worktree 删除未实测（后者实测到「合入后树仍在」）；全部「删失败」路径未实测，均如实标注。
- 「只写不删」：回原文核实——§12 第 1330 行逐字含「显式选择」及两条理由（量级不构成容量风险、复盘唯一证据）＋纯追加声明；§15 第 1374 行同口径。实现侧 `add` 唯一写为 `append_event` 的 `open(ledger_path,"a")`（`relay_log.py:2487`）；唯一例外是 `lint --amend-check` 的受管快照目录（A122），已在文档 §2 注明边界。
- `status` 无自动删除：沿 `_status_command`（`relay_log.py:3190`）→ `_runtime_plan`→`lint_plan`→`parse_plan`（`read_text` :411）→ `read_ledger`（`read_text` :1551）→ `derive_status`（:2757，docstring 自述 read-only projection）→ `status_document`(:3081)/`render_status_text`(:3150)→`print`/`sys.stdout.write`(:3198/:3200) 全链核实；全文写/删操作（`unlink` :1132/1144/1159/1166、`rmtree` :1241/1399/1413/1440/1488、`mkdir` :933/1115、snapshot 写 :950/1145/1183）仅属 `add` 账本追加与 `lint --amend-check` 快照机制，`status` 分支零可达。旁证：RLT_12 `progress.md` E-007 收口实跑 `status` exit 0。
- 范围外发现已登记 `findings.md` F-001～F-004（§12 枚举非穷举、squash 后 commit= 指针悬空、删树无机制保证、关闭证据粒度缺口）；核对文档 §4 同步索引。本批改动文件＝计划内两件（as-built 新说明、本 progress 追加）＋findings.md（worker 铁律规定的范围外发现唯一登记通道，README 允许路径内）。
- 未跑测试（文档回流卡）；未 commit / push；未删除任何历史账本/计划/证据；`tools/relay-light` 下无 `__pycache__`（已核，无需登记 pre-existing）。

DONE task=RLT_11 role=coder node=C1 status=OK ts=2026-09-16T16:20:00+08:00
  summary: 六类退场核对落 as-built；status 无自动删除经调用链证实；只写不删显式选择回原文成立；4 条范围外发现登记
  artifacts: docs/modules/relay-light/as-built/持久化产物退场核对.md, docs/modules/relay-light/workspace/RLT_11/findings.md, docs/modules/relay-light/workspace/RLT_11/progress.md

## C2 · coder — §15 三条教训逐条回流

- 2026-09-16：按 task_plan C2 段执行。施工前重查候选库末号=87（与 W1 记录一致），本次续 候选-88/89/90 三号连续追加在 `docs/modules/dh-relay/knowledge/教训库-候选.md` 末尾，既有条目零改动。
- 逐字保真：三条教训表述直接取自设计 `01-RelayLight-产品设计与验收.md` **第 1378 行原文**（非任何二手转述），含 ①②③ 序号、加粗、`done` 反引号、括注与句末限定；机械核验 = 脚本从 1378 行切出三句、`grep -F` 全中（VERBATIM-OK ×3）。
- 双来源回链（逐条已核实，非杜撰）：候选-88 → 设计 §15 + RLT_12 Linux 预演 `workspace/RLT_12/evidence/linux-dry-run/README.md` DR-F-005（:63，另 DR-F-002/DR-F-004 同族）+ `design/evidence/09` :22；候选-89 → 设计 §15 + RLT-B-01 拆计划讲解 `design/evidence/02-交叉审核记录-RelayLight-B拆计划.md` :50/:140 + 设计 §0.2(:97)/§3.3(:229-237)；候选-90 → 设计 §15 + 设计形成期 §0.1（候选稿 :13-20 → 正式 :41-48）+ HC-RL-A100(:1261) + RLT_07 承接（`workspace/RLT_07/task_plan.md:55`）。
- 疑似重复扫描：候选-64（后台管道）、候选-73（等待上限）、候选-83（reader 轮询）、候选-33（对称变体）、候选-5（大小写）均不同条；库内无 教训库.md 正册，无 L-NNN 冲突；逐条在「疑似重复」字段注明相邻差异。Windows 未复现 DR-F-005 的边界（DR-W-009）已如实写入候选-88 现象字段。
- 每块字段齐：触发场景 / 建议分类 / 来源（双链）/ 疑似重复 / 现象 / 反思 / 建议后续动作 / 状态：待裁决；背景与扩写全在独立字段，原句零改动。
- 机械核验：`git diff` 教训库 = 24 insertions / 0 deletions（纯追加于 :714 后）；`rg '^### 候选-'` 末三号为 88/89/90；`git diff --check` 干净；四集合检查本批改动仅 教训库-候选.md 与本 progress.md（C1 的 as-built 件为上一批产物，RLT_11 工作区文件整体未跟踪为 W1 现状）；本批无新增 findings。
- 未跑测试（文档回流卡）；未 commit / push；未删除任何历史产物；无 __pycache__ 新增。

DONE task=RLT_11 role=coder node=C2 status=OK ts=2026-09-16T16:45:00+08:00
  summary: §15 三条教训逐字回流为候选-88/89/90，双来源回链已核实，旧条目零改动
  artifacts: docs/modules/dh-relay/knowledge/教训库-候选.md, docs/modules/relay-light/workspace/RLT_11/progress.md

DONE task=RLT_11 role=reviewer-lesson node=R1 status=OK ts=2026-09-16T16:26:30+08:00
  summary: 教训路 APPROVE，6 判据全 PASS（P1=0，P2=1 范围外发现：W2 P1-1 模式可考虑入库，未代加）
  artifacts: docs/modules/relay-light/workspace/RLT_11/review.lesson.md

## R2 · reviewer-consistency — 一致性路复核

- 2026-09-16：按 dispatch/R-review-consistency.md 七条判据逐条回原始来源独立核实，未采信施工者自述。
- 实质断言全部独立核实成立：§12 六类转述逐字对得上（`design/01:1321-1328`）；`status` 无自动删除沿 `_status_command`(:3190)→`_runtime_plan`/`read_ledger`/`derive_status`/`status_document`/`render_status_text` 全链核实，且反向枚举全文件写/删原语（unlink :1132/:1144/:1159/:1166、rmtree :1241/:1399、_remove_snapshot_dir :1413/:1440/:1488、mkdir :933/:1115、restricted write :950/:968/:1145-1152/:1183、append :2487）确认仅属 `add` 追加与 `lint --amend-check` 快照簇，status 零可达；「只写不删」回 `design/01:1330` 原文成立；A13 三断言均有机械证据；允许路径四集合干净、全树无 `__pycache__`；未触碰 F-005/F-010 与任何历史产物。
- 两处证据引用精度错（P2）：①RLT_21 `done.*.md` 实为 15 件非 ×13、`evidence/` 归属 RLT_12 而非 RLT_21（核对文档 §1 行 3、§4 差异 1、findings F-001）；②F-002 seq 清单不准（seq 9 无 `commit=`，另漏列 12 条带 commit= 的 seq）。核心结论均不受影响，按 REVISE 交回整改。

DONE task=RLT_11 role=reviewer-consistency node=R2 status=REVISE ts=2026-09-16T16:31:00+08:00
  summary: 一致性复核完成，P1=0、P2=2（证据计数与 seq 清单精度），实质断言独立核实全部成立
  artifacts: review.consistency.md

## X1 · coder — R2 一致性路 P2 整改

- 2026-09-16：按 review.consistency.md 判据 1 的两处证据引用精度错误整改，范围只限 as-built 文档与 findings.md。
- ①`done.*.md` 计数与 `evidence/` 归属：自行复跑 `ls workspace/RLT_21/ | grep -c '^done\.'` = **15**（逐名列出复核），`ls -d workspace/RLT_21/evidence` 不存在、`workspace/RLT_12/evidence` 存在——已把 ×13 改 ×15、`evidence/` 改归 RLT_12（as-built §1 表行与 §4 差异 1、findings F-001 同步）。
- ②F-002 seq 清单：选择**精确集合**而非「多处」——可机械复核、且暴露 seq 54/66 的裸 SHA 引用。按 note 字段精确扫描（`commit=`/`commits=` token，`signal_commit=` 不作命中）：24 条 = seq 1/6/10/11/16/19/21/28/31/32/33/34/48/49/50/51/56/61/62/63/68/69/70/71；seq 9 确认无 commit=；另 seq 54/66 以「基线 <sha>」裸引用同悬空。SHA 集合补入 seq 1 的 `ddfc21d`（账本九个不同 SHA + 工件 verify `dd3ac3c`，共十个全部 MISSING 已复核）。as-built §4 差异 2 同步改精确表述。
- 顺手按复核提示 3 修正 as-built §2/§3 的 rmtree 引用措辞：:1399 是 `snap/"verify"` 直接调用，:1413/:1440/:1488 才是 `_remove_snapshot_dir`(:1239–1241) 的调用点。
- 教训库未触碰（R1 已 APPROVE，候选-88/89/90 原样）；`git diff --numstat` 教训库仍 24+/0-，末块候选-90 未动。无新增 findings。

DONE task=RLT_11 role=coder node=X1 status=OK ts=2026-09-16T17:05:00+08:00
  summary: 按 R2 两条 P2 修正证据引用精度（done.*.md×15/evidence 归属、commit= seq 精确集合 24 条）
  artifacts: docs/modules/relay-light/as-built/持久化产物退场核对.md, docs/modules/relay-light/workspace/RLT_11/findings.md, docs/modules/relay-light/workspace/RLT_11/progress.md

## R2b · reviewer-consistency — 定向复看

- 2026-09-16：只看 R2 两条 P2 是否闭合，全部重跑实证未采信 coder 自述。
- P2-1 闭合：`ls workspace/RLT_21/ | grep -c '^done\.'` 复跑 = 15；`evidence/` 已改归 RLT_12（RLT_21 无此目录复证）；as-built §1/§4 与 F-001 三处同步改正。
- P2-2 闭合：独立重扫 note 字段（`commits?=` 子串、剔除 `signal_commit=`）命中 24 条 seq 集合与 F-002 所列完全一致；seq 54/66 裸 SHA 引用属实；十个 SHA 逐个 `git cat-file -t` 全 MISSING。
- 无新引入问题：git status 仍三件允许路径；教训库 numstat 仍 24+/0-（候选-88/89/90 未动）；rmtree 措辞顺手修正后与代码精确一致，判据 2 结论更精确。

DONE task=RLT_11 role=reviewer-consistency node=R2b status=OK ts=2026-09-16T17:20:00+08:00
  summary: P2-1/P2-2 闭合
  artifacts: review.consistency.md

## 编排收口（orchestrator）

- 复核闸：`light` 两路必做复核已全部闭合——R1 教训路 **APPROVE**（6 判据全 PASS，P1=0）；R2 一致性路 **REVISE**（P1=0/P2=2）→ X1 整改 → R2b 定向复看 **CLOSED**、新引入问题「无」。施工者未复核自己的卡（R1/R2 为两个独立 devin 实例）。
- 允许路径四集合核对（编排独立复核）：改动集合 = `docs/modules/dh-relay/knowledge/教训库-候选.md`（+24/-0 纯追加）、`docs/modules/relay-light/as-built/持久化产物退场核对.md`（新增）、`docs/modules/relay-light/workspace/RLT_11/**`（新增），全部落在卡片允许路径内，无越界、无 `__pycache__` 等脏文件。
- 编排侧过程发现 F-005～F-007 已登记 `findings.md`，均为范围外、供裁决，不在本卡处理。
- 本卡为轻档文档回流，未跑单测（无「有效单测」硬要求）；未删除任何历史账本/计划/证据。

DONE task=RLT_11 role=orchestrator node=F1 status=OK ts=2026-09-16T17:22:00+08:00
  summary: 两路复核闭合、四集合核对通过，进入 commit/push/PR 收口
  artifacts: findings.md, progress.md

## 人类验收落记（AI 代记）

- **2026-09-16**：用户在对话中明确答复「**确认验收**」，并指示清理 worktree。该确认是对 RLT_11 整卡的验收结论，非仅放行动作。据此 DevPlan 任务表 RLT_11 行由「已完成」转「已验收」。
- 代记依据：AGENTS.md 宪章#4——确认来自用户对话明文，非 AI 代签；本卡无 `review.md` 人类签名区（`light` 档两路复核报告分列 `review.lesson.md` / `review.consistency.md`），故无勾选动作。
- 边界：本卡不属高危五类，无 `verify(relay-light):` 提交要求；`light` 档无「有效单测」硬要求，未跑单测。findings F-001～F-007 仍为「已登记 · 待裁决」，不因本次验收而关闭。
- 收口动作：PR #34 本体合入 `856d9b3`；PR #35 DevPlan 回填合入 `1de4c89`；worktree `.dh-worktrees/RLT_11` 已删、分支 `wt/RLT_11` 已清（遗留的 `.dh-worktrees/RLT_21` 与 `dryrun-rlt12` 同日一并清树，两分支保留）。
