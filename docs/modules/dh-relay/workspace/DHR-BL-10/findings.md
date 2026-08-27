<!-- findings.md — 问题清单。🟢 边做边记。 -->
# findings — DHR-BL-10

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|----|------|------|------|------|------|
| F-001 | P1 | as-built/relay-core 开篇称「v1 现役且被 v2 只读作 Oracle」。若 Oracle 面覆盖 `tools/host/` 宿主层，则改 `relay-worker-entry.ps1` 会动到 v2 的比对基线，本卡范围需重新评估 | <施工步骤 0 回填：grep 命中行号 + 引文> | <施工步骤 0 回填：Oracle 面结论> | open |
| F-002 | P3 | zcode `--help` 列出 `--max-turns <n>` 但实际调用报 `Unknown option '--max-turns'`（zcode 0.16.5）。属上游 CLI 帮助文本与实现不一致 | 主控 2026-08-27 实测，见 `progress.md` E-001 | 不处置——本卡命令行不使用该参数；已在 backlog `DHR-BL-10`「现状证据」登记，供后续接入者避坑 | 遗留→backlog DHR-BL-10（已确认） |
| F-003 | P3 | 桌面端 `~/.zcode/v2/config.json` 明文存 BigModel / Z.ai 的 apiKey。属 zcode 桌面端既有设计，非本卡引入 | 主控 2026-08-27 排查 zcode 配置时发现 | 不处置——`brief.md` 已显式列为 out of scope；已向用户口头提示 | 遗留→backlog（已确认） |

> 级别：P0 阻塞发布 / 数据丢失 / 安全 · P1 阻塞任务目标 · P2 质量 / 证据缺口 · P3 后续不阻塞
> 遗留（P0/P1 唯一合法路径）：状态列写 `遗留→<目标>（已确认）`——"已确认"三字代表用户已在对话里明确同意把这条留到别处。AI 不得自行把 open 的 P0/P1 划成遗留。
