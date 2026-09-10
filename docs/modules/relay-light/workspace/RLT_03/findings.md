<!-- dh:v1 -->
# findings — RLT_03

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|
| F-000 | P3 | 开工时无已知实现 finding | 待批次审核 | 被实际 findings 取代 | resolved |
| F-001 | P2 | `generated=` 不是冻结必填字段；旧实现会拒绝合法 marker | batch-1 Opus P2-1；design HC-RL-A18 | 已放开并补无 generated 正例 | resolved |
| F-002 | P2 | 旧 lint CLI 将缺/坏 relay_plan 当作 lint 规则违反，错误前缀和退出码不符合同 | batch-1 Opus P2-3；E-008 | 最小引入 `RelayError(exit_code, code, message)`，缺/坏 plan 走 stderr `error:` 与 exit 3；未扩展账本 | resolved |
| F-003 | P2 | A116/A89/A120 分别属 RLT_05/RLT_05/RLT_09，不能在 RLT_03 静默提前实现；现行冲突口径：design/01 §3.5（lint 映射表 A129 行，约 :409）含 §4.5「追加行落在表尾不算违规」豁免，而 §11（A129 取证行，约 :1132）不含该豁免——design §3.5 与 §11 对 A129 是否包含 §4.5 表尾豁免存在文本分歧 | batch-1 Opus P2-2、fresh Opus R-P2-2；主控裁决；E-010；batch-4-contract-rework-opus P2-1 | 已移除 A116、A89 与 A120 特判；本卡按 §11 严格执行 A129（隔断即拒，含同 stage 表尾追加）；放宽归 RLT_09/A120，RLT_09 必须显式处理/反转该表尾用例后才可实现其放宽 | open |
| F-004 | P2 | 原 E-003 的 ModuleNotFoundError 是导入错误，不是可判别行为红 | batch-1 Opus P2-5；E-003 | 标为 invalid-TDD-red；以 E-006 的 A86 表尾反例替代为有效红证据 | resolved |
| F-005 | P2 | 旧 A109 跨卡“并行”正例实际因默认依赖串行 | batch-1 Opus P2-6 | 已改为两卡后续 C 阶段各自依赖本卡 W 阶段，并断言 C1/C2 间无依赖 | resolved |
| F-006 | P2 | 已落地的 lint argparse/exit/stderr 路径没有回归网 | batch-1 Opus P2-4 | 已加合法、缺计划、坏 marker 的最小 CLI smoke | resolved |
| F-007 | P3 | 单元格竖线与列数同时异常时，split 后可能以错位语义报其他 HC-ID | batch-1 Opus P3-2 | 现有结构检查仍 fail-closed；精确区分错误原因不在本批授权，留后续卡处理 | open |
| F-008 | P3 | `.gitignore` 未覆盖 Python `__pycache__` / `*.pyc`，测试会生成该目录 | batch-1 Opus P3-3、fresh Opus R-P3-4；E-015 | `.gitignore` 不在写权限内；本 worker 每次测试后清除生成物，当前无 pycache；收口仍须主控精确暂存或另行处理 ignore | open |
| F-009 | P3 | A104 缺格式非法反例与合法 stage_id 三段解析断言 | batch-1 Opus P3-4；E-007 | 已补 `#0` 非法反例，以及 card/stage/k 三段正例 | resolved |
| F-010 | P3 | `_error` 纯转发、lint 成功 stdout 与 stage 查询 O(n2) 属可读性/性能小噪音 | batch-1 Opus P3-5 | 不影响本批行为；不在返工范围内，留后续整理 | open |
| F-011 | P2 | `cards=,` 属 marker 解析失败，却曾走 lint exit 2 / `lint:`，与其他 marker 字段缺失不一致 | fresh Opus R-P2-1；E-012 | `cards` 空列表改为 `RelayError(exit_code=3, code=HC-RL-A18)`；CLI 统一 stderr `error:`，并有回归测试 | resolved |
| F-012 | P3 | A35/A71 两条 trigger 反例误放 CLI smoke，会遮蔽测试名与覆盖矩阵 | fresh Opus R-P3-1 | 已移回 `test_trigger_values_and_same_node_done_references_are_checked` | resolved |
| F-013 | P3 | 递归 DFS 在 1500 节点无环依赖链触发未捕获 RecursionError | fresh Opus R-P3-2；E-012 | `_assert_acyclic` 改为显式迭代栈；1500 节点无环测试通过 | resolved |
| F-014 | P3 | `superseded-by:` 不得指向另一条 superseded 节点，否则承接依赖目标自相矛盾 | fresh Opus R-P3-3 | lint 以 HC-RL-A24 拒绝，并补 W1→W2(superseded)→W3 反例 | resolved |
| F-015 | P3 | `depends_on` 留空按冻结语义依赖前一非 superseded 节点，可跨 card 并导致跨卡串行 | fresh Opus R-P3-5；design §4.1 | 有意现状，已登记；不自行改设计或默认依赖逻辑 | resolved |
| F-016 | P2 | 非语义 plan 错误的 CLI 口径存在设计张力：lint 是规则判定 2/`lint:`，add/status 是运行期不可用 3/`error:` | batch-2 Opus P2-3；E-018 | 保留该可辩护分流并以节点号重复回归测试钉住；HC-RL-A5 与 A120 的互斥文字仍需主控/后续设计裁决 | open |
| F-017 | P3 | `error:` 通道的 `arguments` 与 `ledger` code 不是 HC-ID；A63 只冻结格式，RLT_10 A94 可能要求编号来源澄清 | batch-2 Opus P3-1 | 本批不擅改 code 命名；登记给主控决定是否将非 lint 的 operational code 视为 A94 例外 | open |
| F-018 | P3 | 原 A51 pane 断言只看最后一行顶层键，测试文件首行也仍称 batch 1 | batch-2 Opus P3-2/P3-3 | 已将 docstring 更新为 batch 1+2；20 行逐行对完整 JSON 值断言无 pane，另有生产源码 pane guard | resolved |
| F-019 | P2 | 非空账本若末行没有换行，追加会把两条 JSON 粘成一行并永久损坏账本 | batch-2 Opus P1-1；E-017/E-018 | `read_ledger` 先拒非换行终止；status/add 均 exit 4，add 不写入 | resolved |
| F-020 | P2 | `by` 若按 event 推断会与真实 agent 前缀矛盾，并提前架空 RLT_05 的事件归属验证 | batch-2 Opus P2-1 | 改为 `orchestrator#` 派生 orchestrator、其余合法 agent 派生 monitor；未实现 event ownership validation | resolved |
| F-021 | P2 | 空账本 A84 需要 active 节点均 pending，但完整 A62 status 结构属 RLT_05 | batch-2 Opus P2-6；E-018 | `status --json` 最小返回 null current_stage/current_node 和 active `pending_nodes`；未扩展至完整生命周期/状态机 | resolved |
| F-022 | P3 | batch-2 recheck 指出 `status --json` 的 `pending_nodes` 仍应有一条显式 superseded 排除回归，避免后续状态实现回归 | fresh Opus batch-2 recheck R-P3-1；E-021；E-031/E-032 | batch 4 已补 `test_empty_ledger_pending_nodes_exclude_superseded_rows`，变异删除过滤即转红 | resolved |
| F-023 | P3 | 非空账本 `status` 仍是 batch-2 最小 stub，完整 A61/A62 生命周期派生须由 RLT_05/后续 batch 明示承接 | fresh Opus batch-2 recheck R-P3-2；F-021；E-021；E-033 | batch 4 在 `_status_command` 加显式占位注释（relay_log.py:718-721，注明 RLT_05/A61+A62），未实现该生命周期；A61/A62 在生产源码仅以注释出现 | resolved |
| F-024 | P3 | `read_ledger(...).splitlines()` 接受 CRLF 账本行，是当前冻结合同下的有意可读兼容事实 | fresh Opus batch-2 recheck R-P3-3；E-021 | 不新增 CRLF 禁止规则；后续若收紧需设计裁决和专门验收 | open |
| F-025 | P1 | 已启动的 decider/strategist 可在自身 key 写 decision，旧测试只因 helper 未 launch 而以 A60 拒绝，未证明 A69 ownership | fresh Sol batch-3 P1-1；E-026/E-027 | 以 note 关联 helper 与原触发 agent；决策类事件拒绝 helper 自身 key，且 helper 启动后的 wrong-owner 与 wrong-escalate 均断言 A69 | resolved |
| F-026 | P1 | 原触发 agent 可从 `decision` 或 `user_decision` 直接 `done`，绕过固定的 `resume` | fresh Sol batch-3 P1-2；E-026/E-027 | 收紧 `done` 前驱到 launch/checkpoint/resume；保留 helper launch→done 生命周期，并补两种跳过 resume 反例 | resolved |
| F-027 | P2 | A58 重号/跳号测试未先建立合法重拉前因，删除 exact increment 闸仍可被 A49 代为拒绝 | fresh Sol batch-3 P2-1；E-026/E-029 | `agent_lost` 与 `cancelled` 各自建立后，重号/跳号均断言 A58、精确 `+1` 接受；变异转红 | resolved |
| F-028 | P2 | A17 测试未覆盖 close agent 已 done 但另一已 launch agent 未终态，关闭循环可被删除而测试仍绿 | fresh Sol batch-3 P2-2；E-026/E-029 | 新反例要求 A17 错误点名 `coder#1`；清空条件 1 循环的变异转红 | resolved |
| F-029 | P3 | batch 4 的 6 处新增覆盖（help 三子命令、A24 agent.node 存在、A24 同节点重名、A47 跨节点 close、A88 verify-signoff、A64 默认依赖跳过 superseded）在既有实现上直接绿，属 late-added coverage；`relay_log.py` 仅改 docstring 与占位注释，无行为改动，故本批不存在也不伪造有效行为红 | E-031；E-032（7 项定向变异全部使对应目标测试转红） | 按合同如实登记；变异证据证明各新测试具判别力 | resolved |
| F-030 | P2 | A73 的 superseded status 口径与旧 A62 schema 冲突，RLT_03 无法同卡闭合 | batch-4 Sol P1-3；RLT-A-04/RLT-B-04 | 正式 A/B 调整已把 A73 与更新后的 A62 一并划归 RLT_05；RLT_03 不再承担完整 status 差分 | resolved |
| F-031 | P2 | 退役 A90 同时要求 parser/default 与 status 可读 decision_mode，跨越 RLT_03/RLT_05 owner | batch-4 Sol P1-3；RLT-A-04/RLT-B-04 | 正式拆为 A130（RLT_03 parser/default）与 A62 `plan.decision_mode`（RLT_05 schema） | resolved |
| F-032 | P2 | 退役 A88 把 node type lint 与五阶段映射禁项混在 RLT_03 | batch-4 Sol P1-4；RLT-A-04/RLT-B-04 | 正式拆为 A126（RLT_03 node type lint）、A127（RLT_07 template）及更新后的 A92（RLT_05 mapping） | resolved |
| F-033 | P1 | batch-4 rework=1 按 Sol P1-1/P1-2/P2-1/P2-2 与主控裁决 1~4 闭环：`plan_loaded` note 强制非空 `skill=`（A18，退出 2）、决策 helper 链上 escalate/decision/user_decision note 必须携带同一合法 helper token（A69，退出 2，user_decision 允许附加自由文本/approve-amend）、A45/A64/A84/A87 补指定直证、A88 改用全合法隔离 fixture；所有合法 fixture 同步更新。主控独立审计指出其 escalate 半边未真闭合（见 F-034），由 F-034 补齐后共同视为闭合 | batch-4 Sol findings；E-034~E-037、E-038~E-041 | 已实现并先红后绿；P1-3 status 投影与 A88 映射检查按主控裁决 5 不实现，登记为 F-030~F-032 | resolved |
| F-034 | P1 | 主控独立审计：F-033 未真闭合——`_validate_decision_ownership` 在 `escalate` 分支 helper 解析为 None 时直接 return，Sol 原始反例 `escalate(note='')` 仍 exit 0；且 `_decision_helper` 把 `decider=other#9` 这类 kind 与实例名不匹配的 token 当合法 helper | 主控审计；E-038~E-041 | 先红后绿最小修复：新增 `_validate_decision_helper`——escalate 强制恰好一个 token、值过 `AGENT_INSTANCE_RE` 且 kind==实例名（合法仅 `decider=decider#n` / `strategist=strategist#n`），否则 A69 退出 2 且不落行；decision/user_decision 用同一校验并必须重复 escalate 的同一标识；保留自由文本附加、owner、helper lifecycle、resume 行为；Sol 原始真 CLI 序列复验 `escalate(note='')` exit 2 不落行；旧 52-green 不再作为闭合证据 | resolved |
| F-035 | P2 | batch-4-recheck P2-1：现有测试杀不死"仅失效 A69 全链同 helper equality 比较"的精确变异——`test_decision_events_carry_the_same_helper_token_as_the_escalate` 的 `other#9` 反例先被 kind 校验拒绝，缺 kind 合法但实例不同的 decision/user_decision 判别器 | `reviews/batch-4-recheck-sol.md` P2-1；E-042/E-043 | decider/strategist 两路各补 `decision` 与 `user_decision` 使用 `decider#2`/`strategist#2`（同 kind、格式合法、与 escalate 实例不同）反例，断言 rc=2 A69 且 ledger 不增行；状态顺序避开 A60/kind 次生杀死；equality 失效副本上先红（`2 != 0` ×2），真实实现绿，精确变异对全量 53 tests 由 exit 0 存活转为 exit 1；生产实现零改动 | resolved |
| F-036 | P2 | RLT-B-04 生效后，本卡生产错误编号与测试断言仍使用退役编号 A64/A86/A88/A90；空账本 pending 注释与对应测试 docstring 仍引用已划归 RLT_05 的 A73 | RLT-B-04；E-044 | 按正式映射迁移：A64→A128、A86→A129、A88→A126、A90→A130；pending 注释与测试只保留 A128/A84、去掉 A73；先红（5 处规则编号失配，行为与退出码不变）后绿（53 tests OK）；未实现 RLT_05 完整 status、RLT_07 模板、RLT_09 plan amend | resolved |

> 级别：P0 阻塞发布 / 数据丢失 / 安全 · P1 阻塞任务目标 · P2 质量 / 证据缺口 · P3 后续不阻塞
