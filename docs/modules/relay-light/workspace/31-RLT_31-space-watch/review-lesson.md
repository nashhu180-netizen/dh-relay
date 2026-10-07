<!-- dh:v1 -->
# RLT_31 教训独立复核

范围：只读审 `tools/relay-light/space_watch.py`、`install_skill.py`、`skill/SKILL.md` 及两份 adapter；未运行 Herdr、未做网络或实时 pane 操作。本仓不存在 `docs/modules/relay-light/knowledge/`；已按 watcher / Herdr / 投递 / 身份闸 / 监控 / 安装关键词查阅 `docs/modules/dh-relay/knowledge/教训库-候选.md` 与 `knowledge/herdr-派活操作.md`。

## 结论

PASS（本轮教训路径）。未发现候选实现重蹈已登记的 P0/P1 教训；`lesson_candidates.md` 的一句候选不建议进入正式教训库，原因是它是本卡的机制摘要，且已被既有候选和本次协议约束覆盖，不构成新的可复用因果教训。

| 来源教训 / 风险 | 级别 | 实查证据 | 结论 |
| --- | --- | --- | --- |
| 候选-63：派活前置的 `HERDR_ENV=1` 不能跳过 | P1 防回归 | `knowledge/教训库-候选.md:514-520`；`space_watch.py:32-36,111-113,174-179`；SKILL `:410` | 已吸收：脚本每轮与入口均 fail closed，且 `RELAY_RECEIPT` 存在（含空值）也拒绝运行；不是把前置当背景说明。 |
| 候选-67 / Herdr 手册：命令回显不等于实际投递 | P1 防回归 | `知识/教训库-候选.md:546-552`；`knowledge/herdr-派活操作.md:22-31`；`space_watch.py:73-83,156-158`；SKILL `:408` | 已吸收：prompt 的类型、同 pane 和 `state_change_seq` 都须证明；失败在更新基线之前抛出，脚本不发送 Enter、不重试未知结果。 |
| 候选-82：交互输入显示、退出码与真实提交是不同事实 | P1 防回归 | `知识/教训库-候选.md:668-674`；`space_watch.py:42-59,73-83`；双 adapter watcher 模板 `:238-255` | 已吸收且更保守：子进程非零、JSON 异常或确认缺失立即 BLOCKED；脚本没有 PowerShell Stop/Enter 回退路径，模型仅按三条件处理人工安全 Enter。 |
| 候选-88：无接收者的后台等待会令监控断线 | P1 防回归 | `知识/教训库-候选.md:716-722`；SKILL `:404-411`；Codex adapter `:252-257`；Claude adapter `:252-255` | 已吸收：脚本自行维持 120 秒节拍，adapter 明确以持久子进程和 PID/退出码巡检为准；宿主不能维持子进程则报告 blocked，未把包装命令或无人认领的 wait 当存活。 |
| 候选-51 / 58：常驻轮询需有界、可收敛，异步结论不能靠静默 | P2 防回归 | `知识/教训库-候选.md:418-424,474-480`；`space_watch.py:18,42-46,162-181` | 已吸收到运行边界：每次 Herdr 调用 15 秒超时，观察周期固定 120 秒，任何失败退出为 2；本报告不把这替代测试有效性结论。 |
| 安装拓扑与脚本副本漂移 | P2 | `install_skill.py:24-31,74-108`；SKILL `:407` | 已处理：`space_watch.py` 同列入安装清单、以来源文件 hash 回读，默认源从 skill 父目录取脚本，副本自包含；没有将宿主外部路径作为运行依赖。 |

注：表中两处“知识/教训库”路径均指 `docs/modules/dh-relay/knowledge/教训库-候选.md`；为避免表格过宽未重复全路径。

## 候选去重意见

`lesson_candidates.md` 的“模型不承担机械状态 diff；监控集合由宿主 workspace ID 决定并动态发现”不应新入正式库：

- 前半句是本实现的职责分配，已被本卡协议落实为 `space_watch.py` 的内存快照与机械比较（`space_watch.py:111-159`）以及 watcher 的零写入边界（SKILL `:404-409`），缺少独立事故、触发条件和可泛化的因果链。
- 后半句是 SW1/SW2 的功能契约，已由同一脚本的 `workspace_id` 每轮筛选、仅排除自身、按 `agent_status/state_change_seq` 比较落实（`space_watch.py:113-140,147-159`）；与候选-88 的监控生存期问题、候选-63 的环境前置、候选-67 的投递闭环相关但不新增它们未覆盖的教训。
- 建议状态：保留为本卡 `lesson_candidates.md` 的实施线索，标为 `lessons-absent` / N/A；不修改正式库，也不把本轮 PASS 写成对真实 Herdr 演练（SW6）的结论。

未发现需要整改的 P0/P1/P2。此结论只覆盖教训去重与既有教训防回归，不替代代码、需求、一致性复核、机器测试、真实 Herdr 验证或 CI。
