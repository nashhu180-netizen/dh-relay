<!-- dh:v1 -->
# review — DHR_76

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

**第一轮·批次小审合集**

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|---|---|---|---|---|
| /root/dhr76_code1 | 三个生产文件，整改候选5e04dd8 | 原P1清理虚假完成、P2首错顺序已闭合；静态新增0 | e:E-7606 | review-code1.md |

**第二轮·增量复核**

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|---|---|---|---|---|---|
| /root/dhr76_code2 | 24e575f；生产等同5e04dd8，专项与变异 | 静态P0/P1/P2=0；A/B/TTL选点及原始证据已终审；后续config fixture增量定向回读 | approved（限定代码轮2，不代替其它路） | e:E-7623 | review-code2.md |

DHR-B-42 测试增量另由 fresh `/root/dhr76_b42_quick_review` 终审：approved，P0/P1/P2=0；报告见 review-b42-code.md，证据 E-7677/E-7678。该增量不替代代码轮2身份。

**有效单测·变异点登记**

| 变异点锚点(生产代码 path:line) | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人(重核须=轮2实例) | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| relay-core/profiles/validate-profiles.mjs:227 | `json.profiles` → `json.profiles.slice(0, -1)` | 改条件 | `DHR_76/A: a non-target invalid alias remains fail-closed after complete-table validation` | `pwsh -NoProfile -File docs/modules/dh-relay/workspace/DHR_76/scripts/run-mutation-a.ps1 -EvidenceName E-7654-mutation-a-config` | e1244c90fbd577859d3290885dc9233dcc66fe66 | 7cccbc5cf199f4f8295256852dd25dbde0f738de | /root/dhr76_code2 | 断言失败 |
| relay-core/profiles/validate-profiles.mjs:223 | deadline 前加入真实同步 16 秒等待 | 改边界 | `DHR_76/B: the real Host actor renews its default 15s lease during the five-probe async window` | `pwsh -NoProfile -File docs/modules/dh-relay/workspace/DHR_76/scripts/run-mutation-b.ps1 -Mutation B -EvidenceSuffix config` | 26283778e165461fc41c1f9456edc2aee090ad61 | 7cccbc5cf199f4f8295256852dd25dbde0f738de | /root/dhr76_code2 | 断言失败 |

TTL-only 是测试输入负对照，不属于生产变异登记：E-7644-ttl-control-config 以 `60000 !== 15000` 断言失败，E-7656 还原绿。E-7663 记录上述 A/B 变异与还原 Git blob，并以 SHA256 与原始 E-7654/E-7643 内容逐字绑定。

**返工收敛**

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|---|---|---|---|
| 代码轮1整改1 | 0 | 清理不再synthetic close/unref；sync/async按profile保留config→alias首错；5e04dd8 | 静态闭合 |
| 需求方向初审 | 0 | C错误链/正式超时/选择分支/B实际loader/F registry证据补强；A图误判撤回；D由B-42澄清并补E-7662 | 收敛 |

**需求复核结论**：/root/dhr76_requirements｜派出=e:E-7624｜review-requirements.md 定向复审changes-requested，P0=0/P1=0；A golden误判撤回，B/C正常路径/E/F满足；60s证据与D异常边界列P2后续裁决。

**教训复核结论**：/root/dhr76_lessons｜派出=e:E-7625｜review-lessons.md 已执行并纠正golden权威误判，D异常边界阻塞保留。候选68按原执行SHA和源码等价检查记账，不把旧输出改标新执行。miner已在lesson_candidates.md提炼2条去重候选，不替代本路。

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_76 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| 校验顺序与错误面（3处） | sync/async validator、loader | config→alias一致；async额外空stdout拒绝 | 有意差异，保留CLI兼容；见review-consistency.md | e:E-7636 |
| 时间边界（4处） | validator、HerdrCLI、Host、lease | 15/60/10与原HerdrCLI域分离；TTL15k不变 | 一致，未扩大范围 | e:E-7636 |
| fencing/stop（3处） | Host、lease、workflow driver | 既有writeGuard与stopping保持 | 一致，真实epoch/stop证据已过 | e:E-7636 |
| registry结构（4处） | DHR63/live、DHR65、DHR76、golden | live为main空fallback、ninth→main且无config；golden非权威 | A config形状由2f198e5修复，独立静态闭合；运行证E7653已补 | e:E-7636 |
| cleanup异常分支（2处） | validator timer/finish与DHR-B-42合同 | 10s硬界耗尽允许明确失败先于close，必须标记清理未确认、禁止启动 | P1-CONS-01已关闭；fresh B-42审核0/0/0，E-7662通过 | e:E-7636 |
| child error事件 | Node原生spawn与validator error/close | 正常spawn失败有close；无close模拟未证真实必现 | 正式文档E-7655与原生失败用例E-7656已补证；不扩张为OS清理保证 | e:E-7636 |

