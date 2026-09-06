<!-- dh:v1 -->
# DHR-B-46 候选 — legacy event/v2 双读与 capability 正式说明同步

> 状态：**草案，未生效**。来源是 DHR_77 heavy Review Batch 的代码轮 2 / 一致性 / 教训复核；本文件只供 fresh B-adjust 审核与用户理解确认。未获用户对话确认前，不修改 DevPlan allowed paths、不改生产代码、不续做整改。

## 为什么必须调整

DHR_77 的正式验收 `HC-HR-A4` 要求“旧账本只显示 legacy 缺省”。当前候选把新写入合同收紧为 alive observation 必有 `host_ref`，但 `store.mjs:loadEvents` 用新 schema 逐条校验历史 `relay.event/v2`；升级前合法、缺字段的 alive event 会直接变成 `E_EVENT_LOG_CORRUPT`，到不了 read-model/CLI。另 `contracts/CANONICALIZATION.md` 仍要求 v1 使用旧固定 hash，与本卡已实现的 v1/v2 共用完整 baseline 相反。

## 最小 B-adjust

目标、非目标、六项验收、依赖、heavy 类型与 DHR_35 边界全部不变；只扩两处当前未授权语义，并闭合现有 CLI/测试/账本整改：

1. **Store 形状级历史兼容例外（待用户裁决）**：把 `relay-core/store/store.mjs` 的 DHR_77 限定从“只允许 `emitEvent` 复制字段”扩为再允许 `loadEvents` 识别一种精确形状：`protocol=relay.event/v2`、`kind=host_observation_changed`、`observation_status=alive`、对象自身缺少 `host_ref`，且补入仅用于校验的固定 sentinel `herdr-terminal/sha256-0000000000000000000000000000000000000000000000000000000000000000` 后其余字段完整通过现行 schema。实现只能验证浅拷贝，返回内存中的原事件且仍无自身 `host_ref`；不写回、不迁移、不猜测/合成真实 ref。`readEventLog` 与 `openStore` 继续共用同一入口。
2. **legacy 与尚无分流**：`relay-core/cli/render.mjs` 以字段是否存在区分：旧事件缺字段 → `legacy 未提供`；新事件显式 `host_ref:null`/缺可信绑定 → `尚无可信 terminal 标签`；非空 ref 仍按 alive/lost 标当前/历史。JSON/text 共用同一投影。
3. **正式 capability 说明同步**：新增允许路径 `relay-core/contracts/CANONICALIZATION.md`，只改“DHR_61 后的 v1/v2 双轨”段：v1 与 bootstrap/v2 均使用包含新 event digest 的完整 baseline；旧固定 v1 hash 只作为被拒的历史值，不再是本地兼容常量。算法与其它 digest 规则不动。
4. **测试与账本**：只用现有已授权的 `dhr77-host-ref.test.mjs` / `read-model-mirror.test.mjs` / `cli.test.mjs` / `contracts.test.mjs`（按最小落点选择）补下列闭集：`readEventLog` 与 `openStore` 都能 reopen 精确缺字段形状；原 `events.jsonl` 前后 SHA-256 不变；返回事件仍无自身 `host_ref`；alive + `host_ref:null` 仍拒；任一邻近必填字段损坏仍拒；新 writer 仍拒缺 ref 的 alive；CLI JSON/text 显示 `legacy 未提供`，而显式 null 仍显示“尚无可信 terminal 标签”。B-adjust 生效时同步 DevPlan allowed-path/Store 限定与 `brief.md` 只读副本。对 `progress.md` 只追加一条 superseded 纠错账，保留 `ec8ef32` 前后的原结论，不再改写历史行。

## D-B46-1 待用户裁决：兼容与完整性的不可区分取舍

现有事件没有协议小版本、升级切点或可信代际标记。因此两种记录在字节形状上不可区分：

- 真正升级前写下、当时合法的 alive v2 event，缺 `host_ref`；
- 升级后 otherwise-valid 的 alive v2 event 被人为删掉 `host_ref`。

选项 A（主控推荐）：接受上述**形状级兼容例外**。两者都只读打开并标 `legacy 未提供`；这是明确残余完整性风险，不能声称“只识别真实旧账”或“其它所有损坏仍 fail closed”。优点是用最小改动兑现现有 HC-HR-A4，不迁移、不造 ref。

选项 B：拒绝该例外，继续对所有缺字段 alive v2 fail closed。若仍要兼容真实旧账，须另起带可信代际切点/签名/迁移机制的设计调整；这会改变正式兼容机制与范围，不能在 B-46 内临场实现。

## 明确不做

- 不放宽新事件写入的 alive 必有 ref；不让 `emitEvent` 写 legacy 形状。
- 不回写/迁移旧 events.jsonl，不从 `detail`、pane、agent、路径或任何原值推导 ref。
- 不改 Result、Receipt、run_status、Attention、lease、fencing、Profile、fallback、RPC server 顺序或 capability 算法。
- 不修 DHR_76/DHR_34，不跑真实产品 Agent，不重开 DHR_35，不 verify/merge/push/deploy。

## 验收与退场

- 精确 legacy 旧账 reopen + CLI JSON/text 测试红→绿；事件文件前后 SHA-256 相同。
- 同文件加入近邻坏 schema 负例，证明兼容分支除“缺 `host_ref` 的 otherwise-valid alive v2”这个已接受例外外不是通用绕过；不得宣称能区分真实旧账与同形损坏账。
- capability baseline 自检、旧 v1 mismatch 零推送、DHR_77 定向组与根 relay suite 有终态；完整 npm 继续如实保留“未得终态”，不据此宣称全绿。
- 原 Review Batch findings 回原 reviewer 窄复核；P0/P1 清零后才继续有效单测变异与 E9/E10。

## 需用户理解的关键点

这里的“兼容”是**按形状只读接纳**：允许缺字段形状继续打开并标成 `legacy 未提供`，不是补造一个 host_ref，也不是把新写入合同放宽回去；但它无法区分真正旧账与升级后同形损坏账。

## Fresh 审核记录

- 初审：`/root/dhr77_b46_review`，派出 E-7732；P0=0/P1=1/P2=1/P3=0，结论 changes-requested。
- P1 采纳：不再把结构谓词描述为“真实旧账 only”，显式登记 D-B46-1 与选项 A 的残余完整性风险。
- P2 采纳：冻结 sentinel、浅拷贝/返回原事件语义、双入口/文件 hash/字段存在性/邻近坏字段/新 writer/JSON+text 的完整测试矩阵，并要求生效时同步 DevPlan 与 brief。
- 定向复审：同一 reviewer 基于 `8ce1400` 回查，P0～P3=0、`approved`；初审 P1/P2 均闭合。该批准只证明候选可供用户判断，不替代 D-B46-1 的理解与确认。
