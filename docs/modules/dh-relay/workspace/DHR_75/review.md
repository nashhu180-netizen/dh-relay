<!-- dh:v1 -->
# review — DHR_75

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

**第一轮·批次小审合集**

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|---|---|---|---|---|
| `/root/dhr75_code_review1`（fresh） | `4559161..fd3754e` 全 diff；`fd3754e..adcdffb` 定向复审 | PASS（代码层），P0/P1=0；F-7503/F-7504 闭合；F-7505 交轮2裁决；F/有效变异留后续节点 | e:E-7515 | E-7515/E-7516/E-7518/E-7519 |

**第二轮·增量复核**

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|---|---|---|---|---|---|
| `/root/dhr75_code_review2`（fresh，未继承轮1） | `4559161..dc547f7`、轮1结论与收口增量；独立选生产变异 | F-7503/F-7504 已闭；F-7505=非阻塞有意平台边界；无新增 P0/P1 | approved（代码层） | e:E-7524 | E-7520/E-7524 |

**有效单测·变异点登记**

| 变异点锚点(生产代码 path:line) | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人(重核须=轮2实例) | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| `relay-core/runtime/executors/herdr/herdr-cli.mjs:103` | `callTimeoutMs` → `0` | 改超时条件 | DHR_75/A 真实慢 Herdr 子进程 | `node --test --test-name-pattern "真实慢 Herdr 子进程不阻塞同一事件循环的续租节拍" test/dhr75-host-lease-during-herdr.test.mjs` | `20bcdba1d12b04de8e77ba9fa70ed3ee52aecacb` | `b69d4d2f464ec2795ffe08817ce5bb277cd2777b` | `/root/dhr75_code_review2` | 红 exit=1，`:69 false !== true`；还原绿 exit=0 |

**返工收敛**

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|---|---|---|---|
| 1 | 0 | taskkill 设 5s 上限并处理非零/error；pipe error 统一收敛；补 A/B 逐次时间线，D 清理与 B 时间线复跑 | 原两条 P2 已闭合；异常 taskkill 平台边界 F-7505 交轮2 |

**需求复核结论**：approved；A~E/有效变异通过；fresh `/root/dhr75_f_review2` 判 E-7535 满足 F 的 attempt 后首 observation 且 lease 新鲜谓词，checkpoint 仅佐证，agent-ready=blocked 发生在该观测之后不否定 F；P0/P1=0｜证据(E-7535/E-7536)｜派出=e:E-7536

**教训复核结论**：approved；命中候选-73/78 近失并以 L-7501 收敛，候选-34/68/72 证据要求已补｜由 `/root/dhr75_lessons_review`｜派出=e:E-7523

## 第 4 路·一致性复核（横向：本次动的口径 vs 同类路径既有定义）

<!-- dh:consistency-review:v1 task=DHR_75 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| child_process 异步/超时/树清理 | 生产 1 处 + 慢进程/清理夹具 2 处 | 是 | taskkill 异常 fallback 为有意平台边界 F-7505 | e:E-7526 |
| Promise wrapper 与 await | 12 个公开 wrapper；executor 15 个调用点 | 是 | 全部 await，fake plain object 兼容 | e:E-7526 |
| 错误形状 | timeout/spawn/stream/signal/nonzero/empty-json 6 类 | 是 | stream error 是同形新增路径 | e:E-7526 |
| 时间边界 | 10s 通用、60s start、15s lease、5s taskkill | 是 | 各自语义独立，生产 TTL 未改 | e:E-7526 |
| fake/真实/package token | 5 个相关文件/入口 | 是 | envelope、空 stdout、test token 自洽 | e:E-7526 |

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：代码与 A~E 机器证已经两轮/四路复核；fresh 需求复核确认新基线真实 F 已取得 attempt 后的 alive observation，且 observation 时 lease 仍新鲜（E-7535/E-7536）。旧 E-7529 的启动前失租只保留为旧基线事实。agent-ready 随后 blocked、未产生 checkpoint，checkpoint 并非 F 的必要条件。

