# P4-CM4 字段级对证（DHR_50）

## 对证对象和判定规则

两侧都是 DHR_25 冻结 fake fixture：列表 `runs-active.json` 与详情 `run-chinese.json`。DHR_49 的 DSH Host 将该 fixture 集以普通 JSON 提供；CLI 本卡只读重跑，DSH 一侧使用 DHR_49 已落盘的真实 DOM 转录与截图。证据 ID 见 [evidence-index.md](./evidence-index.md)。

“一致”只表示**同一输入上的字段和值未发现差异**；不表示跨机 UI 已验证，更不覆盖 DHR_49 已明确未证的 DM2 判据②。

## 列表屏：五条 run 的可见字段

CLI 当前 `list --layout grouped` 与 E-502 的 DSH `innerText` 对照如下。DSH 的中文状态/严重度是渲染词表，不是第二份状态推导；DHR_49 的 DM6 镜像变异证据已证明只改 `run_status` 不移组、只改 `group` 才移组。

| run_id | group（CLI / DSH） | progress | attention_count + max severity | current_node_title | workflow_name | 结果 |
|---|---|---:|---|---|---|---|
| `fake-run-0005` | `needs_you` / 待你处理 | 3/5 | 1 / block（阻塞） | 第二轮复核：换人对抗评估 | 单卡完整流水 | 一致 |
| `fake-run-0007` | `needs_you` / 待你处理 | 2/9 | 1 / block（阻塞） | 扫全部模块的权威文档新鲜度 | 夜间批量体检 | 一致 |
| `fake-run-0002` | `blocked` / 已阻塞 | 1/2 | 2 / block（阻塞） | implement the projection | p1-relay-poc | 一致 |
| `fake-run-0001` | `running` / 运行中 | 1/4 | 1 / warn（警告） | implement the projection | dev-harness/task-standard@1 | 一致 |
| `fake-run-0006` | `done` / 已完成 | 6/6 | 0 / 无 | 无 | 指标口径回归 | 一致 |

补充核对：两侧均为 5 条；顺序均为 `0005/0007/0002/0001/0006`；DSH 屏内 fixture 指纹为 `67fb18b3`（E-502/503），Host 完整指纹为 `67fb18b3d7d84fa8a3f188f0db67539eb0421aeac4e5c3aadbf536807d39612c`（E-505）。

为避免把“必比字段表”误读为只核了一部分可见内容，列表屏其余可见字段也逐项补核如下：

| run_id | summary | run_status（CLI / DSH） | elapsed_seconds（CLI / DSH） | top_attention_summary（CLI / DSH） | 结果 |
|---|---|---|---|---|---|
| `fake-run-0005` | 冻结客户端中立 Read Model 与 Windows/SSH 控制面 | `waiting_human` / 待人工确认 | 1500 / 25 分钟 | 复核发现 2 个 P1，请确认：现在返工，还是记入 backlog 后先行收口 / 同值 | 一致 |
| `fake-run-0007` | 扫全部模块的权威文档新鲜度并出复查工单 | `failed` / 已失败 | 175 / 2 分钟 | 第 3 步失败，请确认：重跑整条流程，还是仅重试该步骤 / 同值 | 一致 |
| `fake-run-0002` | 把 relay 运行投影成只读视图并接上 CLI | `blocked` / 已阻塞 | 2700 / 45 分钟 | 等一个本条 Run 自己产不出来的上游产物 / 同值 | 一致 |
| `fake-run-0001` | 把 relay 运行投影成只读视图并接上 CLI | `running` / 运行中 | 1121 / 18 分钟 | worker 问要不要换执行器，不换也能继续 / 同值 | 一致 |
| `fake-run-0006` | 核对三个渠道的留存口径是否与新定义一致 | `succeeded` / 已完成 | 2772 / 46 分钟 | 无 / 无 | 一致 |

`current_node_id`、`updated_at`、`started_at`、`trigger`、`trigger_by`、`attempt` 与 `log_locator` 不逐条塞进列表卡；它们对 `fake-run-0005` 已在下方同一 list/detail 关联的详情屏逐字段对过。其余 four runs 的上述字段由 Host payload 等价覆盖，不宣称为列表 UI 逐字展示。

## 详情屏：`fake-run-0005` 的字段并列

CLI 当前 `show run-chinese.json` 的 canonical SHA-256 为 `eb6ca373c87d75f662a5f24bc5210048d18dfbc9cd2f112bbc1a8e5f83ee22a2`；DSH 截图 E-504 为同一 `run_id`。其与列表 `fake-run-0005` 的共有字段亦逐字相同。

| 字段组 | CLI 值 | DSH 实际可见值 | 结果 |
|---|---|---|---|
| 标识与状态 | `fake-run-0005` / `waiting_human` | `fake-run-0005` / 待人工确认 | 一致（词表翻译） |
| 摘要与流程 | 冻结客户端中立 Read Model 与 Windows/SSH 控制面 / 单卡完整流水 | 同值 | 一致 |
| labels | 计划 P4；任务卡 DHR_25 | 同值 | 一致 |
| 触发、开始、耗时、尝试、更新 | human(hyf)；`2026-08-18T13:40:00+08:00`；1500 秒/25 分钟；1；`2026-08-18T14:05:00+08:00` | 人工(hyf)；同一时间；25 分钟；第 1 次；同一更新时间 | 一致（人可读格式） |
| 日志位置 | `.dh-runtime/relay/runs/fake-run-0005/events.jsonl` | 同值 | 一致 |
| nodes[] | 5 条，顺序 `s1-brief`→`s5-verify`；每条的 title/role/status/attempt/depends_on | 5 步接力计划表，顺序和值同 CLI | 一致 |
| attentions[] | 1 条：`att-0005`，block，`s4-review2`，同一 summary 与 since | 待处理事项 1 条，阻塞/待决策/`s4-review2`、同一 summary 与等待起始 | 一致（词表翻译） |

## UI 未直接展示的字段与覆盖态

`schema_version`、`source_kind`、`source_refs` 不在 DSH 可见页面上逐字打印，不能假称“截图已经对过”。它们由 E-505 的 Host plain-JSON + fixture hash 对证为同一输入；这是**payload 等价覆盖**，不是可见 UI 字段覆盖。CM4 的 UI 侧字段对证结论须以两轮只读复核为准。

## 当前机器结论（待复核冻结）

- 已做出的两屏均有同一 fixture 的真实 DSH 渲染证据；列表可见字段和详情字段未发现差异。
- 目标机没有会话，因而**目标机面板渲染出数据未证**；此事实属于 DM2 的约束，不把它写成 CM4 差异。
- **CM4：通过。** Round 1 与 fresh-context Round 2 两轮独立只读复核均建议 `pass`，未见 P0/P1；Round 1 的 P2-1（列表可见字段表不完整）已由本节补表处置。复核记录见 `review-round1.md`、`review-round2.md`。
