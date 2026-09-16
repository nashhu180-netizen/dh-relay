# RLT-A-11 · 分批 task plan（W1 冻结，Issue #37）

## 共同约束与证据协议

- 以 `brief.md`、`dispatch/README.md` 的 2026-09-16 扩展边界及 `decisions.md` O-005 出口 A 为准；Issue #37 原验收文字保留，扩界按用户裁决解释。以下 C/R 均为**后续节点**，W1d 不执行。所有命令从本 worktree 根运行；设计简称 `D=docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md`，DevPlan 简称 `P=docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md`，草稿根简称 `A=docs/modules/relay-light/design/drafts/A11`。命令块先设置 `D/P/A` 后运行。
- C1 候选稿的每一处拟晋级文本须放在独立的 fenced block 内，以唯一标题 `### B-001`、`### B-002`… 紧邻标明**目标文件、定位锚点、替换或新增、来源**；一个 block 只对应一个可比对的连续文本片段。正文写明版本号与更改对照。C2 必须把 B-013 之外的候选 block 逐字晋级；裁决导致的改字须先回写候选稿，并在 decisions.md 留旧/新逐字对照。B-013 是证据结构合同，仅其明确标注的固定锚点片段逐字晋级，每个固定片段须在 evidence/11 中恰出现一次；五节事实正文按实际发生的复核、裁决及晋级结果填写，受下述完整性判据约束，不对占位全文执行逐字匹配。禁止以占位句、预写 APPROVE 或未来 PROMOTE 结论充当证据。结构沿 A09 候选稿的「目标/事实/条款/影响/开放项/停止线」。
- `progress.md` 首行保持 `<!-- dh:v1 -->`；各执行者追加带批号、对象版本、命令及结果的过程记录。只读 reviewer 各自写独立审核报告；编排负责用户裁决。审核报告只记审核事实，不代签人验。
- 每批末用 `git status --short` 核对写入路径。**不得**将 `git diff --stat` 单独当作路径闸：新建文件未纳入 diff，须并查 `git ls-files --others --exclude-standard`。不跑实现测试；若因具体风险需跑，设置 `PYTHONDONTWRITEBYTECODE=1`，不删现存 `__pycache__`。

## C1 · 候选稿（coder）

- **目标**：拟定可逐字晋级的完整 A-adjust，不改正式文件。
- **写入**：`$A/A11-候选.md`、`$A/progress.md`；范围外项仅进 `$A/findings.md`。
- **具体动作**：
  1. 在候选稿列出 `git ls-files` 证据表：真计划 `relay/rlt12-win-01/dispatch/monitor-{W1,C1,C2,R1,X1,F1}.md` 六份 → 计划目录随目录保留；`workspace/RLT_21/done.*.md` 十五份、`brief.md`、`task_plan.md`、`execution_strategy.md`、`lesson_candidates.md` → 工作区随目录保留；`workspace/RLT_12/evidence/` 的实际文件 → 工作区随目录保留。逐类映射设计 §12 现有行或拟增兜底行，写明前六类无遗漏的结论。
  2. 写 §12 表尾兜底类的**逐字行**；选择职责分层落点（§12 或账本章节），给理由、逐字正文、`HC-RL-H10` 回链及 `commit=` 顺手旁注/squash 失效不破约句。把「H10 命题列是否同步改」列为开放项，默认不改该列。
  3. 从 `HC-RL-A151` 连续续号，至少分别承接 RLT_23 的四条纪律：通知投递确认、按主控侧区分 Codex 启动档位、`agent_lost` 不凭 pane 状态单源、F 阶段删树确认；RLT_24 的四个独立命题：`resource_close` 事件 schema 合法性、`lint` 对 `outcome=failed` 的分校验、§12「删失败怎么办」取证路径可执行、旧账本含 71 行真计划账本仍 `lint ok`。每条完整写「验收项」和「怎么证明」，给正反例/结构检查命令；如果再拆分或合并，须按独立失败断言给理由，避免一行不可判的复合条。候选稿另设唯一归属清单，每个新 ID 恰写一行 `OWNER HC-RL-A151 RLT_23` 或 `OWNER HC-RL-A155 RLT_24`（数字按最终续号），供 C2/R 按卡验收行核验；清单不得靠 DevPlan 顶部或 RLT-A-11 条推断。
  4. 写出 §11 总账数字及沿革句、§15「验收 ID 稳定性」行、文件头 `dh:planning-event:v1 id=RLT-A-11 stage=A-adjust` 声明与修订行、DevPlan RLT_23/RLT_24「验收口径」行、「RLT-A-11 调整」条及顶部「现状/下一步」相关句的全部拟改**逐字文本**。出口 A 另须覆盖设计 §0.1 / §3.2～§3.4 的第 20 词、note 子协议、A09 沿革句、**A2 唯一旧行替换**、§12 两类终端空间取证单元格，以及 DevPlan RLT_24 目标/非目标/变更范围三句；RLT_24 allowed-paths 行不动。两卡各自的「验收口径」行须逐个列出归属清单里的 ID，不用 `A151~` 范围缩写代替。声明的 `review=` 和 `understanding=` 都指向拟新建 `design/evidence/11-*.md` 的可解析锚点；参考 design/01 第 6–7 行与 evidence/10 第 13–15 行。
  5. 开放项表逐项用唯一首列 `| O-001 |`、`| O-002 |`… 给两个可点选候选、本稿倾向、理由、不同裁决会改哪些 block；`decisions.md` 2026-09-16 已逐项记录 O-001～O-005 全选 A，其中 O-005 扩界只允许修改旧验收行 A2，H10 依 O-001 保持原行不变。设计未完成之前不得把候选写成已生效事实。
