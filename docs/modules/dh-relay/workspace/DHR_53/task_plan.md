<!-- dh:v1 -->
# task_plan — DHR_53 薄 Plan、Resolver 与运行历史关联

> **执行契约头（zero-context / headless worker）**：执行者默认「只知道本文件 + `brief.md` + DevPlan §3.2 DHR_53 + `design/10`」。
> 先读仓根 `AGENTS.md`（特别是「编排协议段 · worker 铁律」），再照本文件按批施工。跑偏只记 `progress.md`，**不回头改本文件**。
> **每批做完必须停下**：跑本批验证 → 在 `progress.md` 追加日志与 Evidence → 给出 ①做了什么 ②证据 ③风险 的简短汇报 → 等主控派下一批。**不得自行进入复核，不得改 DevPlan 状态列。**

## 要读的上下文 (Context Packet) ★前置

| ID | 来源 (path) | 为什么 |
|----|------------------|--------|
| C-001 | `AGENTS.md`（仓根） | worker 铁律、硬规则、落点与 verify scope；**第一件要读的** |
| C-002 | `docs/modules/dh-relay/design/10-薄RelayPlan与显式节点边界-产品设计调整.md` §2、§3、§4.2、§5.3、§5.4.1、§7、§8.1/§8.3/§8.4 | 本卡冻结的产品语义与反例矩阵的**唯一权威**；`A19/A21/A23/A30/A31` 是本卡承接的机器验收 |
| C-003 | `docs/modules/dh-relay/workspace/DHR_53/brief.md` | 完成条件与边界 |
| C-004 | `relay-core/README.md` | 硬约束（协议中立、fail-closed、locator 相对化、运行现场不入仓）+ **「改了什么就要重生成哪份基线」三张闸** |
| C-005 | `relay-core/contracts/relay.run-state.v1.schema.json`、`relay-core/contracts/_shared/relay.common.v1.schema.json` | 既有 schema 的**写法样板**：`$id` 绝对、`$ref` 指向 `relay.common/v1#/$defs/...`、`additionalProperties:false`、description 里就地写规范性条款 |
| C-006 | `relay-core/tools/validate.mjs`、`relay-core/contracts/reason-codes.md` | 校验器接线方式与 reason code 全集权威；新增码必须先进 `reason-codes.md` |
| C-007 | `relay-core/tools/canonical.mjs`、`relay-core/tools/capability-baseline.mjs`、`relay-core/tools/fixture-manifest.mjs`、`relay-core/tools/audit-contracts.mjs` | JCS 规范化与三份基线的生成方式 |
| C-008 | `relay-core/test/contracts.test.mjs`、`relay-core/test/runtime.test.mjs` | `node --test` 的既有写法与断言风格 |
| C-009 | `relay-core/runtime/runid.mjs`、`relay-core/runtime/gitignore.mjs`、`relay-core/store/store.mjs` | 已 verify 的 run_id 发号、gitignore 前置校验与 Store；**本卡复用它们，不重写** |
| C-010 | `.gitignore`（仓根） | 已有 `/dh_relay/runtime/` 精确忽略规则与两条旧根规则；本卡只**断言**它，不改写它 |
| C-011 | `docs/modules/dh-relay/workspace/DHR_53/decisions.md` D-002 / D-003 | 前置放宽范围（不消费 `wt/DHR_30`、不启用新根 start）与复核路径 id 取 `consistency_review` 的裁决 |

**Recipe 事实来源（不可联网、不可跨仓 import，抄进来并记源）**：dev-harness 的
`D:\MyFiles\ai-workflow\dev-harness\tools\dh-policy\registry.mjs` 中 `TYPE_RECIPES` 当前值为——

| task_type | requiredPathIds | extraRequirements | mutationChooser | verifyRequired |
|---|---|---|---|---|
| `heavy` | `code_round_1, code_round_2, requirement_direction, lessons, consistency_review` | `effective_unit_test` | `round2-reviewer` | `must` |
| `normal` | `code_round_1, requirement_direction, lessons` | `effective_unit_test` | `self-report` | `default` |
| `light` | `lessons, consistency_review` | （无） | `null` | `optional` |

该表**必须以数据形式冻结进本仓**（跨仓 import 违反 relay-core 硬约束 1），并在 Resolved Plan 里带 `recipe_source_digest`。

