<!-- dh:v1 -->
# DHR_66 · Review

## 独立复核区

本卡任务类型为 **light**：不适用代码轮次或实现级 mutation；收口时仅完成教训与一致性两条独立路径，施工者不得复核自己的卡。

| 路径 | 复核者 | 范围 | 结论 | 派出证据 |
|---|---|---|---|---|
| 教训 | `dhr66_lessons_review` | 非敏感 registry 读取、零值留存、fail-closed 边界及候选库 | 初审 P1×1 已整改；定向复验 P0/P1=0，PASS；无新增候选 | e:E-6608 |
| 一致性 | `dhr66_consistency_review` | registry projection/reader、Receipt 四字段、产品 config 不写、runtime fail-closed、账号主体不可证 | 初审 P1×1/P2×1 已整改；定向复验 P0/P1/P2=0，PASS | e:E-6609 |

**教训复核结论**：PASS（命中候选-32/36/50/56/57/12/41/44；旧 task plan 漂移已用 superseded notice 闭合；无新增候选）｜派出=e:E-6608｜证据=`task_plan.md`、`execution_strategy.md`、E-6602~E-6607

## 一致性复核

<!-- dh:consistency-review:v1 task=DHR_66 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| Registry projection / reader | 目标 Profile 1 个；保留 `/model` 1 项；`profiles/identity.mjs`、runtime `profile-registry.mjs` | 一致：reader 只读声明 nonsecret pointer，四类坏 projection fail-closed | PASS | e:E-6609 |
| Receipt 四字段 | `freezeProfileIdentity → createExecutorIdentity`；DHR63/65/66 联合证据 | 一致：固定四字段、两枚 64 位 hash；`/model` 只参与 config fingerprint | PASS | e:E-6609 |
| Codex 产品 config 不写 | B-31、E-6606/E-6607、strict config | 一致：registry 只删 1 field，产品 config hash 不变 | PASS | e:E-6609 |
| Runtime fail-closed | DHR35 projection 缺失红证；DHR65 完整 registry loader/driver 零副作用 | 一致：Attempt 前拒绝有直证，Agent/pane/Result 零副作用由 runtime 证据承担 | PASS | e:E-6609 |
| 账号主体不可证 | evidence/29、DHR63 review | 一致：`account_alias` 不等于主体认证，`expected_identity` 仍不可证 | PASS（有意边界） | e:E-6609 |

## AI 提交区

### 需求对齐证据

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| P6-RI-A5 的 Codex projection 复验 | 旧 `/profiles` 声明缺键 → fail-closed；B-31 只修 registry 声明、不写产品 config → 既有 identity freeze 成功且 Receipt 四字段不变；classification 非 nonsecret/坏/不安全/缺值均 fail-closed。 | E-6602~E-6607；`workspace/DHR_35/progress.md` projection 直达红证；`workspace/DHR_63/review.md` P6-RI-A5；`workspace/DHR_65/review.md` P6-RI-A5 runtime | 满足 DHR66 Codex projection 部分；联合证据闭合 P6-RI-A5，真实产品闭环仍由 DHR35。 |

### 完成条件逐条挂证据

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | 旧 `/profiles` 声明缺键时在 Attempt、Agent、pane、Result 前拒绝；修复 registry 声明后 `freezeProfileIdentity` 仍产生 `executor_profile_id`、脱敏 `account_alias`、`config_fingerprint`、`executor_capability_hash` 四字段，工件仅含 hash、错误码与脱敏摘要。 | machine | E-6602、E-6604、E-6606、E-6607；`workspace/DHR_35/progress.md` Attempt 前红证；`workspace/DHR_65/review.md` runtime 零副作用 | 是 |
| 2 | 现役入口无 overlay selector，Codex 产品配置不因本卡写入；`/model` 未声明 nonsecret、pointer 坏/不安全或值不可证时 fail-closed。 | machine | E-6603、E-6605~E-6607 | 是 |
| 3 | 投影值、配置正文与凭据零进入工件。 | machine | E-6606、E-6607 | 是 |

### 验收项元数据表