- **完成判据（命令/逐字比对）**：
  ```bash
  A=docs/modules/relay-light/design/drafts/A11
  test -s "$A/A11-候选.md"
  test "$(git ls-files 'docs/modules/relay-light/relay/rlt12-win-01/dispatch/monitor-*.md' | wc -l)" -eq 6
  test "$(git ls-files 'docs/modules/relay-light/workspace/RLT_21/done.*.md' | wc -l)" -eq 15
  git ls-files 'docs/modules/relay-light/workspace/RLT_12/evidence/**' | rg -q .
  rg -q 'HC-RL-A151' "$A/A11-候选.md"
  rg -q 'HC-RL-H10' "$A/A11-候选.md"
  git diff --quiet -- docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md
  ```
  另将候选证据表中的每个实际 `git ls-files` 路径逐行与上述三组命令输出比对；缺一个路径即未过 C1。
- **证据落点**：候选稿的「实际清单/映射」「逐字晋级文本」「开放项」三节，`progress.md` 的 C1 记录。
- **审核方式**：交 fresh reviewer 全面独立审，不由 coder 自审。

## C1-audit · fresh 全面审核（reviewer）

- **目标**：对候选稿及来源做独立事实、原子性、授权边界和可执行性审核。
- **写入**：仅 `$A/review.fresh-01.md`、按派活要求的审核完成信号；不改候选或正式文件。
- **具体动作**：fresh 读 Issue #37、F-001/F-002、RLT_23/RLT_24、`decisions.md` O-005、设计 §0.1/§3.2～§3.4/A2/§11/§12/§15、A09 先例与候选稿。报告用 A09 `design/drafts/A09-复核记录-fresh-01.md` 的**三段格式：结论；P1（阻断）；P2（不阻断）**。每项附候选稿行号、权威来源、可执行整改动作。特别核真计划路径映射、H10 人判尺子、A2 精确例外、20 词与 note 协议、A151~ 原子性、RLT_24 历史兼容及卡合同分工、文件头锚点和允许路径。
- **完成判据**：`test -s "$A/review.fresh-01.md" && rg -q '^## 结论$' "$A/review.fresh-01.md" && rg -q '^## P1（阻断）$' "$A/review.fresh-01.md" && rg -q '^## P2（不阻断）$' "$A/review.fresh-01.md"`；报告结论须逐字为 `APPROVE` 或 `REVISE`，列 P1/P2 数量。
- **证据落点**：`review.fresh-01.md`。
- **审核方式**：fresh reviewer 独立只读复核；REVISE 时转 C1b，APPROVE 仍须完成用户开放项裁决。

## C1b · 整改（仅 fresh 为 REVISE 时，原 coder）

- **目标**：逐项闭合 fresh P1/P2，不夹带新设计方向。
- **写入**：`$A/A11-候选.md`、`$A/progress.md`、`$A/fix.fresh-01.md`。
- **具体动作**：按审核编号写「原文/新文/对应候选稿行/验证命令」对照，更新版本与逐字 block；争议写开放项不擅定。
- **完成判据**：`test -s "$A/fix.fresh-01.md" && test -s "$A/A11-候选.md"`；用 `rg -o '^(### )?P[12]-[0-9]+' "$A/review.fresh-01.md" | sort -u` 与整改对照中的编号集合逐字比对，要求前者每项均有对应闭合行。
- **证据落点**：`fix.fresh-01.md`、候选稿版本记录、`progress.md`。
- **审核方式**：交 RV 定向复审；不得自报审核通过。

## RV · 定向复审（fresh 审有 P1/P2 且完成 C1b 时）

- **目标**：只核 fresh 所列 P1/P2 是否在新版候选中闭合。
- **写入**：仅 `$A/review.targeted-02.md`、按派活要求的独立审核信号。
- **具体动作**：fresh 报告每项用 `### P1-1：…` 等标题；定向复审对每个标题编号恰写一条独立终态行 `TARGET P1-1 status=CLOSED` 或 `TARGET P1-1 status=OPEN`，其下写候选行号与证据。若仍 OPEN，退 C1b 再改并开启下一次定向复审，不直接晋级。
- **完成判据**：从 fresh 标题提取编号，与 `TARGET` 行编号集合精确相等、无重复、状态全为 `CLOSED`。以下脚本同时证明：说明文字含 `OPEN` 仍通过，缺一项或一项为 `OPEN` 均失败。
  ```bash
  A=docs/modules/relay-light/design/drafts/A11
  A="$A" python3 - <<'PY'
  import os, re
  from pathlib import Path
  a = Path(os.environ['A'])
  fresh = (a/'review.fresh-01.md').read_text()
  report = (a/'review.targeted-02.md').read_text()
  expected = re.findall(r'^### (P[12]-\d+)[:：]', fresh, re.M)
  assert expected and len(expected) == len(set(expected)), 'fresh 编号缺失或重复'
  line = re.compile(r'^TARGET (P[12]-\d+) status=(CLOSED|OPEN)$', re.M)
  def valid(s):
      found = line.findall(s)
      return (len(found) == len(expected) and
              len({i for i, _ in found}) == len(found) and
              {i for i, _ in found} == set(expected) and
              all(state == 'CLOSED' for _, state in found))
  assert valid(report), '定向复审缺项、重复或未闭合'
  assert valid(report + '\n说明：无 OPEN 项。\n')
  sample = line.search(report)
  assert sample and not valid(report[:sample.start()] + report[sample.end():]), '缺一项反例未被拒'
  assert not valid(report[:sample.start()] + sample.group(0).replace('status=CLOSED', 'status=OPEN') + report[sample.end():]), 'OPEN 反例未被拒'
  print('RV_RECORDS_OK', sorted(expected))
  PY
  ```
