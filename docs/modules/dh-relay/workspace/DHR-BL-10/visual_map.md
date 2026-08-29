<!-- dh:v1 · visual_map.md — 步骤证据表。🟢 边做边更新。 -->
# visual_map — DHR-BL-10

## 步骤证据表 (Step Table)

| 步骤 | 完成% | 要的证据 | 证据状态 |
|------|------|---------|---------|
| 0 查证 F-001 Oracle 面 | 100 | grep 命中行号 + 引文 + findings F-001=resolved，反证三链 | present |
| 1 写失败测试（zcode dry-run + 非法值拒绝） | 100 | E-005：旧实现 `SUITE FAIL (3)`，红恰为 zcode 三断言 | present |
| 2 ValidateSet 加 zcode | 100 | E-005 pop 后 → E-004 全绿 | present |
| 3 worker-entry 三分支 | 100 | E-004：`ASSERTIONS 36`/`SUITE PASS`，claude/codex 命令行逐字未动 | present |
| 4 run-dogfood ValidateSet | 100 | E-006：`ValidValues` 含 `claude,codex,zcode` | present |
| 5 全量回归 | 100 | E-007：末行 `RELAY ALL PASS (SKIPPED: 1)`，16 套件 | present |
| 6 密钥/绝对路径闸 | 100 | E-008；naive 口径假命中甄别见 findings F-004 | present |
| 7 as-built 同步 | 100 | E-010：`relay-psmux-host.md` 第 9/57 行 | present |
| 8 真实拉起一棒（人验项 H1） | 100 | E-009：exit 0 + schema 双 True；人验结论见 review 确认记录 | present |
| 9 返工轮1：R1/R2 收敛 + G3 证据入仓 | 100 | E-011~E-013；findings F-006/F-007/F-008=resolved | present |
| 10 返工轮2：F-006 处置反转为 fail-closed | 100 | E-014~E-017；findings F-009/F-010=resolved | present |
| 11 返工轮3：真实 `-NoExit` launcher 形态 fail-closed 收敛 | 100 | E-018~E-022；findings F-011/F-012/F-013；F-009 已知局限撤销；lesson L-005 | present |
| 12 返工轮4：第 34 行实拉分支直接断言 + RQ 收敛 + 引号缺陷修复 | 100 | E-023~E-028；findings F-014~F-018；F-013 保持 open；lesson L-001/L-003 rejected、L-002/L-004 改措辞、L-006 追加 | present |

> 证据状态四态：`missing / partial / present / waived`
> （waived = 有意豁免，必须在 progress.md 记原因和谁定的）
> 注：F-005 登记 as-built「测试与守卫」计数表为历史快照（15 套件/32 断言），现势 16/36，按步骤范围未顺手改。
