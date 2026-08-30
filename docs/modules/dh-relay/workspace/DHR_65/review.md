<!-- dh:v1 -->
# DHR_65 · Review

## 独立复核区

**第一轮（normal 必做；施工者不得自审）**

| 复核者 | 范围 | 发现 | 结论 | 派出证据 |
|---|---|---|---|---|
| dhr65-code1-fresh | `c52feda` 的允许路径、loader、专项测试与 mutation | P1：初版仅 3/5 Profile；P2：driver 路径缺 config、固定等待、侧效应记录不足 | changes-requested | e:E-6509；`review-code1-fresh.md` |
| dhr65-code1-reverify | `c52feda..2c32180` 的完整 fixture、双 driver 负例、B-26 与 mutation | P2：alias driver 的 8 秒保险等待低于实际 alias 探测耗时 | changes-requested | e:E-6509；`review-code1-reverify.md` |
| dhr65-code1-final | `2c32180..47f7949` 的 8s→60s timeout 增量、稳定终态与最终 mutation | P0/P1/P2/P3=0；初审 P1/P2 均收敛 | PASS | e:E-6509；`review-code1-final.md` |

**返工收敛**

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|---|---:|---|---|
| 1 | 1 / 0 | 补齐五 Profile 与 fallback 图；补 alias/config 两条 driver 负例、done 屏障和直接零侧效应断言；B-26 纳入默认 test 清单；E-6513、E-6515。 | 未收敛：E-6517 新 P2 |
| 2 | 0 / 1 | 仅将 alias driver 的保险 timeout 调至 60 秒，重新取得 loader 3/3 + driver 2/2 终态；最终 mutation 见 E-6519。 | 已收敛：final re-reverify PASS、P0/P1/P2/P3=0 |

**有效单测·变异点登记**

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人 | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| `profile-registry.mjs:15` | `true→false` | 改条件 | E-6519 | `node --test --test-concurrency=1 --test-name-pattern "loader rejects a bad alias" relay-core/test/dhr65-registry-loader.test.mjs`；还原后 E-6518 | `c7aba8a4a9af89834d37172644fe64bb57e7da3d` | `75f0a0f03d726949cbe3087369b73b5d32f1dcc0` | 施工者（normal 允许） | mutant 断言失败、exit 1；还原后 loader 3/3 和 driver 2/2 均 exit 0。 |

**需求复核结论**：PASS（P0/P1/P2/P3=0）；完整五 Profile、alias/config driver 零副作用、B-26 最小范围、未得终态的 `npm test` 陈述及 DHR_35 blocked 均已核实｜派出=log:review-requirements-reverify.md｜证据=`E-6513`、`E-6514`、`E-6515`、`E-6516`

**教训复核结论**：PASS（P0/P1/P2/P3=0）；L-6501 已标 DHR63 L-6302 重合，L-6502/6503 与既有候选为应用关系且无重复；未把 `npm test` 未得终态写绿｜派出=log:review-lessons-reverify.md｜证据=`E-6514`、`E-6518`、`E-6519`

## AI 提交区

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| P6-RI-A5 runtime 部分 | 将坏 alias/config 注入完整五 Profile 结构等价 registry；每条均直测 loader，alias/config 各一条调用既有 driver 启动前路径；fake Herdr 与 Store/Result 计数必须保持零。 | E-6518、E-6519 | 满足 |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | 使用完整正式 registry 的结构等价测试副本，任一已登记 Profile 的坏 alias/config 都使 runtime loader 与 driver 在真实启动前 fail-closed；不得用仅含目标 Profile 的局部 registry 替代，工件不得落配置正文或凭据。 | machine | E-6518、E-6519、E-6508 | 是 |
| 2 | 好 registry 仍可解析 `herdr.codex.main`、`herdr.claude.main`；坏 registry 不创建 Attempt、Agent、pane 或 Result。 | machine | E-6518 | 是 |
| 3 | 对 loader 的 alias-resolve 分支做实现级 mutation，指定测试必须断言失败后还原转绿。 | machine | E-6519 | 是 |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者 | 稳定 ID | 覆盖态 | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P6-RI-A5 runtime fail-closed | 专属 Node 测试：完整五 Profile 结构等价 registry + loader + driver fake/Store/Result 计数 | machine | P6-RI-A5 | 等价覆盖 | 五个 alias、五个 config 坏值均被 loader 拒绝；alias/config driver 负例启动前副作用为零 | E-6513：5/5、exit 0 | 本地 Node | formal validator 的预期错误类别与零副作用断言 | 不读取 live registry、未启动真实 Agent；driver 仅 alias/config 各一代表项 | design/12 | loader/test | 自动化 |
| 好 registry 与 mutation | 专属 Node 测试与 git-backed mutation | machine | DHR65-A2/A3 | 等价覆盖 | 好目标可解析；语义 mutant 断言失败、还原转绿 | E-6513、E-6515：5/5、exit 0 | 本地 Node | 专属断言 | 不覆盖 DHR35 真闭环 | DevPlan P6 | loader/test | 自动化 |

**Confidence Challenge**：E-6517 已推翻初版专项 5/5；E-6518 的 loader 3/3 + driver 2/2 与 E-6519 最终 mutation 已恢复稳定终态，但代码 re-reverify 尚未完成。默认 `npm test` 已列入专属 test 但未得完整终态且可见既有 DHR33 失败，未作为本卡绿色。

- 设计契约无变化：只让既有 runtime consumer 使用 formal validator 已冻结的 alias 解析；未改变 design/12、driver、Receipt、Store、RPC 或 Result 合同。
- 文档无需改：`as-built/relay-core.md` 已将 profile registry 与 Herdr runtime 边界描述为现役行为；本卡仅使 loader 对既有 formal validator 的 alias 检查 fail-closed，未新增子系统、外部接口或设计契约。

**风险放行账表**

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|---|---|---|---|---|---|---|
| 无 | — | — | — | — | — | — |

→ 当前状态：**E11 已确认，待本次主干 verify 提交**

## 人类签名区

本卡完成条件均为机器证；E10 已展示定向测试、mutation、卫生与完整日志落点。用户已在开工指令中授权本卡推进至本地 `verify(dh-relay)`，不含 push、部署、环境动作或 DHR_35。

- 确认记录：2026-08-30 用户 E11 明文“认可，授权”。
- verify 提交 SHA：本次 `verify(dh-relay)` 主干提交。
- 签名：chat-confirm（用户明确授权，AI 仅据此记录）。