- **证据落点**：`review.targeted-02.md`。
- **审核方式**：独立定向 reviewer，只判既有问题，不代替用户裁决。

## D1 · 用户裁决开放项（编排）

- **目标**：让用户逐项点选未定产品决定，使晋级文本定稿。
- **写入**：`$A/decisions.md`；若裁决使文本改变，由 coder 更新 `$A/A11-候选.md` 和逐字对照，审核范围由编排按改动决定是否再复审。
- **具体动作**：对候选稿每个 `O-…` 开放项恰写一条独立终态行 `DECISION O-001 status=CHOSEN option=A`（或 `option=B`），未决项写 `DECISION O-001 status=OPEN option=-`；行下另记用户原话/日期、受影响 block、旧文/新文。`decisions.md` 已记录 2026-09-16 O-001～O-005 全选 A；H10 行不改，O-005 按出口 A 只允许 A2 旧行精确替换。若后续出现未答复的新开放项，不得替签或晋级；偏离已选方向须另行裁决与复审。
- **完成判据**：从候选稿开放项表首列提取编号，与 `DECISION` 行编号集合精确相等、无重复、状态全为 `CHOSEN` 且选项为 A/B；偏离推荐项时另须有对应 `review.targeted-*.md` 的逐项 `CLOSED` 结论。以下脚本证明说明文字含 `OPEN` 不误伤，缺一项或某项 `OPEN` 均失败。
  ```bash
  A=docs/modules/relay-light/design/drafts/A11
  A="$A" python3 - <<'PY'
  import os, re
  from pathlib import Path
  a = Path(os.environ['A'])
  candidate = (a/'A11-候选.md').read_text()
  report = (a/'decisions.md').read_text()
  expected = re.findall(r'^\| (O-\d+) \|', candidate, re.M)
  assert expected and len(expected) == len(set(expected)), '开放项编号缺失或重复'
  line = re.compile(r'^DECISION (O-\d+) status=(CHOSEN|OPEN) option=(A|B|-)$', re.M)
  def valid(s):
      found = line.findall(s)
      return (len(found) == len(expected) and
              len({i for i, _, _ in found}) == len(found) and
              {i for i, _, _ in found} == set(expected) and
              all(state == 'CHOSEN' and option in {'A','B'} for _, state, option in found))
  assert valid(report), '开放项裁决缺项、重复或未决'
  assert valid(report + '\n说明：没有 OPEN 项。\n')
  sample = line.search(report)
  assert sample and not valid(report[:sample.start()] + report[sample.end():]), '缺一项反例未被拒'
  assert not valid(report[:sample.start()] + re.sub(r'status=CHOSEN option=[AB]', 'status=OPEN option=-', sample.group(0)) + report[sample.end():]), 'OPEN 反例未被拒'
  print('DECISION_RECORDS_OK', sorted(expected))
  PY
  ```
- **证据落点**：`decisions.md`、候选稿改稿对照、必要的定向复审报告。
- **审核方式**：编排核用户原话；偏离推荐项交独立 reviewer 定向核改稿。

## C2 · 晋级正式文件（coder）

