<!-- dh:v1 -->
# RLT-A-11 · Progress

## W1 · builder

- 输入：Issue #37、RLT_11 findings F-001/F-002 与裁决落记、DevPlan RLT-A-11/RLT_23/RLT_24、design/01 §11/§12/§15、A09 候选稿与 evidence/10 先例。
- 实测：`origin/master` 当前最大验收 ID = `HC-RL-A150`；真计划监工派单 6 份、RLT_21 `done.*.md` 15 份、RLT_12 `evidence/` 已跟踪文件存在。
- 产出：`brief.md` 固定业务合同与 Issue 五条验收原文；`task_plan.md` 拆成 8 批；`findings.md` 登记 RLT_24 未来路径合同不一致。

DONE task=RLT-A-11 role=builder node=W1 status=OK ts=2026-09-16T21:06:10+08:00
  summary: brief 与分批 task_plan 已落盘，共 8 批
  artifacts: brief.md, task_plan.md, progress.md, findings.md

## W1b · builder 整改

- 输入：`plan-review.md` 第 1 轮 REVISE；仅整改逐项判据 #1（P2）、#2（P1）、#6（P1）。
- 核验：`task_plan.md` 四段 Python 完成判据均可编译；按卡区块提取规则可定位当前 DevPlan 的 RLT_23/RLT_24「验收口径」行；`task_plan.md` 末尾已有 W1b 整改对照表。

DONE task=RLT-A-11 role=builder node=W1b status=OK ts=2026-09-16T21:12:39+08:00
  summary: W2 #1/#2/#6 已按判据修订，待 W2 复评
  artifacts: brief.md, task_plan.md, progress.md

## W1c · builder 整改

- 输入：`decision.1.md` §3（fresh P1-4，分类=小决策）；仅替换 §3.1、§3.2、§3.3 指定文本。
- 核验：四段 `text` 逐字块在 `task_plan.md` 各出现一次；末尾已追加 W1c 整改对照表。

DONE task=RLT-A-11 role=builder node=W1c status=OK ts=2026-09-16T21:53:35+08:00
  summary: decision.1 §3 三处指定整改已落盘
  artifacts: task_plan.md, progress.md

DONE task=RLT-A-11 role=plan-reviewer node=W2 status=REVISE ts=2026-09-16T21:09:14+08:00
  summary: 计划评审完成，P1=2、P2=1；须修订按卡 ID 核验与复审状态判据
  artifacts: plan-review.md

DONE task=RLT-A-11 role=plan-reviewer node=W2r2 status=APPROVE ts=2026-09-16T21:14:27+08:00
  summary: 第 1 轮 #1/#2/#6 均闭合；新增 P1=0、P2=1，计划评审 APPROVE
  artifacts: plan-review.md

## C1 · coder 候选稿

- 输入：`brief.md`、`task_plan.md` C1 节、`plan-review.md` 两轮（含第 2 轮 P2：两卡各 ≥4 条不合并）、Issue #37、design/01 §11/§12/§15/文件头、DevPlan RLT_23/RLT_24 卡与 RLT-A-11 条、A09 候选稿与 evidence/10 先例、`workspace/RLT_11/findings.md` F-001/F-002。
- 产出：`A11-候选.md` v1——§1.1 三组 `git ls-files` 实际清单（8+29+14=51 路径）与逐类映射「前六类无遗漏」结论；§2 共 13 个 B-block 逐字晋级文本（§12 兜底行、§12 职责分层段含 H10 回链与 commit= 旁注句、§11.1 新增 A151～A158 八行、§11 总账 140→148、§15 稳定性行、文件头声明/活动声明/修订行、DevPlan 两卡验收口径行、RLT-A-11 调整条、dh:status 下一步句、evidence/11 骨架含 review/understanding 锚点）；§3.3 OWNER 归属清单八行（RLT_23: A151–A154，RLT_24: A155–A158，各恰四条）；§5 开放项 O-001～O-004（H10 命题列默认不改、职责段落位置默认 §12、resource_close 载体默认新增事件词、字段合同默认完整冻结）。
- 完成判据命令与输出（从 worktree 根执行）：