## 硬红线（违反即本批作废）

1. **不创建 `dh_relay/runtime/` 正式目录、不用新根 start 任何真实 Run**（design/10 §10-5 新根闸）。根路由只在临时测试根与 `relay-core/fixtures/` 里取证。
2. **不读、不合并、不引用 `.dh-worktrees/DHR_30/` 或分支 `wt/DHR_30` 的任何代码。**
3. **不改** `docs/modules/dh-relay/design/**`、`docs/modules/dh-relay/dev_plan/**`、仓根 `.gitignore`、`AGENTS.md`、以及 `relay-core/contracts/` 里**已冻结的既有 schema**（新增文件除外；`reason-codes.md` 按 1.4 追加不算改写既有条目）。
4. **不实现删除**：resolver / roots / history 模块里**不得出现**任何针对 runtime 目录的 `rm`/`unlink`/`rmdir`/`rmSync` 调用；这是 `A30` 的正面命题，测试会反向断言。
5. **凭据零落盘**：不在任何工件、日志、测试或 commit message 写密钥/令牌值。
6. **不 push、不改 git remote、不动 `~/.dh-relay/`、不动 `.dh-runtime/` 与 `.dh-relay/` 现有内容。**
7. **locator 一律相对/符号化**，禁绝对路径（relay-core 硬约束 4，已有 `E_ABSOLUTE_LOCATOR`）。

## 施工步骤 (Steps)

> 四批。**每批末尾停下等主控。** TDD 五拍：写失败测试 → 跑红 → 最小实现 → 跑绿 → 记录。
> 统一验证命令（在 `relay-core/` 下跑）：
> `npm test` · `node tools/validate.mjs --selftest` · `node tools/audit-contracts.mjs` · `node tools/fixture-manifest.mjs` · `node tools/capability-baseline.mjs`

### 批次 1 — 冻结三份契约 schema + 正反 fixture

