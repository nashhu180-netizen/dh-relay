# A157 取证 1/2 — 阶段的终端空间关闭失败

> oracle：design/01 §12 第 1367 行「阶段的终端空间与 pane · 删失败怎么办」+ §11.1 HC-RL-A157（第 1337 行）+ §3.4 `resource_close` 行（第 257 行）与 wire format（第 301–328 行）。
> 本文只执行与取证，不改设计正文。

## 1. 现场用途来源与所属阶段

- **用途来源**：design/01 §12 第 1367 行——阶段结束时由编排关闭该阶段的终端空间；本条取「C 阶段（`RLT_24:C#1`）的终端空间关闭失败」这一例。按 `decisions.md` 第 1 行用户裁决，`object_type=workspace` 不区分阶段空间与编排空间，wire format 中无用途字段——**对象的阶段空间用途由写入者（orchestrator）按 §12 行归属在记账时声明，本文记录的「用途」来自该写入者纪律的现场声明，不由 `object_id` 或 fixture 名称解析得出**。
- **所属阶段**：`RLT_24:C#1`（fixture 计划 `evidence/fixture/relay_plan.md` 节点表第 1 行 `| C1 | RLT_24 | RLT_24:C#1 | construction | ... |`）。
- **该阶段首有效 node 的判定**：计划中 `stage_id=RLT_24:C#1` 的节点行只有 `C1` 一行，无 superseded 行，故该阶段首有效节点 = **C1**。机器侧由 `relay_log.py _validate_close_node` 复核：`workspace`/`pane` 的 `node` 必须是其 `stage_id` 内首个非 superseded 节点——`C1` 满足，任何非首节点会被 `HC-RL-A155` 退 2。

## 2. 可控关闭失败观察（**实跑**，非打桩）

- 命令：`herdr workspace close rlt24-c4-stage-probe`（本机 herdr 0.9.0，`rlt24-c4-stage-probe` 为不存在的测试 id，与在用空间 id `w15/w2B/w2C/w2E/w2F/w2G` 无交集）。
- 实际返回：**rc=1**，stderr 原样（原始输出存 `evidence/raw/herdr-close-stage-probe.stderr.txt`，stdout 为空存 `.stdout.json`）：

  ```json
  {"error":{"code":"workspace_not_found","message":"workspace rlt24-c4-stage-probe not found"},"id":"cli:workspace:close"}
  ```

- 误触核对：`herdr workspace list` 在两次探针前后各取一次，均为同一组 6 个 id `['w15','w2B','w2C','w2E','w2F','w2G']`——**没有真实在用 workspace/pane 被关闭或改动**。输出经白名单过滤：仅记录 id 集合与计数，不落 workspace 标签等枚举细节。

## 3. 合法失败行落账

由 `agent=orchestrator#1`（`by=orchestrator`，§3.4：终端空间归编排）记在该阶段首有效节点 **C1**：

```
PYTHONDONTWRITEBYTECODE=1 python3 tools/relay-light/relay_log.py add \
  --plan docs/modules/relay-light/workspace/RLT_24/evidence/fixture \
  --node C1 --event resource_close --agent orchestrator#1 \
  --note "object_type=workspace object_id=rlt24-c4-stage-probe outcome=failed reason=herdr%20workspace_not_found" \
  --config-dir tools/relay-light/skill
```

返回 **rc=0**。原 JSONL 行（`evidence/fixture/relay_log.jsonl` seq 4）：

```json
{"seq":4,"ts":"2026-09-17T16:00:47.033481+08:00","node":"C1","event":"resource_close","agent":"orchestrator#1","by":"orchestrator","note":"object_type=workspace object_id=rlt24-c4-stage-probe outcome=failed reason=herdr%20workspace_not_found"}
```

- `object_id` = 探针命令的实际参数 `rlt24-c4-stage-probe`（safe 字符，无需百分号编码）；`reason` 解码后为 `herdr workspace_not_found`，与观察到的错误码一致。
- 观察→落账对应关系：命令参数 id ≡ 行内 `object_id`；行 `ts` 晚于探针执行时刻；失败退出码 1 与 `outcome=failed` 一致。

## 4. 按 seq / object_id 实际检索

`evidence/raw/retrieval-by-seq-and-object-id.txt`（脚本逐行解析 JSONL、解码 note 后匹配）：

```text
== lookup by seq ==
seq=4 node=C1 event=resource_close agent=orchestrator#1 by=orchestrator
  object_id(decoded)='rlt24-c4-stage-probe' note='object_type=workspace object_id=rlt24-c4-stage-probe outcome=failed reason=herdr%20workspace_not_found'
== lookup by decoded object_id ==
object_id=rlt24-c4-stage-probe -> seq=4 node=C1 outcome=failed row found
```

`lint`（同 `--plan`/`--config-dir`）退出 **0**（`lint: ok`，存 `evidence/raw/lint-after-close-rows.txt`）；`status --json` 退出 0 且 `errors=[]`，关闭行不进入状态机、不改变节点/阶段派生（`evidence/raw/status-json.txt`：C1 ready、F1 pending、C#1 open、F#1 pending）。

## 5. 处置记录

- **状态：待人工处理。** 按 §12「报错交人，不强删」：本例失败对象是不存在的测试 id，无真实资源可处置；真实场景下人工按 `object_id` 到 herdr 复核该空间状态后决定是否重试或放弃。
- 账本路径：`docs/modules/relay-light/workspace/RLT_24/evidence/fixture/relay_log.jsonl` seq 4。
- 若记账本身失败，按纪律须保留原始观察证据并报错——本例落账 rc=0、lint 0，观察原件已存 `evidence/raw/`，不宣称未发生的失败。