```text
$ A=docs/modules/relay-light/design/drafts/A11
$ test -s "$A/A11-候选.md" && echo "c1: candidate non-empty OK" \
  && test "$(git ls-files 'docs/modules/relay-light/relay/rlt12-win-01/dispatch/monitor-*.md' | wc -l)" -eq 6 && echo "c2: monitor-* == 6 OK" \
  && test "$(git ls-files 'docs/modules/relay-light/workspace/RLT_21/done.*.md' | wc -l)" -eq 15 && echo "c3: RLT_21 done.* == 15 OK" \
  && git ls-files 'docs/modules/relay-light/workspace/RLT_12/evidence/**' | rg -q . && echo "c4: RLT_12 evidence non-empty OK" \
  && rg -q 'HC-RL-A151' "$A/A11-候选.md" && echo "c5: A151 present OK" \
  && rg -q 'HC-RL-H10' "$A/A11-候选.md" && echo "c6: H10 present OK" \
  && git diff --quiet -- docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md && echo "c7: formal files untouched OK"
c1: candidate non-empty OK
c2: monitor-* == 6 OK
c3: RLT_21 done.* == 15 OK
c4: RLT_12 evidence non-empty OK
c5: A151 present OK
c6: H10 present OK
c7: formal files untouched OK
```

- 逐路径比对（候选证据表 ⊆ 实际 `git ls-files` 且三组输出每条均在候选中）：python3 脚本比对 monitor 6 / done.* 15 / evidence 4 → `missing_in_candidate` 均为空，输出 `PER_PATH_OK`；候选另列的 26 个路径均为三目录内真实已跟踪文件（映射到 §12 第 1～3 类或兜底行用）。
- 路径闸：`git status --short` 仅 `?? docs/modules/relay-light/design/drafts/A11/`；`git ls-files --others --exclude-standard` 同；未改允许路径外任何文件，未 commit/push。

DONE task=RLT-A-11 role=coder node=C1 status=OK ts=2026-09-16T21:36:00+08:00
  summary: 候选稿 v1 落盘：51 路径清单+映射、13 个 B-block 逐字文本、A151~A158 归属清单、4 开放项；判据全过
  artifacts: A11-候选.md, progress.md

DONE task=RLT-A-11 role=audit node=C1-audit status=REVISE ts=2026-09-16T21:46:43+08:00
  summary: 候选稿 fresh-01 审核完成，P1=5、P2=1；逐字晋级与下游合同需整改
  artifacts: review.fresh-01.md

## C1b-part1 · coder 整改（fresh-01 P1-1 / P1-5 / P2-1）

- 输入：`review.fresh-01.md`；按派活只整改三条，P1-2 / P1-3 / P1-4 由决策方出方案中，未动 B-003 的 A155～A158、O-003 / O-004、B-013。
- 整改：①B-009 / B-010 两卡「验收口径」压回原有单行（逐 ID 列出归属四 ID，删除八条机器证子行）；②B-012 改为「候选文本已在分支晋级，仍待 R/PR/CI/合并，收口前 RLT_23/RLT_24 不开工」，不再宣告开工闸解除；③§1.1 RLT_12 清单「13 份」→「14 份」、§1.2 「review.*.md 六份」→「review.*.md 五份及 review.md 一份」。
- 候选稿版本 v1→v2，文末「整改对照」表已逐条登记三项（含闭合自评）并注明未整改项去向。
- 复核不变量：B-block 13、OWNER 8、O 行 4 不变；`git diff --quiet` 对 design/01 与 DevPlan 成立；`git status --short` 仅 `drafts/A11/`。未 commit/push。

DONE task=RLT-A-11 role=coder node=C1b-part1 status=OK ts=2026-09-16T21:58:00+08:00
  summary: v2 整改 P1-1（验收口径压回单行）/P1-5（不提前解开工闸）/P2-1（两处数量标签）；P1-2/3/4 待决策方案
  artifacts: A11-候选.md, progress.md

DONE task=RLT-A-11 role=decider node=C1-decision status=OK ts=2026-09-16T21:52:05+08:00
  summary: P1-2 两个出口及推荐、P1-3 wire format 与验收去重、P1-4 计划逐字替换建议已交付；方向项待用户点选，本节点不代签
  artifacts: decision.1.md

## W1d · builder 出口 A 同步

- 输入：`decisions.md` O-005（2026-09-16 用户选出口 A）、`decision.1.md` §1、`dispatch/README.md` 扩展边界。
- 落点：`brief.md` 明记 A2 唯一旧行例外、第 20 控制词及 RLT_24 实现分工；`task_plan.md` 增加 A2 批准逐字行与反例、四处 20 词及 RLT_24 allowed-paths 原样检查，末尾有 W1d 整改对照。
- 核验：四段 Python 计划脚本可编译；原 A2 与 origin/master 逐字一致，批准新 A2 与 decision.1 §1.3 逐字一致；未执行 C 批。

