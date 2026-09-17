# RLT_24 C4 checker — commits 8cd513b / cd78ea8

## 结论

PASS（P1 0，P2 0）。A157 两类终端空间的可控关闭失败取证均具备观察、合法失败行、按 seq/object_id 实际检索和待人工处理状态；C4 按用户裁决的写入者纪律分别记在 C1 与 F1。本结论仅覆盖 C4 取证，不代替 C3、开发后复核或最终验收。

## 逐项核验

| # | 判据 | 结论 | 依据与独立核验 | 整改动作 |
|---|---|---|---|---|
| 1 | task_plan C4 / A157 四要素 | PASS | `evidence/A157-stage-workspace.md:1-62` 与 `A157-orchestrator-workspace.md:1-60` 分别声明**实跑**（非打桩）：`herdr workspace close rlt24-c4-stage-probe` / `rlt24-c4-orch-probe`，各 rc=1、原始 stderr `workspace_not_found` 存 `evidence/raw/`，并记录前后在用 workspace ID 集相同。两份文件均给出 add 命令与 rc=0、原 JSONL 行、账本路径、seq/object_id 检索输出和明确的“待人工处理”，不冒称已处置。`progress.md` E-C4-01～05 登记命令、观察和结果；本批按 `task_plan.md:125` 无需造程序 RED。 | 无。 |
| 2 | r2 裁决的两类用途与节点 | PASS | `decisions.md:5` 将“编排空间→F 首节点”定为写入者纪律。`evidence/fixture/relay_plan.md` 显示 C#1 仅 C1、F#1 仅 F1，均无 superseded 节点；两份证据分别交代用途来自 §12 现场声明，不拿 object_id/fixture 名称充当解析规则。fixture 账本 seq 4 为 `orchestrator#1/by=orchestrator`、stage 探针 ID、node=C1；seq 5 为相同写入者、独立 orch 探针 ID、node=F1，均有 `outcome=failed reason=herdr%20workspace_not_found`。独立解析 JSONL 按 seq 和解码 object_id 双向匹配，各唯一命中对应原行，账本共 5 行。 | 无。 |
| 3 | 完成判据独立复跑 | PASS | `PYTHONDONTWRITEBYTECODE=1 python3 tools/relay-light/relay_log.py lint --plan docs/modules/relay-light/workspace/RLT_24/evidence/fixture --config-dir tools/relay-light/skill`：exit 0、`lint: ok`；同 fixture `status --json`：exit 0、`errors=[]`、C1 ready/F1 pending、C#1 open/F#1 pending。原始检索文件 `evidence/raw/retrieval-by-seq-and-object-id.txt:1-9` 与实际账本核对一致。 | 无。 |
| 4 | 并行范围、回归减量与历史兼容 | PASS | `git show --name-only 8cd513b` 仅本卡 evidence、progress、findings、lesson_candidates；`cd78ea8` 仅本卡 progress 信号；C4 未改代码或测试。入场 `git status --porcelain` 唯一未提交项为 `M tools/relay-light/test_relay_log.py`，属 C3，本审核未修改或计入 C4。`dispatch/C4-parallel.md:8-25` 明确并行 C4 不跑全量 unittest，改用 lint/status 与历史账本核对；因此 `dispatch/C-check.md` 的通用全量回归记录要求在本批由该特例覆盖，全量回归留开发后复核与 CI。历史 `rlt12-win-01/relay_log.jsonl` 当前 SHA-256 与 master 同为 `3cd08fdc88e9d51be16997ad9dc1bd92fc89f3c00796345e0a0b3a229a5ed40b`，`git diff master --stat -- docs/modules/relay-light/relay/` 为空，`git diff --check` 通过。 | 无。 |
| 5 | §3.4 与既有合同 | PASS | C4 仅使用已提交 C1/C2 `add`/`lint`/`status` 能力；两行顶层七字段、note 四键、编码、写入者及可计算节点规则符合 §3.4。`object_type=workspace` 不提供阶段/编排用途字段，文档按 `decisions.md:5` 将此差别保留为现场纪律，未声称 add/lint 可识别用途；非 `resource_close` 自由 note 路径未被本批改动。 | 无。 |

## 范围外发现

无。设计正文与用户裁决间的已知后续复核风险仍见 `decisions.md:5`；本批只按已批准的 r2 工作计划审核。
