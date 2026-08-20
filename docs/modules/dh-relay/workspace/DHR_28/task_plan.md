<!-- dh:v1 · task_plan.md — 施工图（实施方案的家）。🔵 开工那一刻才写，一次性消耗品：跑偏了去 progress.md 记实际，不回头改这里。
     标准档详到"另一个 agent 能照着直接施工"（动哪个文件 / 关键代码片 / 测试点）——因为马上执行、当场消耗、从不维护；轻档可只写大方向。
     本模板标准档专用；派 headless worker 的轻档请改用 `task_plan-轻档.md`。 -->
# task_plan — DHR_28

## 要读的上下文 (Context Packet) ★前置

> **执行契约头（zero-context）**：执行者默认"只知道本文件 + `brief.md` + DevPlan 任务卡"，不得靠脑补上下文施工；按步骤照做，偏离路线只记 `progress.md` 不回写本文件；每批默认 3 步或一个可独立验证功能点后，先跑本批验证并给阶段汇报（①~⑦），再继续下一批。

| ID | 来源 (path / url) | 为什么 |
|----|------------------|--------|
| C-001 | `docs/modules/dh-relay/dev_plan/P5-Relay-v2持久内核与DSH桥接-开发方案.md` §3.2 DHR_28 + §2.2 + §2.3 + §4.1 | 唯一权威验收口径、禁改边界、P5 冻结协议集清单、Agent 宿主 ADR 必答四问、语言选择原则 |
| C-002 | `docs/modules/dh-relay/design/evidence/10-P4-多控制面Pilot报告.md` §4 | v1 六条实测缺口原文 = 本卡「逐条处置表」的直接输入（表格逐行照抄，不改写） |
| C-003 | 同上 §2.1 / §2.3 / §5（H1·H4 材料与结论） | 语言 ADR 的 P4 侧证据：Node 全链 pilot 跨 Node v24(Win)/v18(Linux) 输出逐字节一致、约 250 行纯函数投影器、七份 fixture canonical sha256 全等 |
| C-004 | `docs/modules/dh-relay/workspace/DHR_26/`（findings + 该卡落档） 与 `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\src\dsh-host\README.md` | dsh-host 零 bare import 装载拓扑教训、`dsh plugin` profile 装载与 `ctx.provide` 公开 API —— 语言 ADR 的反面代价与 DSH 隔离价值 |
| C-005 | `docs/modules/dh-relay/design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md` §4 三类真相、§6.1 生命周期、§6.2 生产协议、§6.3 核心语言、§10.2 运行现场 | 协议中立性硬约束（禁入 DSH/Cordis/Pi/Herdr/DevHarness 私有类型、不共享活动对象）与核心语言候选原文 |
| C-006 | `docs/modules/dh-relay/design/06-多控制面与Headless-SSH运行-设计补充.md`「硬约束」节、「验收命题」节（H1~H7、H12）、「P5」节 | H6 契约级命题（必经角色不能只声明 `dsh-agent`）与 fail-closed / 客户端断开不取消 Run 的语义来源 |
| C-007 | `docs/modules/dh-relay/design/02-完整流水-产品设计与验收.md` B1 / B6 / B7 / B11 | 行为与契约 Oracle：relay/v2 契约与 v1 只读兼容、双根 discovery、run_id 规范化 D23、宿主存活语义 D18、幂等与冲突终态 |
| C-008 | `tools/contracts/`（`relay-schema.ps1` / `relay-transitions.ps1` / `transition-matrix.json` / `relay-identity.ps1` / `relay-redaction.ps1` / `README.md`） | P1 现役 v1 契约 = 兼容矩阵的「v1 侧」事实来源；状态机与 redaction 口径作 Oracle，**只读，不改** |
| C-009 | `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\src\read-model\schema.mjs` | P4 冻结的 `relay.pilot-read-model/v1` 与 `relay.pilot-run-list/v1` = Read Model 字段级起点（B-13 §2.3）；含必填 `group`、源头给的 `progress / elapsed_seconds` |
| C-010 | `AGENTS.md`（宪章 + 落点/slug + 与 dh-crew 关系） | 硬规则常驻子集；注意历史留痕里的 `tools/relay/` 是 dh-crew 旧地址，本仓对应 `tools/`，按原样读不"修正" |