DONE task=RLT-A-11 role=builder node=W1d status=OK ts=2026-09-16T22:21:47+08:00
  summary: O-005 出口 A 已同步 brief 与 task_plan，候选稿留给 coder
  artifacts: brief.md, task_plan.md, progress.md

DONE task=RLT-A-11 role=plan-reviewer node=W2r3 status=REVISE ts=2026-09-16T22:24:53+08:00
  summary: W1c/W1d 窄审完成，P1=3、P2=0；Issue 同步、B-013 结构校验、20 词一致性待整改
  artifacts: plan-review.md

## C1b-part2 · coder 整改（decisions.md O-001～O-005 全 A + decision.1）

- 输入：`decisions.md`（用户逐项点选全 A）、`decision.1.md` 全文、`dispatch/README.md`（允许路径已按 O-005 扩展）；候选稿 v2→v3。**注**：落稿时并行发生 W1d（brief/task_plan 同步出口 A）与 W2r3 窄审（REVISE：Issue 同步、B-013 结构校验、20 词一致性三项），其整改归属编排另行派活，不在本批范围。
- 整改落点：
  - §5 新增 `| O-005 |` 行（fresh-01 P1-2 出口：A=本事件扩界 / B=另立规划前置，本稿倾向 A）；O-004 选项 A 描述对齐 decision.1 §2；§5 标题与注脚改为「已逐项裁决全 A」形成史口径。
  - 新增逐字 B-block：B-014（A2 替换行=decision.1 §1.3 逐字）、B-015（§1.3 事件词表 19→20）、B-016（§3.2 note 事件专属例外）、B-017（§3.3 计数 20）、B-018（§3.4 控制事件表尾 `resource_close` 行）、B-019（A09 段「仍是那 19 个词」改写）、B-020（§3.4 末 wire format 段，decision.1 §2.1/§2.2）、B-021（§12 两类终端空间单元格=§2.4 逐字）、B-022/B-023/B-024（DevPlan RLT_24 目标/非目标/变更范围三句，允许路径不加 design/01）。
  - B-003 的 A155/A156 采用 decision.1 §2.3 逐字（reason 条件独归 A156）；A157/A158 按 §2.4 改写为「执行已冻结 §12 路径、不改设计正文」与「71 行原字节兼容 + fixture 派生不变」。
  - B-013 改为证据结构合同：两个固定锚点片段逐字（`review-rlt-a11`+`dh:planning-evidence:v1` 注释、`understanding-rlt-a11`），五节标题列完整性要求，去掉占位骨架的逐字身份。
  - B-004 总账仍 148（A2 修订不增减条目）；B-005 §15 补 A2 保号修订例外；B-008 修订行、B-011 调整条、B-012 下一步句如实反映扩界与 A2 例外。
  - 删除「本稿默认路径（全 A）不违反任何既有闸」类表述；§4 影响面如实写 A2 为唯一旧行例外；整改对照表补 P1-2 / P1-3 / P1-4 三行及 O-005 新增行。
- 命令与输出：
  - §6.1 自检七条：c1 非空 OK、c2 monitor-* ==6 OK、c3 RLT_21 done.* ==15 OK、c4 RLT_12 evidence 非空 OK、c5 A151 在位 OK、c6 H10 在位 OK、c7 两正式文件 `git diff --quiet` OK。
  - 结构计数：`### B-` = 24、`OWNER HC-RL-A` = 8、`| O-0x |` 行 = 5。
  - task_plan D1 判据脚本：`DECISION_RECORDS_OK ['O-001','O-002','O-003','O-004','O-005']`。
  - 逐字核对：B-014 新文与 decision.1 §1.3 逐字一致、旧文与 `git show origin/master:…` A2 原行（第 1177 行）一致；A155/A156 与 §2.3 逐字一致；§12 单元格与 §2.4 逐字一致（rg -F 双文件比对均命中）。
  - 路径闸：`git status --short` 仅 `?? docs/modules/relay-light/design/drafts/A11/`；design/01 与 DevPlan 零改动。未 commit/push。

