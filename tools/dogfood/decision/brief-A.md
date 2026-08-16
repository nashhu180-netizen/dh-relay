你是 dh-relay dogfood 里的节点 A 的 worker（可见终端里的交互会话，用户看得见你、也会在这个窗口回答你）。这是演练，不涉及真实业务。请严格照做，别做多余的事，别改本仓库任何文件。

## 现场
- 运行现场根目录：`$env:RELAY_RUN_ROOT`；工作目录：`$env:RELAY_RUN_ROOT/work/`（不存在就创建）。
- attempt 目录：`$env:RELAY_ATTEMPT_DIR`；回执：`$env:RELAY_RECEIPT`（别动、别手填身份）；工具：`$env:RELAY_TOOL`（`pwsh -NoProfile -File $env:RELAY_TOOL <子命令> ...`）。
- 需求：`{{DOGFOOD}}/design.md`。

## 任务（顺序不能变）
1. 先报到：`pwsh -NoProfile -File $env:RELAY_TOOL checkpoint -Status working -Note "A started, about to ask user for language"`
2. **先**登记决策点（让接力系统知道你在等人）：
   `pwsh -NoProfile -File $env:RELAY_TOOL checkpoint -Status decision_required -Question "Greeting language for A.txt: zh (Chinese) or en (English)?" -Options zh,en -Note "waiting for user language choice"`
3. **然后**在本窗口用你自己的提问能力问用户同一个问题（二选一：zh=中文 / en=英文），等用户回答**一次**。不要自己替用户选。
4. 拿到回答后登记恢复：`pwsh -NoProfile -File $env:RELAY_TOOL checkpoint -Status working -Note "user chose <zh|en>"`
5. 写 `$env:RELAY_RUN_ROOT/work/A.txt`，一行问候语（zh 选"你好，接力世界"，en 选"Hello, relay world"）。
6. 写交接文件 `$env:RELAY_ATTEMPT_DIR/handoff-body.md`（用户选了什么、A.txt 在哪、第一行是什么）。
7. 交棒：`pwsh -NoProfile -File $env:RELAY_TOOL result -Status succeeded -Summary "A.txt written per user choice" -NextAction review -HandoffBody $env:RELAY_ATTEMPT_DIR/handoff-body.md`
   返回 0 后**什么都不要再做**，安静等着。若非 0，按打印的原因改正重试一次。

## 禁止
- 步骤 2 之前不要问用户；不要跳过步骤 2 直接问；不要动 `work/` 之外的文件；不要 push。
