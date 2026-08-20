<!-- dh:v1 · task_plan.md — 施工图（实施方案的家）。🔵 开工那一刻才写，一次性消耗品：跑偏了去 progress.md 记实际，不回头改这里。 -->
# task_plan — DHR_27 接 v1 只读投影并完成 CLI 控制面收口与 P4 主报告

## 要读的上下文 (Context Packet) ★前置

> **执行契约头（zero-context）**：执行者默认"只知道本文件 + `brief.md` + DevPlan 任务卡"，不得靠脑补上下文施工；按步骤照做，偏离路线只记 `progress.md` 不回写本文件；每批结束先跑本批验证并派 fresh 小审，再继续下一批。

| ID | 来源 (path / url) | 为什么 |
|----|------------------|--------|
| C-001 | `docs/modules/dh-relay/dev_plan/P4-DSH工作台最小Pilot-开发方案.md` §3.2 DHR_27、§2.1~2.3、§4.1 | 唯一权威任务卡与 CM 定义 |
| C-002 | `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\src\read-model\schema.mjs` | 两份 Read Model 契约（DHR_25 冻结，本卡只消费不改语义） |
| C-003 | `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\src\cli\main.mjs` + `src/read-model/load.mjs` | CLI 骨架与「只读 by construction」的落法（全程序唯一 fs 调用是 readFileSync） |
| C-004 | `D:\MyFiles\ai-workflow\dh-crew\.dh-runtime\relay\RELAY-IHSR05-RW-20260816113004\`（只读！） | v1 真实历史现场·主投影对象；同级另有 `RELAY-IHSR05-20260816100852`、`RELAY-IHSR05-20260816100959` 两条 |
| C-005 | `docs/modules/dh-relay/workspace/DHR_25/task.md` | 前卡交付与既有测试基线（90 条），零凭据/零本机路径扫描的既有做法 |
| C-006 | AGENTS.md 宪章#6（密钥红线·进仓证据白名单过滤） | v1 现场含绝对路径（`brief_ref`、`host-state.json`），冻结进 testdata 前必须过滤 |

## 现场侦察结论（开工时已核实，施工依据）

- v1 run 目录关键文件：`relay-state.json`（run_id + 逐节点 `terminal_state / result_status / attempt_id / task_state / pause_reason / last_progress_at / final_committed / consecutive_probe_failures`）、`active-plan.json`（`activated_at`）、`plans/relay-plan.v1.proposal.json`（`nodes[]`：`node_id / role / brief_ref(绝对路径!) / depends_on`）、`events.jsonl`（547 行）、`host-state.json`（**全是绝对路径，投影不需要，不进 fixture**）。
- 主投影对象 `RELAY-IHSR05-RW-20260816113004`：fix → review3 → review4 三节点，全部 `result_status=succeeded` + `final_committed=true`。
- schema 已预留 `source_kind='relay-v1'`、source_ref kind `'relay-v1-run'`；`log_locator` 校验拒绝主机绝对路径。
- **v1 协议缺口（投影时无中生有是造假，必须走"操作员补供 + 留痕"）**：v1 不记录 `workflow_name / summary / trigger / trigger_by`，也没有 run 级状态与节点 title。这些缺口本身是 P4 主报告给 P5 的核心材料。

## 关键设计决策（本卡冻结，偏离记 progress）

1. **投影器是"源头"**：run 级状态、`group`、`elapsed_seconds` 由投影器从 v1 事实推导——这是源头侧推导，不违反"客户端不推导"约束（客户端=render/CLI 展示层，投影器=源头适配层）。
2. **v1 → Read Model 映射表**（节点级）：
   - `final_committed=true ∧ result_status=succeeded` → `succeeded`；`∧ result_status=failed` → `failed`
   - 未 committed ∧ `pause_reason` 非空 → `waiting_human`；未 committed ∧ `task_state=active` → `running`
   - 其余一律 → `unknown`（**不猜**；`terminal_state` 是 psmux 会话观测态、不是任务结果，不参与判定，理由写进报告）
3. **run 级聚合**：任一节点 failed → `failed`；否则任一 running → `running`；任一 waiting_human → `waiting_human`；全部 succeeded → `succeeded`；其余 → `unknown`。
4. **group 映射**：`succeeded→done`；`failed→needs_you`；`waiting_human→needs_you`；`blocked→blocked`；`running/pending→running`；`unknown→needs_you`（异常必须浮上来，不许沉底）。
5. **操作员补供字段**：`project` 子命令要求显式给 `--workflow-name / --summary / --trigger / --trigger-by`（v1 不记录，缺任一即 exit 2 并列明缺哪些）；投影输出的 `source_refs` 里加一条 `kind='note'` 记录「这四个字段为操作员投影时补供，v1 现场不含」。代码里不许有任何默认编造值。
6. **节点 title**：v1 无 title → `title = node_id`（1:1，不造语义）；节点级 `attempt ← attempt_id`；run 级 `attempt` 不填（v1 不记录整条重跑次数，缺省=源头不记）。
7. **时间**：`started_at ← active-plan.activated_at`；`updated_at ← max(各节点 last_progress_at)`；`elapsed_seconds = floor((updated_at−started_at)/1000)`（源头测量，客户端只格式化）。
8. **attentions**：`consecutive_probe_failures>0` → `probe_lost`(warn)；`pause_reason` 非空 → `manual_review`(warn)；此外为空数组。主投影对象两者皆无 → `[]`。
9. **fixture 冻结 = 最小集 + 白名单过滤 + manifest 对证**：只冻结投影要消费的 3 个文件（`relay-state.json`、`active-plan.json`、`plans/relay-plan.v1.proposal.json`）；`brief_ref` 改写为相对路径 `briefs/<名>.md`（唯一改写点，manifest 逐字段留痕）；`events.jsonl` 不进 fixture（投影不消费；547 行逐行扫太重且无收益）；`host-state.json` 不进 fixture（全绝对路径且属编排器内部态）。`freeze-manifest.json` 记录：run 目录**全部**文件的原始 sha256（CM3 对证基线）、冻结了哪 3 个、每处改写的字段与原值 sha256、未冻结文件及原因。
10. **`log_locator = '.dh-runtime/relay/<run_id>'`**（相对符号定位，过 host-path 校验）。
11. **CLI 只读性质不破**：`project` 只写 stdout，落盘靠 shell 重定向；冻结脚本是 `scripts/` 下的一次性工具（可写 testdata/，永不写源 run 目录），不属 CLI。

## 施工步骤 (Steps)

### 批 1：冻结 v1 fixture（功能点=可对证的冻结产物）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---------|--------|--------|
| 1 | Test · `test/freeze.test.mjs` | 先写失败测试：①`testdata/v1/**` 每个文件内容过 `isAbsoluteHostPath` 式扫描（盘符/UNC/家目录根），命中即 fail；②`freeze-manifest.json` 存在且结构齐（source_files 全哈希、frozen 清单、rewrites 逐条、excluded+原因）；③冻结的 `relay-plan.v1.proposal.json` 里 `brief_ref` 全部是 `briefs/` 开头的相对路径 | `node --test test/freeze.test.mjs` → 跑红（testdata/v1 尚不存在） |
| 2 | Create · `scripts/freeze-v1-run.mjs` | 一次性冻结工具：入参 `<run-dir> <dest-dir>`；哈希 run 目录全部文件 → 复制 3 个消费文件 → 改写 `brief_ref` → 输出内容全量扫绝对路径（fail-close：扫出即退出非 0、不落盘）→ 写 `freeze-manifest.json`。**对源目录只有 readFileSync/readdirSync，无任何写调用** | 跑 `node scripts/freeze-v1-run.mjs <dh-crew run 目录> testdata/v1/RELAY-IHSR05-RW-20260816113004` → exit 0 |
| 3 | Test · 重跑批 1 测试 + 既有全量 | 冻结产物落 `testdata/v1/` 后测试转绿；既有 90 条不回归（尤其 C4b testdata 零凭据/零路径扫描要把 v1 目录纳入扫描面） | `node --test test/*.test.mjs` → 全绿 |
| 4 | 批次检查点 | 源目录零写入首验：冻结前后对 run 目录全文件 mtime+size+sha256 逐条比对；派 fresh 小审看本批 diff | 比对全等；小审结论记 review.md 第一轮表 |

### 批 2：v1 投影器 + `project` 子命令（功能点=v1 → Read Model 可验证投影）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---------|--------|--------|
| 5 | Test · `test/project.test.mjs` | 先写失败测试：①对冻结 fixture 投影 → `validateReadModel` / `validateRunList` 全过；②确定性（两次投影 canonical sha256 相同）；③映射表逐条（构造最小 v1 输入：succeeded/failed/active/pause/其余→unknown；group 六态；probe_failures→attention）；④缺操作员字段 exit 2 且列明缺哪些；⑤输出全树扫绝对路径=零；⑥source_refs 含 3 个消费文件的 sha256 + 一条 note；⑦`import` 投影模块不触发任何写调用（复用 DHR_25 只读断言手法） | `node --test test/project.test.mjs` → 跑红 |
| 6 | Create · `src/read-model/project-v1.mjs` | 纯函数 `projectV1Run({relayState, activePlan, planProposal, operator})` → `{model, list}`；按「关键设计决策」2~8 映射；**零 fs、零时钟**（elapsed 从输入时间戳算，不读 `Date.now`） | 步 5 的 ③⑤⑥ 转绿 |
| 7 | Modify · `src/read-model/load.mjs` | 加 `loadV1RunDir(dir)`：readFileSync 读 3 个文件 + JSON.parse，错误归入既有 `ReadModelError` 通道（exit 3 语义） | 步 5 的 ① 转绿 |
| 8 | Modify · `src/cli/main.mjs` | 加 `project <run-dir> --workflow-name X --summary X --trigger X --trigger-by X [--label k=v]* [--out detail\|list]`，输出 canonical JSON 到 stdout；USAGE 同步 | 步 5 的 ②④ 转绿；`relay-pilot project testdata/v1/RELAY… --…` \| `relay-pilot show -`（经临时文件）渲染成功 |
| 9 | 批次检查点 | 全量测试 + 投影产物走既有 `show`/`list`/`hash` 全链；派 fresh 小审 | `node --test test/*.test.mjs` 全绿；小审记 review.md |

### 批 3：活现场演示 + 证据 + P4 主报告（功能点=CM3/CM6a 证据闭合与报告落盘）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---------|--------|--------|
| 10 | Test/证据 · `<experiment-root>\evidence\v1\` | **活现场只读演示（仅一次）**：①演示前快照 `.dh-runtime\relay\` 整树（文件清单+mtime+size+sha256）；②`relay-pilot project <活 run 目录> --…` 重定向存 `evidence/v1/live-projection.json`；③`show`/`list` 渲染转录存 evidence；④演示后再快照 → 逐条比对全等（CM3 + design/02 B1 零新写）；⑤`hash` 记 canonical sha256；冻结 fixture 投影与活现场投影输出比对（应全等，证冻结忠实） | 前后快照 `RESULT: IDENTICAL`；两路投影 canonical sha256 相同 |
| 11 | 证据 · CM6a 审计 | 审计范围 `src/cli/ src/read-model/ src/render/ testdata/`：①全量 grep 写 API（`writeFile/appendFile/mkdir/rm/rename/createWriteStream` 等）→ 命中只允许在 `scripts/`；②grep DSH/cordis import → 零；③记录 DHR_25→27 全部 diff 文件清单 | 审计转录落 `evidence/v1/cm6a-audit.txt` |
| 12 | Create · `docs/modules/dh-relay/design/evidence/10-P4-多控制面Pilot报告.md` | 主报告（CLI 部分）：①CM1/2/3/5/6a 逐条结论+证据指针；②CM4 显式「延后（DHR_50）」；③**锚点 `DM-deferred-facts:`** 按实况三选一（DHR_26/49 未开始 → `no-dm-facts-yet`）+清单；④v1 协议缺口清单（workflow_name/summary/trigger/title/run 级状态——P5 输入）；⑤版本与实耗；⑥H1/H4 人判材料区（终端转录+hash+版本+实耗） | `dh dh-relay` 体检零新增失败；报告内锚点可 grep |
| 13 | 批次检查点 + 收口准备 | progress/findings/visual_map 补齐；派 fresh 小审看批 3；随后进 E 收口段（E2 换人增量复核起） | 小审记 review.md；`dh gate` 过 |

## 关键决策（一句话各一行）

- Worktree：否（仓内只动文档；用户 2026-08-20 确认）
- 派子 agent：批次小审 fresh subagent ×3（轮 1 前移）；E4/E5/E14/E6/E7 按默认委托表
- Review：轮 2 = 收口时另派 fresh-context subagent 增量复核（不继承本会话上下文）
