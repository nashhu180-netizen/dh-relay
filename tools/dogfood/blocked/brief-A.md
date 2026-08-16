你是 dh-relay dogfood 里的节点 A 的 worker（可见终端里的交互会话）。这是演练，不涉及真实业务。请严格照做，别做多余的事，别改本仓库任何文件。

## 现场
- 运行现场根目录：`$env:RELAY_RUN_ROOT`；工作目录：`$env:RELAY_RUN_ROOT/work/`（不存在就创建）。
- 你的 attempt 目录：`$env:RELAY_ATTEMPT_DIR`。
- 你的回执（身份）：`$env:RELAY_RECEIPT`（不要改它、不要手填身份字段）。
- 你的交棒工具：`$env:RELAY_TOOL`（一个 PowerShell 脚本；用 `pwsh -NoProfile -File $env:RELAY_TOOL <子命令> ...` 调用）。
- 需求：`{{DOGFOOD}}/design.md`；计划：`{{DOGFOOD}}/devplan.md`。

## 如果你是续跑的会话（attempt > 1）
先检查 `$env:RELAY_RUN_ROOT/attempts/A/1/handoff.md` 是否存在——存在说明你是 fresh 会话接上一棒。先读它，再按下面"任务"继续，此时 `work/B.txt` 应该已经有了。

## 任务
1. 读 design.md 和 devplan.md。
2. 检查 `$env:RELAY_RUN_ROOT/work/B.txt` 是否存在：
   - **不存在**：**不要自己造 B.txt**。写一份交接文件（路径 `$env:RELAY_ATTEMPT_DIR/handoff-body.md`，内容：你发现了什么、缺什么、下一棒该怎么接），然后交棒并声明被依赖阻塞：
     `pwsh -NoProfile -File $env:RELAY_TOOL result -Status dependency_blocked -Summary "A needs first line of work/B.txt but plan has no task producing B" -NextAction none -HandoffBody $env:RELAY_ATTEMPT_DIR/handoff-body.md`
     命令返回 0 后**什么都不要再做**，安静等着（会话会被回收）。
   - **存在**：写 `$env:RELAY_RUN_ROOT/work/A.txt`，内容一行 `ref: <B.txt 第一行原文>`；再写交接文件 `$env:RELAY_ATTEMPT_DIR/handoff-body.md`（做了什么、A.txt 在哪），然后：
     `pwsh -NoProfile -File $env:RELAY_TOOL result -Status succeeded -Summary "A.txt written, references first line of B.txt" -NextAction review -HandoffBody $env:RELAY_ATTEMPT_DIR/handoff-body.md`
     命令返回 0 后**什么都不要再做**。
3. 若工具返回非 0，读它打印的原因改正后重试一次；仍失败就停下不动。

## 禁止
- 不要问用户问题；不要 push；不要动 `$env:RELAY_RUN_ROOT/work/` 之外的文件；不要伪造 B.txt。
