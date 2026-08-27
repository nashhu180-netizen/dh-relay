<!-- dh:v1 · visual_map.md — 步骤证据表。🟢 边做边更新。 -->
# visual_map — DHR-BL-10

## 步骤证据表 (Step Table)

| 步骤 | 完成% | 要的证据 | 证据状态 |
|------|------|---------|---------|
| 0 查证 F-001 Oracle 面 | 0 | grep 命中行号 + 引文 + findings 结论 | missing |
| 1 写失败测试（zcode dry-run + 非法值拒绝） | 0 | `relay-agent-tool.ps1` 跑红输出摘要 | missing |
| 2 ValidateSet 加 zcode | 0 | 环境断言转绿 | missing |
| 3 worker-entry 三分支 | 0 | `relay-agent-tool.ps1` SUITE PASS | missing |
| 4 run-dogfood ValidateSet | 0 | `ValidValues` 含三值的输出 | missing |
| 5 全量回归 | 0 | `run-relay-tests.ps1` 末行 `RELAY ALL PASS` | missing |
| 6 密钥/绝对路径闸 | 0 | `git diff \| grep -iE "apikey\|Program Files\|\.zcode"` 零命中 | missing |
| 7 as-built 同步 | 0 | `relay-psmux-host.md` 两处 zcode 命中 | missing |
| 8 真实拉起一棒（人验项 H1） | 0 | 真实 run 的 result 文件内容 + exit code | missing |

> 证据状态四态：`missing / partial / present / waived`
> （waived = 有意豁免，必须在 progress.md 记原因和谁定的）