## AI 提交区

**Confidence Challenge**：A/B正反证据、C/D正常路径与完整输入绑定F已有终态；D异常清理按用户确认的DHR-B-42明确失败，E-7667记录未观察close、不声称无残留且driver四类副作用全0。五路P0/P1已收敛；当前尚未进入E11。

**设计契约传导声明**：DHR-B-42只澄清10s清理宽限耗尽后的明确失败语义；严格全表校验、默认TTL、fencing、stop、错误面与生产范围不变。

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| A 全表严格性 | 五Profile真实结构、每项坏alias/config；生产跳过末项红→还原绿 | E-7612、E-7637、E-7646 | 满足；来源误判已撤回，完整config与变异见E-7664~7666 |
| B 不阻塞续租 | 同Host经实际loader，5真实子进程超15s，expiry与contender；同步/TTL对照 | E-7643~7646 | 满足；code2已终审登记 |
| C 先验后启 | 实际driver四种错误及正式timeout四零；双候选只启所选 | E-7641、E-7642、E-7647 | 满足；最终C错误/选择/正常清理见E-7667、E-7669 |
| D fencing/stop/清理 | 校验中epoch接管、stop、真实Windows超时子孙清零及宽限耗尽明确失败 | E-7630、E-7631、E-7659、E-7667 | 满足DHR-B-42：正常清理成功；异常标记未确认并保持四类副作用全0 |
| E 直接回归 | profiles/loader/identity/host/adapter/DHR75分组终态与生产变异 | E-7610~7617、E-7632、E-7638、E-7640、E-7644~7646 | 满足终态取证要求；DHR75与Host既有失败保留，最终回归见E-7660~7662、E-7667 |
| F 本卡真实产品边界 | DSH-off完整用户registry，冻结Codex，Attempt有效lease后首条observation | E-7648 | 满足：24e575f、5ID、registry前后hash一致、时序及owned清理通过 |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---|---|---|---|
| 1 | **机器证 A（全表严格性）**：保留 5 个正式 Profile 与 fallback 关系的结构等价副本；任一 Profile 的 alias/config 失效都在 Attempt、Agent、pane、Result 前以现役错误面 fail-closed。保留非目标坏项，再变异生产代码使其跳过该项、只传目标 Profile 或跳过 fallback 关系时，原测试必须因错误接受而断言失败。 | AI | E-7612、E-7637、E-7646 | 见下方最终覆盖态；D仍阻塞 |
| 2 | **机器证 B（调度不饿死）**：默认 TTL 仍为 15,000ms；同一 Host actor 事件循环中，覆盖全部 5 个 Profile 的真实异步子进程探针总时长超过 15 秒，期间 lease 至少续租 2 次、expiry 单调前移、独立 contender 始终得到 `E_LEASE_HELD`。恢复同步等待或只拉长 TTL 的对照变异必须变红。 | AI | E-7643、E-7644、E-7645、E-7646 | 见下方最终覆盖态；D仍阻塞 |
| 3 | **机器证 C（先校验后启动）**：全表校验完成前 Attempt/Agent/pane/Result 全 0；成功后仍解析两个指定 Profile 并只启动所选 Profile。单 alias 子进程/整轮/清理宽限/测试外层上限分别冻结为 15s/60s/10s/120s；spawn error、非零、signal、超时或空结果保持 `E_BAD_VALUE:PROFILE_REGISTRY`，detail 含 `E_UNRESOLVED_ALIAS`，无部分启动。 | AI | E-7641、E-7642、E-7647 | 见下方最终覆盖态；D仍阻塞 |
| 4 | **机器证 D（fencing、停止竞态与清理）**：校验期间发生 epoch 接管时旧 actor 后续结果与启动动作均拒绝、零双写；`driver.stop()` 在 await 期间发生时，校验返回后、`openAttempt()` 前复查 stopping，Attempt/Agent/pane/Result 全 0。探针自身超时后等待 child close，Windows 子进程及后代无残留；不新增 stop 取消启动前探针语义。 | AI | E-7630、E-7631、E-7642 | 见下方最终覆盖态；D仍阻塞 |
| 5 | **机器证 E（直接回归与有效单测）**：profiles validator、DHR_65 loader、identity/profile、Host lease、DHR_75 专项和 Herdr adapter 定向回归均有终态，禁止改断言迁就实现；第二轮 fresh reviewer 选生产变异点，登记锚点、命令、前后/还原 hash、红绿退出码和失败摘要。 | AI | E-7610~7617、E-7632、E-7638、E-7640；review-code2.md | 见下方最终覆盖态；D仍阻塞 |
| 6 | **机器证 F（真实产品边界）**：本卡自己的 DSH-off Windows 基线上，用完整真实 registry 和冻结 Codex Profile 跑一次；`attempt_started` 时 lease 未过期且随后出现首条 `host_observation_changed`，证据脱敏、零凭据。不得替代 DHR_75 吸收后的重跑或 DHR_72/DHR_35 专属实录。 | AI | E-7648（candidate/五ID/registry前后hash） | 见下方最终覆盖态；D仍阻塞 |
**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 机器证 A | brief 对应场景与原始终态证据 | machine | DHR76-A | 等价覆盖 | 与卡面完整命题一致 | 终态见逐项表及E-7664~7669；全卡仍被D阻塞 | Windows / 原执行SHA保留，3d55ca7源码等价见E-7668 | 独立复核与负例 | 不扩大到D异常边界 | B-41 | 本地运行与审查 | 用户 D-start |
| 机器证 B | brief 对应场景与原始终态证据 | machine | DHR76-B | 等价覆盖 | 与卡面完整命题一致 | 终态见逐项表及E-7664~7669；全卡仍被D阻塞 | Windows / 原执行SHA保留，3d55ca7源码等价见E-7668 | 独立复核与负例 | 不扩大到D异常边界 | B-41 | 本地运行与审查 | 用户 D-start |
| 机器证 C | brief 对应场景与原始终态证据 | machine | DHR76-C | 等价覆盖 | 与卡面完整命题一致 | 终态见逐项表及E-7664~7669；全卡仍被D阻塞 | Windows / 原执行SHA保留，3d55ca7源码等价见E-7668 | 独立复核与负例 | 不扩大到D异常边界 | B-41 | 本地运行与审查 | 用户 D-start |
| 机器证 D | brief 对应场景与原始终态证据 | machine | DHR76-D | 等价覆盖 | 与DHR-B-42后的完整命题一致 | 正常close/子树清零E-7659；异常明确失败及driver四零E-7667；P1-CONS-01关闭 | Windows / 原执行SHA保留，296b885测试增量 | 独立复核与负例 | OS不合作时明确记录清理未确认，不声称无残留 | B-42 | 本地运行与审查 | 用户D-start及B-42确认 |
| 机器证 E | brief 对应场景与原始终态证据 | machine | DHR76-E | 等价覆盖 | 与卡面完整命题一致 | 终态见逐项表及E-7664~7669；全卡仍被D阻塞 | Windows / 原执行SHA保留，3d55ca7源码等价见E-7668 | 独立复核与负例 | 不扩大到D异常边界 | B-41 | 本地运行与审查 | 用户 D-start |
| 机器证 F | brief 对应场景与原始终态证据 | machine | DHR76-F | 等价覆盖 | 与卡面完整命题一致 | 终态见逐项表及E-7664~7669；全卡仍被D阻塞 | Windows / 原执行SHA保留，3d55ca7源码等价见E-7668 | 独立复核与负例 | 不扩大到D异常边界 | B-41 | 本地运行与审查 | 用户 D-start |
**风险放行账表**

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|---|---|---|---|---|---|---|
| 无 | — | — | — | — | — | — |