**路径占位约定**：批次 1 的 ADR-001 裁决代码根之前，下文一律用 `<CODE_ROOT>` 指代新 Runtime 代码根（两种候选：本仓新顶层目录 / 新独立仓）。批次 2 第 1 步把 `<CODE_ROOT>` 落实为具体路径并记 `progress.md`，此后不再出现占位符。

---

## 施工步骤 (Steps)　★详细级

### 批次 1 — ADR（语言 / 进程形态 / 代码根 / Agent 宿主四问）

> 落点：`docs/modules/dh-relay/workspace/DHR_28/adr/`（主树，纯文档）。批次 2 第 1 步随代码根落定迁往 `<CODE_ROOT>/adr/`，workspace 只留指针，不留双份正文。
> **本批出口是「停下来摆给用户点选」**——语言与代码根由用户裁决（2026-08-20 分流已定），AI 不得自行拍板后继续。

| # | 改动文件（Create/Modify/Test + 路径:行） | 怎么改（代码片 / 签名） | 怎么验（命令 → 预期输出） |
|---|------------------------------------------|----------------------|--------------------------|
| 1 | Create · `workspace/DHR_28/adr/ADR-001-runtime-language-and-code-root.md` | 结构固定六节：`## 背景` / `## 候选` / `## P4 证据` / `## 代价与风险` / `## 决策（待用户裁决）` / `## 后果`。「候选」列两轴各两项：语言 = Go｜TypeScript；代码根 = 本仓新顶层目录（`relay-core/`）｜新独立仓。**四种组合逐一评**，不许只评语言不评根。「P4 证据」每条必带**可复跑指针**（文件路径 + 行号或 grep 锚点），引用 C-003（Node 全链跨版本逐字节一致、约 250 行投影器）与 C-004（dsh-host 零 bare import 拓扑约束）。「决策」节按 C-001 §2.3「语言选择原则」逐条对照打分（独立 CLI / 跨外壳 / 单二进制 / DSH 隔离价值 ↔ Agent SDK 复用收益），**结论行写 `> 待用户裁决（2026-08-20 分流：草案摆给用户点选）`**，不预填结论。 | `rg -n "待用户裁决" workspace/DHR_28/adr/ADR-001-*.md` → 命中 1 行；`rg -c "^## " ADR-001-*.md` → 6 |
| 2 | Create · `workspace/DHR_28/adr/ADR-002-agent-host-ownership.md` | 逐字承接 C-001 §2.3「Agent 宿主 ADR 必答」**四问**，一问一节，每节写「归属 / 消失时的语义 / 恢复路径 / 契约层如何表达」：①process executor 由 Runtime 直接持有；②pi-agent 由 Runtime 直接持有 SDK/RPC 还是经冻结 Adapter；③DSH Native Agent 由 Bridge 代持时 DSH 消失如何标记 Attempt；④Herdr Agent 由 Herdr server 持有时 Runtime 如何恢复观察。**第③问按契约层回答**（DHR_50 未收敛不阻塞本卡，见 C-001 任务表备注），显式写明「契约层答法 + 待 DHR_50 的实现侧留口」。每节末尾给 `answer:` grep 锚点。 | `rg -c "^answer:" workspace/DHR_28/adr/ADR-002-*.md` → 4 |
| 3 | Record · `workspace/DHR_28/progress.md` + `visual_map.md` | progress 日志追加批 1 行；证据账本挂 E-001（ADR-001 六节结构与证据指针可复跑）、E-002（ADR-002 四问 answer 锚点计数）。visual_map 批 1 行证据状态改 `present`。 | `git diff --check` → 无输出；`rg -n "E-00[12]" workspace/DHR_28/progress.md` → 两条均在证据账本表内 |
| 4 | Review · **批次检查点 1**（fresh subagent 小审，只看本批 diff） | 派未参与起草的 fresh subagent，只读，专挑：①四问是否真答满、有无用"待定"糊弄；②P4 证据指针是否真实可复跑（抽验 ≥2 条）；③是否偷偷预填了语言/代码根结论；④是否引入了 DSH/Cordis/Pi/Herdr/DevHarness 私有类型的措辞。发现按 P 级进 `findings.md`。 | 小审结论行写入 `review.md` 第一轮表；`dh dispatch` 落 `review-dispatch` 行 → 回显 `e:E-xxx` |
| 5 | Gate · **摆给用户裁决** | 在对话里给阶段汇报（①~⑦）+ AskUserQuestion：语言（Go / TypeScript）× 代码根（本仓新顶层 / 新独立仓）。裁决结果回填 ADR-001「决策」节，`待用户裁决` 行替换为 `> 决策：<语言> + <代码根>（用户 <日期> 对话点选）`。 | `rg -n "^> 决策：" workspace/DHR_28/adr/ADR-001-*.md` → 命中 1 行且不含"待用户裁决" |

