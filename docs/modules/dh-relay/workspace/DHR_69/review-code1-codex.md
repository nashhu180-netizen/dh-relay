<!-- dh:v1 -->
# DHR_69 · 代码复核轮 1 原文

- 复核者：`dhr69rev1`（Herdr pane `w1:p46` · codex `--sandbox read-only` · gpt-5.6-terra high · fresh，未参与施工）
- 派出：e:E-6904
- 基线：派出时 HEAD `5019cb7`；生产 diff `3b147d7..140f21f`
- 回收后：`git status --short` 仅主控自己的 `review-brief-batch.md` 未跟踪，复核者零写入

## 结论：FAIL

## 逐条验收判定

- A：静态满足；派生 blocked 会保留 handle、扣住提交指令，并写入三项观测。
- B：静态满足；派生 blocked 不会进入 done || idle 的 Result-missing 分支。
- C：静态满足；recovery 在发送前先观测，blocked 时置 instructionPending，恢复后沿既有逻辑补发。
- D：静态满足；仅 idle 调用 paneGet，detail 追加 agent_get 与 pane_get。
- E：静态满足；E-1 脚本仅创建普通 shell pane，未启动产品 Agent；E-2 对齐了记录形态。
- F：不满足；信号曾进入 unknown / 观测丢失时，没有清除冲突持续计时，可能把不连续的 idle∧blocked 错当作超过阈值的持续冲突。

## 发现

| ID | 级别 | 文件:行 | 问题 | 为什么是问题 | 建议 |
|---|---|---|---|---|---|
| F-69-R1-01 | P1 | workflow-driver.mjs:333 | 进入 `!observed.ok \|\| herdr_status === 'unknown'` 分支时未重置 `mismatchAt` / `mismatchEscalated` | unknown 已不满足 idle∧blocked，但后续重新观测到该组合时仍沿用旧起点，可能立即升级 Attention，违反 F 的「持续超过 T」及离开 mismatch 后清计时 | 在观测失败或派生 unknown 的分支中清除两计时器，并补「blocked → unknown → blocked」负例 |

## 越界检查

- 改动文件是否全在允许路径：是
- 是否改了 Result 语义 / 新增 reason code / 启动了真实 Agent：否

## 我实际跑了什么

- 审阅 `3b147d7..140f21f` 的完整 diff、允许路径、workspace 合同与 E-1 证据；`git diff --check` 通过。
- 确认 `140f21f..5019cb7` 没有 `relay-core/` 改动。
- `node --test --test-concurrency=1 test/dhr69-false-ready.test.mjs`：4 个无临时目录依赖的用例通过；4 个 driver 用例被只读沙盒阻止于 `mkdtemp`（EPERM），因此未获得其运行时通过证据。
