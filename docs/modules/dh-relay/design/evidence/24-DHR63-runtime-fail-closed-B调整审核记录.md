# DHR-B-25 · DHR_63 runtime fail-closed 补卡 — fresh B-adjust 审核记录

审核结论：**有条件通过，当前不得直接生效或开工**。没有发现 P0；但在并行路径冻结、A5 证据承接、DHR_63 的 A/B 选择与依赖回写前，存在 P1，需先修订候选并取得对应用户决定。本文只审候选，不代签 B-adjust、D-start、merge、verify 或 DHR_35。

## 方案问题

| 级别 | 事实与证据 | 建议 |
|---|---|---|
| P0 | 候选仍明确为“尚未生效”，且非目标排除了用户级 registry、凭据、真实 Agent、DHR_35 与 Linux（候选第 4、17 行）；未见安全绕过或数据写入授权。 | 无 P0；保持候选态，不把本审查当作施工授权。 |
| P1-1 | 候选把 DHR_65 的允许路径定为 `profile-registry.mjs`、`herdr-adapter.test.mjs`、`profiles.test.mjs`（候选第 22 行），并断言与 DHR_64 无所有权重叠（第 34 行）。但现行 DHR_64 task plan 仍允许 `workflow-driver.mjs`、`executors/herdr/**` 与 `relay-core/test/**`（`.dh-worktrees/DHR_64/.../task_plan.md:17-21`），正式 DevPlan 亦保留 `runtime/executors/herdr/**` 与对应测试的宽范围（`dev_plan/P6-Herdr多账号执行底座-开发方案.md:216`）。当前 DHR_64 工作树实际尚未改 `profile-registry.mjs`、`herdr-adapter.test.mjs` 或 `profiles.test.mjs`，但“当前无交集”不等于合同已无交集。 | 在 DHR_64 仍有并行 WIP 时，把 DHR_65 改成精确路径：建议只改 `profile-registry.mjs`，新增独占的 `dhr65-runtime-registry.test.mjs` 与 `workspace/DHR_65/**`；同时把这些路径从 DHR_64 的允许范围显式排除，或先冻结 DHR_64 的最终路径并做交集检查。不要用宽 glob 的文字断言代替合并前的 exact-path 证据。 |
| P1-2 | design/12 的 P6-RI-A5 明确要求三件事：坏 registry 条目拒绝真实启动、**两个修复后的指定 Profile** 复验通过、配置正文/凭据不进入工件（`design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md:83`）。候选只写“目标 Codex/Claude Profile”和坏 alias/config（第 19-20 行），没有冻结两个稳定 ID、没有明确必须使用 DHR_63 修复后的完整用户 registry、也没有把零配置正文/凭据扫描列为 DHR_65 的证据或与 DHR_63 的证据拼接规则。DHR_63 当前 review 也仍将 runtime fail-open 与严格 mutation 标为 open（`.dh-worktrees/DHR_63/.../review.md:24-27,49-52`）。 | 将 A5 拆成可核对的证据映射：明确 `herdr.codex.main`、`herdr.claude.main`（或经用户确认的稳定 ID）；坏 alias/config 必须在完整正式 registry 上测试；好路径必须验证这两个修复后条目；driver 负例断言零 Attempt/Agent/pane/Result；最后附零配置正文、零凭据扫描及“不可证”登记。说明 DHR_63 的 registry 证据与 DHR_65 的 runtime 证据如何共同闭合 A5。 |
| P1-3 | 候选第 25-30 行把 DHR_63 的 `task_type` 从现行 normal 改为 light 与“保持 normal 并扩生产路径”列为二选一，但正式 DevPlan 仍冻结 DHR_63 为 normal（`dev_plan/P6-Herdr多账号执行底座-开发方案.md:194-204`），工作区 brief/task plan 也仍按 normal recipe（`.dh-worktrees/DHR_63/.../brief.md:4-6`、`task_plan.md:21-25`）。候选没有说明选定后需同步 DevPlan、brief、task_plan、review/Findings、复核路径及新的 D-start。 | 保持“待用户决定”，不得因“推荐”自动采用 A。用户必须明确选择 A 或 B；选择后先回写全部合同与复核 recipe，再按新卡边界重新 D-start。若选 B，DHR_63 的原 registry-only 授权不能覆盖 loader/测试生产改动，必须重新冻结范围并重做交集审核。 |
| P1-4 | 依赖段无条件写“新增 DHR_65”且把 DHR_35 改为 `blocked-by:DHR_63,DHR_64,DHR_65`（候选第 34 行），但方案 B 明写“不新增 DHR_65”（第 30 行）。此外，如果 A5 的“修复后 Profile”必须消费 DHR_63 的用户 registry 输出，当前没有 `DHR_63 → DHR_65` 边，也没有写联合汇合闸。现行正式依赖仍是 DHR_35 只阻塞于 DHR_63、DHR_64（`dev_plan/P6-Herdr多账号执行底座-开发方案.md:269-271`）。 | 做成条件依赖：A 方案才新增 DHR_65，并将 DHR_35、P6-A5 的最终汇合改为三卡；B 方案保持两卡并把 runtime 路径正式并入 DHR_63。若 DHR_65 只做实现单元可独立收口，也必须把“DHR_63 registry 证据已闭合后才可判 A5 完成”写成汇合条件；否则增加 DHR_63→DHR_65。DHR_65 也要明确独立 D-start，不能借用 DHR_63/DHR_64 的启动授权。 |
| P2 | 候选说“runtime loader 和 driver”都 fail-closed（第 16、19-20 行），但允许路径只列 loader 与测试，没有说明 driver 是仅被测试的既有消费者，还是要改 `workflow-driver.mjs`；现行 DHR_63 禁改 production code（`.dh-worktrees/DHR_63/.../brief.md:26-30`）。 | 在合同中写死：DHR_65 生产改动仅为 loader 的 alias-resolve 行为；driver 不改则用真实 `startWorkflowDriver` + 完整坏 registry 证明零 pane/Attempt，若需改 driver 必须另行扩路径并重新 B-adjust 审核。 |
| P3 | 当前未发现额外的产品语义、Linux 或 Result bridge 范围问题；候选已将 DHR_65 的非目标写为不碰 Receipt/Store/RPC/Result bridge（第 17 行）。 | 保持该边界，并在最终查漏表注明 P3 无新增项。 |

