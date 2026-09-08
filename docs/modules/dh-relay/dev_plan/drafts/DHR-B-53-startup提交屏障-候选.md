<!-- dh:v1 -->
<!-- dh:planning-no-event:v1 artifact="dev_plan/drafts/DHR-B-53-startup提交屏障-候选.md" reason="DHR-B-53 共创形成史；正式 planning event 只登记在 P6 DevPlan" -->
# DHR-B-53 候选 · DHR_82 启动指令提交屏障

> 状态：B-adjust 候选，尚未写入正式 DevPlan，不构成 D-start、生产代码、真实 Agent、verify、合并、push 或部署授权。

## 1. 触发事实与设计输入

- DHR_35 当前 Windows Codex 实录中，两次 startup dispatch 都记为 `accepted`，但 Agent 全程 `idle`、`state_change_seq` 不变，且无 checkpoint、launcher、wrapper 或 Result；末态为 `waiting_human/E_EXECUTOR_RESULT_MISSING`。
- 现役 `workflow-driver.mjs` 在 `herdr agent prompt` 返回 `ok` 后立即把私有发送记录写为 `accepted` 并启动 60 秒补发计时，没有证明该 prompt 已触发 Agent turn。
- 物理机制高置信但本次单跑不可直接证明：Windows 下文本可能留在 Codex composer，Enter 未被消费。修复不得把推断写成已证事实。
- 正式设计输入保持 `design/15` 的 HC-SD-A10/A11/A12/A15/A16/H4：只有“明确 accepted”才获得 60 秒有限补发资格；发送结果不明须停止自动补发；不改公开协议或 Store 事务；真实 task side effect 仍由 DHR_35 证明。无需 A-full。

## 2. 新卡

### DHR_82 · Herdr startup turn-start 提交屏障

- 档位：标准。
- 风险：组件接线，出口闸要求 `verify(dh-relay):`；本轮不授权 verify。
- `task_type`：heavy。原因是改动触及 DHR_78 已冻结的发送成功语义，虽代码量小，仍须防补发、恢复、lease 与身份边界退化。
- 难度：中；代码量虽小，但 fake seq、字段缺失和共享 adapter 三处容易形成假绿。施工模型按用户指定为 Herdr 中的 `gpt-5.6-luna`、reasoning=max。
- 依赖：DHR_78、DHR_81（均已完成）。卡序改为 `DHR_78 + DHR_81 → DHR_82 → DHR_35`；DHR_73 仍是旁支调查，不并入本卡。

## 3. 目标、范围与非目标

### 唯一目标

在现有 startup sender 的私有边界建立一个有界 turn-start 提交屏障：`agent prompt` 的裸 exit 0 只证明调用返回，不再直接证明 prompt 已触发 Agent turn。只有同一 `host_ref` 下可核的 `state_change_seq` 前进，才把私有记录写为 `accepted` 并启动既有 60 秒计时；否则保留发送次数已占用的保守状态，写恰一条 Attention，并禁止本 Attempt 的自动补发。

### 允许路径

- `relay-core/runtime/workflow-driver.mjs`
- `relay-core/runtime/executors/herdr/herdr-executor.mjs`
- `relay-core/test/dhr82-startup-submission-barrier.test.mjs`
- `relay-core/test/helpers/fake-herdr.mjs`（仅当新专项需要最小 seq 钩子）
- `relay-core/package.json`（仅把新专项追加到既有 test script，不改脚本结构或依赖）
- `docs/modules/dh-relay/workspace/DHR_82/**`
- 正式落盘时机械修改 `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md`

### 明确非目标

- 不改 `store/**`、`contracts/**`、RPC、read-model、公开 reason code、`startup-dispatch/v1` 字段或取值集合。
- 不读取或解析 composer；不使用 `agent prompt --wait`；不自动 `send-keys Enter`；不增加第三发、循环重试、跨恢复重发或产品专属 prompt。
- 不把屏障扩成通用聊天/keys 发送状态机，不改 checkpoint/Result/lease/fencing 算法。
- 不顺手改 DHR_35 runner 的末端错误可读性，不运行真实 Codex/Claude，不替代 DHR_35 的 A16/H4/P6-M1。

## 4. 最小实现约束

