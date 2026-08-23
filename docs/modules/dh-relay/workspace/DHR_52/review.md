<!-- dh:v1 -->
# review — DHR_52

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

**第一轮·批次小审合集**

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 | 证据 |
|---|---|---|---|---|
| codex-fresh-r1（独立 Codex 实例，未参与施工） | RPC/transport/server、F-057 映射、fixtures 与回归证据 | P1：`validate.mjs:173-178` 对不完整/附加未知字段的错协议对象提前归为 `E_BAD_VALUE`，未保留更具体的缺字段/未知字段；P1：`server.mjs:94-97` 未限制 error `data.detail`，可超过 frozen `relay.rpc/v1` 的 4096 上限。未发现 P0。 | E-029 | E-030 |

**第二轮·增量复核**

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|---|
| codex-fresh-r2（独立 Codex 实例，未参与施工及第一轮复核） | RPC/F-057、错误 response 信封、transport 与生命周期 | 新 P1：handler 非 JSON 返回会生成非法 response 或在 `JSON.stringify` 处未捕获；第一轮两项未在此轮复现 | changes-requested | E-032 | E-033 |

**第四轮返工后·新鲜独立复核**

| 复核者(谁·实例/会话) | 范围 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|
| claude-default（新鲜 Claude Code 会话；禁 Write/Edit/NotebookEdit/Bash + strict empty MCP） | 当前 RPC/F-057、JSON-safe response/notification、UTF-8/NDJSON、订阅生命周期与范围 | changes-requested：无 P0/P1；P2-1 建议回退 F-204 的具体错误排序；P3-1 scope 账不一致、P3-2 两条异步路径缺测、P3-3~5 为基线/时序/as-built 观察。 | E-047 | E-049 |

**主控裁决与返工**

| 项目 | 裁决 / 动作 | 证据 |
|---|---|---|
| P2-1 | 驳回。其建议会使不完整或含未知字段的交叉对象重回 `E_BAD_VALUE`，与 F-204、`rpc.test.mjs:668-680` 和 `reason-codes.md:13` 明定的「保留实际最具体既有码」相反。 | F-211；E-050 |
| P3-1 | 修正 brief/execution_strategy：只允许将 `test/rpc.test.mjs` 接入既有 `npm test`，其余 package 改动仍禁。 | F-213；E-050 |
| P3-2 | 已补 handler reject 与迟到 subscribe resolve 两条真实 socket 回归。 | F-212；E-050 |
| P3-3 | 驳回为遗漏：`npm test` 的 contracts 套件已复算 8 份 capability 基线并与快照对证。 | E-050 |
| P3-4 / P3-5 | P3-4 为 `true`=已写 socket 的既有接口边界，无假称对端送达；P3-5 留 E7 as-built 收敛，不冒充已完成。 | E-049；E7 待办 |

**第四轮后返工·新鲜增量复核**

| 复核者(谁·实例/会话) | 范围 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|
| claude-default-r2（新鲜 Claude Code 会话；禁 Write/Edit/NotebookEdit/Bash + strict empty MCP） | F-057 既有码排序、两条异步回归、package test 门面与 RPC 回归 | approved：无 P0/P1/P2；P3-1~4 进入收口尾巴，不阻断实现验收。 | E-051 | E-052 |

**F-218 后·新鲜独立复核**

| 复核者(谁·实例/会话) | 范围 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|
| codex-cli-fresh-r3（`codex-ninth` / `gpt-5.6-sol` 新鲜会话；OS `--sandbox read-only`） | 当前未提交全量 diff；重点 F-218 真实 Store 断连同态、NDJSON 分帧、通知/响应序列化、背压与 F-057 边界 | changes-requested：P1 F-219/F-220；P2 F-221/F-222；静态审，未跑测试。 | E-058 | E-059 |

**F-219~F-222 返工后·新鲜独立复核**

| 复核者(谁·实例/会话) | 范围 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|
| codex-ninth-fresh-r4（`codex-ninth` / `gpt-5.6-sol` 新鲜会话；OS `--sandbox read-only`） | 仅 F-219~F-222 的当前修复与回归：超长帧丢弃、原对象校验、通知背压、未来同名异版 | changes-requested：无 P0/P1；新 P2 F-223（数组自有 toJSON/accessor 可在序列化时改变已校验帧）。静态审，未跑测试。 | E-062 | E-063 |

