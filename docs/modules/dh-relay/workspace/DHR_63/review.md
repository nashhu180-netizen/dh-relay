<!-- dh:v1 -->
# DHR_63 · Review

## 独立复核区

| 路径 | 复核者 | 结论 | 原始记录 |
|---|---|---|---|
| 一致性 | 待派 fresh 复核者 | 待执行 | `review-consistency-*.md` |
| 教训 | 待派 fresh 复核者 | 待执行 | `review-lessons-*.md` |

## AI 提交区

### 需求对齐证据

| 需求 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| registry 维护证据与 runtime 证据共同闭合 P6-RI-A5 | DHR_63：正式整体 registry 校验→目标 Profile 通过→坏条目被 formal validator 拒绝；DHR_65：另卡在启动前 runtime/mutation 证明 | E-6300（仅开工现场） | 不满足（DHR_65 未开始） |

## 完成条件逐条挂证据（验收靶子）

| # | 完成条件 | 事实证明方式 | 谁验 | 稳定 ID | 覆盖态 | 证据 | 达成? |
|---|---|---|---|---|---|---|---|
| 1 | 目标 Profile 不再返回 `E_UNRESOLVED_CONFIG` / `E_UNRESOLVED_ALIAS`，字段闭集、路径模板和命令解析均可复跑。 | 零注入整体校验 | machine | DHR63-A1 | 待验证 | | |
| 2 | 完整 registry 的坏 alias/config 仍被 formal validator 拒绝；不得以局部测试 registry 绕过。与 DHR_65 的 runtime/mutation 证据共同闭合 P6-RI-A5。 | 正式 registry 负例 + DHR_65 的独立 runtime/mutation 证据 | machine | P6-RI-A5 | 待验证 | | |
| 3 | 工件零配置正文、零凭据；身份不可证时明确写「不可证」。 | 工件扫描与复核 | machine | DHR63-A3 | 待验证 | | |

## light 配方边界

本卡不再承担实现级 mutation 或代码轮次；DHR_65 的 normal 配方独立承担 runtime loader mutation。DHR_63 仅完成教训与一致性复核，且不能单独解除 DHR_35。

## 人类签名区

本卡验收项均为机器证；收口时仍须展示 E10 证据并取得用户的本地收口授权，不得预填通过。