### E10 放行证据包（releasePacket-DHR76-v1）

- **展示版本**：`wt/DHR_76@8028cc7`；生产实现锚点 `5e04dd8`，后续提交只含测试与治理证据。
- **机器证据摘要**：A 全表严格性与生产变异红/还原绿；B 默认15s TTL、真实Host续租与同步/TTL对照红；C 全表先验、双Profile只启所选及错误四零；D epoch/stop、正常Windows清理及B-42异常明确失败四零；E 定向回归均有终态且既有失败未冒充通过；F 本卡DSH-off真实运行通过、五ID与registry前后hash一致。
- **复核**：heavy五路已登记；代码两轮独立，需求/教训/一致性完成；B-42 fresh方案审核与增量代码终审均P0/P1/P2=0。有效单测A/B使用代码轮2原选点，真实Git blob和原始SHA256绑定。
- **体检**：E-7680包后全仓 `dh dh-relay` exit1，15失败/91警告；DHR76无failure，仅R14计划卡解析warning。其余失败属于DHR75/74或既有R29，未越界整改，故不声称全仓体检通过。
- **人判结果**：无；六项均为机器证，H=0谓词A成立。
- **风险决定**：0条；无风险接受。H=0谓词B由A~F等价覆盖、五路P0/P1收敛与DHR76零体检failure满足。
- **证据摘要**：cleanup专项JSON SHA256=`73EE9F45BDF21245F156696EA78275A85110927BAC0AB5ABA294FC5E3E2E6A15`；真实F summary SHA256=`537EDDE59166E0AEE9B31292F3E2BFBA72BE3657115D38D7F7DFE9B4A4D1EB95`；真实registry前后SHA256=`CA6916EF791747836F2C76BA4B049056601E522E9EA0497758319254174E5C77`。
- **E11确认范围**：确认后连续执行精确本地squash合入master、合入后相关复验、`verify(dh-relay)`、DevPlan/workspace回填与本任务worktree/branch清理；不含push、deploy/发布/重启、测试或生产环境操作、生产数据/权限操作、下一卡或无关清理。

