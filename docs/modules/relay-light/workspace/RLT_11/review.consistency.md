# R2 · 一致性路复核 — RLT_11

复核范围：本卡全部改动（`git status`：改 `docs/modules/dh-relay/knowledge/教训库-候选.md` +24/-0；新增 `docs/modules/relay-light/as-built/持久化产物退场核对.md` 与 `workspace/RLT_11/`）。本路判退场核对表与 §12 的逐类一致性、「status 无自动删除」的源码依据、「只写不删」转述、A13 三断言机械证据、允许路径四集合、as-built 与现役实现一致性、越界检查。所有结论均回原始来源独立核实（含逐行读 `tools/relay-light/relay_log.py` 全文副作用面），未采信施工者自述。

## 结论

REVISE（P1=0，P2=2——两处证据引用精度错误，均在本卡允许路径内可修；七条判据的实质性结论全部独立核实成立）

## 逐条判据

| # | 判据 | 结论 | 级别 | 依据（文件:行） | 整改动作 |
|---|---|---|---|---|---|
| 1 | 退场核对结论属实（对 §12） | FAIL | P2 | §12 六类转述本身逐字对得上（`design/01:1321-1328`），无把设计没写的说成写了；但证据列两处事实错：①`持久化产物退场核对.md:14` 与 `findings.md` F-001 称 RLT_21 工作区 `done.*.md`×13、`evidence/`——实测 `done.*.md` **15 件**（`ls workspace/RLT_21 \| grep -c '^done\.'` = 15），且 RLT_21 工作区**无 `evidence/` 目录**（`ls -d` 不存在；`evidence/` 在 RLT_12 工作区）；②F-002 的 seq 清单「6/9/21/34/51/61/63/68/69/70/71」不准——seq 9 的 note 无 `commit=`（`relay_log.jsonl:9` 为 node_close 关闭判据说明），而实际带 `commit=`/`commits=` 的还有 seq 10/11/16/19/28/31/32/33/48/49/50/56/62 未列入 | 改正计数与归属（×15；`evidence/` 改归 RLT_12 或删去）；F-002 的 seq 清单改为实际带 commit= 的 seq 集合或改写成「多处」表述 |
| 2 | 「status 无自动删除」有实际源码依据 | PASS | — | 独立复核调用链：`main` 分发 `status`→`_status_command`（`relay_log.py:3249-3250`→`:3190-3201`）→ `_runtime_plan`(`:1531-1538`)→`lint_plan`(`:519`)→`parse_plan`(`:407`，唯一文件动作 `read_text` :411)；`read_ledger`(`:1545-1581`，`exists` :1548 + `read_text` :1551)；`derive_status`(`:2757`，docstring 自述 read-only :2766-2767)；输出 `print(status_document(...))` :3198 / `sys.stdout.write(render_status_text(...))` :3200。反向核实全文件副作用面：所有写/删原语（`os.mkdir` :933/:1115、`os.rmdir` :943、`os.open`/`fdopen` 写 :950/:968/:1145-1152/:1183、`unlink` :1132/:1144/:1159/:1166、`shutil.rmtree` :1241/:1399、`_remove_snapshot_dir` 调用 :1413/:1440/:1488）仅属两处——`append_event` 的 `open(ledger_path,"a")` 追加（:2487，仅 `add` 路径）与 `lint --amend-check` 快照簇（仅 `_lint_command` amend 分支 :1511-1514 可达，CLI 门 :3234-3240）；`status` 分支对以上全部零可达；`load_config`/`resolve_config_dir`/`_configure_utf8_stdio` 无写删。旁证 E-007 实跑 exit 0 属实（`workspace/RLT_12/progress.md:26`）。文档对该断言的举证方式（调用链 + 副作用清单 + 实测旁证）成立 | — |
| 3 | 「只写不删」显式选择且有理由 | PASS | — | `design/01:1330` 原文逐字含「『只写不删』是**显式选择**」及两条理由（量级不构成容量风险、复盘唯一证据）＋「程序不产生临时文件（纯追加）」；`§15:1374` 同口径。核对文档 §2 如实转述（外层引号内层 「→『 属嵌套引号惯例，非篡改）；实现侧补查属实：`append_event` docstring「without changing earlier ledger bytes」:2465、唯一写为 `"a"` 追加 :2487；唯一例外 `lint --amend-check` 受管快照目录已在文档 §2 明示边界，其「恢复校验失败保留交人」（:1434-1439）与 §12「报错交人、不强删」同向 | — |
| 4 | HC-RL-A13 三断言逐条落地 | PASS | — | A13 原文（`design/01:1280`）：设计有 §12 + `status` 不做任何自动删除。①设计 §12 在案（:1319-1330）且实现侧有声明（docstring :2465/:2766 + 本卡新增 as-built 文档）；②`status` 无删除见判据 2 全链证据；③三条教训候选 88/89/90 落账且逐字回链——我独立重做了逐字比对与回链命中（DR-F-005 `linux-dry-run/README.md:63`、DR-F-002 :60、DR-F-004 :62、`evidence/09:22`、DR-W-009 `win-dry-run/README.md:108`、`evidence/02:50,:140`、§0.2 :97、§3.3 :229-237、`drafts/01-候选:13-20`→§0.1 :41-48、HC-RL-A100 :1261、`RLT_07/task_plan.md:55`、`RLT_12/execution_strategy.md:31`），与教训路结论一致 | — |
| 5 | 允许路径四集合核对 | PASS | — | 实际改动 = `教训库-候选.md`(M) + `as-built/持久化产物退场核对.md`(新增) + `workspace/RLT_11/`(新增)，三件全部落在 README 三条允许路径内；`git status --porcelain --ignored` 无 ignored 条目；`find` 全树无 `__pycache__`/`*.pyc`（既无 pre-existing 也无本卡新增，无需登记）；`git diff --check` 干净 | — |
| 6 | as-built 与现役实现一致 | PASS | — | 新增文档引用的全部行号锚点在基线 `f6062c8`（已含 RLT_22 合入 `0a909dd`）逐一命中；A13/A100/A122 编号与验收表原文一致；PR 号对得上 git log（RLT_12→PR #25 `7981556`、RLT_21→PR #27 `124a5c9`、RLT_22→PR #31 `0a909dd`）；「合入后树仍在」实测属实（`git worktree list`：`.dh-worktrees/RLT_21` @ `d81cb4a`、`dryrun-rlt12` @ `143fae3` 均在，远端 `wt/RLT_21`/`dryrun/rlt12-win`/`dryrun/rlt12-linux` 均在）；F-002 九个 SHA 全部 MISSING 实测属实；账本 71 行、`blocked` 0 条、`decision.*` 未产生（agent 表预挂 decision.1/2.md 于 C1/C2/X1 行属实）、RLT_09/RLT_10 存量 `decision.1.md` 佐证属实；E-003 空槽、`evidence/win-real-run/` 未建立属实；`seq 25` checkpoint 删 `.devin/config.local.json` 记录属实。与 RLT_22 合入后现状无矛盾表述（本卡未涉 trigger/A144~A150 语义） | — |
| 7 | 不越界 | PASS | — | 未触碰 F-005/F-010（两者为 RLT_22 转派项，`dev_plan:21` 登记在案，本卡 diff 不含 RLT_22 工作区与 `as-built/RLT_05-实现快照.md`）；未动 dev-harness、历史账本/计划/证据（`relay/rlt12-win-01/`、`workspace/RLT_12/`、`workspace/RLT_21/` 零改动）；教训库为纯追加（24+/0-），既有 87 条零改动 | — |

