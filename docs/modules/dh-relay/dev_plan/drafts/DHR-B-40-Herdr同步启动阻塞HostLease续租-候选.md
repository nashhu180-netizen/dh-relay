<!-- dh:v1 -->
<!-- dh:planning-no-event:v1 artifact="dev_plan/drafts/DHR-B-40-Herdr同步启动阻塞HostLease续租-候选.md" reason="DHR-B-40 共创形成史；正式 planning event 只登记在 P6 DevPlan" -->
# DHR-B-40 · Herdr 同步启动阻塞 Host Lease 续租 — B-adjust 候选

> 状态：**已确认 · 形成史**。2026-09-04 用户明确委托主控自行决定，主控按推荐方案裁决并同步正式 DevPlan；本文件本身不授权改生产代码、建工作区、真实 Agent、verify、合并、推送或部署。

## 1. 触发事实与正式合同

- DHR_72 三次 DSH-off Codex 实录均在首条 `host_observation_changed` 前停止推进；脱敏账显示 15 秒 Host lease 先于 `attempt_started` 到期。该事实只触发本次 B-adjust，不自行改变产品合同。
- 统一 resolver 返回的正式输入中，本次只承接：
  - `design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md` `P6-RI-A3`：lease-lost 必须零改账、保持 fencing；
  - 同文 `P6-RI-A4`：DSH-off Windows 真实链必须经过 Receipt→checkpoint→submission→Result；
  - `design/10-薄RelayPlan与显式节点边界-产品设计调整.md` `HC-3AT-A29`：`node_started` / checkpoint 超时必须可见、Host/Runtime crash 可恢复且旧 Attempt 迟到写入被拒；
  - 同文 `HC-P1-A6`、`HC-CTRL-H1`：无进展和失租 fail-closed，DSH 停止时 Runtime 仍可运行与恢复。
- Code Scout 独立核对：`runtime/host.mjs` 默认 lease TTL=15 秒、约每 5 秒续租；`runtime/executors/herdr/herdr-cli.mjs` 通过 `spawnSync` 执行 Herdr，`agent start` 上限 60 秒；同步调用会占住同一 Node 事件循环，使续租 tick 在合法慢启动期间无法执行。结合三次现场，这构成**目前最强候选机制**，不宣称已排除 actor/Store 队列、文件系统、OS 调度或其它同步调用；剩余机制仍由 DHR_73 调查。

## 2. 调整项

### 2.1 新增 DHR_75

- **目标**：Herdr CLI 的启动、观察、提示与停止调用保持现有有界失败语义，但不得阻塞 Host lease 续租；合法慢启动期间唯一写者持续持有新鲜 lease，随后能落首条 Host Observation 与 checkpoint。
- **非目标**：
  - 不延长默认 lease TTL，不放宽 `writeGuard` / epoch fencing，不允许过期 lease 复活；
  - 不改 Receipt、Result、Event、RPC Schema 或 reason code；
  - 不改 DHR_72 的长期 idle/持续观察语义，不改 quota/fallback；
  - 不把本卡真实实录冒充 DHR_72 机器证 F 或 DHR_35 P6-M1；
  - 不处理 DHR_73 的其它启动停摆机制，不跑 Linux/SSH，不改用户级配置。
- **验收口径**：
  - **机器证 A（续租不饿死）**：静态与运行时断言生产默认 TTL 仍为 **15,000ms**；在持有 Host actor 的同一 Node 事件循环中注入短 TTL 与真实慢子进程，单次 Herdr CLI 调用跨过至少两个 renew tick。逐次记录调用区间、renew 前后 expiry、竞争取 lease 与首条 observation 的时间线；期间 lease 至少成功续租 2 次，独立 contender 取得同一 Run lease必须稳定返回 `E_LEASE_HELD`。仅把 TTL 拉长、保留同步阻塞的对照变异必须不能通过本断言。
  - **机器证 B（链路继续）**：同一夹具在慢调用返回后依次落 `host_observation_changed(alive)` 与至少一条 `checkpoint_recorded`；修前对照稳定表现为 lease 过期/无 Host Observation，修后转绿。
  - **机器证 C（fencing 不退化）**：由独立 contender 接管并写入新 epoch，或等价地使旧 lease 真正失效；逐项断言旧 actor 的 Host Observation、checkpoint、Result 全部被拒，事件账零双写、零重复 seq，actor 终态为 `lost_lease` 或等价现役拒绝语义。
  - **机器证 D（CLI 兼容）**：Herdr 成功、非零退出、超时、signal/启动失败、空 stdout、JSON stderr 错误映射保持现役返回形状与 reason/detail；async spawn 超时后必须等待 child `close`，并在 Windows 验证该子进程及其后代无残留。
  - **机器证 E（直接回归）**：现役 lease/host、Herdr adapter、DHR_70 submission gate 与 DHR_72 冻结五文件定向回归均有终态；不把 `identity-quota.test.mjs` 的 B-38 旧合同阻塞算成本卡失败或顺手改写。
  - **机器证 F（真实产品边界）**：DSH-off Windows、一个冻结 Codex Profile，至少一次运行在 `attempt_started` 后产生首条 `host_observation_changed`，且该时点 lease 未过期；若进一步取得 checkpoint 只记为本卡佐证，DHR_72 仍须在吸收本卡后独立重跑机器证 F。
  - **有效单测**：由第二轮 fresh reviewer 从生产改动选择变异点；登记 reviewer 独立身份、生产代码锚点、指定测试命令、施加前/后/还原后 hash、红/绿退出码与失败摘要。恢复同步阻塞、漏 `await`、或破坏超时清理之一必须使指定测试以**断言失败**变红。
