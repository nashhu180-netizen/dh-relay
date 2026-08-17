# P3 可配置终端后端与 Herdr 底座：冻结说明

<!-- dh:plan-type: 冻结历史 -->
<!-- dh:status
汇报: P3 已于 2026-08-18 冻结废弃；Herdr 实施由 P6 接管
现状: 原 DHR_22~24 均停止生效，未开工
进行到: frozen-superseded
下一步: 只读历史；现役 Herdr 计划见 P6
看什么: design/05、design/evidence/06、P6-Herdr多账号执行底座
阻塞: 本计划禁止新增开工
-->

> 冻结日期：2026-08-18
>
> 冻结前文件 blob：`60e55238e92eecc803b633d7e38ddc266a30ab7b`。完整旧计划保留在 Git 历史中。

## 1. 冻结原因

原 P3 建立在 PowerShell Core、psmux 默认后端和 Herdr 平行候选的前提上。现役目标已经调整为：

```text
DSH 工作台
  + 独立 Relay Runtime
  + Herdr 首选交互宿主
  + 多账号 Executor Profile
```

继续执行原三卡会先为旧 PowerShell Host 抽象 psmux 选择缝，再接 Herdr，随后还需在新 Runtime 中重做一次。该路径不再具有成本优势。

## 2. 保留的成果

以下研究结论继续有效：

- Herdr 提供 `working / blocked / done / idle / unknown` 等 Agent 观测状态。
- Herdr 适合 Windows 与 Linux 的交互式 Agent 承载。
- Herdr 状态属于宿主观测，不能直接代表 Relay 节点或 DevHarness 任务成功。
- 启动信任弹窗、漏事件、进程退出和版本漂移需要对账与补偿。
- psmux 可以保留为迁移期 legacy 回退。

相关实测继续从 design/03 和 evidence/03 读取。

## 3. 责任迁移

Herdr 实施统一进入：

[P6-Herdr多账号执行底座](./P6-Herdr多账号执行底座-开发方案.md)

P6 重新承接：

```text
Executor Profile Registry
codex / codex-ninth
claude / claude-grok / claude5
Herdr Adapter
能力探测
身份与配置指纹
quota/fallback
真实长时间施工
DSH 状态展示与 pane 聚焦
```

## 4. 历史 ID

原 `DHR_22~DHR_24` 保留历史身份，不复用。新 DSH 阶段主线从 `DHR_25` 开始。

## 5. 不允许的使用方式

- 不得按旧计划单独启动 DHR_22、DHR_23 或 DHR_24。
- 不得为新 Runtime 先实现 psmux 默认后端，再把 Herdr 当可选扩展。
- 不得把 prompt 中的只读承诺当成 Profile 机器能力。
- 不得用 Herdr `done` 绕过结构化 Result 和 DevHarness Gate。
