<!-- dh:v1 -->
# review — DHR_77

## 独立复核区（执行者 ≠ 复核者；heavy 五路，返工 ≤3 轮）

**第一轮·唯一功能批次小审**

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|
| Codex fresh `/root/dhr77_code_r1`（未参与施工；instruction-only read-only，前后 Git 基线侦测） | `master...ec8ef32` 全量 + `fb24197` 整改回查；event/v0、writer/recovery、hash、read-model/CLI 与证据边界 | 初审 P0=0/P1=0/P2=2/P3=0：F-7703 v0 mirror 缺对称 schema 断言；F-7704 cold recovery 生命周期缺序列断言。整改回查 P0～P3=0，二者 resolved | e:E-7722、e:E-7726 | E-7723～E-7727 |

**第二轮·增量复核**

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|------|
| Codex fresh `/root/dhr77_code_r2`（实例/会话≠轮1；instruction-only read-only）+ fresh `/root/dhr77_code_r2_recheck` | `master...1e51895` 全程 + 轮1记录；B-46 后窄复核 `282e326..e1835ba`，并复核原生产变异点 | 初审核 F-7703/F-7704 成立、报 F-7707 P1；B-46 窄复核确认 F-7705/F-7707、capability 说明及测试承重均闭合，原变异点仍直达生产算法 | approved；P0～P3=0 | e:E-7728 | E-7735～E-7741、E-7745 |

**有效单测·变异点登记**

| 变异点锚点(生产代码 path:line) | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人(重核须=轮2实例) | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| relay-core/runtime/executors/herdr/herdr-executor.mjs:24 | `dh-relay.host-ref/v1\0` → `dh-relay.host-ref/v2\0` | 改边界 | `DHR_77 host_ref: frozen UTF-8 golden vectors are byte-exact` | `cd relay-core; node --test --test-concurrency=1 --test-name-pattern="frozen UTF-8 golden vectors" test/dhr77-host-ref.test.mjs` | 41cef177550b139b20ee0afce2f72bc03055a25a | 22d0cd5530500399aca94936fbf5b12fe0732482 | Codex fresh `/root/dhr77_code_r2`（实例/会话≠轮1；instruction-only read-only）+ fresh `/root/dhr77_code_r2_recheck` | 断言失败 |

**返工收敛**

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|------|--------------|----------------------|---------|
| 1 | 0 | `fb24197` 仅补两处测试承重与账本；两文件 25/25、定向组串行 111/111，整改 reviewer 回查 approved | 是；F-7703/F-7704 resolved |
| 2 | 0 | B-46 方案 A 闭合 F-7705～F-7708；代码轮2/需求/一致性均一次 approved，教训 P2→P3 两次文档窄修后 approved；最终生产变异与仓根回归通过 | 是；四路 P0～P3=0，H1 转待人验 |

**需求复核结论**：最终 approved，P0～P3=0；HC-HR-A1～A5 机器项证据闭合，HC-HR-H1 仍需用户裁决；B-46 形状级残余如实保留，不构成 DHR_35 证据｜证据 E-7704、E-7708～E-7715、E-7718～E-7745｜由 `/root/dhr77_requirement` + `/root/dhr77_b46_review`｜派出=e:E-7729

**教训复核结论**：初审 F-7708 P2；整改后定位 P3；`4662dc2`/`9209c7a` 两次仅文档窄修，最终 approved，P0～P3=0；其余重点条目未重蹈，miner 新候选 0；终态证据 E-7745｜由 `/root/dhr77_lessons_miner`｜派出=e:E-7730

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_77 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|---------|-------------|------|---------|
| event/v2 `host_ref` | v2 schema、v0 shape、baseline/capability、compat、contracts tests（6 类；inline golden/negative 2 组） | v2/v0 字段纪律一致；旧 v2 账按新 schema 无法 reopen；CANONICALIZATION 仍写旧 v1 固定 hash | 两项均为遗漏：F-7705 P1、F-7706 P1，须 B-46 扩围 | e:E-7731 |
| Herdr terminal identity | Codex launch 1、Claude launch 1、observe 1、reconcile 1、driver polling/recovery 4 点 | 一致；Claude 从 rename 返回对象取 ID 是 Herdr 实际形态差异 | 有意差异，无 finding | e:E-7731 |
| read-model 安全投影 | RPC subscribe 1、CLI event/focus JSON+text 2、legacy status v1/v2 2、client fixtures 5 | RPC 原样传 detail、CLI 默认安全投影属分层设计；legacy 标签未闭合 | RPC/CLI 分层为有意差异；legacy 为遗漏 F-7707 | e:E-7731 |
| nullable/optional + 状态条件 | 含 null schema 13 份；本卡 host_ref 2 份 | 两份 host_ref schema 严格度一致 | 无 finding | e:E-7731 |
| DHR69/DHR72/DHR75 fixtures | DHR69 1 seeded alive；DHR72 3 fake 场景；DHR75 2 直接输入 | 均供应真实来源字段且不弱化断言；lease guard 前拒绝的 late-write 无需伪造 ref | 有意差异，无 finding | e:E-7731 |