- **目标**：将已审核、已裁决的候选文本逐字晋级，无夹带。
- **写入**：`$D`；新建 `docs/modules/relay-light/design/evidence/11-交叉审核记录-RLT-A11-<短名>.md` 一份；`$P` **仅**限 dispatch 指定行；过程记 `$A/progress.md`。不得改别的文件。
- **具体动作**：按已裁决候选 block 写设计 §0.1、§3.2～§3.4（第 20 控制词 `resource_close`、note 子协议与 A09 沿革句）、§11 的 A2 精确替换及 A151~、总账、§12 兜底/职责段/两类终端空间失败取证单元格、§15、文件头；H10 行依 O-001 一字不改。DevPlan 仅改 RLT_23/RLT_24 验收行、RLT-A-11 条、顶部相关句及 RLT_24 的**目标/非目标/变更范围三句**；RLT_24 allowed-paths 行与 master 逐字不变。evidence/11 按 evidence/10 的「触发事实、复核与整改、用户裁决、晋级清单、停止线」结构，加入 `<!-- dh:planning-evidence:v1 event=RLT-A-11 artifact=design/01-RelayLight-产品设计与验收.md kind=review -->` 及声明引用的 `review/understanding` 锚点。逐项记候选 block 与正式段落对照。新事件能力只作设计合同，当前实现仍为 19 词，实现归 RLT_24。
- **完成判据**：`rg -q 'dh:planning-event:v1 id=RLT-A-11 stage=A-adjust' "$D"`；`rg -q 'HC-RL-A151' "$D"`；`rg -q 'HC-RL-H10' "$D"`；`rg -q 'dh:planning-evidence:v1 event=RLT-A-11' docs/modules/relay-light/design/evidence/11-*.md`。对 B-013 以外每个候选 block 运行既有 count(候选 block 原文) == 1 检查；对 B-013 分别检查两个固定锚点片段 count == 1，不对完整 evidence 文件作候选全文匹配。evidence/11 必须包含触发事实、复核与整改、用户裁决、晋级清单、停止线五节；复核与整改逐项覆盖 fresh 的全部 P1/P2 编号，回链真实存在的复审报告及 CLOSED 记录；用户裁决逐项覆盖候选全部 O-ID，引用 decisions.md 的 CHOSEN 行和用户原话/日期，不得以本决策建议代替用户裁决。晋级清单逐项覆盖候选全部 B-ID，列出真实目标文件与可定位锚点/行号，并附本批逐字/结构核验结果；不得要求或宣称尚未发生的 C2-audit PROMOTE 结果。缺节、缺项、重复项、失效回链、未决事项或残留“按实际填”等占位句即失败。C2-audit 的实际结论写入 review.promotion.md，R 批读取该报告；C2 不预写未来复核结果。**C2 运行下方 R 批的 A2 精确例外、按卡验收行、20 词四处一致及 DevPlan RLT_24 allowed-paths 行不变检查**；另跑 R 批的编号与路径核验，失败即停止晋级。路径审查须覆盖新增设计小节/单元格及 DevPlan 三句，禁止碰设计别节、RLT_24 allowed-paths 或实现文件。
- **evidence/11 可解析记录合同（C2 写入，C2-audit 独立核）**：五节标题分别为 `## 一、触发事实`、`## 二、复核与整改`、`## 三、用户裁决`、`## 四、晋级清单`、`## 五、停止线`。第二节每个 fresh P1/P2 恰一行 `CLOSE P1-1 status=CLOSED review=review.targeted-02.md#L42`，所指行须是该编号的 `TARGET … status=CLOSED`；第三节每个 O-ID 恰一行 `DECIDED O-001 status=CHOSEN decision=decisions.md#L9`，所指行须是该编号的 `DECISION … status=CHOSEN option=A|B`，原话与日期仍须人工复核；第四节每个 B-ID 恰一行 `INCLUDED B-001 status=WRITTEN target=docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md#L1329`，指向实有文件与非空行，该状态仅表明 C2 已写入，**不是**未来 C2-audit 的 `PROMOTE … status=MATCH`。固定片段各恰一行 `ANCHOR review-rlt-a11 status=EXACT line=15`、`ANCHOR understanding-rlt-a11 status=EXACT line=80`，行号指向 evidence/11 自身的真实锚点；两个片段的逐字内容以候选 B-013 为准。行号示例须换成实际行号，不得照抄占位数。四类记录只用上述整行格式，编号与状态不得写在解释句中冒充记录。
- **C2 与 C2-audit 共用的完整性校验**：从工作树根运行下段原样命令；同一 `validate` 函数核实际 evidence 与四种内存删项反例。脚本判结构与可解析回链；C2-audit 另逐条对照真实复核、用户原话、正式 diff，不能只凭记录行给 MATCH。
  ```bash
  python3 - <<'PY'
  import re
  from pathlib import Path

  root = Path('docs/modules/relay-light')
  a = root/'design/drafts/A11'
  evidence_files = list((root/'design/evidence').glob('11-*.md'))
  assert len(evidence_files) == 1, 'evidence/11 文件必须恰一份'
  evidence = evidence_files[0].read_text()
  candidate = (a/'A11-候选.md').read_text()
  fresh = (a/'review.fresh-01.md').read_text()
  decisions = (a/'decisions.md').read_text()
  expected_p = re.findall(r'^### (P[12]-\d+)[:：]', fresh, re.M)
  expected_o = re.findall(r'^\| (O-\d+) \|', candidate, re.M)
  expected_b = re.findall(r'^### (B-\d+)\b', candidate, re.M)
  for label, ids in [('fresh', expected_p), ('O-ID', expected_o), ('B-ID', expected_b)]:
      assert ids and len(ids) == len(set(ids)), f'{label} 来源编号缺失或重复'

  fixed_review = '<a id="review-rlt-a11"></a>\n\n<!-- dh:planning-evidence:v1 event=RLT-A-11 artifact=design/01-RelayLight-产品设计与验收.md kind=review -->'
  fixed_understanding = '<a id="understanding-rlt-a11"></a>'
  formats = {
      'CLOSE': re.compile(r'^CLOSE (P[12]-\d+) status=(CLOSED|OPEN) review=([A-Za-z0-9._-]+\.md)#L([1-9]\d*)$', re.M),
      'DECIDED': re.compile(r'^DECIDED (O-\d+) status=(CHOSEN|OPEN) decision=(decisions\.md)#L([1-9]\d*)$', re.M),
      'INCLUDED': re.compile(r'^INCLUDED (B-\d+) status=(WRITTEN|OPEN) target=(docs/modules/relay-light/[^\s#]+\.md)#L([1-9]\d*)$', re.M),
      'ANCHOR': re.compile(r'^ANCHOR (review-rlt-a11|understanding-rlt-a11) status=(EXACT|OPEN) line=([1-9]\d*)$', re.M),
  }
  def line_at(s, number):
      lines = s.splitlines()
      n = int(number)
      assert 1 <= n <= len(lines), f'回链行号不存在：{number}'
      return lines[n-1]
  def records(body, kind, expected, state):
      matches = formats[kind].findall(body)
      assert len(re.findall(r'^' + kind + r'\b', body, re.M)) == len(matches), f'{kind} 记录格式非法'
      ids = [m[0] for m in matches]
      assert len(ids) == len(set(ids)) and set(ids) == set(expected), f'{kind} 缺项、重复或多项'
      assert all(m[1] == state for m in matches), f'{kind} 存在未终局状态'
      return matches
  def validate(body):
      marks = list(re.finditer(r'^## [一二三四五]、([^\n]+)$', body, re.M))
      headings = [m.group(1) for m in marks]
      assert headings == ['触发事实','复核与整改','用户裁决','晋级清单','停止线'], '五节缺失、错序或重复'
      sections = {m.group(1): body[m.end(): marks[i+1].start() if i+1 < len(marks) else len(body)] for i, m in enumerate(marks)}
      assert body.count(fixed_review) == 1 and body.count(fixed_understanding) == 1, 'B-013 固定锚点片段缺失或重复'
      assert '按实际填' not in body, '占位句残留'
      close = records(sections['复核与整改'], 'CLOSE', expected_p, 'CLOSED')
      decided = records(sections['用户裁决'], 'DECIDED', expected_o, 'CHOSEN')
      included = records(sections['晋级清单'], 'INCLUDED', expected_b, 'WRITTEN')
      anchors = records(sections['晋级清单'], 'ANCHOR', ['review-rlt-a11','understanding-rlt-a11'], 'EXACT')
      for kind, found in [('CLOSE',close),('DECIDED',decided),('INCLUDED',included),('ANCHOR',anchors)]:
          assert len(re.findall(r'^' + kind + r'\b', body, re.M)) == len(found), f'{kind} 记录跑到错误章节'
      for item, _, name, number in close:
          path = a/name
          assert path.is_file(), f'{item} 复审文件不存在'
          assert line_at(path.read_text(), number) == f'TARGET {item} status=CLOSED', f'{item} CLOSED 回链无效'
      for item, _, name, number in decided:
          assert name == 'decisions.md' and re.fullmatch(r'DECISION ' + item + r' status=CHOSEN option=[AB]', line_at(decisions, number)), f'{item} 用户裁决回链无效'
      for item, _, name, number in included:
          path = Path(name)
          assert path.is_file() and line_at(path.read_text(), number).strip(), f'{item} 晋级目标文件/行号无效'
      anchor_text = {'review-rlt-a11':'<a id="review-rlt-a11"></a>', 'understanding-rlt-a11':fixed_understanding}
      for item, _, number in anchors:
          assert line_at(body, number) == anchor_text[item], f'{item} 行号未指向锚点'
      return True

  assert validate(evidence)
  deletions = [
      ('固定锚点', fixed_review),
      ('问题闭合', formats['CLOSE'].search(evidence).group(0)),
      ('用户裁决', formats['DECIDED'].search(evidence).group(0)),
      ('晋级清单', formats['INCLUDED'].search(evidence).group(0)),
  ]
  for label, fragment in deletions:
      mutated = evidence.replace(fragment, '', 1)
      try:
          validate(mutated)
      except AssertionError:
          pass
      else:
          raise AssertionError(f'{label} 内存删项反例未被拒')
  print('EVIDENCE_STRUCTURE_AND_FOUR_DELETION_PROBES_OK', len(expected_p), len(expected_o), len(expected_b))
  PY
  ```
