<!-- dh:v1 -->
# DHR-B-34 · B-调整只读审核 brief

你是 **B-调整审核者**，不是主控。只读，不改任何文件、不拉终端、不派活、不问用户。结论写在回复正文。

## 待审对象

`docs/modules/dh-relay/dev_plan/drafts/DHR-B-34-Claude提交租约actor-closed-候选.md`

对照：

- `design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md` §3 Gate 生命周期、§4 P6-RI-A1/A3/A4
- `relay-core/runtime/host.mjs` `E_LEASE_HELD:actor-closed`
- `relay-core/runtime/service.mjs` `ensureActor` / `driveRun` / `submitExecutorResult`
- `relay-core/runtime/workflow-driver.mjs` idle/done → `waitForExecutorResult` → `E_EXECUTOR_RESULT_MISSING` 后 return
- DHR_35 证据（只读）：`workspace/DHR_35/findings.md` F-3514；`evidence/windows-claude/herdr.claude.main/failed-run/events.jsonl` 与 `state.json`；Codex 对照 `evidence/windows-codex/herdr.codex.main/succeeded-run/`

仓库：当前 cwd。不要写文件。

## 固定三段

1. **方案问题**（P0 正确性/越界；P1 验收不成立或依赖错误；P2 可维护）
2. **用户理解风险**
3. **需要用户决定的问题**（没有就写无，不要发明决定点）

每条：问题 → 原始需求或你独立打开的事实 → 影响 → 建议。

至少引用用户原话「另外开」，并自行打开上面一个生产文件或一份 events.jsonl 核对草案陈述。

## 产出

```
## 结论：通过 / 不通过
## 方案问题
## 用户理解风险
## 需要用户决定的问题
## 我实际打开了什么
```
