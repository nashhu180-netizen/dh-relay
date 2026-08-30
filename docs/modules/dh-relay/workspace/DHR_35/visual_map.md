<!-- dh:v1 · workspace/DHR_35/visual_map.md -->
# visual_map — DHR_35

## 步骤证据表

| 步骤 | 完成% | 要的证据 | 证据状态 |
|---|---:|---|---|
| Windows 前置与脚本防护 | 70 | Herdr/DSH-off/CLI 预检；Registry fail-closed 事实；隔离 runner 红/绿 | present |
| Codex 真实闭环 | 0 | Receipt、Herdr 状态、checkpoint/result、CLI 四视图；当前被 F-3505 阻塞 | partial |
| Claude Code 真实闭环 | 0 | 独立 Receipt、Herdr 状态、checkpoint/result、CLI 四视图；当前被 F-3505 阻塞，F-3506 待后续处理 | partial |
| 受控状态与回归 | 0 | working/blocked/done/unknown、Attention、定向测试终态 | missing |
| Linux SSH | 0 | B-22 延后/受限登记；不运行 fixture 替代 | waived |

> 证据状态四态：`missing / partial / present / waived`。
