<!-- dh:v1 -->
# RLT_03 · Batch 4 与最终施工矩阵独立只读复核（Codex）

## 结论

**verdict: changes-requested**

| 级别 | 数量 |
|---|---:|
| P0 | 0 |
| P1 | 4 |
| P2 | 2 |
| P3 | 0 |

Batch 4 新增的 precise pending、help、A24、A47、A88 type 与默认依赖测试均能使对应回退变异转红；46 条 focused suite 也由本 reviewer 独立、无管道运行并以 exit 0 结束。但 `progress.md` 所称“16 组 / 43 ID 全覆盖”不成立：RLT_03 权威验收仍有实际未实现行为、未闭合的映射子句与若干仅邻近映射而非指定行为证据。

本轮只复核 RLT_03 Batch 4 和最终施工矩阵。未批准、未实现也未进入 RLT_05；`relay_log.py:718-721` 的注释只是边界声明，不构成 A61/A62 生命周期实现。

## Findings

### P1-1 · HC-RL-A18 的 `plan_loaded` 版本 note 未实现

权威验收要求 `plan_loaded` 的 `note` 含 `skill=`（design/01:1146；DevPlan RLT_03:155）。当前 `append_event()` 只检查首事件词为 `plan_loaded`，随后原样写入 note（`relay_log.py:677-697`）；测试 helper `start_ledger()` 也始终用空 note 并期待成功（`test_relay_log.py:83-85`）。独立真 CLI 序列确认 `plan_loaded --note ''` 返回 0。

最终矩阵把 A18 仅映射到 marker 字段测试，遗漏账本侧版本要求。必须在 RLT_03 范围内拒绝缺少有效 `skill=` 的 `plan_loaded`，并补正/反测试；不能把它推给 RLT_05。

### P1-2 · HC-RL-A69 未强制决策 helper 标识写入 note

权威验收要求 `escalate` / `decision` / `user_decision` 留在原 triggering/blocked agent 名下，且决策 helper 标识写入 `note`（design/01:1164；DevPlan RLT_03:178）。现实现仅在 note 中“若能解析到 helper”时追踪 owner；`escalate` 的空 note 直接放行（`relay_log.py:554-591`）。独立真 CLI 序列 `plan_loaded -> node_start -> coder launch -> blocked -> escalate(note='')` 五步全部返回 0。

Batch 3 已正确守住 helper launch 后的 owner，但最终矩阵漏掉“helper identity 必须存在于 note”这一半。必须令缺 helper 标识或不合规格标识的升级链以 A69 拒绝，并覆盖 decider/strategist 正反例，同时保留既有 owner 与 helper 生命周期行为。

### P1-3 · RLT_03-owned A64/A73/A86/A90 status 投影未实现

DevPlan 明确把以下子句分配给 RLT_03：A64 status 忽略 superseded、A73 superseded 不计 closed/pending、A86 `stages` 按节点表顺序、A90 decision_mode 可由 status 读取（DevPlan RLT_03:146-156；ownership table:536,540,546,548）。design/01 的逐项证明要求同样明确（design/01:1123-1126,1149）。

当前 `_status_command()` 对所有账本只输出三个键：`current_stage`、`current_node`、`pending_nodes`；非空账本甚至固定 `pending_nodes=[]`（`relay_log.py:711-727`）。独立真 CLI probe 得到：

```text
status_keys=['current_node', 'current_stage', 'pending_nodes']
decision_mode=<missing>
stages=<missing>
nodes=<missing>
```

所以：

- A73 的 `state=superseded`、不影响 current node、closed/pending 三分语义没有可观察实现；新增测试只验证空账本 `pending_nodes` 排除。
- A86 的 lint 枚举/连续性存在，但 `status --json.stages` 顺序投影不存在。
- A90 的解析/default 存在，但 status 不可读。
- A64 只覆盖 lint 忽略和空账本 pending 排除，没有证明完整派生与“移除该行所得结果相同”。

不得借 rework 实现 RLT_05-owned A43/A61/A62 完整生命周期。可接受闭环只有两种：在不扩展到完整生命周期的前提下补齐上述 RLT_03-owned 最小投影及测试；或由主控先以权威设计/DevPlan 变更重新划分这些子句，再修正 RLT_03 矩阵。现有 placeholder 注释不能代替行为。