## 用户理解风险

| 级别 | 事实与证据 | 建议 |
|---|---|---|
| P0 | 本候选不含真实 Agent、凭据或用户配置授权（候选第 4、17 行），没有发现会让用户立即误操作造成数据/安全事故的 P0 理解缺口。 | 无 P0；继续把候选审核、B-adjust 生效、D-start 和真实 E2E 分开。 |
| P1 | 用户可能把“继续 DHR_63/授权 B-adjust”理解成 DHR_63 自动获得生产 loader 修改权，或把新增 DHR_65 理解成 DHR_63 的续棒。事实上 DHR_63 的当前合同明确禁止 Runtime/生产代码（`.dh-worktrees/DHR_63/.../brief.md:28-30`），而候选将 runtime mutation 另列为 DHR_65（第 14-23 行）。 | 解释为两条不同责任：DHR_63 只完成用户级 registry 数据维护；DHR_65 才完成 runtime loader fail-closed。任一新卡都要独立 D-start；DHR_35 在所有选定前置完成并重新 D-start 前继续停。 |
| P1 | “方案 A：保持标准，但把 task_type 改成 light”（候选第 29 行）同时使用档位与 task_type 两个维度，容易被理解成只改文字。实际上它会改变复核 recipe：当前 DHR_63 是 normal，且 review 明列代码轮 1、需求、教训与有效单测（`.dh-worktrees/DHR_63/.../task_plan.md:21-25`、`review.md:8-10`）。 | 向用户分别说明：档位仍可为标准；`task_type=light` 会取消 normal 的实现级 mutation 要求、改用 light 的复核路径。只有用户明确选 A 后才能回写 recipe；不能把 registry 输入 mutation 当 normal code mutation。 |
| P2 | 候选第 34 行把 DHR_35 的阻塞条件写成三卡，但现行 DHR_35 brief/task plan 仍是 `blocked-by:DHR_63,DHR_64`（`.dh-worktrees/DHR_35/.../brief.md:6,32`、`task_plan.md:17`）；若用户只看其中一处，可能误以为 Windows 实录已解锁。 | 在正式回写时同步 DevPlan、DHR_35 brief/task_plan/review/findings，并明确“无论 A/B，DHR_35 不得因 DHR_65 候选落盘而启动”；Linux 继续按 B-22 延后/受限（design/12:20）。 |
| P3 | 用户可能把“无需真实 Agent”（候选第 23 行）理解成 A5 已经通过；实际上它只表示 DHR_65 用机器/fixture 证明 loader 与 driver 的启动前止损，不能替代 DHR_35 的真实 Codex/Claude E2E（design/12:82-83）。 | 在展示中把 DHR_65 结论标为 runtime 机器证，把 DHR_35 的真实产品证据单列为后续闸。 |