- **证据落点**：`evidence/11-*.md` 晋级清单、`$A/progress.md`。
- **审核方式**：交 C2-audit 对照候选 + decisions，不由 coder 自审。

## C2-audit · 晋级批检查（reviewer）

- **目标**：确认正式差异等于定稿候选 + 用户裁决，零夹带。
- **写入**：仅 `$A/review.promotion.md`、按派活要求的独立审核信号。
- **具体动作**：对 B-013 之外的候选 block 逐字比对正式文件；对 B-013 核对两个固定锚点片段各恰出现一次，并独立复核 C2 的五节证据完整性判据。仅在固定片段匹配与事实证据完整性同时通过时记录 PROMOTE B-013 status=MATCH，否则记录 PROMOTE B-013 status=MISMATCH。B-013 仍计入候选 B-ID 集合，不能通过删掉这一项使集合检查通过。对每个 `B-…` 标题恰写一条独立终态行 `PROMOTE B-001 status=MATCH` 或 `PROMOTE B-001 status=MISMATCH`，行下记正式文件行号及差异证据。检查 evidence/11 事实与锚点、DevPlan 允许句；扫描 working/untracked 路径。
- **完成判据**：**先运行 C2 的共用完整性脚本并记录通过输出**，再做候选 block 标题编号与 `PROMOTE` 行集合精确相等、无重复、状态全 `MATCH` 的本批检查；`git diff --stat` 与 `git ls-files --others --exclude-standard` 只命中 README 允许路径。下方脚本证明说明文字含 `MISMATCH` 不误伤，缺一项或某项 `MISMATCH` 均失败。共用脚本须记录 B-013 两固定片段计数、fresh 问题编号覆盖、O-ID 裁决覆盖、B-ID 晋级清单覆盖和文件/行号可解析，并以同一 `validate` 跑四种内存删项反例；本批还须人工复核证据事实与回链内容，不能仅凭 `PROMOTE B-013 status=MATCH` 字面行认定事实完整。
  ```bash
  A=docs/modules/relay-light/design/drafts/A11
  A="$A" python3 - <<'PY'
  import os, re
  from pathlib import Path
  a = Path(os.environ['A'])
  candidate = (a/'A11-候选.md').read_text()
  report = (a/'review.promotion.md').read_text()
  expected = re.findall(r'^### (B-\d+)\b', candidate, re.M)
  assert expected and len(expected) == len(set(expected)), '候选 block 编号缺失或重复'
  line = re.compile(r'^PROMOTE (B-\d+) status=(MATCH|MISMATCH)$', re.M)
  def valid(s):
      found = line.findall(s)
      return (len(found) == len(expected) and
              len({i for i, _ in found}) == len(found) and
              {i for i, _ in found} == set(expected) and
              all(state == 'MATCH' for _, state in found))
  assert valid(report), '晋级审核缺项、重复或不匹配'
  assert valid(report + '\n说明：无 MISMATCH 项。\n')
  sample = line.search(report)
  assert sample and not valid(report[:sample.start()] + report[sample.end():]), '缺一项反例未被拒'
  assert not valid(report[:sample.start()] + sample.group(0).replace('status=MATCH', 'status=MISMATCH') + report[sample.end():]), 'MISMATCH 反例未被拒'
  print('PROMOTION_RECORDS_OK', sorted(expected))
  PY
  ```