- **变更范围**：
  <!-- dh:allowed-paths:v1 task=DHR_75 -->
  - `relay-core/runtime/executors/herdr/herdr-cli.mjs`
  - `relay-core/runtime/executors/herdr/herdr-executor.mjs`
  - `relay-core/test/dhr75-host-lease-during-herdr.test.mjs`
  - `relay-core/test/herdr-adapter.test.mjs`
  - `relay-core/test/helpers/fake-herdr-bin.mjs`
  - `relay-core/package.json`
  - `docs/modules/dh-relay/workspace/DHR_75/**`
  - `docs/modules/dh-relay/as-built/relay-core.md`
  - `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md`
  - `docs/modules/dh-relay/dev_plan/README.md`

  **限定**：生产修复收敛在 Herdr CLI/adapter 的异步调用边界；`herdr-executor.mjs` 只为 CLI Promise 补齐 `await`、失败 pane 清理与现役错误传播，不改变状态映射或业务判断。`herdr-adapter.test.mjs` 仅迁移直接调用 `makeHerdrCli()` 的 CLI 包装测试并补异步超时清理断言，不动 DHR_72 所有的 S1~S4、`:305`、`blocked→done` 等语义用例；`package.json` 只追加 DHR_75 新测试文件名，DHR_72 rebase 时与其追加 token 并存。`dev_plan/README.md` 只机械同步新增卡和依赖。`workflow-driver.mjs`、`host.mjs`、`lease.mjs`、`service.mjs`、`launcher.mjs`、`store/**`、`contracts/**` 均只读；若实现必须修改这些文件，停止施工并重新做 B-adjust。
- **档位**：标准（Runtime/Herdr 组件接线，高危）。
- **任务类型**：重核 `heavy`。
- **依赖**：DHR_70（已完成）；不依赖未合入的 DHR_72 生产改动；正式落盘后仍须另行 D-start，B-adjust 确认不授权施工。

### 2.2 调整依赖与恢复顺序

1. **状态事实分层**：主树 P6 DevPlan 尚停在陈旧的“未开始”，但用户已在此前对话完成 DHR_72 D-start，`wt/DHR_72` 已机械回填“进行中”；该 worktree 相对 `master@bbeffc4` 新增 6 笔 DHR_72 提交（相对 `origin/master` 的 ahead 9 还包含 master 自身 3 笔 DHR_74 历史，不混称本卡提交）。B-40 正式落盘时把主树状态机械对齐为“进行中”并新增 `blocked-by:DHR_75`；这不是 B-40 新授予 D-start。现有分支与提交保留，不回退、不混入 DHR_75 施工。
2. 用户另行 D-start 后，DHR_75 从届时精确 master 建独立 worktree；开发完成后自动推进五路复核、有效单测和 E10 证据备料，只有用户 E11 本地收口确认后才可 verify 并合入 master。
3. DHR_72 再 rebase 已含 DHR_75 的 master，重跑当前非绿的专属套件、冻结回归与自己的真实机器证 F；DHR_75 的实录不能替代该证据。
4. DHR_72 收口并使其机器证 H 入 master后，严格按既有三步执行：master 上 DHR_74 的 R31 清零 → 回填并补签 DHR_74 `verify(dh-relay)` → 才可删除 DHR_74 worktree/branch。DHR_75 本身不完成或回签 DHR_74。
5. DHR_73 与 DHR_35 的既有边界不变：DHR_73 仍是纯调查卡；DHR_35 仍须消费 DHR_72 收口后的新基线并自跑两条真实闭环。

