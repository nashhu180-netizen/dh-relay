<!-- dh:v1 -->
# DHR_33 · Review

> 任务类型 heavy：代码两轮换人 + 五路复核（代码1/代码2/需求/教训/一致性）+ 有效单测（变异点由轮 2 实例选定）。
> 复核形态：claude 经 Herdr `pane run` 拉起、侦测型只读（提示词硬约束 + 回收后 git status 核对）；模型身份按候选-40 双证登记。

## 开工预审（brief/task_plan fresh 审核）

- 实例身份：claude fresh 实例，Herdr `pane run` 拉起（pane w1:pB，agent `rev-b33pre`，2026-08-29，`--model opus` 拉起；模型双证按候选-40 待补实例自报）。回收后 `git status` 仅新增 review-pre-opus.md，零越权。
- 结论：19 条（P1×6 / P2×8 / P3×5），原文 [review-pre-opus.md](review-pre-opus.md)。P1 全部命中主控裁决里的事实错误：event.v2 无 payload 且多余键被 emitEvent 静默丢弃、host-observation v0 装不下版本/能力 hash、inspectRun detail 不含事件、reason code 错用 ADAPTER_LOST（专属 pi）、profile 两套结构无桥、attach/send 漏排。另附 9 项「已核实无误」留档。
- 主会话裁决（2026-08-29）：**19 条全采纳**——P1-1/P1-2 取复核建议 (a)+(c)（executor_ref+detail 固定编码；版本/能力 hash 降级 progress 证据并记 Oracle 差异）；P1-3 focus 改走 subscribe；P1-4 码分界改 HOST_LOST/ORPHANED/KILLED + 包装层用进程内前缀；P1-5 立裁决 7（ref 逐字承载 profile_id + profile-registry.mjs 只读桥 + 查无即 pending）；P1-6 取「补」（裁决 8：sendToHerdrAgent/attachHerdrAgent）；P2/P3 逐条落实（含 P2-8 CANONICALIZATION 过时留档、P2-10 心跳幂等陷阱、P2-12 超阈值升级与 launch 盲区、P2-14 DSH 未运行取证）。brief/task_plan 已按裁决重写后再派工。

## 完成条件逐条挂证据（验收靶子）

| # | 命题（brief 完成条件） | 事实证明方式 | 最终裁决者 | 稳定 ID | 覆盖态 | 证据 | 结论 |
|---|---|---|---|---|---|---|---|
| 1 | H4/H9 · P6-M6 Linux SSH（**B-22① 延后**） | 延后登记：fixture 冻结 + 「待真实 smoke」备注，无冒充 | 机器+复核 | E-3301 | 延后 | | |
| 2 | H5 · P6-M3：blocked→持久 Attention；done 只进 awaiting_result；漏事件/重启/pane 消失/进程退出均有明确结果 | 机器证：herdr-adapter.test 断言 2/3/4/5 + 重放持久性 | 机器+复核 | E-3302 | 待 | | |
| 3 | H1 · P6-M5：DSH 不启动时 CLI 完成查询与附着 | 机器证：focus/status/inspect/events 测试 + 真实 smoke（DSH 关闭） | 机器+复核 | E-3303 | 待 | | |
| 4 | 快路+慢路对账；HostObservation 记版本/能力/pane 句柄；focus 不存任意拼接命令 | 机器证：observe/reconcile 测试 + renderFocus 逐字断言 + 代码复核 | 机器+复核 | E-3304 | 待 | | |
| 5 | work_dir_root 由 launch 决定并登记（DevPlan 承接备注） | 机器证：launch 必填断言 + 句柄字段逐字 | 机器 | E-3305 | 待 | | |
| 6 | 有效单测：轮 2 选点变异改坏必红 | 机器证：红→还原(sha256)→绿三段 | 机器 | E-3306 | 待 | | |

## 代码轮 1（fresh）

（待回填：实例身份双证 / 发现 / 裁决）

## 代码轮 2（换人 fresh，变异点选定者）

（待回填）

## 需求方向复核（fresh）

（待回填）

## 教训复核

（待回填）

## 一致性复核

（待回填）

## 人类签名区（待用户回归，AI 不得代勾）

- [ ] **E10 收口确认与 verify**：已查看证据，认可收口。
- [ ] **P6-M6 延后受理**：接受 Linux 项延后至阶段闸裁决（B-22① 汇合点）。
