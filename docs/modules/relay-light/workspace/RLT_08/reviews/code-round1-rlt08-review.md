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