- **证据落点**：`review.promotion.md`。
- **审核方式**：独立 reviewer，发现偏差退 coder 修复并重审。

## R · 开发后复核与机械核验（reviewer）

- **目标**：对晋级后的设计与 DevPlan 做一致性复核，不把规划完成写成两卡已开工或已验收。
- **写入**：仅 `$A/review.final.md`、按派活要求的独立完成信号。
- **具体动作**：执行下列命令，报告每条退出码与输出摘要；将设计 A151~ 与 RLT_23/RLT_24 卡片引用逐项对照，检查 §11 活动数 = 旧 140 + 实际新 AI 条数（A2 替换不增条目）、§15 沿革、§12 兜底/两格取证及 H10 回链、planning-event 的 evidence 锚点可定位。按出口 A 核事件词表计数行（现位于 §1.3；此前 dispatch 称 §0.1）、§3.3、§3.4、A2 四处 20 词一致；§3.4 A09 段旧“仍是那 19 个词”必须被批准的新沿革句替换。另核 §3.2 note 协议与 RLT_24 allowed-paths 原样保留。
- **完成判据（机械脚本）**：
  ```bash
  D=docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md
  P=docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md
  A=docs/modules/relay-light/design/drafts/A11
  python3 - <<'PY'
  import re, subprocess
  from pathlib import Path
  d = Path('docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md')
  old = subprocess.check_output(['git','show',f'origin/master:{d}'], text=True)
  new = d.read_text()
  a2 = 'HC-RL-A2'
  old_a2 = '| HC-RL-A2 | 账本事件层 19 词白名单 fail closed | 单测：19 个合法词全过；未知词退出码 2 且不落盘 |'
  approved_a2 = '| HC-RL-A2 | 账本事件层 20 词白名单 fail closed（原 19 词加 resource_close；新增词的实现由 RLT_24 承接） | 单测：20 个合法词以各自合法上下文和字段通过；未知词退出码 2 且不落盘 |'
  def rows(s):
      pairs = [(m.group(1), m.group(0)) for m in re.finditer(r'^\| (HC-RL-[AH]\d+) \|.*$', s, re.M)]
      assert len(pairs) == len(dict(pairs)), '验收 ID 行重复'
      return dict(pairs)
  before = rows(old)
  assert before.get(a2) == old_a2, '冻结 master 基线的原 A2 与预期不符'
  def valid_old_rows(s):
      after_rows = rows(s)
      return (after_rows.get(a2) == approved_a2 and
              all(after_rows.get(k) == v for k, v in before.items() if k != a2))
  assert valid_old_rows(new), 'A2 非批准逐字行，或 A2 以外旧验收 ID 行有变动'
  after = rows(new)
  other = next(k for k in before if k != a2)
  changed_other = new.replace(after[other], after[other] + ' 非授权改字', 1)
  assert not valid_old_rows(changed_other), '改动 A2 以外旧行的反例未被拒'
  changed_a2 = new.replace(approved_a2, approved_a2.replace('20 词白名单', '21 词白名单', 1), 1)
  assert not valid_old_rows(changed_a2), 'A2 写成非批准文本的反例未被拒'
  added = set(after) - set(before)
  ids = sorted(int(k.removeprefix('HC-RL-A')) for k in added if k.startswith('HC-RL-A'))
  assert ids and ids == list(range(151, 151+len(ids))), '新 AI ID 不从 A151 连续续号'
  assert len(re.findall(r'^\| HC-RL-A\d+ \|', new, re.M)) == len({k for k in after if k.startswith('HC-RL-A')}), 'AI 表内 ID 重复'
  assert len(re.findall(r'^\| HC-RL-H\d+ \|', new, re.M)) == len({k for k in after if k.startswith('HC-RL-H')}), '人验表内 ID 重复'
  candidate = Path('docs/modules/relay-light/design/drafts/A11/A11-候选.md').read_text()
  owner_rows = re.findall(r'^OWNER (HC-RL-A\d+) (RLT_23|RLT_24)$', candidate, re.M)
  owner = dict(owner_rows)
  new_ids = {f'HC-RL-A{i}' for i in ids}
  assert len(owner_rows) == len(owner) and set(owner) == new_ids, '候选归属清单须逐个且仅覆盖新增 ID'
  assert all(sum(card == c for c in owner.values()) >= 4 for card in ('RLT_23','RLT_24')), '两卡各自至少四条原子验收'
  p = Path('docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md').read_text()
  def card_refs(body, card):
      section = re.search(r'(?ms)^#### ' + re.escape(card) + r'\b[^\n]*\n(.*?)(?=^#### |\Z)', body)
      if not section: return None
      lines = re.findall(r'^- \*\*验收口径\*\*：[^\n]*$', section.group(1), re.M)
      if len(lines) != 1: return None
      return set(re.findall(r'HC-RL-A\d+', lines[0]))
  def cards_ok(body):
      return all(card_refs(body, card) == {i for i, c in owner.items() if c == card}
                 for card in ('RLT_23','RLT_24'))
  assert cards_ok(p), 'RLT_23/RLT_24 验收口径行缺归属 ID 或误领对方 ID'
  for card in ('RLT_23','RLT_24'):
      section = re.search(r'(?ms)^#### ' + re.escape(card) + r'\b[^\n]*\n(.*?)(?=^#### |\Z)', p)
      line = re.search(r'^- \*\*验收口径\*\*：[^\n]*$', section.group(1), re.M).group(0)
      fake = p.replace(line, '- **验收口径**：待续发。', 1)
      assert not cards_ok(fake), f'{card} 仅顶部/RLT-A-11 条提及 ID 的反例未被拒'
  def design_section(body, number):
      section = re.search(r'(?ms)^### ' + re.escape(number) + r'\b[^\n]*\n(.*?)(?=^### |^## |\Z)', body)
      assert section, f'缺设计 §{number}'
      return section.group(1)
  old_a09 = '**账本事件层词表不变**——仍是那 19 个词，信号落在 `checkpoint` 现有的合法迁移里'
  approved_a09 = '**账本事件层词表在 RLT-A-09 当时未扩展**——信号落在 `checkpoint` 现有的合法迁移里（RLT-A-11 新增 `resource_close` 后词表为 20 词，送审信号仍使用 `checkpoint`）'
  def valid_word_count(body):
      s33, s34 = design_section(body, '3.3'), design_section(body, '3.4')
      return (bool(re.search(r'(?m)^\| 事件词表 \| 20 个[^\n]*$', body)) and
              bool(re.search(r'20\s*(?:个|词)', s33)) and
              bool(re.search(r'20\s*(?:个|词)', s34)) and
              approved_a2 in body and
              s34.count(approved_a09) == 1 and
              old_a09 not in s34 and
              not re.search(r'仍是(?:那\s*)?19\s*(?:个|词)', s34))
  assert valid_word_count(new), '四处 20 词口径或 §3.4 A09 沿革句不一致'
  stale_a09 = new.replace(approved_a09, approved_a09 + '；' + old_a09, 1)
  assert not valid_word_count(stale_a09), '新 20 词行存在但 A09 旧 19 词句残留的反例未被拒'
  assert 'resource_close' in design_section(new, '3.2'), '§3.2 缺事件专属 note 协议'
  assert 'resource_close' in design_section(new, '3.4'), '§3.4 缺第 20 控制事件'
  def card_section(body, card):
      section = re.search(r'(?ms)^#### ' + re.escape(card) + r'\b[^\n]*\n(.*?)(?=^#### |\Z)', body)
      assert section, f'缺 {card} 卡'
      return section.group(1)
  old_p = subprocess.check_output(['git','show','origin/master:docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md'], text=True)
  old_card, new_card = card_section(old_p, 'RLT_24'), card_section(p, 'RLT_24')
  allowed = lambda s: re.search(r'(?ms)^- \*\*允许路径\*\*：[^\n]*\n.*?(?=^- \*\*档位\*\*：)', s).group(0)
  assert allowed(new_card) == allowed(old_card), 'RLT_24 allowed-paths 行及其三条路径相对 master 有变动'
  for field in ('目标','非目标','变更范围'):
      pattern = r'^- \*\*' + field + r'\*\*：[^\n]*$'
      old_line = re.search(pattern, old_card, re.M)
      new_line = re.search(pattern, new_card, re.M)
      assert old_line and new_line and old_line.group(0) != new_line.group(0), f'RLT_24 {field} 句未按出口 A 改写'
  assert 'dh:planning-event:v1 id=RLT-A-11 stage=A-adjust' in new
  print('A2_EXACT_EXCEPTION_CARD_OWNER_20_WORDS_AND_RLT24_SCOPE_OK', sorted(new_ids))
  PY
  rg -n '20 个|20 词' "$D"  # 逐行展示事件词表行（现 §1.3）、§3.3、§3.4、A2；上方脚本逐处断言
  git diff --stat
  git ls-files --others --exclude-standard
  git diff --check
  ```
  再逐字读取 planning-event 的 `review=`/`understanding=` 目标，`test -f` 对应 evidence/11 文件并 `rg -q` 两个锚点；执行 `git diff --unified=0 -- "$D" "$P"`，逐 hunk 对照已裁决候选 block，设计修改仅限文件头、§0.1、§3.2～§3.4、§11 总账/A2/A151～、§12、§15，DevPlan 修改仅限顶部相关句、RLT-A-11 条、两卡验收行与 RLT_24 目标/非目标/变更范围三句。路径清单只允许 `dispatch/README.md` 列出的四类路径，任何多余路径或 hunk 判 FAIL；RLT_24 allowed-paths 另由上述脚本逐字守门。