**B-46 一致性窄复核终态**：`/root/dhr77_consistency` 只读核 `e1835ba`，Store 新写入 1 / 重放入口 2、CLI 四态与 JSON/text、capability 函数 2 + v1/v2 endpoint 2 + bootstrap 1、B-46 正反夹具均与现役同类一致；F-7705/F-7706/F-7707 已闭合，方案 A 无代际标记的残余裁为用户已接受的有意差异。approved，P0～P3=0；未重跑测试，完整 npm 未得终态不在其覆盖内（E-7745）。

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：当前最可能被误读的是“定向 113/113 + 仓根回归绿 = 完整 npm 全绿”。反证是 E-7721：完整 npm 两种运行形态均未得自然终态，且 DHR_76/C、DHR_34 identity-quota 保持范围外。另一个不可消除残余是方案 A 无法区分真实旧账与升级后删字段的同形损坏账；该风险已在 B-46 用户选择中明示接受，未改写成严格代际识别。

**设计契约传导声明**：DHR_77 修改 event/v2、v0 mirror、capability baseline/hash、Herdr writer/recovery、Store 回放与 CLI 安全投影；现役合同已同步到 `contracts/CANONICALIZATION.md`、`contracts/compat-matrix.md` 和 `as-built/relay-core.md`。B-46 只增加形状级只读兼容，不改变新 writer 的严格合同。

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| HC-HR-H1 | DSH 关闭；AI 在对话展示生产 focus 渲染层的等价终端输出，并与右侧受控 Herdr API 现场派生的脱敏 ref 对照；用户核状态措辞与零泄露 | E-7743、E-7744 | 待人验；只证明标签/展示，不证明 DHR_35 业务闭环 |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---------|------|-------------|------|
| 1 | 只接受非空 string `terminal_id`，逐字 UTF-8 按冻结公式生成完整 SHA-256 ref；空白/Unicode golden vectors、缺失/错类型/空串与全部 fallback 负例见红。 | AI | E-7703～E-7705、E-7741 | 是 |
| 2 | 轮询/recovery 相同 ID 保持 ref，不同 ID 换 ref；pane/agent 改名不影响；`working→working` replacement 仍写事件。 | AI | E-7708～E-7710、E-7723～E-7725 | 是 |
| 3 | alive 必有 ref；lost 保留最后成功 ref 或如实缺省；recover/replace/初始失败回放正确，旧事件不回写。 | AI | E-7705、E-7708～E-7710、E-7736～E-7739 | 是 |
| 4 | event/v0、descriptor/hash、writer/recovery/read-model/CLI 原子闭合；旧 v1 hash 在分派/订阅前 `E_CAPABILITY_MISMATCH` 且零推送，新 hash 的 v1 与 bootstrap/v2 均工作；旧账本仅显示 legacy 缺省。 | AI | E-7709、E-7713、E-7736～E-7740 | 是 |
| 5 | CLI 区分当前/历史/尚无标签；默认安全投影省略 `detail`；非观测事件拒绝非空 ref；既有 Result/Receipt/lease/fencing/状态全回归。 | AI | E-7705、E-7710～E-7712、E-7739、E-7742 | 是 |
| 6 | 独立展示 DSH-off 安全投影与受控 Herdr 对照面中的同一脱敏 ref，用户判断状态措辞可区分且证据未出现原始 `terminal_id`、`detail`、路径或敏感信息；不得消费为 DHR_35 真实闭环证据。 | 人 | E-7743、E-7744 | 待人验 |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|----------|--------|-------|---------|-------------|---------|-----------|-----------|----------------|------------------|---------------------|
| terminal_id 来源与固定 SHA-256 算法 | golden + schema/source 负例 | machine | HC-HR-A1 | 等价覆盖 | 冻结谓词和字节算法逐项通过，全部 fallback 见红 | E-7703～E-7705；最终生产变异红→还原绿 E-7741 | `9209c7a`（生产代码 `e1835ba`）/ Windows / Node | design/14 §1、contracts validator | 原始 ID 不进入证据 | v1 | node test + validator | 已授权并执行 |
| terminal 生命周期与 replacement | fake Herdr 时序账 + recovery 测试 | machine | HC-HR-A2 | 等价覆盖 | same/replace/rename/recovery 与 `working→working` 触发逐项相符 | E-7708～E-7710、E-7723～E-7725 通过 | 同上 | design/14 §2 | 冷重启只按返回 ID | v1 | node test | 已授权并执行 |
| alive/lost/recover 回放 | reducer/event ledger sequence | machine | HC-HR-A3 | 等价覆盖 | 历史 ref 保留、初始失联缺省、旧事件不回写 | B-46 双入口 3/3；两文件 27/27；六文件 113/113 | 同上 | design/14 §3.1 | 单事件 schema 不证明历史 | v1 | node test | 已授权并执行 |
| 原子协议与 v1/v2 hash | baseline 对证 + RPC mismatch/zero-push + client fixtures | machine | HC-HR-A4 | 等价覆盖 | 新 hash 双版本工作，旧 v1 hash 在分派前拒绝且零推送 | E-7709/E-7713、E-7736～E-7740 通过 | 同上 | capability baseline + RPC server trace | 不废止 v1 信封；方案 A 形状级残余已接受 | v1 | node test + baseline tool | 已授权并执行 |
| CLI 安全投影与兄弟回归 | read-model/CLI/schema + Result/lease/fencing/profile 回归 | machine | HC-HR-A5 | 等价覆盖 | 四态可分、默认无 detail、非观察事件禁 ref、既有合同不变 | E-7739 113/113；E-7742 仓根回归 PASS | 同上 | design/14 §3.3 + frozen suites | 完整 npm 未得终态，范围外债不纳入 | v1 | node test + relay suite | 已授权并执行 |
| DSH-off 对照展示可理解且零泄露 | 对话中的等价终端渲染与脱敏白名单扫描 | human | HC-HR-H1 | 等价覆盖 | 两端同 ref，当前/历史/尚无可分，禁项零出现 | E-7743 两端同 ref/四态；E-7744 禁值扫描 0；用户于 2026-09-06 明文“认可” | `544d2b3` / Windows / Herdr controlled API + production renderer | 用户判断 | 不替代 DHR_35 真实闭环；不是 service/socket E2E | v1 | human review | 已获 E11 对话确认 |