## 需要用户决定的问题

| 级别 | 事实与证据 | 建议 |
|---|---|---|
| P0 | 当前没有需要用户对安全事故或数据回滚作出的 P0 决定；候选仍未生效。 | 无 P0 决定项。 |
| P1 | 必须决定 DHR_63 的任务类型与拆分：A = DHR_63 改为 `task_type=light`、新增独立 DHR_65；B = DHR_63 保持 normal 并吸收 loader/test 路径。候选明列二选一且标为“待用户决定”（第 25-30 行），现行 DevPlan 尚未回写（第 203 行仍为 normal）。 | 请用户明确选择 A 或 B，而不是只说“授权”。本审查建议 A：保持 DHR_63 registry-only，DHR_65 独立承接 runtime mutation；若选 B，必须接受扩大 DHR_63 范围、重新冻结合同/复核和与 DHR_64 的串行或精确隔离成本。 |
| P1 | 必须决定 A5 的汇合方式：DHR_65 是否必须等待 DHR_63 的两个修复后 Profile 与零敏感证据闭合，还是允许 DHR_65 先独立收口、最后由三卡汇合。候选当前同时写独立依赖与三卡阻塞，未给出规则（第 19-20、34、38-40 行）。 | 建议选择“代码可独立施工，但 A5/P6 闭合必须等待 DHR_63 registry 证据 + DHR_65 runtime 证据”的汇合规则；若要严格拓扑表达，则加 `DHR_63 → DHR_65`。 |
| P2 | 必须决定 DHR_65 的测试落点和路径冻结：复用既有 `herdr-adapter.test.mjs`/`profiles.test.mjs`，还是采用独占新测试文件。DHR_64 当前 task plan 对 `relay-core/test/**` 与 `executors/herdr/**` 使用宽范围（见方案问题 P1-1）。 | 建议选择独占 `dhr65-runtime-registry.test.mjs`，并在 DHR_64 收口/合并前做 exact-path 交集检查；无须 A-full。 |
| P2 | 必须决定 DHR_65 是否只修复现有 design/12 A5 的实现缺口。design/12 已是正式、已确认的设计输入，A5 已明确坏 registry 拒绝真实启动及两 Profile 复验（`design/12:4,75-83`）；候选没有提出新的 Result、身份、RPC、Linux 或用户语义。 | 就当前候选，**B-adjust 足够，不需要 A-full**。仅当后续要改变 A5 语义、registry 字段闭集、Receipt/Result/RPC、或新增设计命题时，才停止并另走 A-full；不要把实现 mutation 当成 A-full 的理由。 |
| P3 | Linux 延后与 DHR_35 真实 E2E 边界已有正式口径（design/12:20,82-89），本候选没有新的 Linux 决策。 | 无新增 P3 决定；保持 Linux 延后/受限，待阶段闸另行裁决。 |