- **证据落点**：`review.final.md` 中命令/退出码、ID 差集、逐项对照表。
- **审核方式**：独立 reviewer 只读；若失败回对应 C2 整改并复审。R 通过也不等于 D-start、PR/CI/合并、verify 或人验。

## 分批理由与后续出口

按「候选 → fresh 三段审核 → 整改 → 定向复审 → 用户裁决 → 晋级 → 批检查 → 开发后复核」切为 **8 批**；C1b/RV 仅在 fresh 有问题时实际运行，偏离推荐项另加窄复审。这使每个写入批都有独立的输入版本和证据，尤其不让 C2 晋级掩盖候选审核。A09 的候选稿/`evidence/10` 是结构先例；Issue #37 的 PR、CI 三硬门、master 回填与删树由编排在 R 后另行推进，本 W1 不授权远端动作。

## W1b 整改对照

| 原项 | 改动位置 | 改动摘要 |
|---|---|---|
| W2 #1（P2） | `brief.md`「目标与来源」F-002 | 将“用户裁决原话”改为“所载裁决要点”，保留既有职责分层含义。 |
| W2 #2（P1） | 本计划 C1 第 3/4 项、C2 完成判据、R 机械脚本 | 候选稿冻结逐 ID 的 RLT_23/RLT_24 归属；按两卡区块内各自「验收口径」行断言完整引用且不误领；反例移除卡内 ID、仅留顶部或 RLT-A-11 条提及时必须失败。 |
| W2 #6（P1） | 本计划 C1 编号约定、RV、D1、C2-audit | 固定 `TARGET`/`DECISION`/`PROMOTE` 终态行；按审核项、开放项、候选 block 的编号集合逐一比较并拒重复/缺项/非成功状态；各脚本含说明文字、缺项、OPEN/MISMATCH 反例。 |

