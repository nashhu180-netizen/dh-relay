<!-- dh:v1 -->
# DHR-B-46 · DHR_77 legacy 账本兼容例外 B-adjust 交叉审核记录

> 状态：fresh-context 初审问题已全采纳并定向复审 approved；用户明文选择方案 A 并授权执行。B-46 只扩精确的 Store 形状级只读兼容、CLI legacy 标签、capability 正式说明与指定测试/纠错账，不改变 DHR_77 目标、验收、依赖或 DHR_35 边界。

<a id="review-b46"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-46 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=review -->
## 1. fresh-context 独立审核

- 审核实例：`/root/dhr77_b46_review`；fresh context、未参与候选起草，基于任务树 `14790a4` 初审与 `8ce1400` 定向复审。运行环境具写能力，故登记为 instruction-only read-only + 前后 Git 基线侦测，不声称机器强制只读。
- 初审：P0=0、P1=1、P2=1、P3=0，`changes-requested`。P1 指出现存账无协议小版本、可信切点或代际标记，真正旧账与升级后同形损坏账不可区分；P2 要求冻结 sentinel、浅拷贝验证/返回原事件语义与闭集测试。
- 主控两项全采纳：新增 D-B46-1 A/B 取舍；方案 A 明示为“形状级历史兼容例外”，完整性残余不隐藏。固定 sentinel 为 `herdr-terminal/sha256-` 加 64 个 `0`，只用于浅拷贝 schema 验证；返回原事件且不写回。
- 定向复审：基于 `8ce1400`，P0/P1/P2/P3=0，`approved`。确认范围精确；完整 npm 仍为“未得终态”。

## 2. 方案与范围

1. `store.mjs:loadEvents` 只对 otherwise-valid、alive、缺自身 `host_ref` 的 event/v2 采用形状级兼容；浅拷贝补固定 sentinel 仅供校验，内存返回原事件，不迁移、不写回、不造 ref。alive + `host_ref:null` 与邻近字段损坏仍拒。
2. CLI 以字段是否存在区分 `legacy 未提供` 与新事件“尚无可信 terminal 标签”；非空 ref 的当前/历史语义不变。
3. 新增精确路径 `relay-core/contracts/CANONICALIZATION.md`，只把 v1/v2 capability 说明同步为共用完整 baseline；旧固定 v1 hash 仅是被拒历史值。
4. 测试证明双入口 reopen、原文件 hash 不变、返回对象无字段、新 writer 仍严、近邻损坏仍拒与 JSON/text 标签分流；纠错账只 append superseded。

<a id="understanding-b46"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-46 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=understanding -->
## 3. 用户理解、确认与权限

- 主控向用户说明：方案 A 会把真正旧账与升级后被删字段的同形损坏账都按 legacy 只读打开；现有数据无法区分二者。方案 B 则继续 fail closed，并需另起可信代际/迁移设计。
- 用户明文回复：“那就方案A，执行的话，右侧 herdr 重新调用 Luna max”。据此确认 D-B46-1=A、接受上述形状级完整性残余，并授权本 B-adjust 落盘及在原 DHR_77 construction/remediation Node 续做。
- 执行形态：右侧 Herdr 新启动 Codex `gpt-5.6-luna`、reasoning `max`；前一 OpenCode worker 已 durable 收口，不复用为本批施工者。
- 不授权：DHR_76/DHR_34 修复、完整 npm 债务扩围、真实产品 Agent、DHR_35、verify、任务合并、push、deploy 或环境操作。