DONE task=RLT-A-11 role=coder node=C1b-part2 status=OK ts=2026-09-16T22:30:00+08:00
  summary: v3 落稿：O-005 行补齐、B-014~B-024 新增、A155/A156 取 decision.1 §2.3 逐字、A157/A158 按 §2.4 改写、B-013 改证据结构合同、A2 例外如实入账；fresh-01 六项全部落稿待 RV
  artifacts: A11-候选.md, progress.md

## W1e · builder 计划窄整改

- 输入：`plan-review.md` 第 3 轮 #4/#5；#6 Issue 同步由编排承接。
- 落点：`task_plan.md` 增加 evidence/11 四类可解析记录与 C2/C2-audit 共用验证脚本、四种内存删项反例；R 批新增 §3.4 A09 批准沿革句与旧句残留反例；末尾有 W1e 整改对照。
- 核验：五段 Python 计划脚本可编译；共用 evidence 脚本在临时夹具中通过完整样例与四种删项反例；20 词函数在内存样例中通过批准新句并拒旧句残留。

DONE task=RLT-A-11 role=builder node=W1e status=OK ts=2026-09-16T22:29:40+08:00
  summary: W2 第 3 轮 #4/#5 机械判据已整改，#6 留编排
  artifacts: task_plan.md, progress.md

DONE task=RLT-A-11 role=plan-reviewer node=W2r4 status=APPROVE ts=2026-09-16T22:33:12+08:00
  summary: W2 第 3 轮 #4/#5/#6 均闭合；新增 P1=0、P2=0
  artifacts: plan-review.md

DONE task=RLT-A-11 role=reviewer node=RV status=REVISE ts=2026-09-16T23:05:00+08:00
  summary: 定向复审完成：fresh-01 六项全 CLOSED；裁决落地核查新发现 N-001（P1：B-011 把 Issue #37 边界更新误记为「评论落记」，实为权威正文直接更新且评论数=0）、N-002（P2：A85 写入者二分枚举装不下 resource_close 的分叉写入者）、N-003（P2：DevPlan 历史卡 19 词记录口径确认）；判据脚本 RV_RECORDS_OK
  artifacts: review.targeted-02.md, progress.md

## C1c · coder 整改（RV targeted-02 N-001～N-003）

- 输入：`review.targeted-02.md`（fresh-01 六项 CLOSED；新发现 N-001 P1 / N-002 P2 / N-003 P2）、`decisions.md` 文末小决策段（N-002 取选项 a，N-003 原样保留登记）。
- 整改落点：
  - **N-001**：B-011 新文「边界同步更新由编排以 Issue 评论落记」→「边界同步更新已由编排直接落进权威正文，2026-09-16」；全文 grep「评论」仅剩整改对照行自身说明，B-008 / B-013 固定片段 / §4 无同类残留。
  - **N-002**：取 (a)，B-020 wire format 段写入者条下补「`HC-RL-A85` 的写入者二分枚举系 19 词时代口径、未含 `resource_close`；`resource_close` 的法定写入者以 §3.4 控制事件表为准」；不新增改 A85 的 block。
  - **N-003 + findings**：`findings.md` 追加 C1c-F-001（A85/A68/A89 枚举 20 词后陈旧，留后续规划事件）与 C1c-F-002（DevPlan RLT_03/RLT_22 已完成卡「19 词」按历史原样保留）。
  - 候选稿 v3→v4；整改对照表补 N-001 / N-002 / N-003 三行。
- 命令与输出：
  - §6.1 自检：c1 非空 OK、c2 monitor-* ==6 OK、c3 done.* ==15 OK、c4 evidence OK、c5/c6 A151+H10 在位 OK、c7 `git diff --quiet` 对两正式文件 OK。
  - `rg -n '评论'` 候选稿：仅整改对照行 1 命中。
  - 结构计数：`### B-` = 24、`OWNER HC-RL-A` = 8、`| O-0x |` = 5；`git status --short` 仅 `?? docs/modules/relay-light/design/drafts/A11/`。未 commit/push。

DONE task=RLT-A-11 role=coder node=C1c status=OK ts=2026-09-16T23:02:16+08:00
  summary: v4 整改 RV 三项：B-011 改「编排直接更新 Issue 权威正文」、B-020 补 A85 限定句、findings 登记 A85/A68/A89 与历史卡 19 词口径；自检全过
  artifacts: A11-候选.md, findings.md, progress.md