### 批次 2 — v1 缺口处置表 + 冻结 7 份 schema + reason code + 兼容矩阵 + 4 份 v0 形状

> 前置：批次 1 第 5 步用户裁决完成。本批第 1 步落实 `<CODE_ROOT>`，之后按裁决结果决定是否开 worktree（仓内 → `dh wt new DHR_28`；新独立仓 → 在新仓内做，本仓只回填 workspace 文档）。

| # | 改动文件（Create/Modify/Test + 路径:行） | 怎么改（代码片 / 签名） | 怎么验（命令 → 预期输出） |
|---|------------------------------------------|----------------------|--------------------------|
| 6 | Create · `<CODE_ROOT>/`（含 `adr/`、`contracts/`、`fixtures/`、`tools/` 或语言等价目录）+ 迁入批 1 两份 ADR | 按 ADR-001 裁决建根。仓内方案：`git mv` 两份 ADR 到 `<CODE_ROOT>/adr/`，workspace 留一行指针。独立仓方案：新仓 `git init` + 首提交，ADR 复制过去，workspace 留指针并在 `progress.md` 记跨仓落点与访问路径。**无论哪种，仓根须显式忽略 `/.dh-relay/`**（C-001 §2.2）。 | `ls <CODE_ROOT>/adr/` → 两份 ADR；`rg -n "^/\.dh-relay/" <仓根>/.gitignore` → 命中 |
| 7 | Create · `<CODE_ROOT>/contracts/v1-gap-disposition.md` | **逐条处置表**，六行对应 C-002 §4 六条缺口，一条不增不减。列固定：`缺口（P4 原文照抄） \| 处置（采纳进 v2 字段 / 显式不采纳） \| 落到哪个 schema 的哪个字段 \| 理由`。每行前置可 grep 锚点 `v1-gap-disposition: <gap-id>`（gap-id 用 `G1`~`G6`）。**处置方向由本卡 ADR 定，不预设结论**——「显式不采纳」也必须写理由，不许留空或写"待定"。 | `rg -c "^v1-gap-disposition: G[1-6]$" <CODE_ROOT>/contracts/v1-gap-disposition.md` → 6 |
| 8 | Create · `<CODE_ROOT>/contracts/` 下 7 份正式 schema | 逐份冻结（C-001 §2.3 清单）：`relay.rpc/v1`、`relay.run/v2`、`relay.event/v2`、`relay.run-state/v1`、`relay.launch-receipt/v2`、`relay.checkpoint/v2`、`relay.result/v2`。硬约束逐条落进 schema 本体：①**禁入私有类型**——不出现 DSH/Cordis/Pi/Herdr/DevHarness 任何私有类型名（C-005 §6.2）；②**H6 契约级**——必经角色的 executor 枚举不得只有 `dsh-agent`，schema 层用 `minItems`/枚举约束拒绝（C-006 §11）；③**locator 相对/符号化**——所有路径类字段（含 `brief_ref` / `log_locator`）禁绝对路径，用 pattern 约束（承接 G5）；④**未知字段 fail-closed**——`additionalProperties: false` 全域；⑤`relay.run/v2` 按 G1/G2/G3/G4/G6 的处置结论决定是否新增 `workflow_name / summary / trigger / trigger_by`、run 级状态、节点 title、run 级 attempt、会话观测态与任务结果分字段。**Read Model 字段级起点见 C-009**，字段增删须在 `v1-gap-disposition.md` 或 schema 内留处置记录，不静默漂移。 | `ls <CODE_ROOT>/contracts/*.schema.json`（或语言等价）→ 7 份；`rg -n "dsh-agent" <CODE_ROOT>/contracts/` → 仅出现在枚举成员位置，不出现在任何 `required`/单值默认位置 |
| 9 | Create · `<CODE_ROOT>/contracts/` 下 4 份 v0 形状 | `relay.resolved-plan/v1`、`relay.host-observation/v1`、`relay.attention/v1`、`relay.approval/v1` **只定 v0 形状**（C-001 §2.3：首次承重在 P6/P7 才冻结）。每份文件头写死 `status: v0-shape-only`、`frozen-at: <未冻结>`，并注明首次承重阶段。 | `rg -c "^status: v0-shape-only" <CODE_ROOT>/contracts/` → 4 |
| 10 | Create · `<CODE_ROOT>/contracts/reason-codes.md` + `compat-matrix.md` | reason code：至少覆盖 fail-closed 三类（`E_UNKNOWN_FIELD` / `E_UNSUPPORTED_VERSION` / `E_CAPABILITY_MISMATCH`）+ start 前置类（`E_GITIGNORE_MISSING`，承接 C-001 §2.2 fail-closed）+ 幂等冲突类。兼容矩阵：v1（C-008 现役 PowerShell 契约）↔ v2 逐字段对照，标 `保留 / 改名 / 新增 / 弃用`，弃用项写迁移说明。**v1 侧事实必须来自 C-008 实读，不得凭记忆写。** | `rg -c "^\| E_" <CODE_ROOT>/contracts/reason-codes.md` → ≥5；`rg -n "保留\|改名\|新增\|弃用" <CODE_ROOT>/contracts/compat-matrix.md` → 每列枚举齐 |
| 11 | Review · **批次检查点 2**（fresh subagent 小审） | 只看本批 diff。专挑：①六条缺口是否逐条对上 P4 §4 原文（抽验字面）；②schema 是否真 `additionalProperties: false` 全域；③有没有私有类型泄漏；④兼容矩阵 v1 侧是否与 `tools/contracts/` 实际一致（抽验 ≥3 字段）；⑤有没有把「待定」写成结论（G8 反例）。 | 结论进 `review.md` 第一轮表；`dh dispatch` 落账 → `e:E-xxx` |

