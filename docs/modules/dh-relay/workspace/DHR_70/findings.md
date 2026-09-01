<!-- findings.md — 问题清单。边做边记。 -->
# findings — DHR_70

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|
| F-7001 | P1 | 承接 DHR_35 的 `F-3514`：Claude Receipt 提交撞 `E_LEASE_HELD:actor-closed`，节点停 `running` 无 Result（E-3526）。根因待夹具钉死（H1/H2/H3） | DHR_35 `evidence/windows-claude/herdr.claude.main/failed-run/`；evidence/34 §1.1 租约时间线 | 本卡承接 | open |

> 级别：P0 阻塞发布 / 数据丢失 / 安全 · P1 阻塞任务目标 · P2 质量 / 证据缺口 · P3 后续不阻塞
> 遗留（P0/P1 唯一合法路径）：状态列写 `遗留→<卡号 / backlog>（已确认）`；没有"已确认"三字仍按 open 处理。
