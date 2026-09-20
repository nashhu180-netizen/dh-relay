# RLT_27 W1 builder evidence

## 结果

BLOCKED。初次核对的 PASS 已由 `plan-reviewer#1` 的独立 P1 finding 推翻；本节及下方 checkpoint 结论为当前有效结果。

## 预建七件套

以下七份预建工件均存在、为普通文件且非空；本棒仅检查，未重建或修改：

- `brief.md`：11 行，目标、范围、完成条件、Issue #52 与用户授权边界齐全。
- `task_plan.md`：9 行，W/C/R/F 顺序、角色写入者与禁止项明确。
- `execution_strategy.md`：5 行，fresh Codex、独立 monitor、前台等待与安全边界明确。
- `progress.md`：8 行，前置环境、224 测试自然退出 0 与独立方案审核事实已登记。
- `findings.md`：5 行，已知适用范围与不外推边界已登记。
- `lesson_candidates.md`：3 行，保留给后续 coder，当前状态明确。
- `review.md`：13 行，light 的 lesson/consistency、机器证待填项与人类签名边界明确。

## task_plan 与 W1 合同一致性

- `task_plan.md:4` 规定 builder 只写 `evidence/builder.md`、仅验证预建七件套，并要求独立 plan-reviewer PASS 后才能封口；与 `relay_plan.md:11,18-19` 的 W1 build 节点、builder 输出及 `close=agent:plan-reviewer` 一致。
- 派单明确追加本棒唯一完成信号 `evidence/done.W1.builder.md`；`relay_plan.md:28` 同时授权每个 worker 只额外写自身唯一的 `evidence/done.<stage>.<agent>.md`，因此两个允许写入目标闭合且无冲突。
- `relay_plan.md:19` 的 `on:review_ready:builder` 与本次专用 `config/SKILL.md` W 模板一致；当前 `tools/relay-light/relay_log.py` 也将 `on:review_ready:` 识别为合法触发，并要求当前 builder 实例以 `checkpoint ready_for_review=plan-reviewer` 保持非终态送审，支持 FAIL 后回同一 live builder 的合同。
- 使用计划中声明的绝对 plan-dir 与 config-dir 只读执行 lint；输出为 `lint: ok`，退出码为 `0`。执行时设置 `PYTHONDONTWRITEBYTECODE=1`，未生成 Python 字节码。
- W1 不授权生产代码、配置、计划、七件套其他文件、Git 或 relay ledger 写入；本棒未执行这些写入，也未启动终端、派活或等待 `node_closed`。

## checkpoint 核对

- 已读取 `review.plan.md` 与 `evidence/done.W1.plan-reviewer.md`；独立 reviewer 结论为 FAIL，包含 1 条 P1、0 条 P2。
- P1 成立：`task_plan.md:6` 把 R reviewer FAIL 写成回同一 live 送审/判定方 checkpoint，但 R1 只有 lesson、consistency、scribe；被审材料的 C1 coder 已不在 R 阶段，无法成为同一 live 送审方。
- 专用 `config/SKILL.md` 将复核后的修复定义为 X 阶段的新 coder 与被打回 reviewer；当前 `relay_plan.md:11-14` 只有 W1/C1/R1/F1，没有 X 节点，且 `relay_plan.md:28` 禁止 runtime plan amendments。因此当前合同没有可执行的 R FAIL 路径。
- `lint: ok` 只证明结构 lint 通过，不能消除上述内容合同矛盾。

## 本棒无法闭合的原因

本棒只获准修改 `evidence/builder.md` 与 `evidence/done.W1.builder.md`。闭合 P1 至少需要以下未获授权的计划/合同改动类别：

1. 修改七件套中的 `task_plan.md`，把 R 阶段 FAIL 处理改为与冻结协议一致的 X 节点级返工路径，不再声称回到不存在的同一 live C1 送审方。
2. 修改 `relay_plan.md` 的节点与 agent 拓扑，预建可执行的 X 返工节点、依赖、close、coder 与被打回 reviewer 路由；若选择运行时追加，则还需改变当前“禁止 runtime plan amendments”的计划约束并走获授权的计划修订流程。

上述目标均在本棒写入白名单之外；本棒未实施，也不能以修改 evidence 文案替代真实计划修复。W1 不得封口或进入 C1。

## 偏离与 findings

- P1：R FAIL 路径与冻结 X 阶段协议矛盾，且现有 relay plan 无可执行返工节点。
- 偏离：无越界修改；仅按 checkpoint 更新两份 builder 工件。
