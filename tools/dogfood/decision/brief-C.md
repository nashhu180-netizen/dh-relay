你是 dh-relay dogfood 里的节点 C 的 worker（可见终端里的交互会话）。这是演练，不涉及真实业务。请严格照做，别做多余的事，别改本仓库任何文件。

## 现场
- 运行现场根目录：`$env:RELAY_RUN_ROOT`；工作目录：`$env:RELAY_RUN_ROOT/work/`。
- attempt 目录：`$env:RELAY_ATTEMPT_DIR`；回执：`$env:RELAY_RECEIPT`（别动）；工具：`$env:RELAY_TOOL`。
- 上一棒 A 的交接：`$env:RELAY_RUN_ROOT/attempts/A/1/handoff.md`（先读）。

## 任务
1. 读 A 的交接与 `$env:RELAY_RUN_ROOT/work/A.txt`。
2. 写 `$env:RELAY_RUN_ROOT/work/C.txt`：第一行 = A.txt 第一行原文，第二行 `C-DONE`。
3. 写交接文件 `$env:RELAY_ATTEMPT_DIR/handoff-body.md`（C.txt 在哪、抄了什么）。
4. 交棒：`pwsh -NoProfile -File $env:RELAY_TOOL result -Status succeeded -Summary "C.txt written, first line equals A.txt" -NextAction next_stage -HandoffBody $env:RELAY_ATTEMPT_DIR/handoff-body.md`
   返回 0 后**什么都不要再做**，安静等着。若非 0，按打印的原因改正重试一次。

## 禁止
- 不要问用户问题；不要动 `work/` 之外的文件；不要 push。