**设计契约传导声明**：DHR_75 只实现 design/12 P6-RI-A3/A4 的 lease 续租前置；Receipt/Result/Event/RPC 合同、15s TTL、DHR_72 持续观测与 DHR_35 真实闭环责任均未改变。

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| DHR_75 真实产品边界 | DSH-off Windows 冻结 Codex Profile：attempt_started → 首条 host observation，并核对当时 lease expiry | E-7529/E-7530/E-7535/E-7536 | 满足：E-7535 首条 alive observation 早于 lease expiry；fresh 复核确认 agent-ready blocked 与无 checkpoint 不否定 F |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---|---|---|---|
| 1 | **机器证 A（续租不饿死）**：静态与运行时断言生产默认 TTL 仍为 **15,000ms**；在持有 Host actor 的同一 Node 事件循环中注入短 TTL 与真实慢子进程，单次 Herdr CLI 调用跨过至少两个 renew tick。逐次记录调用区间、renew 前后 expiry、竞争取 lease 与首条 observation 的时间线；期间 lease 至少成功续租 2 次，独立 contender 取得同一 Run lease稳定返回 `E_LEASE_HELD`。仅把 TTL 拉长、保留同步阻塞的对照变异不能通过。 | AI | E-7504/E-7512/E-7519 | 是 |
| 2 | **机器证 B（链路继续）**：同一夹具在慢调用返回后依次落 `host_observation_changed(alive)` 与至少一条 `checkpoint_recorded`；修前对照稳定表现为 lease 过期/无 Host Observation，修后转绿。 | AI | E-7510/E-7511/E-7519 | 是 |
| 3 | **机器证 C（fencing 不退化）**：由独立 contender 接管并写入新 epoch，或等价地使旧 lease真正失效；旧 actor 的 Host Observation、checkpoint、Result 全部被拒，事件账零双写、零重复 seq，actor 终态为 `lost_lease` 或等价现役拒绝语义。 | AI | E-7512 | 是 |
| 4 | **机器证 D（CLI 兼容）**：Herdr 成功、非零退出、超时、signal/启动失败、空 stdout、JSON stderr 错误映射保持现役返回形状与 reason/detail；async spawn 超时后等待 child `close`，并在 Windows 验证该子进程及其后代无残留。 | AI | E-7512/E-7517/E-7518 | 是（主路径；F-7505 为有意平台边界） |
| 5 | **机器证 E（直接回归）**：现役 lease/host、Herdr adapter、DHR_70 submission gate 与 DHR_72 冻结五文件定向回归均有终态；不把 `identity-quota.test.mjs` 的 B-38 旧合同阻塞算成本卡失败或顺手改写。 | AI | E-7508/E-7509/E-7517 | 是（有终态，非全绿） |
| 6 | **机器证 F（真实产品边界）**：DSH-off Windows、一个冻结 Codex Profile，至少一次运行在 `attempt_started` 后产生首条 `host_observation_changed`，且该时点 lease 未过期；若进一步取得 checkpoint 只记为本卡佐证，DHR_72 仍须在吸收本卡后独立重跑机器证 F。 | AI | E-7529/E-7530/E-7535/E-7536 | 是 |
| 7 | **有效单测**：由第二轮 fresh reviewer 从生产改动选择变异点；登记 reviewer 独立身份、生产代码锚点、指定测试命令、施加前/后/还原后 hash、红/绿退出码与失败摘要。恢复同步阻塞、漏 `await`、或破坏超时清理之一必须使指定测试以断言失败变红。 | AI | E-7520/E-7524 | 是 |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 慢 Herdr 调用不饿死续租 | 短 TTL + 真实慢子进程 + lease 时间线 + contender | machine | DHR75-A | 等价覆盖 | ≥2 renew，TTL 15s，contender E_LEASE_HELD | pass（E-7519） | Windows/Node v24.12.0 | 事件账 + lease 文件 | 其它启动停摆机制 | P6-RI-A3/A4 | test+runtime | D-start |
| CLI 行为兼容与清理 | 返回矩阵 + child close + Windows 进程树检查 | machine | DHR75-D | 等价覆盖 | 返回形状不变、主路径无残留 | pass（E-7512/E-7517） | Windows/Node v24.12.0 | 原断言 + OS 进程检查 | taskkill 自身失效、Linux/SSH | DHR-B-40 | test+runtime | D-start |
| 真实产品首观测时 lease 新鲜 | DSH-off 冻结 Codex Profile 实录 | machine | DHR75-F | 等价覆盖 | 首 observation 时 expiry 在未来 | E-7535：alive observation `06:16:00.057Z` 早于 expiry `06:16:14.974Z`；fresh 复核 E-7536=PASS，checkpoint 未产生但仅为佐证 | Windows/Herdr；rebase 后 `wt/DHR_75` | 脱敏事件账 + lease + redaction manifest | 不替代 DHR72/DHR35 | P6-RI-A4-pre | runtime | D-start |

