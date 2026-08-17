# dh-relay dogfood 夹具（DHR_03）

两场最小演练，全部内容为假需求；由 `tools/host/run-dogfood.ps1` 渲染到运行现场 `<run>/dogfood/`（替换 `{{RUN_ID}}` `{{RUN_ROOT}}` `{{DOGFOOD}}` `{{TOOL}}`），worker 的 `brief_ref` 指向渲染后的副本（跨 attempt 不变）。

| 场景 | 文件 | 目的 |
|------|------|------|
| `blocked/` | design/devplan（故意漏 B）、brief-A（缺 B 则 `dependency_blocked` 交棒；attempt>1 先读上一棒 handoff）、brief-B、orchestrator-prompt（v1 只 A）、replanner-prompt（v2 补 B、A depends_on B、resume_from A/1） | 阻塞→重编排→fresh A 续跑，0 人工动作 |
| `decision/` | design/devplan、brief-A（先 `checkpoint decision_required` 再在窗口问用户一次）、brief-B（并行）、brief-C（依赖 A）、orchestrator-prompt（A/B/C） | 决策挂起：C 冻结、B 继续、用户回答一次后 A 继续 → C |

一键：

```powershell
pwsh tools/host/run-dogfood.ps1 -Scenario blocked  -ScreenshotOnLaunch -ScreenshotOnStop
pwsh tools/host/run-dogfood.ps1 -Scenario decision -ScreenshotOnLaunch -ScreenshotOnStop
```

证据落 `docs/workspace/DHR_03/evidence/<scenario>/`（events/state/launches/psmux-handles/host-state/timeline.md/signature.txt/shots/spawns/work）。
