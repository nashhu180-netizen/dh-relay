<!-- dh:v1 -->
# DHR_63 · Review

## 独立复核区

| 路径 | 复核者 | 结论 | 原始记录 |
|---|---|---|---|
| 一致性 | Claude Opus fresh reviewer（dedicated_pair，只读） | approved（返工复验 P0/P1=0） | `review-consistency-opus.md` |
| 教训 | Claude Opus fresh reviewer（dedicated_pair，只读） | approved | `review-lessons-opus.md` |

## B-25 前历史复核（仅作 registry 维护证据，不属于当前 light 配方）

| 原问题 | 本轮处理 | 证据 | 当前状态 |
|---|---|---|---|
| P1-1 loader 对坏 alias fail-open | 只读复现 validator/loader 差异；loader 属 DHR_63 禁改边界，未修改 | E-6310 | **B-25 已移交 DHR_65，不由本卡闭合** |
| P1-2 Codex fallback 触发 driver 启动前 guard | 移除 `herdr.codex.main` 对不可证 `herdr.codex.ninth` 的 `fallback_profile_ids` 引用；ninth 仍无 config rule，直接选择保持 fail-closed | E-6311、E-6312 | **registry 部分 closed，待 fresh 复验** |
| P1-3 normal 有效 mutation 缺失 | 完成 registry 输入红→还原探针；未改实现代码/测试，因此严格 code mutation 不宣称完成 | E-6313、E-6314、F-6303 | B-25 已移交 DHR_65，不由本卡闭合 |

## 代码轮 1 · 返工第 1 轮（fresh 复验）

| 复验项 | fresh 事实 | 证据 | 当前状态 |
|---|---|---|---|
| P1-1 loader 对坏 alias fail-open | 完整 registry alias 变异仍为 validator `REJECT E_UNRESOLVED_ALIAS`、loader `ACCEPTED`；未改 loader/validator | E-6322 | **B-25 已移交 DHR_65，不由本卡闭合** |
| P1-2 Codex fallback 触发 driver 启动前 guard | `herdr.codex.main.fallback_profile_ids=[]`；正式 validator 通过；临时非敏感 fixture + fake Herdr 的 driver preflight 为 `CLEAR` | E-6320、E-6323 | **closed / registry 部分** |
| P1-3 normal 有效 mutation 缺失 | profiles 定向绿测 `14/14`；无实现级 code mutation 红测，registry 输入变异不等价 | E-6324、F-6303 | **B-25 已移交 DHR_65，不由本卡闭合** |
| F-6301 ninth 身份与独立配置根 | 未读取配置正文/凭据，继续标「不可证」 | E-6325 | **open / 不可证** |

## AI 提交区

### 需求对齐证据

| 需求 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| registry 维护证据与 runtime 证据共同闭合 P6-RI-A5 | DHR_63：正式整体 registry 校验→目标 Profile 通过→坏条目被 formal validator 拒绝；DHR_65：另卡在启动前 runtime/mutation 证明 | E-6320、E-6321、E-6323、E-6324、E-6330 | DHR_63 registry 部分满足；联合命题仍等待 DHR_65，DHR_35 不解锁 |

## 完成条件逐条挂证据（验收靶子）

| # | 完成条件 | 事实证明方式 | 谁验 | 稳定 ID | 覆盖态 | 证据 | 达成? |
|---|---|---|---|---|---|---|---|
| 1 | 目标 Profile 不再返回 `E_UNRESOLVED_CONFIG` / `E_UNRESOLVED_ALIAS`，字段闭集、路径模板和命令解析均可复跑。 | 零注入整体校验 | machine | DHR63-A1 | 等价覆盖 | E-6320、E-6330 | 是（DHR_63） |
| 2 | 完整 registry 的坏 alias/config 仍被 formal validator 拒绝；不得以局部测试 registry 绕过。与 DHR_65 的 runtime/mutation 证据共同闭合 P6-RI-A5。 | 正式 registry 负例 + DHR_65 的独立 runtime/mutation 证据 | machine | P6-RI-A5 | 部分覆盖 | E-6321、E-6330 | DHR_63 部分是；联合命题待 DHR_65 |
| 3 | 工件零配置正文、零凭据；身份不可证时明确写「不可证」。 | 工件扫描与复核 | machine | DHR63-A3 | 等价覆盖 | E-6325、E-6331 | 是（DHR_63） |

## light 配方边界

本卡不再承担实现级 mutation 或代码轮次；DHR_65 的 normal 配方独立承担 runtime loader mutation。DHR_63 仅完成教训与一致性复核，且不能单独解除 DHR_35。

## 人类签名区

本卡验收项均为机器证；收口时仍须展示 E10 证据并取得用户的本地收口授权，不得预填通过。