| # | 改动文件（Create/Modify/Test + 路径） | 怎么改 | 怎么验（命令 → 预期） |
|---|---|---|---|
| 1.1 | Create · `relay-core/contracts/relay.plan.v1.schema.json` | 薄 RelayPlan 计划源。必填：`protocol`（const `relay.plan/v1`）、`plan_id`、`task_id`、`workspace`（`$ref` `relay.common/v1#/$defs/locator`）、`flow`（数组 `minItems:1`，元素 `{stage}`，`stage` ∈ `construction`/`review_recipe`/`rework`）、`review_recipe`（`{source: const "task_type_registry"}`）。可选：`profile_overrides`（对象，key 为 review path id 或 node id，value 为 profile id 字符串；**只能选执行者，不能删路径或降级**——把这条写进 description）。`additionalProperties:false`。**禁止**出现 `goal`/`acceptance`/`allowed_paths`/`task_plan`/`run_id` 字段名（A23：不维护可漂移副本、Plan 不反写 run_id），在 description 写明并由 1.8 反向断言。 | `node tools/validate.mjs fixtures/golden/plan.v1.json --schema relay.plan/v1` → 退出 0 |
| 1.2 | Create · `relay-core/contracts/relay.resolved-plan.v1.schema.json` | 解析快照。必填：`protocol`（const `relay.resolved-plan/v1`）、`plan_id`、`task_id`、`task_type`（enum `heavy`/`normal`/`light`）、`workspace`（locator）、`workspace_input_digest`、`worktree`（locator）、`worktree_head`（40 位十六进制）、`recipe`、`nodes`、`source_digests`。<br>`recipe` = `{required_path_ids[], extra_requirements[], mutation_chooser, verify_required, recipe_source_digest}`；`required_path_ids` 元素 enum 取五路 id（见 D-003：第三路是 `consistency_review`，design/10 行文里的 `consistency` 是同一路径的简写，在 description 里就地说明）。<br>`nodes[]` 每项：`node_id`（唯一）、`node_type`（enum `construction`/`review`/`rework`）、`depends_on[]`、`start_deadline`、`checkpoint_deadline`（两者必填——design/10 §5.4.1「缺任一时限不得 launch」）、`applicability`（enum `applicable`/`na`）、`execution_mode`（enum `inline_registration`/`dedicated_pair`）、可选 `review_path_id`、可选 `profile_id`；`applicability=na` 时**必须**同时有 `na_evidence_ref` 与 `resolver_digest`。<br>`source_digests` = `{devplan_row, workspace_inputs, git_head, profile_registry, recipe}` 五个 sha256。`additionalProperties:false`；**不得**含 `run_id`/`generation`（那是 Run 侧的事，见 1.3）。 | `node tools/validate.mjs fixtures/golden/resolved-plan.v1.json --schema relay.resolved-plan/v1` → 退出 0 |
| 1.3 | Create · `relay-core/contracts/relay.run-binding.v1.schema.json` | Run↔Plan 关联（A31）。必填：`protocol`（const `relay.run-binding/v1`）、`run_id`（`$ref` common）、`plan_id`、`task_id`、`generations`（数组 `minItems:1`，每项 `{generation:integer≥1, resolved_plan_digest:sha256, activated_at}`）。description 写明三条规范性条款：①`plan_id`/`task_id` 在 Run 根**不可变**；②同一 Run 的新 generation 只允许沿用相同 `plan_id + task_id`，要改必须新建 Run；③Plan 文件**不反写** `run_id`。`additionalProperties:false`。 | `node tools/validate.mjs fixtures/golden/run-binding.v1.json --schema relay.run-binding/v1` → 退出 0 |
| 1.4 | Modify · `relay-core/contracts/reason-codes.md` | 按既有表格式**追加**本卡新增码（逐条写语义与触发场景）：`E_PLAN_LOCATOR_ESCAPE`、`E_WORKSPACE_MISSING`、`E_INPUT_DIGEST_DRIFT`、`E_RECIPE_PATH_MISSING`、`E_RECIPE_ILLEGAL_DOWNGRADE`、`E_RECIPE_NA_WITHOUT_EVIDENCE`、`E_PLAN_IDENTITY_MISMATCH`、`E_PLAN_DIGEST_MISMATCH`、`E_LEGACY_ROOT_WRITE`、`E_NEW_ROOT_START_DISABLED`。已有的 `E_ABSOLUTE_LOCATOR`/`E_UNKNOWN_FIELD`/`E_MISSING_FIELD`/`E_BAD_VALUE` 沿用，**不新造同义码**。 | `node tools/audit-contracts.mjs` → 0 违规 |
| 1.5 | Modify · `relay-core/tools/validate.mjs` | 把三份新 schema 接进 selftest 的加载与 id 映射（照既有写法）；`toReason` 里为新 pattern/条件补映射，**保持「先判语义最具体」的既有顺序**。 | `node tools/validate.mjs --selftest` → 全量通过 |
| 1.6 | Create · `relay-core/fixtures/golden/plan.v1.json`、`resolved-plan.v1.json`、`run-binding.v1.json` | 每份一个正例；`plan.v1.json` 用 `task_id: DHR_60`、`workspace: docs/modules/dh-relay/workspace/DHR_60`（与 design/10 §3.1 示例同口径，但**只能用相对 locator**）。 | 见 1.1~1.3 |
| 1.7 | Create · `relay-core/fixtures/negative/*.json` + 同名 `*.expect.json` | 至少这些：`plan-unknown-field`、`plan-missing-task-id`、`plan-absolute-locator`、`plan-locator-escape`（`../../etc`）、`plan-carries-acceptance-copy`（含 `acceptance` → `E_UNKNOWN_FIELD`）、`plan-writes-run-id`（含 `run_id` → `E_UNKNOWN_FIELD`）、`resolved-plan-node-missing-deadline`、`resolved-plan-na-without-evidence`、`resolved-plan-recipe-path-missing`（heavy 少 `code_round_2`）、`resolved-plan-illegal-downgrade`（要求 `dedicated_pair` 的路径写成 `inline_registration`）、`run-binding-generation-changes-plan-id`、`run-binding-digest-empty`。`.expect.json` 按既有格式写死 reason code **与出错位置 `at`**。 | `node tools/validate.mjs --selftest` → 全部按期望码被拒 |
| 1.8 | Test · `relay-core/test/contracts.test.mjs`（追加，不重排既有用例） | 新增一组 `DHR_53 plan contracts`：①三份 golden 通过；②每条 negative 命中期望 reason code + `at`；③**反向断言** `relay.plan/v1` 的 `properties` 里不存在 `goal/acceptance/allowed_paths/task_plan/run_id`（A23 全称命题，直接读 schema 断言）。 | `npm test` → 全绿 |
| 1.9 | Record · 三份基线 | 依次跑 `node tools/fixture-manifest.mjs --write`、`node tools/capability-baseline.mjs --write`、`node tools/audit-contracts.mjs --write-tokens`；**commit 里能看见 `capability_hash` 变了**。 | 三条命令不带 `--write` 再跑 → 全部相符 |
| 1.10 | Commit | `feat(dh-relay): 冻结 DHR_53 Plan/ResolvedPlan/RunBinding 契约`；按路径 stage，**禁 `git add -A`**。 | `git status --short` 干净 |

