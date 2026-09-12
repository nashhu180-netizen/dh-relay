# RLT_05 Batch 2 小审 — Sol

- 派出：E-037、E-038
- reviewer：`rlt05-b2-check-sol` / `rlt05-b2-check2-sol`，Codex gpt-5.6-sol，fresh，非施工者
- 范围：Batch 2 完整只读 status 投影；不含 Batch 3/4 或 heavy 最终复核
- 结论：`CHANGES_REQUIRED`
- 计数：P0=0，P1=1，P2=0，open=1

## 环境说明

E-037 的只读 reviewer 在任何实际文件读取或测试启动前被 `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` 拒绝，除 `pwd` 外全部 `NOT_RUN`，因此不构成有效实现复核。E-038 使用两份 Python SHA-256 与源 worktree 一致的一次性快照重派；其 shell 仍受同一环境问题影响，动态项保持 `NOT_RUN`，但通过可用的只读搜索定位到下述 schema 缺口。主控随后在源 worktree 直接复算合同与实现，确认该缺口是实际实现问题，不只是证据不足。

## Findings

| ID | 级别 | 位置 | 事实与违反 | 影响 | 最小闭合 |
|---|---|---|---|---|---|
| F-B2-LAST-RESULT-SCHEMA | P1 | `tools/relay-light/relay_log.py:1271-1292`；`tools/relay-light/test_relay_log.py:2153-2162`；design §3.5 `last_stage_result` 表 | `_result_document()` 固定返回 `{stage_id,outcome,note,amend,nodes}`，`status_document()` 同时把它用于顶层 `last_stage_result` 与 `stages[].result`；测试还明确要求顶层为同一五键集合。正式合同只给顶层 `{stage_id,outcome,note}`，五键仅属于 `stages[].result`。 | 有当前阶段结果时公开 JSON schema 多出 `amend`、`nodes`，A62 精确键合同失配；现有绿测把错误行为锁成 oracle。 | 先把顶层正向 fixture 改为精确三键并捕获当前实现的有效行为红；再拆分顶层与 stage-result serializer，保持 `stages[].result` 五键；focused/full/真实 CLI 复跑。 |

## 已核对项

- 主控独立动态复跑：focused `12/12`、全文件 `84/84`、`git diff --check` PASS、无 pycache；这些证明当前实现自洽，但不能覆盖错误 oracle。
- Batch 2 其余靶子本轮未形成新的 P0/P1；E-037/E-038 reviewer 动态命令均为 `NOT_RUN`，未冒充 fresh green。
- 边界：PASS。未进入 Batch 3/4，未改 TOML，未新增 CLI，未做 heavy review。

## Verdict

`CHANGES_REQUIRED`。仅闭合 `F-B2-LAST-RESULT-SCHEMA` 后做定向复审；Batch 3 继续锁定。

## 定向复审 R1（E-047 / E-048）

- reviewer：`rlt05-b2-check2-sol`，同一独立 reviewer，在刷新后的 hash-matched 隔离快照复审
- 结论：`PASS`
- 原 finding：`F-B2-LAST-RESULT-SCHEMA` → resolved
- 新增：P0=0，P1=0；open=0
- 静态核对：`_last_result_document()` 只返回顶层三键并仅用于 `last_stage_result`；`_result_document()` 保持阶段结果五键；amended/plain 两个非空 fixture 分别精确断言两层 key set
- reviewer 动态：`NOT_RUN`（既有 bwrap 启动失败）；主控随后在源 worktree 用 `PYTHONDONTWRITEBYTECODE=1` 独立复跑 smallest 1/1、focused 12/12、full 84/84，均 PASS
- 边界：PASS；未进入 Batch 3/4，无新增公共 CLI、TOML 改动或 review 自改

最终 verdict：`APPROVE`，Batch 2 小审闭合；是否开放 Batch 3 仍由主控等待独立授权。
