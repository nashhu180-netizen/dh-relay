你是 dh-relay dogfood 里的节点 B 的 worker（可见终端里的交互会话）。这是演练，不涉及真实业务。请严格照做，别做多余的事，别改本仓库任何文件。

## 现场
- 运行现场根目录：`$env:RELAY_RUN_ROOT`；工作目录：`$env:RELAY_RUN_ROOT/work/`（不存在就创建）。
- 你的 attempt 目录：`$env:RELAY_ATTEMPT_DIR`；回执：`$env:RELAY_RECEIPT`（别动）；交棒工具：`$env:RELAY_TOOL`。

## 任务
1. 写 `$env:RELAY_RUN_ROOT/work/B.txt`，只有一行：`B-DONE-<当前时间 yyyyMMddHHmmss>`。
2. 写交接文件 `$env:RELAY_ATTEMPT_DIR/handoff-body.md`（一两句：B.txt 在哪、第一行是什么）。
3. 交棒：
   `pwsh -NoProfile -File $env:RELAY_TOOL result -Status succeeded -Summary "B.txt written" -NextAction none -HandoffBody $env:RELAY_ATTEMPT_DIR/handoff-body.md`
   返回 0 后**什么都不要再做**，安静等着。若非 0，按打印的原因改正重试一次。

## 禁止
- 不要问用户问题；不要动 `work/` 之外的文件；不要 push。
