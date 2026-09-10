<!-- dh:v1 -->
# RLT_03 · Batch 4 rework=1 独立只读复审（Codex）

## VERDICT

**changes-requested — implementation rework findings closed; card remains blocked by open formal planning-contract conflicts.**

| 级别 | open 数量 |
|---|---:|
| P0 | 0 |
| P1 | 0 |
| P2 | 4 |
| P3 | 0 |

前轮可由 RLT_03 施工闭合的 P1-1、P1-2、P2-1、P2-2，在当前实现与真 CLI 行为上均已闭合；主控追加指出的 A69 `escalate(note="")` 漏口也已闭合。独立无管道运行 53 tests，exit 0。

但本卡仍不得 approved/complete：F-030、F-031、F-032 是三项真实且尚未裁决的正式规划合同冲突；此外发现一项新的 P2 回归网缺口——现有 53 tests 杀不死“删除 A69 全链同 helper equality 比较”的精确 mutation。故本报告区分“实现整改已闭合”与“整卡仍 blocked”，不把绿测试解释为整卡批准。

## 前轮 finding 闭环表

| 前轮项 | 结论 | 独立证据 |
|---|---|---|
| P1-1 / A18 `plan_loaded` note | **closed** | `_validate_plan_loaded_note()` 在 append 前执行（`relay_log.py:589-594,688-690,707-727`）。真 CLI 对 `note=""`、`note="skill="` 均 rc=2、stderr 为 A18，且账本不存在；删除该调用后目标 test 以四个 `2 != 0` 失败。 |
| P1-2 / A69 helper note、owner、旧生命周期 | **closed（行为）** | `_validate_decision_helper()` 强制恰好一个 token、实例格式合法且 kind 与实例名一致（`relay_log.py:562-571`）；decision/user_decision 与原 owner 的 escalate helper 比对（`:574-618`）。decider/strategist 真 CLI 坏 note 均 rc=2 且字节不变；合法自由文本链成功；三条决策事件都写 coder#1；helper `launch→done`、owner `resume→done` 或 `cancelled` 成功。 |
| 主控补洞 / A69 空 escalate | **closed** | Sol 原始 `escalate(note="")` 在 decider、strategist 两路均 rc=2 A69 且不落行；将 escalate 分支恢复为直接 return 后目标 test 两路均因 `2 != 0` 失败，没有次生异常。 |
| P2-1 / A45 指定直证 | **closed** | `test_unreadable_ledger_status_exits_four` 用 ledger 路径为目录制造真实 read OSError，status rc=4、stdout 空、stderr `error: ledger ...`（`test_relay_log.py:646-653`）。 |
| P2-1 / A64 指定直证 | **closed within current RLT_03 observable surface** | `test_status_and_lint_match_with_and_without_superseded_rows` 对带/不带 superseded 的两份计划分别跑 lint/status 并比较 JSON 等值（`:655-679`）。完整非空 status 语义仍受 F-030/F-031 阻塞，不能由本条越界冒充。 |
| P2-1 / A84 指定直证 | **closed** | `test_missing_and_zero_byte_ledgers_match_for_status_and_lint` 直接比较不存在/零字节两路 status JSON，并断言两路 lint rc=0 + `lint: ok`（`:681-697`）；既有用例同时断言 null current、全部 active pending 与首条非 plan_loaded 不落盘。 |
| P2-1 / A87 指定直证 | **closed** | 跨卡合法计划现在直接断言 `len(plan.cards) == 2`（`:389-431`），另保留 card 不在 marker 的 A87 反例。 |
| P2-2 / A88 sole-violation fixture | **closed** | kickoff 与 verify-signoff 两 fixture 的 marker、card、stage、依赖、close 和 agent 表均合法，唯一违规是 type（`:448-464`）。将二者加入 NODE_TYPES 后，两 subtest 都因 `RelayError not raised` 失败，而非次生 A24/A75。 |

## A69 定向对抗矩阵

对 decider 与 strategist 各建独立 `TemporaryDirectory`，通过真实 CLI 执行：

```text
plan_loaded(skill=0.1.0) -> node_start -> coder#1 launch
decider: blocked -> escalate
strategist: escalate（无 blocked，保留既有 strategist 入口）
```