### 批次 3 — golden 正反 fixture + 独立校验器

> TDD：先写 fixture（含反例）→ 跑红 → 再写校验器 → 跑绿。

| # | 改动文件（Create/Modify/Test + 路径:行） | 怎么改（代码片 / 签名） | 怎么验（命令 → 预期输出） |
|---|------------------------------------------|----------------------|--------------------------|
| 12 | Test · `<CODE_ROOT>/fixtures/golden/` 正例 + `<CODE_ROOT>/fixtures/negative/` 反例 | 每份已冻结 schema 至少 1 正例；反例**必须覆盖 fail-closed 三条**（未知字段 / 未知版本 / 能力不匹配）+ H6（必经角色只声明 `dsh-agent`）+ locator 绝对路径（G5）。每份反例同目录放 `<name>.expect.json`，写死期望 reason code。目录内放 `manifest.json` 列全部 fixture 与其 canonical sha256（承接 P4 §2.1 的 manifest 对证做法）。 | 此时无校验器 → 跑测试**预期全红**：`<校验器测试命令>` → `FAIL: validator not found`（把这条红输出贴进 `progress.md`） |
| 13 | Create · `<CODE_ROOT>/tools/validate.<ext>` + 测试 | 独立校验器（不依赖 Runtime、不依赖任何工作台进程）。接口：`validate(payload, schemaId) -> {ok: bool, reason: string|null}`。行为硬条：①未知字段 → `E_UNKNOWN_FIELD`；②未知/不支持版本 → `E_UNSUPPORTED_VERSION`；③能力不匹配 → `E_CAPABILITY_MISMATCH`；④以上三条一律**拒绝**，不得降级放行。CLI 入口 `validate <file> --schema <id> [--json]`，退出码：0=pass，非 0=拒绝（reason code 打印到 stdout）。 | `<校验器测试命令>` → 全绿；正例全 pass、反例逐条命中 `.expect.json` 里写死的 reason code |
| 14 | Test · 静态中立性断言 | 加一条测试/脚本断言 C-005 §6.2：`contracts/` 与 `tools/` 全域 grep 不出现 DSH/Cordis/Pi/Herdr/DevHarness 私有类型名（维护一份禁词表 `forbidden-types.txt`），命中即失败。同一脚本断言 H6：schema 层拒绝「必经角色只声明 `dsh-agent`」。 | `<中立性检查命令>` → PASS；故意插一个禁词后重跑 → FAIL（把这组红/绿对照贴进 `progress.md`） |
| 15 | Record · commit + `progress.md` | 按路径 stage（禁 `git add -A`，主树有并行 session 的 DHR_49 WIP）。progress 挂 E-00x：校验器全绿输出、反例逐条 reason code 命中、中立性检查红/绿对照。 | `git status --short` → 只含本卡路径；`git diff --check` → 无输出 |
| 16 | Review · **批次检查点 3**（fresh subagent 小审） | 只看本批 diff。专挑：①反例是否真能被拒（抽验 ≥2 条手工复跑）；②校验器有没有对未知版本"宽容放行"；③fixture manifest 的 sha256 是否真对得上；④校验器是否偷偷 import 了 Runtime 或工作台代码。 | 结论进 `review.md` 第一轮表；`dh dispatch` 落账 → `e:E-xxx` |