## 3. 决定点

| ID | 问题 | 主控推荐 | 状态 |
|---|---|---|---|
| D-B40-1 | 直接把 lease TTL 拉长，还是消除 Herdr CLI 对事件循环的同步阻塞 | **消除同步阻塞**。TTL 拉到 60 秒以上仍会被更慢命令或后续同步调用再次击穿，而且延长故障接管时间；异步有界调用直接保证续租 tick 能运行，同时保留现有超时和 fencing。 | **已裁决：采纳推荐**（用户委托主控决定） |
| D-B40-2 | 把修复塞回 DHR_72，还是新增独立卡 | **新增 DHR_75**。DHR_72 明确禁改 `runtime/executors/herdr/**` 与启动段；独立卡使启动/lease 生命周期和持续观察语义可分别验收，避免扩大在途 heavy 卡。 | **已裁决：采纳推荐**（用户委托主控决定） |

## 4. 查漏

- **覆盖**：DHR_75 只补 `P6-RI-A3/A4`、`HC-3AT-A29`、`HC-P1-A6`、`HC-CTRL-H1` 在“同步 Herdr 调用饿死 lease 续租”这一实现缺口；不新增产品语义，不替代 DHR_72/DHR_35 的真实链验收。
- **颗粒度**：异步 CLI、续租不饿死、fencing 不退化与超时清理同生同灭，可作为一个独立验收单元；quota 与其它启动停摆仍拆开。
- **依赖**：`DHR_70 → DHR_75 → DHR_72 → DHR_35` 无环；DHR_73 仍依赖 DHR_72，但不阻塞 DHR_35 重开。
- **并行 WIP**：DHR_75 不改 DHR_72 当前拥有的 `workflow-driver.mjs`；`herdr-adapter.test.mjs` 仅改 CLI 包装测试区，`package.json` 仅追加独立 token。DHR_72 rebase 时逐 hunk 核对两处文本重叠，禁止用整文件覆盖解决冲突。

## 5. 审核账

### 5.1 第一轮 fresh 只读审核（2026-09-04，v1 → v2）

- reviewer：`/root/dhr_b40_review`，fresh-context，只读；HEAD `bbeffc4`；派出前后 Git 均仅本候选与 review brief 两个未跟踪文件；未运行测试。
- 结论：`CHANGES_REQUESTED`，P1×6、P2×1，全部采纳：根因降级为最强候选；A 补默认 TTL、逐次 expiry、TTL-only 变异与同事件循环；C/D 补独立 contender、child close 与 Windows 后代清理；移除 `workflow-driver.mjs`，冻结 `herdr-adapter`/`package.json` 重叠区；补 DevPlan README；DHR_74/DHR_73 顺序写硬；有效单测补齐 reviewer、锚点、命令、hash 与红绿字段。
- 用户理解风险：不得把本卡理解为延长 TTL、DHR_72 checkpoint、DHR_35 完整闭环、DHR_74 自动完成或全部启动停摆已解决。
- 用户决定点：异步化 vs 拉长 TTL；独立 DHR_75 vs 塞回 DHR_72；维持合同的 B-adjust vs 改 lease/recovery 语义后升级 A-full。

### 5.2 定向复审

第二个 fresh-context 实例 `/root/dhr_b40_recheck` 判 1~5、7 到位；第 6 项报 P1：它只读取主树 P6 的陈旧“未开始”，认为“保持进行中”会形成状态跃迁。主控**不采纳其建议的终态**，但采纳“必须消除歧义”：DHR_72 worktree 的 progress 与 P6 已登记此前用户 D-start、进行中和 9 笔提交；v3 改为明确区分主树陈旧状态、在途事实与 B-40 落盘时的机械对齐，不把既有 D-start 伪装成新授权。该裁决须由第三个 fresh 实例只核状态证据与措辞。

### 5.3 状态措辞窄复审

第三个 fresh-context 实例 `/root/dhr_b40_state_recheck` 确认状态三层描述准确，仅报 P2 数量归因：ahead 9 包含 master 自身 3 笔历史，实际相对 master 新增 6 笔 DHR_72 提交。v4 已按其最小修改精确区分两种基线；不改变任务、范围、验收、依赖或用户决定点。
