# RLT_11 派活总览（编排维护 · worker 只读）

## 身份与合同

- 任务卡：`RLT_11 — 持久化退场核对与教训回流`
- 开发方案：`docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md`（卡片全文在「#### RLT_11」段）
- 设计与验收：`docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md`（§12 退场路径、§15 查漏自查、验收 ID `HC-RL-A13`）
- GitHub Issue：**#33**
- 分支 / worktree：`wt/RLT_11` @ `/home/nash/work/dh-relay/.dh-worktrees/RLT_11`（基线 `f6062c8` = origin/master）
- 档位：**轻**；任务类型 `light` → 必做复核**两路**：教训、一致性（无「有效单测」硬要求）

## 允许路径（四集合核对的权威来源，越界即 FAIL）

```
docs/modules/dh-relay/knowledge/教训库-候选.md
docs/modules/relay-light/as-built/**
docs/modules/relay-light/workspace/RLT_11/**
```

任何超出上述路径的改动一律 **不做**，只写进 `findings.md` 转派。

## 环境事实（Linux ThinkPad，照抄勿改）

- 单测入口**不能写 dotted 路径**（`tools/relay-light` 含连字符，`python -m unittest tools.relay-light.xxx` 永远 ImportError）。正确写法：
  ```
  cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log
  ```
- **每条测试命令都要带 `PYTHONDONTWRITEBYTECODE=1`**，包括
  `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`（它会 shell out 到 python）。
  否则 `__pycache__` 落进树，撞「允许路径四集合核对」。
  **反向陷阱**：发现已有 `__pycache__` 时**不要主动删**（删同样是越界写动作），只在 progress 登记 pre-existing 并区分本卡新增。
- 本卡是**文档回流卡**，预期不改 Python/PowerShell 代码，因此正常情况下**不需要**跑上面的测试；写在这里是防止你顺手跑出脏文件。

## worker 铁律（摘自仓根 AGENTS.md「编排协议段」）

1. 你是 worker 不是主控：**不得**再拉终端 / 派活 / 起 watcher，**不得**回头问用户。
2. 只做本 brief 指向的这一件事；别自行加载 dev-harness skill，别满仓库找「流程框架」。
3. 范围外新想法记 `findings.md`，**不顺手做**。
4. 卡住必须落信号、不许憋死：把 `BLOCKED` 结构化写进 `progress.md` 并结束回合。
5. 完成即停，不越位派下一棒。

## 完成信号（统一格式，追加到 `docs/modules/relay-light/workspace/RLT_11/progress.md`）

```
DONE task=RLT_11 role=<角色> node=<节点号> status=<OK|BLOCKED|REVISE> ts=<ISO8601>
  summary: <一行>
  artifacts: <逗号分隔的相对路径>
```

## 角色与派活文件

| 节点 | 角色 | 模型 | brief |
|---|---|---|---|
| W1 | builder | codex gpt-5.6-sol medium | `W1-builder.md` |
| W2 | plan-reviewer（审核） | codex gpt-5.6-sol medium | `W2-plan-review.md` |
| C* | coder | devin swe-2-max | `C-coder.md` |
| R1/R2 | reviewer（教训 / 一致性） | devin swe-2-max | `R-review-*.md` |
| — | monitor（监督） | devin swe-2-medium | `M-monitor.md` |
| — | decider（决策，仅 BLOCKED） | codex gpt-6-astra medium | 临时下发 |