**批次 1 停下汇报后等主控。**

### 批次 2 — 确定性 Resolver

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 2.1 | Create · `relay-core/resolver/recipe.mjs` | 用 `Object.freeze` 冻结上面那张 `TYPE_RECIPES` 表 + 五路 id 常量 + 每路 `execution_mode` 下限（`code_round_1`/`code_round_2`/`requirement_direction` = `dedicated_pair`；`lessons`/`consistency_review` 允许 `inline_registration`）。导出 `recipeFor(taskType)` 与 `RECIPE_SOURCE_DIGEST`（对冻结表的 JCS sha256，用 `tools/canonical.mjs`）。**顶部注释写明来源仓路径与抄录日期**，并写明「跨仓 import 违反 relay-core 硬约束 1，故以数据形式冻结」。 | 单测：`recipeFor('heavy').required_path_ids.length === 5` |
| 2.2 | Create · `relay-core/resolver/devplan.mjs` | 从 DevPlan markdown 确定性读一行：定位 `<!-- dh:tasks -->` 之后的表，按「任务 ID」列精确匹配；`task_type` 优先取任务卡里的 `<!-- dh:task-type:v1 task=DHR_xx type=heavy -->` marker，marker 缺失 → fail-closed（**不猜、不默认降轻**）。导出 `readTaskRow(devplanPath, taskId)` → `{task_id, task_type, tier, status, workspace_hint, row_digest}`。 | 对 `dev_plan/P7-*.md` 读 `DHR_53` → `task_type==='heavy'`；读不存在的 ID → 命中 `E_MISSING_FIELD` 类错误 |
| 2.3 | Create · `relay-core/resolver/locator.mjs` | `resolveLocator(repoRoot, locator)`：拒绝绝对路径（盘符 / `\\` / `file:` / `~`）→ `E_ABSOLUTE_LOCATOR`；规范化后逃出 `repoRoot` → `E_PLAN_LOCATOR_ESCAPE`；目标不存在 → `E_WORKSPACE_MISSING`。**只做路径判定，不读内容。** | 单测三条反例各命中对应码 |
| 2.4 | Create · `relay-core/resolver/inputs.mjs` | `workspaceInputDigest(dir)`：只对**静态合同输入**取摘要——`brief.md`、`task_plan.md`（存在才计入，按文件名排序，JCS 化 `{name, sha256}` 列表再 sha256）。**明确排除** `progress.md`/`findings.md`/`review.md`/`lesson_candidates.md`（design/10 §3.2：运行中允许追加的工件不算静态输入）——写进函数注释并由测试断言。 | 单测：往 `progress.md` 追加一行 digest **不变**；改 `brief.md` digest **变** |
| 2.5 | Create · `relay-core/resolver/git.mjs` | `gitFacts(repoRoot)` → `{head, worktree}`；用 `child_process.execFileSync('git', ...)`，**只读命令**（`rev-parse HEAD`、`rev-parse --show-toplevel`）。git 不可用或非仓库 → fail-closed。 | 单测在本仓跑 → `head` 匹配 `/^[0-9a-f]{40}$/` |
| 2.6 | Create · `relay-core/resolver/resolve.mjs` | `resolvePlan({repoRoot, planPath, profileRegistry})` → Resolved Plan 对象。顺序：①按 schema 校验 plan ②locator 解析 ③workspace 存在性与 input digest ④DevPlan 行与 task_type ⑤`recipeFor` 展开五路 → 逐路生成 review node（`node_id` = `review-<path_id>`）⑥construction node（`node_id`=`construction-1`）⑦`profile_overrides` **只允许覆盖 profile_id**；试图改 `applicability`/`execution_mode`/删路径 → `E_RECIPE_ILLEGAL_DOWNGRADE`。<br>**依赖拓扑（照 design/10 §5.3）**：`construction-1` → `review-code_round_1` → 其余四路（`code_round_2`/`requirement_direction`/`consistency_review`/`lessons`）**并列**依赖 `review-code_round_1`。<br>**`lessons-absent` N/A**：教训库（`docs/modules/dh-relay/knowledge/教训库-候选.md`）不存在或无条目时该路 `applicability='na'`，必须带 `na_evidence_ref`（指向被检查的路径）与 `resolver_digest`；**N/A 不删路径**（`required_path_ids` 仍含它）。<br>时限：从 `profileRegistry` 或默认常量取 `start_deadline`/`checkpoint_deadline`，缺任一 → fail-closed。<br>**确定性**：同样输入两次调用产出**逐字节相同**的 JCS 序列化。 | `node --test test/resolver.test.mjs` |
| 2.7 | Test · `relay-core/test/resolver.test.mjs`（新建） | ①确定性：连跑两次 JCS 相同；②heavy 展开 6 个 node（1 construction + 5 review）；③normal 展开 4 个；④light 展开 3 个；⑤`profile_overrides` 只改 profile_id 通过、试图删路径/降级命中 `E_RECIPE_ILLEGAL_DOWNGRADE`；⑥缺 workspace → `E_WORKSPACE_MISSING`；⑦locator 越界 → `E_PLAN_LOCATOR_ESCAPE`；⑧input digest 漂移 → `E_INPUT_DIGEST_DRIFT`；⑨N/A 缺 evidence → `E_RECIPE_NA_WITHOUT_EVIDENCE`；⑩`lessons-absent` 时该路为 `na` 且**仍在** required 列表里。**fixture 用临时目录构造，不污染真实 workspace。** | `npm test` 全绿 |
| 2.8 | Modify · `relay-core/package.json` | `scripts.test` 追加 `test/resolver.test.mjs`。**只改这一处**，不动依赖。 | `npm test` 跑到新套件 |
| 2.9 | Commit | `feat(dh-relay): DHR_53 确定性 Plan Resolver` | 干净 |