**F-223 返工后·新鲜独立复核**

| 复核者(谁·实例/会话) | 范围 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|
| codex-ninth-fresh-r5（`codex-ninth` / `gpt-5.6-sol` 新鲜会话；OS `--sandbox read-only`） | F-223 数组 JSON 预检修复及 notification/response 回归 | changes-requested：P1 F-223（预检→原对象序列化 TOCTOU，Proxy/自定义原型可改变输出）；P2 F-224（accessor/extra/Proxy/自定义原型覆盖缺口）。静态审，未跑测试。 | E-065 | E-066 |

**F-223/F-224 二次返工后·新鲜独立复核**

| 复核者(谁·实例/会话) | 范围 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|
| codex-ninth-fresh-r6（`codex-ninth` / `gpt-5.6-sol` 新鲜会话；OS `--sandbox read-only`） | descriptor-derived snapshot、Proxy/custom array prototype 与 F-224 回归 | changes-requested：P1 F-223（snapshot 数组继承 `Array.prototype.toJSON`）；P2 F-224（`length` 只读一次与 zero-frame/getter 覆盖缺口）。P3：F-057 为范围观察；静态审，未跑测试。 | E-068 | E-069 |

**F-223/F-224 三次返工后·新鲜独立复核**

| 复核者(谁·实例/会话) | 范围 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|
| codex-ninth-fresh-r7（`codex-ninth` / `gpt-5.6-sol` 新鲜会话；OS `--sandbox read-only`） | null-prototype descriptor snapshot、单读 array length、zero-frame/getter 回归 | approved：无 P0/P1/P2/P3；确认 response/notification 共用 snapshot，数组/对象原型隔离，Proxy/global `Array.prototype.toJSON` 不可改写线上帧。静态审，未跑测试。 | E-071 | E-072 |

**返工收敛**

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|---|---:|---|---|
| 第一轮返工 | 0（F-204/F-205 已修，待复核确认） | E-031：RPC 30/30、validator 34/34、npm 50/50、audit/fixture/capability/diff 闸全绿 | 待第二轮独立复核 |
| 第二轮返工 | 0（F-206 已修，待新鲜复核确认） | E-034：RPC 31/31、validator 34/34、npm 50/50、audit/fixture/capability/diff 闸全绿 | 待第三轮独立复核 |
| 第四轮后返工 | 0（F-211 驳回；F-212/F-213 已修，待新鲜复核确认） | E-050：RPC 35/35、npm 85/85、diff 检查通过 | 待新鲜独立复核 |
| 第四轮后增量复核 | 0 | E-052：新鲜实例 approved；定向 35/35、npm 85/85、validator/audit/fixture/capability 全绿 | 代码复核收敛；P3 F-214~F-217 待尾巴裁决 |
| F-218 后复核 | 2（F-219/F-220） | E-059：新鲜 OS 只读静态审发现 NDJSON 分帧与校验前净化两个 P1 | 未收敛；等待用户授权返工 |
| F-219~F-222 返工 | 0（待新鲜独立复核确认） | E-060 红测 5/5；E-061：RPC 39/39、npm 89/89、validator 34/34、audit/fixture/capability/diff 闸全绿 | 待新鲜独立复核 |
| F-219~F-222 复核 | 0 | E-063：新鲜 OS 只读复核未发现 P0/P1，但发现新增 P2 F-223 | 未收敛；等待 F-223 授权 |
| F-223 返工 | 0（待新鲜独立复核确认） | E-064：RPC 39/39、npm 89/89、validator 34/34、audit/fixture/capability/diff 闸全绿 | 待新鲜独立复核 |
| F-223 复核 | 1（F-223） | E-066：新鲜 OS 只读复核发现 snapshot TOCTOU P1 与 F-224 覆盖缺口 | 未收敛；等待用户授权 |
| F-223/F-224 返工 | 0（待新鲜独立复核确认） | E-067：RPC 40/40、npm 90/90、validator 34/34、audit/fixture/capability/diff 闸全绿 | 待新鲜独立复核 |
| F-223/F-224 二次复核 | 1（F-223） | E-069：新鲜 OS 只读复核发现 snapshot 数组原型的 P1 与 F-224 覆盖缺口 | 未收敛；已在授权范围内返工 |
| F-223/F-224 二次返工 | 0（待新鲜独立复核确认） | E-070：RPC 40/40、npm 90/90（首轮 detached-host 波动后单项与全量复跑通过）、validator 34/34、audit/fixture/capability/diff 闸全绿 | 待新鲜独立复核 |
| F-223/F-224 三次复核 | 0 | E-072：新鲜 OS 只读静态审 approved，无 P0/P1/P2/P3；E-070 机器闸通过 | 本轮实现与增量复核收敛；整卡仍须既定后续收口门禁 |

