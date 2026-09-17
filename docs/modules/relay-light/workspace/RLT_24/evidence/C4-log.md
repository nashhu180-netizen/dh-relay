# C4 施工日志（rlt24-coder2 · A157 两类终端空间关闭失败取证）

与 rlt24-coder 的 C3 并行：按 `dispatch/C4-parallel.md` 硬规则，本批**未** rebase/stash/reset，未改 `relay_log.py` / `test_relay_log.py`，未跑全量 unittest；只用已提交的 C1/C2 能力（`add`/`lint`/`status`）取证。

## 时序

| 时刻(约) | 动作 | 结果 |
|---|---|---|
| 15:5x | `git status && git branch --show-current`（跳过 rebase） | `wt/RLT_24`，仅 C3 未提交的 `M test_relay_log.py` |
| 15:5x | 建 `evidence/fixture/relay_plan.md`（C1=RLT_24:C#1 首节点、F1=RLT_24:F#1 首节点） | 文件落盘 |
| 15:5x | `lint --plan fixture --config-dir skill`（空账本） | `lint: ok`，rc=0 |
| 16:00 | `herdr workspace list` 快照 → `herdr workspace close rlt24-c4-stage-probe` / `rlt24-c4-orch-probe` → 再快照 | 两探针各 rc=1、`workspace_not_found`；前后 id 集相同（6 个在用空间零误触）；**实跑** |
| 16:00 | `add plan_loaded`（C1）→ `stage_start`（C1, `stage_id=RLT_24:C#1`）→ `monitor_launch`（C1, 同上） | 各 rc=0，seq 1–3 |
| 16:00 | `add resource_close`（node=C1，`object_id=rlt24-c4-stage-probe outcome=failed`） | rc=0，seq 4 |
| 16:00 | `add resource_close`（node=F1，`object_id=rlt24-c4-orch-probe outcome=failed`） | rc=0，seq 5 |
| 16:0x | `lint` / `status --json` 复跑 | lint rc=0 `lint: ok`；status rc=0 `errors=[]`，C1 ready / F1 pending、C#1 open / F#1 pending |
| 16:0x | 按 seq 与解码 `object_id` 双向检索 JSONL | seq4↔stage-probe、seq5↔orch-probe 各恰命中一行 |
| 16:0x | `sha256sum rlt12-win-01/relay_log.jsonl` + `git diff master --stat -- relay/` + `git status --porcelain` + `git diff --check` | sha=`3cd08fdc…40b` 与 E-C1-06/E-C2-06 一致；relay/ diff 空；porcelain 仅 C3 的 `M test_relay_log.py` + 本批 `?? evidence/`；无 `__pycache__` |

## 结论

- 两例可控关闭失败均为**实跑**（herdr 0.9.0 实际 socket API，id 为不存在的探针），观察原件在 `evidence/raw/`。
- 写入者纪律现场证据：阶段空间观察由 `orchestrator#1` 记在其阶段首有效节点 C1（seq 4）；编排空间观察由 `orchestrator#1` 记在收口 F 首有效节点 F1（seq 5）——这正是 `decisions.md` 第 1 行裁决要求 C4 证明的两条对应关系；机器不解析 workspace 用途，fixture 名称不作解析规则。
- 两例处置状态均为**待人工处理**（§12 报错交人、不强删；探针 id 无真实资源可处置）。
- 本批无程序 RED 需求：C1/C2 已交付的合法写入能力直接可用（task_plan 「不造假 RED」口径）。
- 程序缺陷：未发现，无需在允许路径内修代码。

## 待登记（收口时追加到 progress.md / findings.md / lesson_candidates.md）

- E-C4-01 fixture 建账与上下文行；E-C4-02 两次探针观察与零误触快照；E-C4-03 两条 resource_close add rc=0；E-C4-04 lint/status/双向检索；E-C4-05 历史账本 sha 与 relay/ diff 核对。
- findings：本批无新发现（A157 取证一次走通，未暴露 C1/C2 缺口）。
- lesson：并行取证批的安全姿势——「禁止 rebase/只加自己的 evidence、实跑用不存在 id 探针 + 前后快照证零误触」可复用。
