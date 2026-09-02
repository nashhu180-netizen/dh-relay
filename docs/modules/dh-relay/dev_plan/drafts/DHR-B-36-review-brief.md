<!-- dh:v1 -->
# DHR-B-36 · B-调整只读审核 brief

你是 **B-调整审核者**，不是主控。只读，不改任何文件、不拉终端、不派活、不问用户。结论写在回复正文（中文）。

## 待审对象

`docs/modules/dh-relay/dev_plan/drafts/DHR-B-36-DHR71隔离清单与绿闸范围校正-候选.md`

对照（请自行打开，不要只信草案陈述）：

- 上游合同：`docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md` §3.2 `#### DHR_71`、`#### DHR_72`（允许路径 marker 与「限定」段）、§0.2 `DHR-B-35` 事件段；`docs/modules/dh-relay/dev_plan/drafts/DHR-B-35-driver持续观测与定向回归复绿-候选.md` §1 触发事实表（F-3520 那行的归类）与 §3.1/§3.2、审核账 X-03。
- 施工现场（分支 `wt/DHR_71`，**未合入 master**；worktree 在 `.dh-worktrees/DHR_71/`，可直接读，或 `git show wt/DHR_71:<path>`）：`docs/modules/dh-relay/workspace/DHR_71/construction.DONE`、`progress.md`、`findings.md`、`evidence/gate-round{1,2,3}-20260902T0405Z.txt`、`evidence/hang-repro-20260902T0338Z.txt`、`evidence/baseline-20260902T0316Z.txt`、`evidence/isolated-*-20260902T0322Z.txt`。
- 代码事实：`relay-core/runtime/workflow-driver.mjs` `:420-427`（stop 后写 `human_input_requested(E_EXECUTOR_KILLED)`）、`:536-541`（恢复届 `probe.missing` → `human_input_requested(E_EXECUTOR_HOST_LOST)`）；`git show 0dd371d --stat`（DHR_64 删 judge 直写通路）；`relay-core/test/agent-node.test.mjs` 与 `relay-core/test/herdr-adapter.test.mjs` 在 master 与 `wt/DHR_71` 两个版本（`git diff master...wt/DHR_71 -- relay-core/test/`）；`relay-core/test/dhr69-false-ready.test.mjs:15`、`:179-184`；`relay-core/runtime/executors/herdr/herdr-cli.mjs:17`（`HERDR_START_TIMEOUT_MS`）。
- `docs/modules/dh-relay/backlog.md` `DHR-BL-17`。

仓库：当前 cwd（主树，master）。不要写文件。

## 固定三段

1. **方案问题**（P0 正确性/越界；P1 验收不成立、允许路径与验收口径对不上、两卡互斥被打破；P2 可维护/措辞）
2. **用户理解风险**
3. **需要用户决定的问题**（没有就写无，不要发明决定点；草案 D-B36-1 / D-B36-2 是主控已开出的待确认项，请对其推荐给出你的判断）

每条：问题 → 原始需求或你独立打开的事实 → 影响 → 建议。无新增实质问题也须列已核假设、反例和证据。至少引用一条用户原始需求（B-35 §0 / 本草案 §状态行）并自行核查一项仓库事实。

## 重点核

- **F-7102 / F-7104 是不是真的语义红**：亲自打开 `gate-round1` 的失败段（`undefined !== 'E_EXECUTOR_KILLED'`；`#10` 的超限 dump 事件序列），再对照 `workflow-driver.mjs` 的两个写点。若你认为其中任一条其实是时序或 EPERM，说明依据。
- **「skip 恰 4」是否仍是可核查的冻结清单**：四条的定位方式（文件 + 用例名 + master 行号）是否足以让 DHR_72 收口时一一解除、不会多解少解。
- **两卡互斥是否仍成立**：草案给 DHR_72 加了 `agent-node.test.mjs`（仅一条用例）和 `herdr-adapter.test.mjs:354`；给 DHR_71 加了 `dhr69-false-ready.test.mjs:179`。是否与 B-35 X-03 冻结的「共享夹具 / `fake-herdr.mjs` / `workflow-driver.mjs` 唯一归属 DHR_72」冲突；串行顺序（DHR_71 先合入）是否足以避免同文件冲突。
- **D-B36-2 的替代方案**是否被公平陈述；`dhr69:179` 的 45s 等待是否真的"抖动"——请看 `:510`（三轮全绿，45s 上限未改）与 `dhr69:179` 走的是不是同一条启动 blocked 路径，以及生产上限（`HERDR_START_TIMEOUT_MS`、driver `herdrReadyTimeoutMs`）是否可能让这条路径合法地超过 45s。若可能，草案 §2.1 要求"上限由生产上限推出"是否足够。
- **652s 归因**是否被草案如实转述（`hang-repro` 的 A/B/C/E/F 组结论），以及把它补进 BL-17 而不是另开条目是否恰当。
- **是否有未被草案列出的 B-35 条款因本次调整而失效**（例如 DHR_72 机器证 E 的「55/55」数字、B-35 §7 颗粒度段的「2 条语义红」表述）。