### P1-4 · HC-RL-A88 的 E11/E12/E13 映射子句被矩阵明示跳过

Brief 条件 7 与 DevPlan RLT_03:153 均要求“kickoff/verify-signoff 被禁，映射不含 E11~E13”；design/01:1144 的证明方式还要求检查五种阶段模板和映射配置。当前测试只验证两个非法 `type`（`test_relay_log.py:432-445`），而最终矩阵明确写“E11~E13 映射检查属 RLT_05 配置范围，不在本卡”。这与本卡权威完成条件直接冲突，因此 A88 只能算部分覆盖，不能计入 43/43。

RLT_03 不得擅自创建 RLT_05 的 `dh-mapping.toml`。主控必须先解决验收所有权冲突；在此之前，删除“全覆盖”结论并将 A88 映射子句标为未闭合。若已有合法的本卡内结构来源，则应对五种阶段模板及 E11/E12/E13 缺席做可执行检查。

### P2-1 · 四个 ID 的指定证明仍被邻近测试替代

实现大体 fail closed，但最终矩阵没有达到 design/01 冻结的证明颗粒度：

| ID | 已有证据 | 缺少的指定证据 |
|---|---|---|
| A45 | status 读坏 JSON、add 读目录失败 | `status` 对不可读账本退出 4 |
| A64 | lint 跳过坏 superseded 行、空账本 pending 排除 | 带/不带 superseded 行的 status/lint 派生结果等值比较 |
| A84 | 不存在账本 status、首条非 plan_loaded | 显式零字节账本；不存在/零字节两路 lint；两路完整空账本断言 |
| A87 | 非 marker card 被拒，跨卡 plan 间接参与依赖测试 | 两卡正例明确断言 `len(plan.cards) == 2` |

这些缺口必须用直接断言补齐；测试名或同一大用例中的邻近行为不能替代验收表指定的正/反例。

### P2-2 · A88 verify-signoff mutation 被次生 A24 杀死，未隔离目标守卫

把 `verify-signoff` 加入 `NODE_TYPES` 后，目标测试确实 exit 1，但失败原因是 fixture 的默认 `coder` 仍引用不存在的 C1，因而得到 A24，而不是一个其它结构均合法的 verify-signoff plan 被错误接受。该变异证明了错误编号变化，却没有独立证明 A88 type guard 是唯一拒绝原因。

应为 kickoff/verify-signoff 各提供同节点 agent、card、stage、依赖均合法的 fixture；删除 type guard 后目标用例应因“不再抛 RelayError”而失败。现有 mutation 结果可保留为辅助证据，不能称为完全隔离的行为变异。

## 16 条完成条件与 43-ID 矩阵复算

| brief 条件 | 结果 | 说明 |
|---|---|---|
| 1 / 2 / 3 | covered | A46/A47/A48 直接正反例；A47 跨节点 close mutation 因不再抛错而失败。 |
| 4 | partial | A72 与默认依赖守卫有效；A64/A73 status 完整语义缺失。 |
| 5 | covered | A75 零 agent 与全 superseded 两路。 |
| 6 | partial | A104/A109 与 A86 lint 有覆盖；A86 stages 投影不存在，A87 缺 cards 长度直接断言。 |
| 7 | partial | kickoff/verify-signoff type 禁止存在；五模板与 E11/E12/E13 映射子句未闭合。 |
| 8 | partial | A24 与 decision_mode parse 有效；A18 plan_loaded note、A90 status 可读缺失。 |
| 9 / 10 / 11 | covered | trigger、append-only、19 词和大小写/静态守卫均有直接证据。 |
| 12 | partial | 退出分流主体有效；A45/A84 指定边界证据不完整。 |
| 13 / 14 | covered | 七键、配对/attempt、四豁免、状态机及节点时序有直接证据。 |
| 15 | partial | A70/A77/A78/A17/A74 与 A69 owner 有效；A69 helper-note 必填缺失。 |
| 16 | covered | stderr 格式与 add 0/2/3/4 路径可复现。 |