## W1c 整改对照（decision.1 §3 / fresh P1-4）

| 原项 | 改动位置 | 改动摘要 |
|---|---|---|
| §3.1 | 共同约束第 2 条 | B-013 改为证据结构合同，仅两个固定锚点片段逐字晋级；五节事实正文独立校验，禁止预写未来结论。 |
| §3.2 | C2 完成判据 | B-013 固定锚点分别计数，五节内容按问题、裁决、晋级清单及回链完整性核验；C2 不预写 C2-audit 结果。 |
| §3.3 | C2-audit 具体动作与完成判据 | B-013 仍参加 B-ID 集合；固定片段和事实完整性同时通过才记 MATCH，四类内存删项反例须失败。 |

## W1d 整改对照（O-005 出口 A）

| 原项 | 改动位置 | 改动摘要 |
|---|---|---|
| O-005 设计合同扩界 | `brief.md` 目标/验收扩界/边界与本计划 C1、C2 | 本事件冻结 `resource_close` 第 20 控制词及 note 子协议，覆盖 §0.1、§3.2～§3.4、A2、§12 两格；实现归 RLT_24。 |
| O-005 A2 唯一旧行例外 | 本计划 C2/R 完成判据 | 原 A2 校验冻结 master 逐字行，新 A2 校验 `decision.1.md` §1.3 批准逐字行，其余旧验收行逐字不变；两类反例必须失败。 |
| O-005 卡合同与路径 | `brief.md` 允许路径/非目标、本计划 C2 写入与 R 核验 | DevPlan 扩到 RLT_24 目标/非目标/变更范围三句；allowed-paths 相对 master 原样，C2/R 核四处 20 词与新增 hunk 范围。 |

## W1e 整改对照

| 原项 | 改动位置 | 改动摘要 |
|---|---|---|
| W2 第 3 轮 #4（P1） | C2 完成判据后「evidence/11 可解析记录合同」与共用脚本；C2-audit 完成判据 | 固定 CLOSE/DECIDED/INCLUDED/ANCHOR 行格式、章节归属、编号集合与状态、文件和行锚；C2/C2-audit 共用 `validate`，四种内存删项均须失败，事实另由 reviewer 独立核。 |
| W2 第 3 轮 #5（P1） | R 批 20 词判据 | 新沿革句须逐字存在、旧“仍是那 19 个词”不得残留于 §3.4；同一 `valid_word_count` 用于实文与“新 20 词 + 旧句残留”内存反例。 |
