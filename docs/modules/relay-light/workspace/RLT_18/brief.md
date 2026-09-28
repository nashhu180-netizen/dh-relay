<!-- dh:v1 · brief.md -->
<!-- dh:workspace-contract:v2 -->
# brief — RLT_18 watch 通知与兜底（single-task）

## 覆盖任务与身份

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| RLT_18 | P1-RelayLight 第 5 批 | DevPlan `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md`「#### RLT_18」段与任务表 RLT_18 行；design/01 §3.6、§7.2、第 115/140/189/1436–1439 行、`HC-RL-A82`/`A83`/`A101`、`HC-RL-H11`/`H12`；`HC-RL-A125` 只做终局回归不承接 |

- GitHub Issue：**#65**；PR 使用 `Relates to #65`（高危，出口闸闭合前不自动关闭）。
- 工作树：`/home/nash/work/dh-relay/.dh-worktrees/RLT_18`；分支 `wt/RLT_18`；基线 `origin/master@5ab3bba`。
- 档位：标准 · 高危（第 5 批 watch 与组件接线）；`task_type=heavy`；有效单测硬要求；收口前须 `verify(relay-light):`。
- 执行模式：relay-light **`single-task`**（用户 2026-09-23「走简单版」）。不创建/读写本卡 `relay_plan.md` / `relay_log.jsonl`，不用 W/C/R/X/F 作 phase；派单与 signal 合同见 `dispatch/README.md`，运行配置见 `execution_strategy.md`（仅 orchestrator 写）。
- D-start：用户 2026-09-23 对话点选。

## 前置豁免（用户 2026-09-23）与三条已知影响

DevPlan 依赖 RLT_05、RLT_07、RLT_13、RLT_17；其中 **RLT_13 / RLT_17 由用户豁免**，已知影响：

1. RLT_17（Linux 双主控取证）将在**带 watch 的 adapter** 上跑，而非「先证无 watch 前台回退、再上 watch」的原排序。
2. 本机只有 Linux：Windows 两副本同步与 **A125 终局回归**（两机 `--all` 四目标哈希一致）**挂起**待 Windows 机。
3. `verify(relay-light):` 可能被 dev-harness 模块级钩子拦截（同 RLT_27 F-001）→ 本卡**最多到「待验收」**。

登记见 `findings.md` F-001～F-003。

## 目标 (Outcome)

交付 `relay_log.py watch --plan <dir> --notify <agent>`：只通知、不写账；每个在场 agent 一线程挂 `herdr agent wait`，返回即发短 ASCII 单行 prompt；发完不立即重挂，改 30 秒 `agent get` 轮询直到账本终态（退出）或回 `working`（重挂）；同一 `(agent, 状态)` 转换只通知一次；每 20 分钟 `[relay-light] tick`；阶段级在本阶段末节点 `node_close` 后退出、编排级在末阶段 `stage_close` 后退出。两个仓内 adapter 的等待段改为「watch 默认、无 watch 回退前台 `wait --timeout 1200000`」并写明节拍归属；watch 中途死亡按用户裁决 UD-1（`decisions.md`）处置：pane 内 shell 重启循环自动恢复进程，阶段级 pane 被关由编排 20 分钟 tick 对账发 `stage-stalled` 兜底，编排级 pane 被关如实写依赖人工。按 UD-2 同步 SKILL.md 三处 watch 过时措辞。最后真实 Herdr 实测 H11/H12 并交用户人判。

## 非目标

- 不把 watch 变成驱动器或写者；不做秒级监控；不改 design/、AGENTS.md、SKILL.md 中 UD-2 三处以外的内容、`install_skill.py`、`docs/modules/relay-light/relay/**`。
- 不做用户级 skill 副本同步（orchestrator 收口时另取用户授权）；不做 Windows 侧与 A125 终局回归（挂起）。

## 完成条件

| # | 条件 | 谁验 | 出处 | 证据落点 |
|---|---|---|---|---|
| 1 | 30 秒轮询、发通知后无立即重挂；账本终态 → 停盯退出线程；Herdr 回 `working` → 重挂 wait；同一 `(agent, 状态)` 转换只通知一次 | AI（打桩单测） | `HC-RL-A82` | batch 1 |
| 2 | 每 20 分钟 `[relay-light] tick`；无 watch 时节拍由前台 `wait --timeout 1200000` 维持（adapter 写明归属）；阶段级末节点 `node_close` / 编排级末阶段 `stage_close` 两层退出 | AI（打桩时钟 + 结构检查） | `HC-RL-A83` | batch 2 |
| 3 | watch 代码路径无任何写账调用 | AI（静态检查 + 运行期账本字节不变） | `HC-RL-A101` | batch 1 |
| 4 | Claude / Codex 监工忙（working）时 watch prompt 是否被排队而非丢弃——分别验 | 人 | `HC-RL-H11` | batch 3 取证，用户判 |
| 5 | watch 死亡后，本终端空间 watcher 的 10 分钟巡检是否接住（契约 v2，RLT-A-14 / RLT-B-10；v1「20 分钟兜底」经 UD-3 否决） | 人 | `HC-RL-H12` | UD-3 U2 取证（`evidence/ud3-h12/`），用户判 |
| 6 | heavy 五路 workflow-final + E2 无 open P0/P1；`verify(relay-light):`（可能被钩子拦，见 F-003） | AI + 人 | AGENTS 宪章 #2/#5 | review.md |

## 流程

`task_plan.md`（本 phase=plan）→ plan-review → batch 1/2/3 各带 batch-review → workflow-final heavy 五路 → E2 code_review → 主会话人验（H11/H12、验收）。
