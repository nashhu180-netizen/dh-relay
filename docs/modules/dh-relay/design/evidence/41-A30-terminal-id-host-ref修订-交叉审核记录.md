<!-- dh:v1 -->
# DHR-A-30 · `terminal_id` → `host_ref` 修订交叉审核记录

> 正式对象：[`design/14`](../14-Herdr-host-ref正式冻结与DSH-off可验证展示.md)（候选形成史：[`design/drafts/DHR-A-30-terminal-id-host-ref修订-候选.md`](../drafts/DHR-A-30-terminal-id-host-ref修订-候选.md)）。本文记录 A-full 候选审核、主控裁决、理解对齐与整版确认；不授权 B-adjust、任务卡或代码。

<a id="review-a30"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-30 artifact=design/14-Herdr-host-ref正式冻结与DSH-off可验证展示.md kind=review -->

## 1. 修订起因

`DHR-A-29` 的后续 B-adjust 只读审核发现：正式 `design/14` 要求 `host_ref` 标识 Herdr“会话”，却没有可信身份字段和精确派生规则；现役 adapter 实际只有 `agent_name`、`pane_id`、`terminal_id`。继续 B-adjust 会迫使施工者发明 `session_instance_id` 或错误摘要 pane/agent。

主控反查本机 Herdr stable `0.8.2` bundled schema 与官方 Socket API 后确认：

- Herdr 公开必填 string `terminal_id`；没有 `session_instance_id`。
- 可选 `agent_session` 是原生 Agent 对话引用，不是 terminal instance identity。
- 官方 restore 合同没有保证 Herdr 冷重启后 terminal identity 必然不变。

用户选择以现有 Herdr `terminal_id` 为来源，故回到 A-full 起草本修订，不继续拆卡。

## 2. fresh-context 初审

审核实例：`/root/a30_fresh_review`。fresh、只读、未参与起草；核对候选、正式 `design/14`、现役 adapter/driver/event/v0/CLI/capability、`dh-core`、本机 Herdr schema 与官方文档；未写文件、未触碰 DHR_35。

结论：P0=0，P1=4。

| # | 发现 | 主控裁决与调整 |
|---|---|---|
| R1 | 禁止持久原始 ID，却要求跨重启识别不同 ID 的 SHA-256 碰撞，不可实现。 | 采纳。使用完整 SHA-256；不建原 ID 映射、不承诺碰撞检测，登记为可忽略残余风险；若有碰撞证据则 fail closed 并另起协议版本。 |
| R2 | 现役 CLI `detail` 含 `work_dir_root`，与人验“未见路径”冲突。 | 采纳。DSH-off 安全投影必须省略 `detail`；受控诊断面若保留，须另名且不进入人验证据。 |
| R3 | 现役 writer 只在状态变化时落 alive，会漏掉 `working→working` 但 terminal replacement。 | 采纳。事件触发式新增 `host_ref` 变化；按 Attempt 保留最后成功 ref，补相同状态 replacement 变异。 |
| R4 | 没有冻结非观测事件禁入 `host_ref`。 | 采纳。`kind != host_observation_changed` 时字段必须缺省/null，Result/Attention/checkpoint/lease/client 事件补负例。 |

用户理解风险同步收敛：全文改称“脱敏关联标签”，明示 SHA-256 不是认证/保密，拥有候选集合的本机主体仍可字典比对。

## 3. 调整后 fresh 定向复核

审核实例：`/root/a30_adjust_review`。fresh、只读、未参与起草；先定向核对 §2 四项修订，再检查全稿与现役 RPC/CLI/driver。

首轮结论：§2 四项已闭合，但仍有 P1=2：

| # | 发现 | 主控裁决与调整 |
|---|---|---|
| R5 | Herdr schema 只保证 `terminal_id` 是 string，候选的“非法”没有谓词，writer/fixture 会各自猜 trim、空白、Unicode。 | 采纳。冻结为 `typeof === "string" && length > 0`；不 trim/normalize/case-fold，原值逐字 UTF-8；缺失、错类型、空串 fail closed，并加空白/Unicode golden vectors。 |
| R6 | 现役 RPC v1 使用与完整 baseline 脱钩的旧固定 hash，却可订阅 `relay.event/v2`；只更新 v2 baseline 不会拒绝旧 v1 client。 | 采纳。保留 v1/subscribe，但 v1 与 bootstrap/v2 均校验含新 event 的完整新 hash；旧固定 v1 hash 在任何分派/订阅前返回 `E_CAPABILITY_MISMATCH` 且零推送，刷新后的 v1 继续原信封/方法。 |

同一审核实例随后只读复核 R5/R6 的调整，结论：P0=0、P1=0，通过。审核确认：谓词与字节语义可直接实现；现役 RPC server 已在 handler/subscribe 前做 capability 比对，v1 切换为完整 baseline hash 即能实现旧 hash 零推送，不需旁路。

## 4. 主控整体验收

- 身份对象：terminal instance，不再混称 Herdr session 或 Agent conversation。
- 唯一来源与算法：Herdr `terminal_id` + 固定域分隔完整 SHA-256；无 `pane_id` fallback。
- 稳定边界：只比较 Herdr 实际返回 ID；冷重启无额外保证。
- 事件账：alive/lost/首次失败/recover/replacement/历史不回写均已冻结；非观测事件禁入。
- 兼容闭环：event/v0/descriptor/hash/writer/recovery/read-model/CLI/新旧 client 与 ledger 必须由单张 heavy 卡原子承接。
- 人验边界：安全投影无 `detail`/原始 ID/路径；不消费为 DHR_35 真实闭环证据。
- Harness：新验收 ID 使用 `HC-HR-A1..A5/H1`，当前 `dh-core` 可识别；旧 `HR-*` 只作退役形成史，不伪造已收集证据。
- 权限边界：正式设计、README、DevPlan、代码、现役卡状态、verify、合并与推送均未改。

候选可以进入用户理解对齐与整版确认。

<a id="understanding-a30"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-30 artifact=design/14-Herdr-host-ref正式冻结与DSH-off可验证展示.md kind=understanding -->
## 5. 用户理解对齐与整版确认

理解问题：如果 Herdr 冷重启后返回了新的 `terminal_id`，即使恢复的是同一个 Codex/Claude 对话，Relay 是否也应显示新的 `host_ref`，而不是试图用 `agent_session` 把它维持成旧标签？

用户于 2026-09-06 明文回复“确认”，同时确认上述理解命题与 A-30 整版设计。该确认只授权：将候选原子晋升到既有正式路径 `design/14`、同步 `design/README.md` 导航并落本审核记录；不授权 B-adjust、DevPlan/任务卡、代码、真实 Agent、凭据读取/写入、DHR_35 复跑、verify、合并、推送或部署。