| 检查 | decider | strategist |
|---|---:|---:|
| `escalate(note="")` | rc=2，A69，不落行 | rc=2，A69，不落行 |
| 空 token / kind 与实例不匹配 / 相同 token 重复两次 | rc=2，不落行 | rc=2，不落行 |
| 恰好一个正确 token，前后附自由文本 | rc=0 | rc=0 |
| decision 沿用原 owner 与同 token | rc=0 | rc=0 |
| user_decision 换成同 kind 的 `#2` | rc=2 | rc=2 |
| user_decision 同 token + 自由文本 | rc=0 | rc=0 |
| helper `launch→done` | rc=0→0 | rc=0→0 |
| owner 终局 | `resume→done` rc=0→0 | `cancelled` rc=0 |
| 三条决策事件落账 agent | 全为 `coder#1` | 全为 `coder#1` |

这证明当前生产行为满足本轮要求：`escalate` / `decision` / `user_decision` 留在原 owner；每条恰好一个合法且 kind/实例名一致的 helper token；全链 helper 相同；自由文本不被禁止；Batch 3 的 helper 生命周期、resume 与 terminal 语义未回归。

## 新 finding

### P2-1 · A69 “全链同 helper” equality guard 缺精确回归判别器

当前生产行为正确，但测试未包含“格式完全合法、kind 相同、仅 attempt/实例不同”的 decision/user_decision 反例。现有 `test_decision_events_carry_the_same_helper_token_as_the_escalate` 使用的 `other#9` 会先被 kind 校验拒绝（`test_relay_log.py:1045-1087`），因此无法单独咬住 `note_helper != owners[agent]`。

独立 mutation 仅把 `relay_log.py:615` 的 equality 条件失效，其余 token 校验保持不变：目标 test exit 0，完整 53 tests 也 exit 0；在 mutation 副本中，`escalate decider=decider#1` 后的 `decision decider=decider#2` 被错误接受（rc=0）。这不是次生异常，而是精确 guard 回退存活。

**要求**：decider/strategist 两路都补 `decision` 与 `user_decision` 使用同 kind、合法但不同实例（例如 `decider#2` / `strategist#2`）的 rc=2 A69 + 不落行断言；失效 equality 比较后必须因错误接受而红。该项是测试证据缺口，不推翻本轮已实测正确的生产行为。

## F-030～F-032 独立规划合同判断

### P2-2 · F-030 A73 vs §3.5/A62 — **open，确属 formal planning-contract conflict**

- A73 明文要求 superseded 节点 `state=superseded` 可观察，并且不计 closed/pending、不影响 current node（design 验收表 `:1123-1124`；DevPlan RLT_03 `:146-147`）。
- §3.5 冻结 schema 的 `nodes[].state` 只允许 pending/ready/open/closed（design `:352-358`），且 superseded 行不得出现在 stages/nodes/agents，只有 `superseded_ignored` 计数（`:375`）。A62 又要求顶层和嵌套键集合精确，并重复该排除规则（`:1172`）。

若把 superseded 节点放入 nodes 以暴露该 state，就违反 A62；若只排除并计数，就无法满足 A73 的 `state=superseded` 可观察要求。两条冻结文本不可同时满足，且完整 schema/生命周期属于 RLT_05。F-030 必须保持 open，等待正式 design/DevPlan 裁决；RLT_03 rework 不应自行选边。

### P2-3 · F-031 A90 vs A62 exact schema — **open，确属 formal planning-contract conflict**

- A90 要求解析结果能被 `status --json` 读出（design `:1149`；DevPlan RLT_03 `:155-156`）。
- A62 冻结顶层精确键集合不含 `decision_mode`，其 `plan` 嵌套对象也精确只有 `marker`、`cards`（design `:321-375,1172`）。

把 decision_mode 加到顶层或 `plan` 都改变 A62 精确 schema；不加则 A90 不可读。该矛盾不是 relay_log.py 内可安全猜测的实现选择。F-031 必须保持 open。

### P2-4 · F-032 A88 mapping vs RLT_05 allowed paths — **open，确属 formal planning-contract conflict**

