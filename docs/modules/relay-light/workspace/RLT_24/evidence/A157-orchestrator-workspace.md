# A157 取证 2/2 — 编排的终端空间关闭失败

> oracle：design/01 §12 第 1368 行「编排的终端空间 · 删失败怎么办」+ §11.1 HC-RL-A157（第 1337 行）+ §3.4 `resource_close` 行（第 257 行：「编排终端空间 / worktree 取收口 F 阶段第一个有效节点」）。
> 本文只执行与取证，不改设计正文。

## 1. 现场用途来源与 F 首有效节点判定

- **用途来源**：design/01 §12 第 1368 行——编排的终端空间由人在全计划结束后关闭；本条取「编排终端空间关闭失败」这一例。按 `decisions.md` 第 1 行用户裁决，「编排空间须指向 F 首有效节点」是**写入者纪律**而非机器校验：wire format 无字段可区分两类 `workspace`，本文的用途声明来自写入者按 §12 行归属的现场记账，**fixture 名称与 `object_id` 仅作证据定位，不作为空间用途的解析规则**。
- **收口 F 阶段首有效 node 的判定**：fixture 计划 `evidence/fixture/relay_plan.md` 中 `stage_id=RLT_24:F#1` 的节点行只有 `F1` 一行（`| F1 | RLT_24 | RLT_24:F#1 | handoff | ... | depends_on=C1 |`），无 superseded 行，故 F 阶段首有效节点 = **F1**。机器侧 `_validate_close_node` 对 `workspace` 只强制「`node` 为其 `stage_id` 首有效节点」（F1 满足）；「编排空间→F」这一层由写入者纪律承担，本条证据证明实际记账落在 F1 而非别处。

## 2. 可控关闭失败观察（**实跑**，非打桩）

- 命令：`herdr workspace close rlt24-c4-orch-probe`（与阶段空间探针不同的独立测试 id，同样不与任何在用空间 id 相交）。
- 实际返回：**rc=1**，stderr 原样（原始输出存 `evidence/raw/herdr-close-orch-probe.stderr.txt`，stdout 为空存 `.stdout.json`）：

  ```json
  {"error":{"code":"workspace_not_found","message":"workspace rlt24-c4-orch-probe not found"},"id":"cli:workspace:close"}
  ```

- 误触核对：与上一例共用同一组前后快照——`herdr workspace list` 前后均为 `['w15','w2B','w2C','w2E','w2F','w2G']`，6 个在用 workspace 无一被关闭或改动；仅记录 id 集合与计数。

## 3. 合法失败行落账

由 `agent=orchestrator#1`（`by=orchestrator`）记在收口 F 阶段首有效节点 **F1**（独立于上一例的另一对象、另一行）：

```
PYTHONDONTWRITEBYTECODE=1 python3 tools/relay-light/relay_log.py add \
  --plan docs/modules/relay-light/workspace/RLT_24/evidence/fixture \
  --node F1 --event resource_close --agent orchestrator#1 \
  --note "object_type=workspace object_id=rlt24-c4-orch-probe outcome=failed reason=herdr%20workspace_not_found" \
  --config-dir tools/relay-light/skill
```

返回 **rc=0**。原 JSONL 行（`evidence/fixture/relay_log.jsonl` seq 5）：

```json
{"seq":5,"ts":"2026-09-17T16:00:47.403926+08:00","node":"F1","event":"resource_close","agent":"orchestrator#1","by":"orchestrator","note":"object_type=workspace object_id=rlt24-c4-orch-probe outcome=failed reason=herdr%20workspace_not_found"}
```

- `object_id` ≡ 探针命令实际参数；`reason` 解码为 `herdr workspace_not_found`，与观察一致；rc=1 ↔ `outcome=failed`。

## 4. 按 seq / object_id 实际检索

`evidence/raw/retrieval-by-seq-and-object-id.txt`：

```text
== lookup by seq ==
seq=5 node=F1 event=resource_close agent=orchestrator#1 by=orchestrator
  object_id(decoded)='rlt24-c4-orch-probe' note='object_type=workspace object_id=rlt24-c4-orch-probe outcome=failed reason=herdr%20workspace_not_found'
== lookup by decoded object_id ==
object_id=rlt24-c4-orch-probe -> seq=5 node=F1 outcome=failed row found
```

`lint` 退出 **0**；`status --json` 退出 0、`errors=[]`，本行同样不进入状态机、不改变派生（C1 ready、F1 pending；C#1 open、F#1 pending）。

## 5. 处置记录

- **状态：待人工处理。** 同上——按 §12「报错交人，不强删」，不冒称已处置；本例对象为不存在的测试 id，无真实资源残留。
- 账本路径：`docs/modules/relay-light/workspace/RLT_24/evidence/fixture/relay_log.jsonl` seq 5。
- 观察原件保留于 `evidence/raw/`；落账 rc=0、lint 0，记账路径本身无失败。