**需求复核结论**：`approved`（新鲜 Claude 只读会话；E-054；transcript `e8803839-da32-40ac-ab61-a90816c961ae.jsonl:132`）。无 P0/P1；条件 1/3/4 有逐项可复跑证据，范围合规。其 P2 F-218 已补真实 Store 的 state/events 前后逐字对照与重连同态回归（E-056），待新鲜复核确认；不得据此提前作人验签字。P3：能力基线独立性依赖 contracts 闸、异名不完整对象的既有码归宿宜另列 fixture、JSON-RPC 信封与 transport-invalid 的文字映射、as-built 仍待 E7。

**教训复核结论**：`approved`（主控只读复核；E-075）。正册 `knowledge/教训库.md` 不存在，`dh mine` 明示在册条目为 0，故无在册教训可重蹈；候选区 14 条不等同已入册规则。与本卡相关的候选-1（reason 分支断言）、候选-6（边界变异）、候选-11（同类覆盖）已逐项对照：F-057 双向 fixture + 同名异版回归钉住分支，F-219~F-224 均有反例/红测或零帧回归，frozen protocol 集合由全部冻结顶层 schema 动态形成。无 P0/P1/P2/P3；miner 另产出两条待裁决候选，未擅自升正册。

## TDD 结论

`部分符合，不能把整卡表述为全程 TDD`。E-016 已用临时还原让订阅生命周期回归确定性变红；E-060 对 F-219~F-222 的 5 个修复先建立了可复现红测。F-223/F-224 的历史账本只保留「复核发现 → 修复 → 全绿」链，没有独立的修复前红测记录；它们是有效回归而非可追溯的 test-first 证明。该缺口不改变本卡四条机器验收的通过结论，但 E8 不以“全程 TDD”作为放行证据。

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_52 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| Runtime handshake capability 比较 | `rpc/capabilities.mjs`、`rpc/server.mjs`、`relay.rpc.v1.schema.json`、`reason-codes.md`、`test/rpc.test.mjs` | 一致：schema 只守 hash 形态；capabilities 复算权威 8 份基线；server 严格值相等并以既有码拒绝；回归覆盖同值通过/异值拒绝。 | 无差异。 | E-076 |
| protocol mismatch / unsupported version | `tools/validate.mjs`、`reason-codes.md`、双向 negative fixtures、`test/rpc.test.mjs` | 一致：完整另一已冻结顶层对象才入 `E_PROTOCOL_MISMATCH`；同名未冻结未来版本仍为 `E_UNSUPPORTED_VERSION`；不完整/未知字段走既有具体码。 | 无差异；F-214 的注释精度留独立验收池。 | E-076 |
| subscribe notification 与 response 跨边界发送 | `rpc/server.mjs` 的 `encodeValidatedFrame`、`emitNotification`、`sendResponse` 与 socket 回归 | 一致：两类帧同走 descriptor-derived null-prototype snapshot → 冻结校验 → transport 发送；getter/Proxy/toJSON/extra key 全 fail-closed。 | 无差异。 | E-076 |
| 连接生命周期 / unsubscribe | `rpc/transport.mjs` 的连接级 handler seam、`rpc/server.mjs` 的 connection map、真实 socket 回归 | 一致：transport 回调携带所属连接；server 按连接建账、onClose 删除并清理，迟到 resolve 只走已关闭的即时清理；不触 Store/cancel。 | F-215 是定向覆盖粒度尾巴，已入验收池。 | E-076 |

