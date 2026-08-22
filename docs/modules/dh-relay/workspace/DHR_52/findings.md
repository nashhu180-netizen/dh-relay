<!-- dh:v1 -->
# findings — DHR_52

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|
| F-201 | P2 | F-057：发错协议是否应从既有 `E_BAD_VALUE` 中分出 `E_PROTOCOL_MISMATCH` 尚待运行期反例与边界裁决。 | DevPlan DHR_52；`reason-codes.md` 的版本/值边界 | 先取证；未裁决前 contracts 与基线零改动 | open |
| F-202 | P2 | `dh status dh-relay` 当前报 `DESIGN_INPUTS_STRUCTURE_INVALID`，尚未确认是否为 DHR_52 之外的既有模块治理问题。 | 2026-08-22 `dh status dh-relay` 输出 | 不在本卡顺手修；收口前单独核对是否影响所需 gate | open |

> 级别：P0 阻塞发布 / 数据丢失 / 安全 · P1 阻塞任务目标 · P2 质量 / 证据缺口 · P3 后续不阻塞