**业务化五段展示区**

- 要证明啥：DSH 关闭时，Relay 展示的 terminal 标签与受控 Herdr 对照一致，且三态清楚、零敏感原值。
- 期望值：两端只出现相同 `herdr-terminal/sha256-…`；CLI 明示当前/历史/尚无；不出现原始 `terminal_id`、`detail`、路径或敏感信息。
- 实际值：E-7743 的受控 Herdr API 对照与生产 focus 等价终端渲染给出同一 `herdr-terminal/sha256-5de0e6f053d7f2943116ff4c948377b7e5fd35784499a43247ca833a3d03c3bc`；current=`当前观测`、history=`历史观测`、none=`尚无可信 terminal 标签`、legacy=`legacy 未提供`。E-7744 白名单扫描 0 命中。
- 差没差：机器比对无差；状态措辞是否清楚、展示是否可接受由用户在 E11 判断。
- 证据局限：使用生产 `renderFocus` 的等价终端渲染，不是 service/socket 端到端 CLI；仅验 DHR_77 标签/展示，不证明 DHR_35 Codex/Claude Receipt→Result 闭环。

**风险放行账表**

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|-------|---------|------|------|------------|---------|---------|
| 无 | — | — | — | — | — | — |

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [x]
**as-built 更新了没**：`as-built/relay-core.md` 已按真实实现覆盖更新？ [x]

→ 当前状态：**HC-HR-A1～A5 与 H1 均通过；E11～E13 本地收口完成；squash=`36aa990`，verify=下一提交，release_mode=full**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

### 目的：证明 DSH-off 下 terminal 标签可核对、可区分且不泄密（HC-HR-H1）

本工作区交付：E-7743 DSH-off 生产 focus 等价终端渲染、受控 Herdr 对照，以及 E-7744 白名单扫描结果。

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| 独立展示 DSH-off 安全投影与受控 Herdr 对照面中的同一脱敏 ref，用户判断状态措辞可区分且证据未出现原始 `terminal_id`、`detail`、路径或敏感信息；不得消费为 DHR_35 真实闭环证据。 | 查看 AI 在对话展示的 CLI 当前/历史/尚无三态、受控 Herdr 对照与白名单扫描摘要 | 两端 `host_ref` 逐字相同；三态可明确区分；禁项零出现；明确不替代 DHR_35 | [x] 通过（用户 2026-09-06 明文“认可”） |

---

- 确认记录：2026-09-06 用户在 E10 证据展示后明文“认可”，授权执行 DHR_77 本地收口包
- verify 提交 SHA：下一提交（`verify(dh-relay): DHR_77 terminal host_ref 原子闭环验收通过`）
- 签名：hyf（chat-confirm 代签）　　时间：2026-09-06T19:48:31+08:00

→ 解锁状态：**已通过并完成 E12/E13；DHR_35 计划阻塞解除，但未获独立 D-start**

### 确认记录（append-only）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---------|--------|----------------------|----------------------|-------------------------------|---------------|--------------------------------|
| 2026-09-06T19:48:31+08:00 | hyf | releasePacket-DHR77-v1 | 544d2b3d42f223b7cf5b9df1e32f726ac6ff96c3 | sha256:54b6f187d8af49c19583a45184f0c39e233d70269ec5401f273b24cf2bbf5e84 | HC-HR-A1,HC-HR-A2,HC-HR-A3,HC-HR-A4,HC-HR-A5,HC-HR-H1 | 通过 |