| 命题 | 事实证明方式 | 最终裁决者 | 稳定 ID | 覆盖态 | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Codex nonsecret projection 不绕过 fail-closed 且 Receipt 身份不收窄 | 旧声明红证 + registry 单 field mutation + live identity 正证 + synthetic 四类负例 + DHR65 runtime 零副作用 + 零值泄露扫描 | machine | P6-RI-A5 | 等价覆盖（DHR63+65+66 合取） | 基线错误、修复后四字段、四类负例、产品 config hash 不变及 runtime 零副作用均有终态 | E-6602~E-6607；`workspace/DHR_63/review.md` registry 部分；`workspace/DHR_65/review.md` runtime 部分 | 本地 Windows / Codex CLI 0.151.0 | 既有 formal validator、`freezeProfileIdentity`、runtime fake/Store/Result 计数 | 不证明账号主体；不启动真实 Agent，DHR35 另卡承担 | design/12 | validator/identity/runtime tests | 自动化 |

- 设计契约无变化：只纠正用户级 registry 的漂移声明；`/model` 仅参与 `config_fingerprint`，不是账号主体或 `expected_identity`；Receipt、schema、validator、产品 config 与仓内实现均不变。
- 文档无需改：本卡不改变仓内子系统行为或正式设计输入。

## E9 交付汇报

`deliveryReport: DHR_66-E9-v1`：目标是闭合 Codex main Profile 的 nonsecret projection 漂移；范围仅含用户级 Relay registry 声明与本卡治理工件，未改 Codex 产品配置、生产代码、Receipt 合同或 schema。三条完成条件均由 E-6602~E-6607 达成，B-31 fresh 审核与 light 教训/一致性复核均已收敛为 P0/P1/P2=0；miner 无新增候选，as-built 无行为变化所以 N/A。机器终态为 formal validator PASS、live identity 四字段且两枚 hash 均为 64 位、四类负例 4/4 fail-closed、strict config exit 0、定向测试 23/23、registry 敏感形态 0。待裁决项仅为用户次日是否授权本地收口；在此之前不执行 verify、合并、清理或 DHR35。

## E10 放行证据包

`releasePacket: DHR_66-E10-v1`：H=0（无人判结果项、无 open 方向项、无风险接受项）。要证明的是旧漂移声明能 fail-closed 且修复后 Receipt 身份不收窄；期望值为产品 config 字节不变、registry 仅删 `/profiles`、live identity 保持四字段、负例继续拒绝；实际值为 registry `052d0f…`→`ca6916…`、产品 config 前后 `82e5a2…`、validator/freeze/strict/tests 全部 exit 0、23/23 通过、四类负例 4/4 拒绝、敏感形态 0；未见差异。证据为 E-6602~E-6610 与 `design/evidence/29-DHR66-Codex-projection漂移-B调整交叉审核记录.md`。局限：不证明真实账号主体，不启动真实 Agent，不替代 DHR35 的 Codex/Claude Windows 闭环；备份 `%USERPROFILE%/.dh-relay/executor-profiles.json.bak-DHR66-B31-20260830T165431Z` 可恢复本次外部 registry 单字段变更。

→ E12 已将 DHR66 精确 squash 至主干 `459b8ac`，合入复验通过；E13 的 verify/销户回填在本提交完成。

## 人类签名区

本卡完成条件均为机器证。E10 展示：旧声明红证 E-6602；B-31 当前 Codex 契约 E-6603；正向 dry-run/负例 E-6604/E-6605；可恢复精确 mutation E-6606；写后 validator/live freeze/strict config/23 tests/零泄露 E-6607；light 两路复核 E-6608/E-6609。

**E11 用户确认**：用户于 2026-08-31T10:00:24+08:00 在本对话中明文回复“认可”。确认语义承接已展示的 `DHR_66-E10-v1` 与本地收口授权包：精确本地 squash、合入复验、`verify(dh-relay)`、DevPlan/workspace 回填以及 DHR_66 worktree/branch 清理；明确不含 push、deploy、环境操作或下一卡（DHR_35）开工。H=0 且所有机器证为等价 pass，因此 `release_mode=full`。