1. 发送前以最终身份观测取得 `host_ref + state_change_seq` 基线；发送次数仍须先持久占用，原有身份、指针摘要、stop/lease 检查顺序不变。
2. 屏障必须是 startup 专用函数，或只在 driver 的 startup 调用点组合：先让既有 `sendStartupInstruction` 逐字保持当前调用/返回语义，再消费其 `agent prompt` 返回的 Agent 记录，并仅在必要时做短、有界、异步的同一 Agent 再观测。`sendToHerdrAgent`、`sendStartupInstruction` 的现有公共形态和非 startup 调用方不得改变；屏障时间为代码常量，不开放配置面。实现必须区分 `state_change_seq` 字段缺失与字段存在但未前进；字段缺失一律按不可证处理，并在安全 detail 中明写。
3. 同一 `host_ref` 且 seq 严格前进时返回内部 `submitted`；driver 才写既有 `accepted` 并设置 `startupAcceptedAt`。
4. seq 未前进、字段缺失、观测失败/unknown 或提交状态不可证时返回内部 `ambiguous`；driver 不写新 Store outcome、不启动 60 秒计时，保留既有 `authorized`，写恰一条带固定新 detail 前缀的安全 Attention 后继续现有人工等待/Result 观测。该 Attention 只复用既有 `human_input_requested` kind，**不带新 reason**（现役已有无 reason 先例），差异只落安全 detail 前缀。这里有意让 `authorized` 同时覆盖“已占次但调用前中断”和“已调用但提交不可证”；恢复届继续沿用既有“可能未送达、检查现场并先停旧 Attempt”保守措辞，不新增 Store 状态。
5. host_ref 改变、明确 CLI 失败及 stop/lease 失败继续走既有失败/宿主丢失边界，不把它们降格成 ambiguous。
6. `fake-herdr` 的 seq 钩子必须可选，默认调用计数与既有用例行为逐字不变；DHR_82 专项以“seq 冻结/前进”为显式可控轴。施工账必须记录：fake 绿只证明判据实现，不证明真实 Herdr 稳定提供该字段。

## 5. 验收与批次

### 批次 0 · D-start 骨架

- 用户完成本 B-adjust 的理解与落盘确认后，主控把卡写入正式 P6 DevPlan，建立 `workspace/DHR_82` 七件套并提交计划骨架。
- 从届时最新 master 创建 `.dh-worktrees/DHR_82` / `wt/DHR_82`；worker 第一动作 rebase master，并核对 HEAD、merge-base、status、允许路径。

### 批次 1 · 红测与最小实现

- worker 动手前必须读 `test/helpers/fake-herdr.mjs:14-19,81-96`、`herdr-executor.mjs:164-199`、`workflow-driver.mjs:187-228,438-447,590-595` 与 `store/store.mjs:692-746`，并在 `progress.md` 记下 fake seq 的真实语义。
- 先红：prompt 返回 ok，但同 host 始终 `idle + seq=N`；断言不写 `accepted`、不启动补发、时间越过 60 秒后 `send_count` 仍为 1、按新 detail 前缀计数的屏障 Attention 恰一条。既有 `E_EXECUTOR_RESULT_MISSING` 等 Attention 不计入本断言且行为不变。
- 先红：post-send 观测失败/unknown，以及 ambiguous 后转 blocked，均不得成为 accepted 或触发补发。
- 先红：`state_change_seq` 字段缺失按不可证处理；ambiguous 后重启 driver 仍不发送，并只出现既有恢复届保守措辞。
- 先红：把 seq 比较变异为恒真时，静默未提交负例必须红。
- 修绿：同 host 的 seq 前进后写既有 `accepted`，既有首次发送和 60 秒最多一次补发语义保持。

### 批次 2 · 回归与施工收口

- DHR_82 专项自然终态全绿；DHR_78 startup dispatch、`herdr-adapter`、DHR_68/C、`dhr75-host-lease-during-herdr`、`dhr76-profile-validation-lease`、DHR_72 持续观测及 DHR_70 submission gate 各组自然终态不退化。
- 静态核对 Store schema/outcome、公开协议、composer、`--wait`、`send-keys`、第三发与 runner 文件均零越界；PowerShell/Node 相关语法检查、`git diff --check` 通过。
- worker 只提交 construction commit，写 `progress.md`/`findings.md` 和规定 Handoff 后停止；不自行复核、verify、合并、push、真实 Agent 或 DHR_35。

## 6. 诚实出口

- 本卡通过只证明 Relay 不再把“CLI exit 0、turn 未启动”误记为明确 accepted，并能安全抑制重复发送。
- 它不证明 Herdr/Codex 的物理 Enter 问题已修复。DHR_35 必须在本卡未来完成并进入新 committed SHA 后，另获授权重跑真实 Codex/Claude；没有 committed Result 与 task side effect 就仍未通过。
- 若真实 Herdr 不能稳定提供 `state_change_seq`，本卡会保守地长期落入 ambiguous、失去 A10 自动补发能力；这是不误重发优先于可用性的既定代价，须由 DHR_35 真实链暴露，不能被 fake 绿掩盖。
