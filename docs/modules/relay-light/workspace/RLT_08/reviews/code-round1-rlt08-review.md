# code-round1 复核 — RLT_08

- **身份**：rlt08-review（独立复核 worker，未参与施工），复核路 `code-round1`（normal Recipe 三路之一）
- **模型自报**：Devin CLI / SWE-2 Max
- **日期**：2026-09-13
- **输入清单**：`dispatch/README.md`、`dispatch/review.md`、`brief.md`、`task_plan.md`、`progress.md`、`findings.md`、`git diff master -- AGENTS.md`（整卡 diff，分支 `wt/RLT_08` 对 master `851433c`，20 笔 commit）、design/01 §0.3、§1.2、§1.3、§4.5.2/§4.5.3、§7.1、§11 HC-RL-A28/A29/A33/A34 oracle 原文、`tools/relay-light/skill/references/adapter-claude-code.md` 与 `adapter-codex.md` 派活模板首行
- **方法**：只读复核，未改任何被审文件；task_plan B3「整卡机检脚本」由复核者在本机逐字复跑一遍（非引用 exec 证据）

## 复跑证据（四条 HC 机检，复核者自跑，exit=0）

- 阅读矩阵 `## 任务类型阅读矩阵` 边界内 `tools/relay-light/skill/SKILL.md` 恰 1 命中（AGENTS.md L90，矩阵内第 16 行）→ A33 前半 ✓
- `## relay-light 编排协议段` 命中 L40；判定句 `见此标头即完成即停不等 node_closed，有 RELAY_RECEIPT 即冻结 Runner 流水` 命中 L44；`有意绕过 B-adjust` 与 `设计与验收仍走 dev-harness` 命中 L46 → A28 / A34 文档面 ✓
- `slug=\`relay-light\``、`docs/modules/relay-light/`、`tools/relay-light/`、`verify scope = \`relay-light\`` 各命中（L12/L97）；旧单模块三变体正则零命中 → A29 文档面 ✓
- 两份 adapter 的 ```` ```text ```` 块首行（claude-code L50 / codex L49）逐字节等于期望串，`adapter_count=2`；AGENTS L44 内嵌标头以 `rg -o -F` 独立命中同一字面量 → A34 标头同构 ✓
- `dh relay-light` 实跑：输出首行 `=== dh-check: relay-light ===`，尾行「合计: 25 失败, 9 警告」→ slug 可解析证据真实；25 条存量失败与 F-4 登记一致，未与解析结论混淆 → A29 后半 ✓
- dev-harness baseline：`head.txt` / `tracked.sha256` / `untracked-paths.sha256` 三项与 B1 冻结基线 `cmp` 逐项一致（head=`00c035c`，tracked/untracked 均为空输入哈希）→ A33 后半「dev-harness 未被改动」✓
- `git diff --check` rc=0；`master...HEAD` 已提交 22 文件、`working tree`、`index`、`untracked` 四集合经 `scope_re` 反选零越界（只含 `AGENTS.md` 与 RLT_08 workspace）→ 允许路径闭集 ✓

## 逐项核对

### 1. 改动精确性 / 无误伤现役铁律 — 通过

整卡 diff 仅五处，全部对齐 oracle：L12 项目概况改双模块句；`## relay-light 编排协议段` 纯插入在 Runner 段前（并列、互不隶属，符合 task_plan 位置要求）；Runner 通用铁律第 2 条行尾追加窄句；阅读矩阵 +1 行；落点/slug +1 行；`dh` 命令小节改写。宪章七条、Runner 通用铁律第 1/3/4/5/6 条、施工/复核 worker 两小节在 diff 中零 `-` 行触碰——无删除、重写或弱化；第 2 条原句逐字保留，冻结边界为纯增量。

### 2. 判定句 / 标头逐字一致 — 通过

AGENTS L44 标头字面量 `[relay-light] worker · node=<n> · agent=<角色>#<实例> · workspace=<任务工作区>` 与两份 adapter 派活模板首行逐字节一致（sed 抽取比对 + `rg -o -F` 双验证）。判定句与 design §11 A34 oracle 逐字一致，可单行 `rg -F` grep。「监工派活 prompt 首行必须是…」无过度强化（adapter 模板首行确为该标头）；「四字段样式」注解与标头四个 `<…>` 槽位吻合。

### 3. B-adjust 窄例外边界 — 通过

AGENTS L46「计划例外」行对照 design §4.5.2 白名单（relay_plan 追加/标 superseded 与 marker、开发方案任务行、任务卡 `task_plan.md`）与禁区（`design/` 整目录含验收清单）：三类覆盖为忠实压缩，「设计与验收仍走 dev-harness」与 oracle 边界句逐字一致；例外未延伸进 design/验收，压缩方向为收窄而非放宽。

### 4. 双模块描述 / `dh` 解析证据 — 通过

L12 与 L97 双处登记 slug / 文档根 / 代码根 / 英文 verify scope；`dh` 小节旧「自动选中」句改为「本仓有多个模块，须显式指定」，落实 §0.3「需同步改」。`dh relay-light` 模块标头命中为复核者实放证据，E-011 描述属实。

## 发现项