**业务化五段展示区**

- 要证明啥：Herdr 命令合法变慢时，Relay 的 Host lease 仍持续续租，并且旧 actor 仍不能越权写入。
- 期望值：至少两次续租、竞争者被拒、慢调用后首观测可达、默认 TTL 不变。
- 实际值：synthetic/真实子进程机器证 A~E 与有效变异通过；E-7535 真实 Codex F 的首条 alive observation 发生时 lease 未过期，随后 agent-ready blocked，未产生 checkpoint。
- 差没差：F 的首 observation/lease 谓词与期望一致；fresh 需求复核已确认 checkpoint 仅为佐证。
- 证据局限：不证明 DHR_72 持续观测、DHR_35 完整闭环或全部启动停摆已解决；E-7535 不含 checkpoint。

**风险放行账表**

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|---|---|---|---|---|---|---|
| 无 | | — | — | — | — | — |

**材料齐没齐**：A~F、有效变异、两轮代码/需求/教训/一致性复核、miner 与 as-built 均齐；E-7535 真实 F 已由 fresh 需求复核 E-7536 判 PASS。

**as-built 更新了没**：已更新 DHR_75 async/timeout/平台边界。

→ 当前状态：**待验收（用户 E11 已确认、本地 squash 已入主干；全仓 DHR_74 R31 阻断 verify）**

### E10 放行证据包

- `releasePacket-DHR75-v1`：机器证 A~F 与有效变异均通过；真实 F=E-7535、fresh 需求复核=E-7536；无产品体验型 H 项、无风险放行行。
- 机器证摘要：DHR_75 专项 7/7；adapter 24 pass / 3 frozen skip / 0 fail；新基线真实实录的首条 alive observation 早于 lease expiry；原 Receipt/Attempt 字段和文件名扫描均为 0。
- 仍需如实查看的边界：E-7535 的 agent-ready=blocked，未产生 checkpoint（该 checkpoint 不在 DHR_75 F 必要条件内）；不替代 DHR_72 的真实 F 或 DHR_35 的完整闭环。F-7501/F-7502/F-7505/F-7507/F-7509 仍为 P2/P3 跟踪项。

---

## 人类签名区　✅ 凭你在对话里的确认解锁

本卡没有产品体验型 H 项；E10 将展示全部机器证与 releasePacket。只有用户在对话中确认“已查看证据，认可执行本地收口”后，才允许 E12/E13。

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| 本地收口授权包 | 查看 E10 展示的机器证、复核结论、diff 与残余边界 | 明确同意或拒绝本地 squash/复验/verify/销户/任务树清理；不含 push/deploy/下一卡 | [x] |

- 确认记录：用户在对话中明文回复“确认”。
- verify 提交 SHA：未生成；`dh dh-relay` 仅余 DHR_74 R31，强闸拒绝代签。
- 签名：hyf（chat-confirm）　　时间：2026-09-05

→ 解锁状态：**用户已验收，待 DHR_74 R31 清零后签 verify；不含 push/deploy/下一卡**

### 确认记录（append-only）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---|---|---|---|---|---|---|
| 2026-09-05 | hyf | releasePacket-DHR75-v1 | `24ba064` | E-7512/E-7517/E-7533/E-7535/E-7536/E-7537；模块体检仅余 DHR_74 R31 | DHR75-A/D/F | 通过 |