---

## 关键决策（一句话各一行）

- **Worktree**：批次 1 = 否（主树，纯文档 ADR，其产出裁决代码根）；批次 2 起按 ADR-001 结果定 —— 仓内方案 → `dh wt new DHR_28`（分支 `wt/DHR_28`，目录 `.dh-worktrees/DHR_28`）；新独立仓方案 → 在新仓内施工，本仓只回填 `workspace/DHR_28/`。用户 2026-08-20 分流确认。
- **派子 agent**：是 —— S1 brief 起草（sonnet 委托）；批次检查点 1/2/3 各派一个 fresh subagent 小审（代码复核轮 1 前移）；收口 E4 需求复核 / E5 教训复核 / E14 一致性复核 / E6 miner / E7 as-built 按节点表默认委托。S2 施工步骤、E2/E3 复核收敛、E11 人闸留主会话。用户 2026-08-20 分流确认「照节点表默认」。
- **Review**：独立复核方式 = 会话内 fresh-context subagent；E2 轮 2 必须另派、实例/会话 ≠ 批次小审、不继承轮 1 上下文（硬闸，不可 skip）。
- **人验项**：0 条（验收口径 5 条全为机器证）→ 收口走 **H=0 双谓词**（谓词 A 人验栏为空 ∧ 谓词 B 放行资格齐），不认 AI 自写"无需人判"。
- **TDD**：批次 3 走五拍循环（fixture 红 → 校验器绿）；批次 1（纯 ADR 文档）与批次 2（schema 与处置表文档）不适用 TDD，豁免理由记本行 + `review.md`。
- **停下来问人的点**：批次 1 第 5 步（语言 + 代码根裁决）、E11 一次性确认本地收口授权包、P0/P1 三轮不收敛。除此之外不索权。