- A88 在 RLT_03 同时要求 type 禁止与“映射不含 E11/E12/E13”（design `:1144`；DevPlan RLT_03 `:153`）。
- 其证明要求检查五阶段模板和 mapping 配置；但 RLT_03 allowed paths 只有两条 Python 文件与 RLT_03 workspace（DevPlan `:186-190`）。
- `tools/relay-light/skill/dh-mapping.toml` 的创建/修改及配置验收明确属于 RLT_05 allowed paths 与 A92（DevPlan `:195-235`；design `:1178`）。

RLT_03 无权制造尚不存在的 RLT_05 配置来证明该子句，RLT_05 又尚未启动。A88 type 部分已闭合，但 mapping 子句仍无法在本卡边界内完成。F-032 必须保持 open。

三项冲突均为正式输入内部矛盾/所有权错配，不是施工者可借 rework 越界修复的普通代码 finding。它们维持 `BLOCKED batch=4 rework=1 reason=planning-contract-conflicts`，因此总体 verdict 不能是 approved/complete。

## 独立命令与退出码

### Full focused suite

```text
python3 -m unittest tools/relay-light/test_relay_log.py -v
Ran 53 tests in 24.348s
OK
exit 0
```

该命令未使用管道、tee、`|| true` 或其它退出码掩蔽。

### 精确 mutations

| mutation | 目标测试/全量 | 结果 | 判别质量 |
|---|---|---|---|
| 删除 A18 plan_loaded note validator 调用 | A18 target | exit 1，4 failures，均 `2 != 0` | killed，无次生异常 |
| escalate 分支跳过 helper validator | A69 escalate target | exit 1，decider/strategist 各 `2 != 0` | killed，直接覆盖 Sol 原始空 note |
| 将“恰好一个 token”放宽为“至少一个” | A69 escalate target | exit 1，双 token 被接受 | killed，无 IndexError/次生异常 |
| 仅失效全链 helper equality 比较 | A69 chain target；完整 53 | **exit 0；exit 0** | **survived，形成 P2-1** |
| 将 kickoff 与 verify-signoff 加入 NODE_TYPES | A88 sole-violation target | exit 1，2 failures，均 `RelayError not raised` | killed，fixture 无次生违规 |

所有 mutation 只在 `/tmp/rlt03-b4r1-sol-mutations.*` 隔离副本中运行；mutation 目录已删除，仓内代码/测试未修改。

## Scope / hygiene

- 复审基线：branch `wt/RLT_03`，HEAD `baf2aad6aa5cf5b8fc0941411bbb30a0ebac8a6b`。复审前已有 DevPlan WIP、未跟踪 RLT_03 workspace 与 `tools/relay-light/`；本 reviewer 未改生产、测试、DevPlan、design、progress、findings、旧 review 或 `review.md`。
- 复审前后生产/测试 SHA-256 保持：`relay_log.py` = `3d6f251009a5caa7dbc5228b1602ee7902643a9d7ce58eb758effb90ef1cb774`；`test_relay_log.py` = `ce26ff902d4742cafa6ba82fc7a71aeba0f3d3bbd82f40630fa39313ff02595d`。
- `python3 -m py_compile` 两文件 exit 0；`git diff --check` exit 0；真实 help 仅 `{add,status,lint}`，exit 0。
- 生产源码仍只以 `open(..., "a", newline="")` 追加单行 JSON + `\n`（`relay_log.py:725-727`）。静态扫描无 lower/casefold 枚举归一、lock API、tempfile、replace/rename/move 或 pane 字段。
- focused suite、py_compile 与 mutation 产生的 `.pyc` 已精确删除，空 `__pycache__` 已删除；最终 pycache 扫描无输出。
- 唯一持久写入是本报告 `reviews/batch-4-recheck-sol.md`。未 commit、verify、启动 RLT_05 或下一卡。

## 收口

**Implementation rework closure:** A18、A69（含主控补洞）、A45/A64/A84/A87 直证、A88 isolated fixture 均 closed；新增 A69 equality mutation test gap open（P2）。

**Card status:** F-030/F-031/F-032 均为经独立核对确认的 formal planning-contract conflicts，仍 open；RLT_03 Batch 4 rework=1 继续 blocked，不能 approved/complete。