复算结果：**10/16 条 fully covered，6/16 partial；33/43 个 HC-ID fully substantiated，10/43 partial/omitted**。部分项为 A18、A45、A64、A69、A73、A84、A86、A87、A88、A90。43 个 ID 都出现在表里不等于 43 个验收语义均已行为覆盖。

## 独立测试与变异证据

### E-B4-SOL-01 · full focused suite

```text
python3 -m unittest tools/relay-light/test_relay_log.py -v
Ran 46 tests in 18.582s
OK
exit 0
```

命令未使用管道、`tee`、`|| true` 或其它退出码掩蔽；这是 reviewer 独立结果，不依赖 OMP piped output 或主控的 46-test 记录。

### E-B4-SOL-02 · Batch 4 七项 mutation

| 变异 | 目标结果 |
|---|---|
| 精确删除 `_status_command` pending 的 `not node.superseded` | exit 1；实际变为 `['W1','W2','C1']` |
| 注册第 4 个 `watch` help 子命令 | exit 1；help 变为 `{add,status,lint,watch}` |
| 删除 A24 `agent.node` 存在闸 | exit 1；期望 A24、实际 A75 |
| 删除 A24 同节点重名闸 | exit 1；期望 A24、实际 A75 |
| 放宽 A47 close 到任意节点同名 agent | exit 1；不再抛 RelayError |
| 把 `verify-signoff` 加进 NODE_TYPES | exit 1；期望 A88、实际次生 A24（见 P2-2） |
| 默认依赖不再跳过 superseded | exit 1；触发 A72 |

七个变异均在 `/tmp/rlt03-b4-sol-mutations.*` 的隔离副本运行，未改仓内生产/测试；副本已删除。

### E-B4-SOL-03 · 漏项对抗序列

```text
plan_loaded(note='') -> rc 0
node_start -> rc 0
coder#1 agent_launch -> rc 0
coder#1 blocked -> rc 0
coder#1 escalate(note='') -> rc 0
status --json keys -> current_node,current_stage,pending_nodes only
```

以上均通过真 CLI 和 `TemporaryDirectory` fixture，分别直接证伪 A18 note、A69 helper note 与 A73/A86/A90 status 可观察性。

## 范围、持久化与卫生

- 允许路径由 DevPlan RLT_03:187-190 冻结为两条 Python 文件与本 workspace。复核前工作树仍只有入场既有 DevPlan WIP、未跟踪 RLT_03 workspace 与 `tools/relay-light/`；`master...HEAD` 仅显示既有 DevPlan 提交差异。本 reviewer 唯一持久写入是本报告。
- 生产写入仍是 `open(..., "a", newline="")` 后追加单行 JSON + `\n`（`relay_log.py:695-697`）；没有 rewrite/replace/rename、锁、tempfile 或 pane 字段。CLI help 精确显示 `{add,status,lint}`。
- RLT_05/RLT_09 专属 ID 扫描仅命中 `relay_log.py:718` 的 A61/A62 注释；没有对应生命周期行为、watch 子命令或 skill 配置文件。placeholder 没有实现 RLT_05，也不构成 scope creep。
- focused tests 生成的两条 `.pyc` 与空 `__pycache__` 已精确删除；最终 pycache 扫描无输出。生产/测试及已读 workspace 文件 SHA-256 与复核前一致。

## Actionable requirements

1. 在 RLT_03 范围内实现并测试 A18 `plan_loaded note skill=` 与 A69 决策 helper note 必填，同时保持 Batch 3 已批准的 owner/resume/attempt/close 语义。
2. 补齐 A64/A73/A86/A90 的 RLT_03-owned 最小 status 可观察合同，或先由主控正式重划所有权；不得借此进入 A43/A61/A62 的完整 RLT_05 生命周期。
3. 解决 A88 的任务所有权冲突并取得 E11/E12/E13 映射缺席证据；在此之前不得声称 A88 或 43/43 完成。
4. 补 A45/A64/A84/A87 的冻结证明用例，并把 A88 type mutation 改成其它结构完全合法的隔离 fixture。
5. rework 后重新运行完整 focused suite、上述漏项真 CLI 序列和全部目标 mutations，再由 fresh reviewer 复核；不得启动 RLT_05、verify、commit 或下一任务。

本报告不作验收裁决，只给出 Batch 4 / 最终施工矩阵的独立事实结论：**changes-requested**。