DONE task=RLT-A-11 role=reviewer node=RV2 status=APPROVE ts=2026-09-16T23:20:00+08:00
  summary: 第二轮窄审通过：N-001 B-011 更正为「编排直接落进权威正文」、N-002 B-020 补 A85 限定句、N-003 findings 登记均闭合；v3→v4 +4 行全部可归属、其它 B-block 逐字未动、「评论落记」无晋级残留；RV 判据脚本重跑仍 RV_RECORDS_OK
  artifacts: review.targeted-03.md, progress.md

## C2 · coder 晋级（B-001～B-024 → design/01 + DevPlan；新建 evidence/11）

- 输入：`A11-候选.md` v4（24 块权威逐字输入）、`decisions.md`（O-001～O-005 全 CHOSEN A）、`decision.1.md`（批准逐字行）、`task_plan.md` C2 节与共用校验脚本。
- 动作：B-013 以外 23 个 block 逐字晋级（每块先以旧文唯一锚点定位再替换/插入）；B-013 按证据结构合同新建 `design/evidence/11-交叉审核记录-RLT-A11-产物兜底与验收续发.md`——两个固定锚点片段逐字各一次 + 五节事实正文 + CLOSE/DECIDED/INCLUDED/ANCHOR 可解析记录。H10 行一字未动；A2 为唯一改动的既有验收 ID 行。未 commit / push。

### 命令与输出（原样）

1. 逐块核验（候选 `新文逐字`/新增 fence 原文在目标文件 count==1，替换块旧文 count==0；B-013 走证据合同另查）：

   ```
   $ PYTHONDONTWRITEBYTECODE=1 python3 - <<'PY'   # 提取候选各 block 的 新文逐字/新增 fence 对 design/01 与 DevPlan 计数
   B-001: count=1 line=1370 OK
   B-002: count=1 line=1374 OK
   B-003: count=1 line=1331 OK
   B-004: count=1 line=1198 OK
   B-005: count=1 line=1427 OK
   B-006: count=1 line=8 OK
   B-007: count=1 line=10 OK
   B-008: count=1 line=21 OK
   B-009: count=1 line=438 OK
   B-010: count=1 line=453 OK
   B-011: count=1 line=49 OK
   B-012: count=1 line=21 OK
   B-014: count=1 line=1210 | old count=0 OK
   B-015: count=1 line=99 | old count=0 OK
   B-016: count=1 line=221 | old count=0 OK
   B-017: count=1 line=237 | old count=0 OK
   B-018: count=1 line=257 OK
   B-019: count=1 line=299 | old count=0 OK
   B-020: count=1 line=301 OK
   B-021: count=1 line=1367 | old count=0 OK
   B-022: count=1 line=450 | old count=0 OK
   B-023: count=1 line=452 | old count=0 OK
   B-024: count=1 line=454 | old count=0 OK
   ALL_BLOCKS_OK
   ```

   （首轮自检脚本曾用我凭记忆写的中文 needle 对 B-008/B-018/B-019/B-020 报 FAIL，属检查脚本 needle 写错；改用候选稿 fence 原文提取后全部 count==1，晋级文本本身无误。另 B-019/B-012 的 fence 尾换行需 strip 后作子串计数；B-024 节内含 OWNER fence，须按「新文逐字」标签取块。）

2. B-013 固定锚点片段计数（evidence/11 内各恰一次）：

   ```
   $ grep -Fn '<a id="review-rlt-a11"></a>' → 15:<a id="review-rlt-a11"></a>
   $ grep -Fn '<a id="understanding-rlt-a11"></a>' → 50:<a id="understanding-rlt-a11"></a>
   固定片段 '<a id="review-rlt-a11"></a>\n\n<!-- dh:planning-evidence:v1 ... kind=review -->' count==1；'<a id="understanding-rlt-a11"></a>' count==1
   ```

3. task_plan C2/C2-audit 共用完整性校验（原样脚本）：

   ```
   $ python3 - <<'PY'   # task_plan.md L130-211 原样
   EVIDENCE_STRUCTURE_AND_FOUR_DELETION_PROBES_OK 6 5 24
   ```