## 范围外发现

1. **P2 · RLT_21 工作区 `done.*.md` 实有 15 件、`evidence/` 在 RLT_12 而非 RLT_21**：本卡 `持久化产物退场核对.md:14` 与 `findings.md` F-001 的枚举计数/归属写错（结论方向不变——§12 枚举确实非穷举）。整改归本卡 REVISE，见判据 1。
2. **P2 · F-002 的 seq 清单与实际账本不符**：`commit=`/`commits=` 实际出现在 seq 6/10/11/16/19/21/28/31/32/33/34/48/49/50/51/56/61/62/63/68/69/70/71（共 23 条），F-002 所举 11 个 seq 中 seq 9 无 `commit=`、且漏列 12 条；九个 SHA 不可解析的核心结论本身属实。同上归判据 1 整改。
3. **提示（非判据项，不需整改）**：`持久化产物退场核对.md:44` 把 `shutil.rmtree` 的四处「调用点」列为 `:1399/:1413/:1440/:1488`——实际 `:1399` 是 `snap/"verify"` 上的直接 `shutil.rmtree` 调用，`:1413/:1440/:1488` 才是 `_remove_snapshot_dir` 调用点；措辞略有歧义但「均在 amend-check 簇内、status 零可达」的实质结论不变，如顺手可在整改时一并为精确。
4. 无其他范围外发现。

## R2b 定向复看（P2-1 / P2-2）

结论：CLOSED

逐点核对：
- **P2-1 闭合**：复跑 `ls workspace/RLT_21/ | grep -c '^done\.'` = **15**、`ls -d workspace/RLT_21/evidence` 不存在、`workspace/RLT_12/evidence` 存在；核对文档 §1 行（:14）与 §4 差异 1（:59）已改 `done.*.md`×15 并把 `evidence/` 改归 RLT_12 工作区；`findings.md` F-001 同步改正并保留实测出处。
- **P2-2 闭合**：F-002 改为精确集合而非模糊表述——我独立重扫 `relay_log.jsonl` note 字段（`commits?=` 子串匹配，剔除 `signal_commit=` 误命中），命中 seq 集合 `1/6/10/11/16/19/21/28/31/32/33/34/48/49/50/51/56/61/62/63/68/69/70/71` 共 24 条，与 F-002 所列举**完全一致**；seq 9 确认无 `commit=`；seq 54/66 的「基线 \<sha\>」裸引用复扫属实（fc70185/435fad6）；十个 SHA（账本九个不同值含 seq 1 `ddfc21d` + verify `dd3ac3c`）逐个 `git cat-file -t` 全部 MISSING；as-built §4 差异 2 同步改精确表述。
- **判据 2/3/4/6 未被改坏**：整改仅触碰证据引用措辞；§3 调用链与「零可达」结论原样成立；顺手修正的 rmtree 措辞（:24/:44）现在与代码精确一致（`:1399` 直接调用 vs `_remove_snapshot_dir` :1239–1241 调用点 :1413/:1440/:1488），判据 2 结论反而更精确。

新引入问题：无。`git status` 仍只有三件允许路径改动；`git diff --numstat` 教训库仍 24+/0-（候选-88/89/90 原样未动）；无范围扩大、无越界路径。
