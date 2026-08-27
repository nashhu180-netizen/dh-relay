<!-- dh:v1 · visual_map.md — 步骤证据表。🟢 边做边更新。 -->
# visual_map — DHR-BL-10

## 步骤证据表 (Step Table)

| 步骤 | 完成% | 要的证据 | 证据状态 |
|------|------|---------|---------|
| 0 查证 F-001 Oracle 面 | 100 | grep 命中行号 + 引文 + findings 结论 | present（findings F-001=resolved，反证三链） |
| 1 写失败测试（zcode dry-run + 非法值拒绝） | 100 | `relay-agent-tool.ps1` 跑红输出摘要 | present（E-005：旧实现上 `SUITE FAIL (3)`，红恰为 zcode 三断言） |
| 2 ValidateSet 加 zcode | 100 | 环境断言转绿 | present（E-005 pop 后 → E-004 全绿） |
| 3 worker-entry 三分支 | 100 | `relay-agent-tool.ps1` SUITE PASS | present（E-004：`ASSERTIONS 36`/`SUITE PASS`，claude/codex 命令行逐字未动） |
| 4 run-dogfood ValidateSet | 100 | `ValidValues` 含三值的输出 | present（E-006：`claude,codex,zcode`） |
| 5 全量回归 | 100 | `run-relay-tests.ps1` 末行 `RELAY ALL PASS` | present（E-007：末行原文 `RELAY ALL PASS (SKIPPED: 1)`，16 套件） |
| 6 密钥/绝对路径闸 | 100 | 新增行 grep 零命中 | present（E-008；naive 口径假命中甄别见 findings F-004） |
| 7 as-built 同步 | 100 | `relay-psmux-host.md` 两处 zcode 命中 | present（E-010：第 9/57 行） |
| 8 真实拉起一棒（人验项 H1） | 100 | 真实 run 的 result 文件内容 + exit code | present（E-009：exit 0 + schema 双 True；人验裁决留待验收） |
| 9 返工轮1：R1/R2 收敛 + G3 证据入仓 | 100 | 大小写断言×2 绿 + 非 DryRun stub 断言绿（红自证过）+ 变异点表九字段齐 + 复跑证据七份入仓 | present（E-012/E-013/E-011；findings F-006/F-007/F-008=resolved） |
| 10 返工轮2：F-006 处置反转为 fail-closed | 100 | `switch -CaseSensitive` 两处翻转 + 拒绝断言红→绿 + 全库算子巡检零风险命中 | present（E-014/E-015/E-016/E-017；findings F-009/F-010=resolved） |
| 11 返工轮3：真实 `-NoExit` launcher 形态 fail-closed 收敛 | 100 | 两处 default 显式硬退出（`[Environment]::Exit(4)`，实测修正 brief 处方）+ 新断言红→绿（throw 回滚自证）+ 全量回归 + 无残留 pwsh | present（E-018/E-019/E-020/E-021/E-022；findings F-011/F-012/F-013、F-009 已知局限撤销；lesson L-005） |
| 12 返工轮4：第 34 行实拉分支直接断言 + RQ 收敛 + 引号缺陷修复 | 100 | 两新断言（三哨兵 stub＋真实 `-NoExit -File` 无 -DryRun）绿→变异红→还原复绿 + 引号配对修复（探针实证 -DryRun 曾被吞）+ provenance 三时间线 + 全量回归 42 断言 | present（E-023~E-028；findings F-014~F-018、F-013 保持 open；lesson L-001/L-003 rejected、L-002/L-004 改措辞、L-006 追加） |

> 证据状态四态：`missing / partial / present / waived`
> （waived = 有意豁免，必须在 progress.md 记原因和谁定的）
> 注：F-005 登记 as-built「测试与守卫」计数表为历史快照（15 套件/32 断言），现势 16/36，按步骤范围未顺手改。
