<!-- dh:v1 -->
# findings — DHR_52

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|
| F-201 | P2 | F-057：用户已于 2026-08-22 对话明确裁决新增 `E_PROTOCOL_MISMATCH`。它仅表示「完整且可识别的另一已冻结协议对象被发送到错误的协议位置」；不覆盖缺字段、未知字段、版本不支持或本协议内普通坏值。 | 对话明示「新增」；E-019~E-021；DevPlan DHR_52 | reason code、双向负例/期望、校验器窄映射与 fixture 基线已更新；待独立复核 | resolved |
| F-202 | P2 | `dh dh-relay` 复现模块体检 42 项失败：design 输入结构与历史 DHR_03/DHR_29/DHR_49/DHR_51 为主；DHR_52 自身 review 模板项已在本卡补齐，仍须在 E1 确认本卡是否有残留。 | E-022 | 不在本卡顺手修 design 或其他历史卡；仅修复 DHR_52 自己的收口记录并在复跑中区分剩余范围 | open |
| F-203 | P2 | 先前的 OMP / Claude Opus 尝试未给出结论；用户随后重新授权新鲜 Codex 实例复核，已取得第一轮正式结论。 | E-023、E-026、E-027、E-028、E-029、E-030 | E-028 仅为当时暂停记录，后续复核以 E-029/E-030 为准；仍需处理 P1 并完成后续轮次 | open |
| F-204 | P1 | F-057 映射的错误优先级不完整：不完整或含未知字段的另一协议对象可能先落 `E_BAD_VALUE`，而不是保留 `E_MISSING_FIELD` / `E_UNKNOWN_FIELD`。 | E-030；E-031；`relay-core/tools/validate.mjs` | 已改为仅完整另一冻结 schema 验证通过时返回 `E_PROTOCOL_MISMATCH`，否则进入既有具体错误排序；补两条交叉不完整回归 | resolved，待第二轮独立复核确认 |
| F-205 | P1 | RPC 错误响应的 `error.data.detail` 未限长；大量未知字段可使其超过冻结 `relay.rpc/v1` 的 `maxLength:4096`，导致响应自身不可验证。 | E-030；E-031；`relay-core/rpc/server.mjs` | 已在发送前截断为 4096 字符；补 1000 个未知字段的真实 transport 回归并验证响应信封 | resolved，待第二轮独立复核确认 |
| F-206 | P1 | handler 返回函数、BigInt 或循环对象时，response 可能缺 `result` 或在 JSON 序列化时未捕获抛错，违反响应冻结信封并可击穿异步回调。 | E-033；`relay-core/rpc/server.mjs:164,178`；`relay-core/rpc/transport.mjs:110` | 已统一先 JSON-safe 序列化且过 `relay.rpc/v1` 校验，失败即断连；subscribe 先登记 unsubscribe；补函数/BigInt 与后续连接存活回归 | resolved，待第三轮独立复核确认 |
| F-207 | P1 | subscribe fulfillment 的 getter 异常可形成未处理 rejection。 | E-036、E-037 | `.then` 后追加 fail-closed catch | resolved，待新鲜复核确认 |
| F-208 | P2 | `npm test` 漏 RPC 测试。 | E-036、E-037 | test script 已纳入 rpc.test.mjs | resolved，待新鲜复核确认 |
| F-209 | P2 | 非法 UTF-8 被替换后仍可能解析。 | E-036、E-037 | fatal UTF-8 解码并映射 transport invalid | resolved，待新鲜复核确认 |
| F-210 | P2 | 关闭后遗留 sink 假称发送成功。 | E-036、E-037 | emit 前检查连接集合，关闭后返回 false | resolved，待新鲜复核确认 |
| F-211 | P2 | 新鲜 Claude 复核建议把不完整或含未知字段的交叉对象重新归 `E_BAD_VALUE`；此建议与 F-204 的已验收边界相反。 | E-049；`rpc.test.mjs:668-680`；`reason-codes.md:13` | 主控独立复验后驳回：完整另一冻结对象才入 `E_PROTOCOL_MISMATCH`，其余保留实际最具体的既有码。 | rejected |
| F-212 | P3 | 异步 handler reject 与连接关闭后 subscribe 迟到 resolve 缺少真实 socket 回归。 | E-049 | 已补两条 transport 回归：reject 仅断当前连接且后续可服务；迟到 resolve 的 unsubscribe 恰一次。 | resolved，待新鲜复核确认 |
| F-213 | P3 | brief 与实际 F-208 标准 test 门面接线的 `package.json` 触及范围矛盾。 | E-049 | brief/execution_strategy 已收紧为仅允许纳入 `test/rpc.test.mjs`，其余 package 改动仍禁。 | resolved，待新鲜复核确认 |
| F-214 | P3 | F-057 的校验器注释仍称所有判别字段优先；实际不完整异名对象已按最具体既有码排序，契约文本未明确这条归宿。 | E-052；E-076；`validate.mjs:168-170`；`reason-codes.md:13` | E9 裁决：入验收池 `ACC-2026-08-23-01`，独立补卡收敛注释/码表叙述；本卡不顺手改。 | routed-to-acceptance |
| F-215 | P3 | 迟到 subscribe resolve 回归在当前调度下走挂账→onClose 正常路径，未直接覆盖 `server.mjs` 的已关闭即时清理分支。 | E-052；E-076；`rpc.test.mjs:904-924` | E9 裁决：入验收池 `ACC-2026-08-23-01`，独立补卡直测已关闭即时清理分支；本卡不顺手改。 | routed-to-acceptance |
| F-216 | P3 | 三处 connect 后未等服务端 accept 即写入，与文件内 Windows named-pipe 顺序约定不一致，暂未复现 flake。 | E-052；E-076；`rpc.test.mjs:699,888,913` | E9 裁决：入验收池 `ACC-2026-08-23-01`，独立补卡统一 accept 同步；本卡不顺手改。 | routed-to-acceptance |
| F-217 | P3 | `reason-codes.md`/`OPEN-POINTS.md` 的 reason-code 总数与实际 grep/表行数不一致；本次新增码使旧计数继续漂移。 | E-052；E-076 | E9 裁决：入验收池 `ACC-2026-08-23-01`，独立补卡修正 `OPEN-POINTS.md` 的旧计数；本卡不顺手改。 | routed-to-acceptance |
| F-218 | P2 | 完成条件 2 与 task plan 要求以真实 Store 支撑 handler，对比断连前后 state/events signature；原有回归只证明 RPC 层零触碰、unsubscribe 恰一次与重连可服务。 | E-054；需求复核 transcript `e8803839-da32-40ac-ab61-a90816c961ae.jsonl:132`；原 `rpc.test.mjs:484-519` | 已补真实 Store 的 `state.json`/`events.jsonl` 前后逐字对照与重连 `inspectRun` 同态回归；待新鲜复核确认。 | resolved，待新鲜复核确认 |
| F-219 | P1 | 超过 `maxFrameBytes` 且尚无换行的 NDJSON 帧会立即清空缓冲；同一坏帧若按 chunk 分割，其合法 JSON 尾部可在后续被解析为独立请求，导致分帧语义依赖 chunk 边界。 | E-059；E-060；`relay-core/rpc/transport.mjs` | 已进入 discard-until-LF 状态；新增分块尾部不得执行回归。 | resolved，待新鲜独立复核确认 |
| F-220 | P1 | `sendResponse` / `emitNotification` 在冻结 schema 校验前先 `JSON.stringify`；`undefined`/函数等字段可被静默删除，导致本应拒绝的未知字段被净化为合法帧，且不再是原样发送。 | E-059；E-060；`relay-core/rpc/server.mjs` | 已在原对象预检后再做冻结校验与编码；新增 unknown/undefined/toJSON/nested undefined 回归。 | resolved，待新鲜独立复核确认 |
| F-221 | P2 | 推送路径忽略 `socket.write()` 的背压结果；慢客户端持续不读时，Node 写缓冲可能无界累积，而 sink 仍报告成功。 | E-059；E-060；`relay-core/rpc/transport.mjs` | 已传播 write 返回值；通知写入背压即断开连接并返回 false，新增回归。 | resolved，待新鲜独立复核确认 |
| F-222 | P2 | `isFrozenProtocolMismatch` 仅比较完整对象的 protocol 是否不同；未来若注册同名新版本，完整对象可能被误归 `E_PROTOCOL_MISMATCH`，而契约要求同名异版为 `E_UNSUPPORTED_VERSION`。 | E-059；E-060；`relay-core/tools/validate.mjs` | 已记录启动时冻结协议集合；未冻结的同名新版本优先归 `E_UNSUPPORTED_VERSION`，新增 v3 回归。 | resolved，待新鲜独立复核确认 |
| F-223 | P1 | 原对象预检后仍对原对象 `JSON.stringify`；Proxy 可在两次观察间隐藏/暴露自有键或 accessor，自定义数组原型也可提供 `toJSON`，使线上的 notification/response 与 AJV 已验对象不同。后续 snapshot 数组若仍继承 `Array.prototype.toJSON`，也会重开该窗口。 | E-063；E-066；E-069；E-070；E-072；`relay-core/rpc/server.mjs` | descriptor-derived snapshot 的对象与数组均隔离原型，schema 校验与传输均只使用 snapshot；数组 `length` 只读取一次 descriptor。 | resolved，r7 新鲜独立复核 approved |
| F-224 | P2 | F-223 回归仅覆盖数组 own `toJSON` data property，未覆盖 accessor、任意额外键、Proxy 或自定义数组原型，不能证明完整防线。 | E-066；E-069；E-070；E-072；`relay-core/test/rpc.test.mjs` | 已覆盖 Proxy 隐藏 `toJSON`、变长 `length`、自定义与全局数组原型 `toJSON`、accessor、extra property；无效载荷断言零帧且 getter 不执行。 | resolved，r7 新鲜独立复核 approved |

> 级别：P0 阻塞发布 / 数据丢失 / 安全 · P1 阻塞任务目标 · P2 质量 / 证据缺口 · P3 后续不阻塞