- **P2 — L95「独立仓里只有 relay 一份代码」残留陈旧表述**（与 findings F-1 同项）：该从句与 L97 新增「relay-light 模块…代码根 `tools/relay-light/`」同节并存；按现役态读「只有 relay 一份代码」已不成立（tools/ 顶层 relay 代码与 `tools/relay-light/` 并存）。可辩读为「拆仓时」历史叙述，但在本卡专门落地双模块身份的小节内属措辞不精确，一处措辞可修（AGENTS.md 在允许路径内）。exec 按 B1 合同三处改动位置未顺手改、已记 F-1，流程处理正确。
- **P3 — 冻结判定句两读**（与 findings F-3 同项）：oracle 逐字句「有 RELAY_RECEIPT 即冻结 Runner 流水」在 Runner 铁律第 2 条语境下字面可误读为「本棒冻结自己」；exec 按 §0.3「Runner 冻结在 P6 现状」取标记义落笔，且同行有「不交叉执行 relay-light」作操作性指令。句为 oracle 强制逐字，本卡无改写空间；歧义属设计层措辞，交收口裁决。
- **P3 — dh-check 存量失败含本卡工作区缺口**（与 findings F-4 同项，复核者实跑确认）：25 条存量失败中 RLT_08/review.md R4 缺复核三区、R12 缺需求对齐证据表、R15 缺 `visual_map.md`、R16 无 test 类证据提示。属八件套体检口径与本卡 AGENTS diff 无关，不阻代码轮结论，供收口裁决。

## 结论

**APPROVE_WITH_NITS**

四条 HC 机检复核者复跑全绿（exit=0）；改动精确、纯增量，现役铁律零弱化；判定句/标头与 adapter、oracle 逐字一致且可单行 grep；B-adjust 例外边界忠实于 §4.5.2/§4.5.3、未延伸 design/验收；双模块描述与 `dh relay-light` 解析证据真实可复放。P2/P3 三项均已由 exec 登记 findings，留收口裁决；本路只写事实与级别，不做验收裁决。

## X1 复看（定向，commit `ae38e65`）

- **身份**：rlt08-review（同 code-round1 复核者）· Devin CLI / SWE-2 Max · 2026-09-13
- **范围**：编排点名的四项——`git diff a755143 ae38e65 -- AGENTS.md` 两处措辞不破 oracle 原文（四条 HC 机检自跑）、`review.md` 三区与需求对齐表引用属实、`LC-4~6` 与 lesson 路 P2-1~3 对应、diff 不出允许路径。

### ① AGENTS.md 两 hunk + 四条 HC 复跑 — 通过

`a755143..ae38e65` 对 AGENTS.md 恰两 hunk：L57（Runner 铁律 2）在逐字冻结句「有 RELAY_RECEIPT 即冻结 Runner 流水」**之后**插入括注「Runner 体系冻结在 P6 现状、不删不迁；本句是流水归属判定，不是让本棒停摆」——oracle 子串逐字保留、`rg -F` 连续命中不破，括注取 §0.3 原义消解 F-3 误读（F-3 闭合）；L95 改「彼时独立仓只有 relay 一份代码…relay-light 代码根见下行 `tools/relay-light/`」——历史叙述锚定 + 前向指针（F-1 闭合），该行无 oracle 原文。B3 整卡机检脚本复核者复跑 exit=0：矩阵恰 1、协议段/判定句/两句例外/四项身份全中、旧句零命中、`adapter_count=2`、dh 标头命中、baseline cmp 3/3、`diff --check`=0、四集合零越界。

### ② review.md 引用属实性 — 通过

独立复核区三路汇总与实际报告一致：code-round1 `APPROVE_WITH_NITS`（P2×1+P3×2，路径正确）、requirement `APPROVE`、lesson `rlt08-review2` `APPROVE_WITH_NITS`（P2×3+P3×2）。需求对齐证据表四行 HC→E-ID 引用（E-005/006/009~013/016 等）均在证据账本市真实存在、路径描述准确；AI 提交区 Confidence Challenge 只述事实不冒称验收。R4 三区（独立复核区/AI 提交区/人类签名区）与 R12 需求对齐表已补齐——`dh` 复跑中 RLT_08 的 R4/R12 失败行消失，证实属实。人类签名区结果列空白、明记「AI 不得预勾」——**未勾**。

### ③ LC-4~6 ↔ lesson P2-1~3 — 通过

LC-4=P2-1（task_plan B3 直接 `CONSTRUCTION_DONE` vs `exec.md` audit 后再派令的合同漂移 + exec.md 缺 rebase 第一动作；引 review.plan.md P1-1/P1-4）、LC-5=P2-2（P1-4 首轮漏、次轮全量复看逮出；引 review.plan.md L96-101）、LC-6=P2-3（B1 信号 `evidence=` 悬空引用，补记 `cbea9a6` 后 PASS；引 check.C1.md）。三条均逐字复述 lesson 报告证据链并标注对应 P2 号，对应关系属实。

### ④ 允许路径 — 通过

`ae38e65` 单提交触及：`AGENTS.md` + `findings.md`/`lesson_candidates.md`/`progress.md`/`review.md`（均 RLT_08 workspace 内）；`master...HEAD` 反选零越界，工作树/index/untracked 干净。

### 观察（不阻断）

- **P3 — E-016 计数时点性**：E-016 记 dh 存量失败「25→22」；复核者此刻复跑为「21」。差额方向为进一步好转（R4/R12 确已消），推测 E-016 记数于整改中途或后续 progress 更新又灭一项；实质声明「R4/R12 已补齐」属实，仅计数为时点值、不可逐字复放。

### X1 结论

**APPROVE**

编排裁决的四项整改全部落实且无副作用：oracle 逐字零字节改动、四条 HC 机检仍全绿；review.md 三区补齐且引用全部属实、人类签名区未勾；LC-4~6 与 P2-1~3 一一对应；diff 仍在允许路径闭集内。
