# DHR_50 · P4-CM4 独立只读复核 Round 2

## Fresh-context 声明

本轮为 Round 2 fresh-context 复核；未读取、未继承 `review-round1.md` 或任何 Round 1 结果。只按 `review-brief-round2.md` 指定范围复核，不施工、不改代码、不执行写入操作；除本复核结果文件外无其他落盘。

## 复核身份、日期与只读范围

- 复核身份：DHR_50 / P4-CM4 Round 2 独立只读复核者
- 日期：2026-08-21
- 工作树：`D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\DHR_50`
- 只读仓内材料：`task.md`、`cm4-field-comparison.md`、`evidence-index.md`、DevPlan `P4-DSH工作台最小Pilot-开发方案.md` §3.2 DHR_50
- 按索引只读外部证据：E-502 `screen-baseline.txt`、E-503 `list-screen-rebuild.md`、E-504 `detail-screen-relayplan.png`、E-505 `probe-transcript.md` / `clean-rerun.txt`，以及 `cross-machine.txt` §5~§6；同一冻结 fixture 的 `runs-active.json`、`run-chinese.json`
- 未读取或修改其他 review 文件；本文件是唯一落盘文件

## 逐项结论

### 1. 同一 fixture

通过。CLI 只读重跑的 list JSON、grouped 文本、detail JSON、detail 文本和 hash 命令均 exit 0。fixture 原件为 `runs-active.json` 与 `run-chinese.json`；详情 CLI canonical SHA-256 为 `eb6ca373c87d75f662a5f24bc5210048d18dfbc9cd2f112bbc1a8e5f83ee22a2`，与对证表一致。DSH E-502/E-503 屏内指纹为 `67fb18b3`，E-505 Host 完整 fixture hash 为 `67fb18b3d7d84fa8a3f188f0db67539eb0421aeac4e5c3aadbf536807d39612c`，与记录的同一输入一致。

### 2. 列表屏字段级对证

通过。E-502 的真实 DSH `innerText` 与当前 CLI grouped 输出在五条及顺序 `0005/0007/0002/0001/0006` 上一致；逐条核对 `group`/中文状态、progress、attention_count 与最高严重度、current_node_title、workflow_name 未发现差异：

| run_id | group / DSH 状态 | progress | attention / max severity | current node | workflow |
|---|---|---:|---|---|---|
| `fake-run-0005` | `needs_you` / 待你处理 | 3/5 | 1 / block（阻塞） | 第二轮复核：换人对抗评估 | 单卡完整流水 |
| `fake-run-0007` | `needs_you` / 待你处理 | 2/9 | 1 / block（阻塞） | 扫全部模块的权威文档新鲜度 | 夜间批量体检 |
| `fake-run-0002` | `blocked` / 已阻塞 | 1/2 | 2 / block（阻塞） | implement the projection | p1-relay-poc |
| `fake-run-0001` | `running` / 运行中 | 1/4 | 1 / warn（警告） | implement the projection | dev-harness/task-standard@1 |
| `fake-run-0006` | `done` / 已完成 | 6/6 | 0 / 无 | 无 | 指标口径回归 |

E-503 还证明同一机器同一浏览器首载、刷新、DSH 进程重启后的列表 `innerText` SHA-256 均为 `076c9d4a1036b0733ce6e854893676c10959c4fd1ce9f95d938ebbb89ce39e24`，不是一次偶然首载。

### 3. 详情屏字段级对证

通过。E-504 真实 DSH 截图的 `fake-run-0005` 与 CLI detail fixture 逐项一致：标识与 waiting-human 状态（中文词表）；摘要、流程名、labels；触发人、开始时间、25 分钟耗时、第 1 次尝试、更新时间、日志位置；5 条 nodes 的顺序及 title/role/status/attempt/depends_on；以及 `att-0005` 的 block、`s4-review2`、summary、since。截图所示值与 CLI detail 输出及 `run-chinese.json` 相符。

### 4. payload 与 UI 的覆盖边界

如实通过。`schema_version`、`source_kind`、`source_refs` 未在 DSH 可见页面逐字打印，不能把它们写成“截图已覆盖”；E-505 的 Host plain-JSON 与 fixture hash 只证明同一 payload/输入，属于 payload 等价覆盖。该边界已在 `cm4-field-comparison.md` 明确登记，不构成隐藏差异。

### 5. 目标机渲染缺口隔离

如实通过。`cross-machine.txt` §5~§6 记录目标机 Host 已答出同一 fixture hash，客户端 bundle 已完成加载、挂 Remote、注册视图和注入样式；但目标机没有已打开会话，因此 Relay 页签及面板渲染出数据未证。该缺口被明确归在 DSH/P4-DM2 的目标机 UI 前置条件，未被误写成 CM4 字段差异；同机 E-502 列表转录与 E-504 详情截图仍是本次 CM4 的真实 DSH UI 证据。

## P0~P3

- P0：0
- P1：0
- P2：0
- P3：0

目标机未开会话的渲染缺口是已登记的范围限制，不重复计为 CM4 缺陷；E-503 的 `innerText` 非像素证据也符合 brief 要求的真实转录/等价渲染证据，不构成问题。

## CM4 建议

**建议 P4-CM4 可记 `pass`。** 两份冻结 Read Model 均有 CLI 与真实 DSH 面板的字段级对证，列表与详情都覆盖；同一 fixture、顺序、字段和值均未发现差异；不可见 payload 字段和目标机 UI 未验证边界均已诚实隔离。此文件仅给出本轮 Round 2 的独立意见；最终是否满足“记 pass 前两轮独立复核”的流程条件，由主控结合另一轮独立信号确认。