4. R 批机械脚本（A2 精确例外 + 按卡验收行 + 20 词四处一致 + RLT_24 allowed-paths 逐字守门；原样）：

   ```
   $ python3 - <<'PY'   # task_plan.md L260-348 原样
   A2_EXACT_EXCEPTION_CARD_OWNER_20_WORDS_AND_RLT24_SCOPE_OK ['HC-RL-A151', 'HC-RL-A152', 'HC-RL-A153', 'HC-RL-A154', 'HC-RL-A155', 'HC-RL-A156', 'HC-RL-A157', 'HC-RL-A158']
   ```

   覆盖：冻结 master 基线原 A2 逐字一致；新 A2 与批准逐字行一致；A2 以外全部旧验收 ID 行（含 H10）逐字不变；改动他行/写歪 A2 两个内存反例均被拒；新增 ID 恰为 A151～A158 连续续号；候选 OWNER 归属与新增 ID 集合精确相等、两卡各 ≥4；RLT_23/RLT_24 各自「验收口径」行 ID 集合恰等于归属、删 ID 反例被拒；§1.3/§3.3/§3.4/A2 四处 20 词一致、批准 A09 新句恰一次且旧句无残留、旧句残留反例被拒；§3.2 与 §3.4 均含 resource_close；RLT_24 allowed-paths 相对 master 逐字不变；目标/非目标/变更范围三句均已改写；planning-event 声明存在。

5. rg 定点与 20 词逐行：

   ```
   $ rg -q 'dh:planning-event:v1 id=RLT-A-11 stage=A-adjust' "$D" → planning-event OK
   $ rg -q 'HC-RL-A151' "$D" → A151 OK
   $ rg -q 'HC-RL-H10' "$D" → H10 OK
   $ rg -q 'dh:planning-evidence:v1 event=RLT-A-11' evidence/11-*.md → evidence marker OK
   $ rg -n '20 个|20 词' "$D"
   21:  RLT-A-11 修订行（…19→20 词…）
   99:  | 事件词表 | 20 个，分控制事件与 agent 事件两类… |
   237: | **账本事件层** | 20 个，见下（RLT-A-11 新增 `resource_close`） |
   299: §3.4 A09 段批准新句（…词表为 20 词…）
   1198: §11 总账（…白名单 19→20 词…）
   1210: | HC-RL-A2 | 账本事件层 20 词白名单 fail closed… |
   1427: §15 验收 ID 稳定性行（…19→20 词…）
   ```

6. planning-event `review=`/`understanding=` 目标：

   ```
   $ test -f evidence/11-交叉审核记录-RLT-A11-产物兜底与验收续发.md → exists
   $ rg -q '<a id="review-rlt-a11"></a>' → OK（L15）
   $ rg -q '<a id="understanding-rlt-a11"></a>' → OK（L50）
   ```

7. 路径检查：

   ```
   $ git status --short
    M docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md
    M docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md
   ?? docs/modules/relay-light/design/drafts/A11/
   ?? docs/modules/relay-light/design/evidence/11-交叉审核记录-RLT-A11-产物兜底与验收续发.md
   $ git diff --stat
    design/01… | 64 ++++++++++++++++++----
    P1…        | 14 ++---
    2 files changed, 61 insertions(+), 17 deletions(-)
   $ git ls-files --others --exclude-standard
    仅 drafts/A11/** 17 个工件 + 新建 evidence/11 一份
   $ git diff --check → (clean)
   ```

   `git diff --unified=0` hunk 头：design/01 仅 @8（B-006 声明行）/ @10（B-007 活动句）/ @21+2（B-008 修订行）/ @99（§1.3 B-015）/ @221（§3.2 B-016）/ @237（§3.3 B-017）/ @257（§3.4 B-018 行）/ @299+30（B-019 子句替换 + B-020 wire format 段）/ @1198（§11 总账 B-004）/ @1210（A2 B-014）/ @1331+8（B-003 A151～A158）/ @1367,2（§12 B-021 两格）/ @1370（§12 B-001 兜底行）/ @1374+2（§12 B-002 段）/ @1427（§15 B-005）；DevPlan 仅 @21（B-012 顶部句）/ @49（B-011 调整条）/ @438（RLT_23 验收口径 B-009）/ @450（RLT_24 目标 B-022）/ @452,3（RLT_24 非目标 B-023 + 验收口径 B-010 + 变更范围 B-024）。设计改动仅限文件头、§1.3、§3.2～§3.4、§11、§12、§15；DevPlan 改动仅限顶部相关句、RLT-A-11 条、两卡验收口径行、RLT_24 三句。无多余路径或 hunk。

### 候选 block → 正式文件行号对照