**一致性复核结论**：`approved`（主控只读横向比对；E-076）。比对 4 个维度、13 处同类实现/契约/回归；未发现 P0/P1/P2，两个已知 P3 已按 E9 分流，不影响本卡完成条件。

## AI 提交区　⚠️ This is not human approval

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| 客户端断开不取消 Run | 真实本地 pipe/UDS 建连、subscribe 后客户端断开；间谍 Store 零调用、无 cancel，第二连接继续服务 | E-019、E-021、E-073 | 满足 |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | 两份 capability hash 不同但形态合法的握手被 Runtime 拒绝为 `E_CAPABILITY_MISMATCH`，不按交集降级；参考实现的指纹逐字匹配 `capability-baseline.json`。 | AI | E-017、E-019、E-021、E-073 | 是 |
| 2 | 客户端断开、进程退出或模拟 SSH 断链均不生成 cancel；Run 状态和事件账逐字不变，重新连接可从 Runtime 取得同一状态。 | AI | E-019、E-021、E-073 | 是 |
| 3 | `subscribe` 的 `event` 与 `runStateChanged` 推送为完整自描述协议对象；交叉 payload、缺 `protocol`、未知字段均拒绝。 | AI | E-019、E-021、E-073 | 是 |
| 4 | F-057 对「发错协议」是否需要 `E_PROTOCOL_MISMATCH` 有可复现事实、既有码边界与明确裁决；若需变更冻结契约，先停在决策点，不静默修改。 | AI + 主控裁决 | E-019、E-020、E-021、E-073；用户对话「新增」 | 是 |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态 | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| capability mismatch fail-closed | 实际 socket/pipe 双端握手测试 | machine | DHR52-M1 | 等价覆盖 | 不同合法 hash 必拒 E_CAPABILITY_MISMATCH | pass（E-019/E-021） | Node + Windows | capability-baseline.json | 远程网络不在范围 | relay.rpc/v1 | test runner | task card |
| 断连不取消 | 连接关闭前后 Store state/events byte 比对 | machine | DHR52-M2 | 等价覆盖 | 无 cancel 且重连同态 | pass（E-019/E-021） | Node + Windows | Store replay | SSH 真机另列 | relay.rpc/v1 | test runner | task card |
| 完整订阅帧 | schema + socket notification 正反例 | machine | DHR52-M3 | 等价覆盖 | 两正例完整、三反例拒绝 | pass（E-019/E-021） | Node + Windows | frozen schema | 新 notification 不在范围 | relay.rpc/v1 | test runner | task card |
| F-057 reason 边界 | 固定反例与 reason-code 对照 | machine | DHR52-D1 | 等价覆盖 | 裁决有可复跑证据 | pass（E-019/E-021） | Node + Windows | reason-codes.md | 仅完整、可识别的错位冻结对象入新码 | relay.rpc/v1 | main controller | task card |

**风险放行账表**

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|---|---|---|---|---|---|---|
| 无 | — | — | — | — | — | — |

## E10 放行证据包

`releasePacket: DHR_52-E10-v1`：机器证据为 E-073（90/90、34/34、audit 0、fixture 57、capability 8、diff check）；代码增量复核为 E-072 `approved`，需求/E5/E14 均 `approved`（E-054/E-075/E-076）；四项完成条件均为等价覆盖。H=0：无人判结果项、无 open 方向项、无风险接受项；P3 F-214~F-217 已按 E9 转入 `ACC-2026-08-23-01`，不以风险放行伪装为通过。E11 已获用户确认，但 E12 主干集成复验被 F-225（DHR_51 runtime 既有测试失败）阻断；修复并重跑后必须刷新本包，当前不可 verify。

→ 当前状态：**E12 集成复验阻塞，待授权修复 DHR_51 runtime 后重跑**

---

## 人类签名区

本卡无独立人判结果项；F-057 的开发裁决已在对话中完成。E10 已展示 H=0 放行包后，用户于 2026-08-23 在对话回复“认可”，确认对象为 `DHR_52-E10-v1` 的本地收口授权包：精确 squash、主干复验、`verify(dh-relay)`、DevPlan/workspace 回填与本任务 worktree/branch 清理；不含 push、部署、环境操作或下一卡。