当前状态：E11已由用户明文“认可”；任务分支已精确squash到`master@23de8cf`，合入后相关专项全部通过。全仓体检仍有范围外既有失败，边界见下方；待创建verify并机械回填销户。

## 人类签名区

本卡六项为机器证；用户已在最终展示完整证据后明文确认本地收口。

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---|---|---|---|---|---|---|
| 2026-09-05 13:44 +08:00 | 用户（对话明文“认可”） | releasePacket-DHR76-v1：机器证据摘要、H=0、Risk-Count=0及本地收口授权包 | `wt/DHR_76@5fda285` | cleanup=`73EE9F45…E6A15`；real-F=`537EDDE5…1EB95`；registry=`CA6916EF…5C77` | DHR76-A / DHR76-B / DHR76-C / DHR76-D / DHR76-E / DHR76-F | 通过；授权精确squash、合入复验、verify、回填和本任务树/分支清理 |

最终证据补记：E-7669（evidence/E-7659-config-start-cleanup.*）在3d55ca7上2项通过、exit0，覆盖完整config下双候选只启所选及正式Windows超时清理。旧记录保留原执行SHA；源码等价依据E-7668。需求路早先两项补证请求已有原始证据；DHR-B-42确认后，一致性最终P0=0/P1=0/P2=0，异常分支及driver四零专项见E-7677（raw E-7667）。

体检边界：最终 E-7680（raw E-7668-dh-check-e10.txt）为exit1、15失败/91警告。DHR76 的R8/R21/R27/R31均已清零，仅R14称找不到DevPlan验收口径；主控逐字核对P6 DHR76卡与brief相同，不改写合同规避解析残留。其余14项属DHR75/74及既有R29，保留原输出，不冒充全仓通过。

合入后复验：`master@23de8cf` 上 profiles 14/14、loader 3/3+2/2、Host/清理 3/3、Windows清理 1/1、先全表校验后选择启动 1/1、epoch/stop 2/2，全部exit0（E-7682~E-7685）。E-7686全仓体检exit1、15失败/94警告；DHR76仍无failure、仅R14 warning，未把范围外失败改写成通过。