**批次 2 停下汇报后等主控。**

### 批次 3 — 根路由、Run 关联与永久历史

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 3.1 | Create · `relay-core/resolver/roots.mjs` | `discoverRoots(repoRoot)` → `{new:{plans, archive, runtime}, legacy:[{kind, path, mode:'read-only'}], user}`。硬规则：①legacy 根（`.dh-relay/`、`.dh-runtime/relay/`）**只读发现**，任何写入入口返回 `E_LEGACY_ROOT_WRITE`；②**不原地改名/迁移/删除**；③用户级 `~/.dh-relay` 路径原样返回、不改；④`startInNewRoot()` 恒返回 `E_NEW_ROOT_START_DISABLED`（新根闸；解除条件写在注释里：DHR_60 前置全绿 + 用户放行）。 | 单测四条 |
| 3.2 | Create · `relay-core/resolver/run-binding.mjs` | `createRunBinding({runRoot, plan_id, task_id, run_id})` 写不可变绑定；`activateGeneration(binding, {generation, resolved_plan_digest})` 追加；`assertIdentity(binding,{plan_id,task_id})` 不符 → `E_PLAN_IDENTITY_MISMATCH`；`assertDigest(binding, generation, digest)` 不符 → `E_PLAN_DIGEST_MISMATCH`。**旧 generation 记录不可改写**（写入前断言目标 generation 不存在）。 | 单测五条 |
| 3.3 | Create · `relay-core/resolver/history.mjs` | `listRuns(root)` 区分 `active` 与 `history`：Run 处于 terminal（succeeded/failed/cancelled）→ 只进 `history`，`countsTowardCapacity===false`、`canContinue===false`。目录缺失/半写/读失败 → fail-closed，**且不得删除其他历史 Run**。**本模块不得含任何删除调用。** | 单测 + 3.6 源码级断言 |
| 3.4 | Test · `relay-core/test/roots.test.mjs`（新建） | ①`.gitignore` 断言：仓根 `.gitignore` 含精确行 `/dh_relay/runtime/`，且**不**含忽略整个 `dh_relay/` 的规则；用 `git check-ignore -q` 实测三条路径（`dh_relay/runtime/x` 被忽略；`dh_relay/plans/x`、`dh_relay/archive/x` **不**被忽略）。②legacy 根写入 → `E_LEGACY_ROOT_WRITE`。③`startInNewRoot()` → `E_NEW_ROOT_START_DISABLED`。④用户级 `~/.dh-relay` 路径未被改写。 | `npm test` |
| 3.5 | Test · `relay-core/test/run-binding.test.mjs`（新建） | ①同一 Plan 连续解析两次 → 两个**不同** `run_id`，两个 Run 根都保存**同一** `plan_id + task_id`（用 `runtime/runid.mjs` 发号）。②tracked Plan 内容改变后重新解析 → 新 Run/新 generation 有新 digest，**旧 Run 的 generation 元数据与 digest 逐字节不变**。③同 Run 新 generation 试图改 `plan_id`/`task_id` → `E_PLAN_IDENTITY_MISMATCH` 且 Store 不变。④缺 `resolved_plan_digest` → 拒绝激活。⑤全流程后 Plan 文件**未被写入 `run_id`**（读文件断言）。 | `npm test` |
| 3.6 | Test · `relay-core/test/history.test.mjs`（新建） | ①三类终态（succeeded/failed/cancelled）Run 目录仍在 → 不在 active、`canContinue===false`、`countsTowardCapacity===false`。②跑完整流程后目录与工件**仍存在**（逐文件断言）。③某个 Run 目录被人为删空 → 该 Run fail-closed，**其他历史 Run 完好**。④**源码级反向断言**：读取 `resolver/roots.mjs`、`resolver/history.mjs`、`resolver/run-binding.mjs` 文本，断言不含 `rmSync`/`rmdirSync`/`unlinkSync`/`rm(`/`rimraf`（A30「Runner 不删除」全称命题）。 | `npm test` |
| 3.7 | Record · 基线 | 若 3.x 动了 schema 或 fixture，重跑 1.9 的三条 `--write`。 | 三条不带 `--write` 相符 |
| 3.8 | Commit | `feat(dh-relay): DHR_53 根路由、Run 关联与永久历史` | 干净 |

