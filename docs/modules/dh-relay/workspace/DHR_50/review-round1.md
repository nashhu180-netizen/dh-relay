# DHR_50 · CM4 只读对证 Round 1

## 复核身份与范围

- 复核者：Round 1 独立只读复核 worker（未参与 DHR_50 施工）。
- 日期：2026-08-21。
- 范围：仅复核 P4-CM4 是否可记 `pass`；读取 `task.md`、`cm4-field-comparison.md`、`evidence-index.md`、DevPlan §3.2 DHR_50，以及索引所指 E-501~E-505 和仓外冻结 fixture / DOM 转录 / 截图。未修改代码、fixture、Pilot 或 DSH；不复核 CM6b，也不代裁三态 / H2 / H3。

## 逐项结论

1. **同一 fixture：通过。** Pilot 当前的 `testdata/fake/runs-active.json` 与 DSH 镜像 baseline 的 SHA-256 均为 `70c20ff9a3346af005dad51b0b1b303482fa16d013eeffd2c2e97ebf14022cc1`；`run-chinese.json` 与镜像 baseline 均为 `a653daac7b256546c4d1931c20bbefbb70cdc73aa92e7db20b6dab67e0cd6f9b`。CLI 列表包含 `fake-run-0005`，CLI 详情的 `run_id` 也是 `fake-run-0005`，与 E-504 截图一致。
2. **列表屏：对已声明的 CM4 字段通过。** E-501 CLI 与 E-502 DSH `innerText` 均为 5 条，顺序均为 `0005/0007/0002/0001/0006`；`group`、`progress`、`attention_count`、最高严重度、当前节点标题和流程名逐项相符。DSH 的中文状态 / 严重度是明确登记的词表渲染，不被误写成另一套状态推导；E-503 也证明同机首载、刷新、DSH 重启后的列表顺序和文本 hash 不变。
3. **详情屏：通过。** E-501 CLI 详情与 E-504 同一 `fake-run-0005` 截图的标识、摘要、流程、labels、触发 / 时间 / 用时 / 尝试 / 更新时间、日志位置、5 个节点的顺序与字段、1 条 Attention 的严重度 / 所在步骤 / 摘要 / 等待起始均相符；人可读词形转换已显式标注。
4. **不可见字段边界：诚实。** `schema_version`、`source_kind`、`source_refs` 未被声称为截图可见字段；E-505 只作为 Host / payload 等价覆盖与 fixture hash 证据，且索引明确写出它不能替代 UI 字段对照。没有把 payload 等价覆盖冒充 UI 逐字可见。
5. **DM2 目标机缺口：未被偷换。** E-505 / `cross-machine.txt` 的目标机结论仍是“bundle / Host / 客户端加载成立，但因没有会话，面板渲染出数据未证”。`cm4-field-comparison.md` 同样明确该缺口属于 DM2，不把它写成 CM4 差异或 DM2 通过。该目标机事实不削弱本次同一机器上的 CM4 字段对证，但也不能被本轮结论覆盖。

## 复核提醒（非阻断）

- **P2-1：列表表格的覆盖声明可再收窄或补齐。** `cm4-field-comparison.md` 标题称“可见字段”，但 E-502 屏上还可见摘要、状态词、用时、attention 摘要等，表格没有逐项列出；这不影响本轮已列 CM4 必比字段的证据，也没有被我判作这些遗漏字段已通过。最终附录建议明确“未列字段未作 UI 逐项结论”，或补成逐字段表，避免读者将部分表格误读为全量 UI 对证。

## P0~P3 统计

| 级别 | 数量 | 结论 |
|---|---:|---|
| P0 | 0 | 无阻断性安全 / 数据真相问题 |
| P1 | 0 | 未发现会阻止 CM4 机器结论的问题 |
| P2 | 1 | 仅列表可见字段表的覆盖声明需澄清，非 CM4 pass 阻断 |
| P3 | 0 | 未发现其他需登记项 |

## 对 CM4 `pass` 的明确建议

**建议 CM4 可记 `pass`（本轮支持），但必须完成 DevPlan 要求的 Round 2 fresh-context 独立只读复核后，才可最终落定。** 理由是：同一冻结 list/detail fixture 已由 hash 和关联 `run_id` 闭合；列表与详情均有 CLI 对照和真实 DSH DOM / 截图证据；UI 可见、payload 等价覆盖、目标机未覆盖边界均有明确区分；DM2 的目标机渲染缺口没有被挪用或掩盖。Round 2 仍应复核本记录中的 P2 提醒及上述边界。