| block | 目标文件 | 行号 | 动作 |
|---|---|---|---|
| B-001 | design/01 §12 | 1370 | 新增兜底类行 |
| B-002 | design/01 §12 末 | 1374 | 新增「两个现场」段 |
| B-003 | design/01 §11.1 | 1331–1338 | 新增 A151～A158 八行 |
| B-004 | design/01 §11 总账 | 1198 | 替换（140→148） |
| B-005 | design/01 §15 | 1427 | 替换「验收 ID 稳定性」行 |
| B-006 | design/01 文件头 | 8 | 新增 planning-event 声明行 |
| B-007 | design/01 文件头 | 10 | 活动声明句追加 RLT-A-11 |
| B-008 | design/01 文件头 | 21 | 新增 RLT-A-11 修订行 |
| B-009 | DevPlan RLT_23 | 438 | 替换「验收口径」行 |
| B-010 | DevPlan RLT_24 | 453 | 替换「验收口径」行 |
| B-011 | DevPlan 调整史 | 49 | 替换 RLT-A-11 调整条 |
| B-012 | DevPlan 顶部 | 21 | 替换「下一步」句（晋级在分支、收口前两卡不开工） |
| B-013 | design/evidence/11-*.md | 全文件（锚点 L15/L50） | 新建证据文件 |
| B-014 | design/01 §11.1 | 1210 | 替换 A2 行（唯一旧行例外） |
| B-015 | design/01 §1.3 | 99 | 替换事件词表行（19→20） |
| B-016 | design/01 §3.2 | 221 | 替换 note 行（加 resource_close 例外） |
| B-017 | design/01 §3.3 | 237 | 替换账本事件层行（19→20） |
| B-018 | design/01 §3.4 | 257 | 新增 resource_close 控制事件行 |
| B-019 | design/01 §3.4 | 299 | 替换 A09「仍是那 19 个词」子句 |
| B-020 | design/01 §3.4 末 | 301–328 | 新增 wire format 段 |
| B-021 | design/01 §12 | 1367–1368 | 替换两类终端空间「删失败怎么办」格 |
| B-022 | DevPlan RLT_24 | 450 | 替换「目标」句 |
| B-023 | DevPlan RLT_24 | 452 | 替换「非目标」句 |
| B-024 | DevPlan RLT_24 | 454 | 替换「变更范围」句 |

- 停止线：本次只完成 C2 晋级写入，不代表 C2-audit / R 复核 / D-start / verify / 验收 / PR / CI / 合并；RLT_23/RLT_24 在本事件合并收口前不开工；evidence/11 的 INCLUDED 记录为 WRITTEN（已写入），PROMOTE=MATCH 结论由 C2-audit 独立判定。

DONE task=RLT-A-11 role=coder node=C2 status=OK ts=2026-09-16T23:58:00+08:00
  summary: B-001~B-024 逐字晋级 design/01 与 DevPlan、新建 evidence/11；逐块 count==1、共用脚本 EVIDENCE_STRUCTURE_AND_FOUR_DELETION_PROBES_OK(6/5/24)、R 机械脚本 A2_EXACT_EXCEPTION_CARD_OWNER_20_WORDS_AND_RLT24_SCOPE_OK、路径只命中允许清单；H10 未动、A2 唯一旧行例外
  artifacts: docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md, docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md, docs/modules/relay-light/design/evidence/11-交叉审核记录-RLT-A11-产物兜底与验收续发.md, docs/modules/relay-light/design/drafts/A11/progress.md

DONE task=RLT-A-11 role=audit node=C2-audit status=APPROVE ts=2026-09-16T23:40:02+08:00
  summary: C2 晋级批检查通过；B-001～B-024 全 MATCH，B-013 事实与回链、脚本反例及路径核验通过，P1=0、P2=0
  artifacts: review.promotion.md

DONE task=RLT-A-11 role=reviewer node=R status=APPROVE ts=2026-09-17T00:01:39+08:00
  summary: R 机械核验全过（R 脚本/共用完整性脚本/PROMOTE 复核/路径/20 词/A2 例外/allowed-paths 逐字），Issue #37 验收含扩界逐条 PASS；test_relay_log 203 用例 OK 且无新增 __pycache__；P1=0、P2=1（DONE 时间戳倒挂记录异常）
  artifacts: docs/modules/relay-light/design/drafts/A11/review.final.md, docs/modules/relay-light/design/drafts/A11/progress.md
