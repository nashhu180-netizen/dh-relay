<!-- dh:v1 -->
# DHR_32 · Review

> 任务类型 normal：代码轮 1 + 需求方向复核 + 教训复核 + 有效单测；轮 2 未被用户点名、不做。
> 复核形态：claude opus 经 Herdr 拉起，**侦测型只读**（提示词硬约束 + 主控回收后 `git status` 核对零改动；非机器只读，如实登记）。

## B-22 预审（B-调整 fresh 审核，opus）

- 审对象：DevPlan P6 §0.2 `DHR-B-22` 三条调整 + 本工作区 brief.md / task_plan.md。
- 复核实例身份：claude opus fresh 实例，Herdr `pane run` 拉起（pane w1:p7，agent `rev-b22`，2026-08-29），与调整③冻结形态一致；回收后 `git status` 核对仅新增 `review-b22-opus.md` 一文件，零越权。
- 结论：共 23 条（P1×8 / P2×11 / P3×4），原文见 [review-b22-opus.md](review-b22-opus.md)。核心：npm test 显式清单不会拾取新测、§4.3 与调整①冲突、禁改边界指错 `tools/` 位置、凭据正则漏 `sk-ant-`/base64、扫描范围漏注册表本体、shim 全文引用是泄露口、验收①与字段闭集互斥（P1-8）。
- 主会话裁决（2026-08-29，主控独立复算 P1 关键事实后裁决）：
  - **P1×8 全采纳**：P1-1 取方案 (a)（allowed-paths 增列 `package.json` 仅 `scripts.test` 追加一个 token）；P1-8 取方案 (a)（解析做成校验器行为 `E_UNRESOLVED_CONFIG`/`E_UNRESOLVED_ALIAS`，不扩字段闭集，已回写 DevPlan §2.3）；其余按建议落实。
  - **P2×11 全采纳**：P2-7 落位定为 `relay-core/profiles/`（与 contracts 平级），DevPlan 三处已改。
  - **P3-1① 驳回**：复核者自称「非 Herdr 拉起」有误——`herdr agent get rev-b22` 证实其运行于 Herdr pane w1:p7，形态与调整③一致，无需补登记差异；P3-1②（复核形态迁移路径）采纳记 findings。P3-2/3/4 采纳。
  - 全部采纳项已回写 DevPlan / brief.md / task_plan.md（同批提交）。

## 完成条件逐条挂证据（验收靶子）

| # | 命题（brief 完成条件） | 事实证明方式 | 最终裁决者 | 稳定 ID | 覆盖态 | 证据 | 结论 |
|---|---|---|---|---|---|---|---|
| 1 | B4·P6-M2：注册表条目解析到真实 cli/config_dir；每个启用 Profile 有可重复身份探测或明确标不可证 | 机器证：golden-registry 条目 ↔ evidence 审计命令输出逐条对得上 | 机器+复核 | E-3201 | 待 | | |
| 2 | §7.1：注册表只含 §2.3 允许字段；凭据零出现（扫描+白名单双证） | 机器证：schema `additionalProperties:false` + negative fixture + rg 扫描输出 | 机器+复核 | E-3202 | 待 | | |
| 3 | 宪章#6：审计工件零凭据、白名单脱敏 | 机器证：progress 里的扫描记录 + 复核抽查 | 机器+复核 | E-3203 | 待 | | |
| 4 | B15⑤：capabilities 逐项对应真实 CLI 开关，不支持者标不支持 | 机器证：evidence 能力位表每格挂命令依据或「不可证」 | 机器+复核 | E-3204 | 待 | | |
| 5 | 有效单测：E_CREDENTIAL_FIELD 变异点改坏必红 | 机器证：progress 里红→还原→绿三段输出 | 机器 | E-3205 | 待 | | |

## 代码轮 1（opus·fresh）

（待回填：实例身份 / 范围 / 发现 / 收敛）

## 需求方向复核（opus·fresh）

（待回填）

## 教训复核

（待回填）

## 人类签名区（待用户回归，AI 不得代勾）

- [ ] **追认 `DHR-B-22` 代决策**：①Linux 项延后 ②审计读取范围与脱敏白名单 ③派发形态。做什么：读 DevPlan P6 §0.2 B-22 + 本卡 evidence 任一份，判断范围与脱敏是否可接受。通过标准：对话内明文/点选认可。
- [ ] **E10 收口确认与 verify**：已查看证据，认可收口（注：squash 合入已按 2026-08-29 委托先行执行，用户如不认可可指令回滚）。