**批次 3 停下汇报后等主控。**

### 批次 4 — 全量回归、证据与 as-built 草稿

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 4.1 | Test · 全量 | 依次跑五条命令（`npm test` / `validate --selftest` / `audit-contracts` / `fixture-manifest` / `capability-baseline`），把**逐条命令 + 退出码 + 关键计数**贴进 `progress.md` 的 Evidence Ledger。 | 五条全绿 |
| 4.2 | Create · `relay-core/resolver/README.md` | 一页说明：resolver 的输入/输出、fail-closed 清单（reason code 逐条）、**新根闸仍关**、以及「本模块不删除任何 runtime」。 | — |
| 4.3 | Modify · `docs/modules/dh-relay/as-built/relay-contracts.md`、`docs/modules/dh-relay/as-built/relay-core.md` | 覆盖式更新：新增三份协议与 `resolver/` 目录的现状；**盖真实 A→B**，不写计划语气。 | — |
| 4.4 | Record · `progress.md` / `findings.md` | 逐批日志、Evidence（E-0xx）、以及施工中发现的所有问题（含 D-003 那条 id 差异的实际落点）。 | — |
| 4.5 | Commit | `feat(dh-relay): DHR_53 回归证据与 as-built 收敛` | 干净 |

**批次 4 完成后停下，等主控进入复核，不得自行复核。**

## 关键决策（一句话各一行）

- Worktree：是，分支 = `wt/DHR_53`，目录 = `.dh-worktrees/DHR_53`（从最新 `master` 切出）
- 派子 agent：是 —— 施工 = `omp`（`openrouter/stealth/ox-alpha:max`，非交互分批）；兜底 = `codex exec -m gpt-5.6-terra`
- Review：五路复核全部派 **fresh `codex exec --sandbox read-only -m gpt-5.6-terra`**（OS 级机器只读）；施工者不复核自己的卡
- 批次策略：4 批，每批一个可独立验证的功能点，批末 fresh 小审（代码轮 1 前移）
