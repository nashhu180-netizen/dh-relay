# rework-brief · DHR-BL-10 返工轮 3（收敛技术裁定复核：`-NoExit` 下 throw 不退出）

铁律同前：不 commit / push / stash / reset / checkout；不派活；不问用户；卡住写 progress 后 `DONE(blocked)`。
**工作树里有大量未提交成果，弄丢即事故。**

## 为什么返工

独立技术裁定复核（codex，只读）实测推翻了主控裁定 4 的一半。核心事实：

两个真实调用方都用 **`-NoExit`** 拉 worker：
- `tools/host/run-dogfood.ps1:57`：`@('pwsh','-NoProfile','-NoExit','-File',$workerEntry,...)`
- `tools/adapters/psmux-adapter.ps1:96`：同形

而 `-NoExit` 下 `throw` 只中止脚本、**不让 pwsh 进程退出**，它会停在提示符。复核方隔离实测：

```
running_after_800ms=True
exit_after_probe_cleanup=-1
--- stdout ---
before-throw
PS D:\...\DHR-BL-10>
```

后果：psmux adapter 会先把会话建成判为成功（`psmux-adapter.ps1:111-126`），之后对这个还活着的 pane
最终观察成 **`idle`**（`:129`），而不是启动失败。也就是说——**当前的 `default{throw}` 并没有真的 fail-closed**，
它把"静默错派"换成了"挂住一个永远 idle 的窗口"，而"分不清在等人还是卡死"正是 backlog `DHR-BL-1` / `DHR-BL-6` 已登记的痛点。

同一实测确认：**`-NoExit` 会遵守显式 `exit`**（复核方实测 `exit=64` 生效）。所以修法是把 `throw` 换成显式 `exit`。

## 任务 A：两处 default 改为「写 stderr + 显式 exit」

`tools/host/relay-worker-entry.ps1` 第 31 行与第 34 行两处 `switch -CaseSensitive` 的 `default` 分支，
从 `throw "..."` 改为**本仓既有惯例**（对齐同目录 `relay-agent-tool.ps1:128` 的 `校验失败` 写法）：

```powershell
default{[Console]::Error.WriteLine("relay-worker-entry: unsupported -Cli value '$Cli' (case-sensitive: claude|codex|zcode)");exit 4}
```

要点：
- **用 `exit 4` 不用 `exit 64`**：`relay-agent-tool.ps1:128` 已把 `exit 4` 定为"输入校验失败"，`exit 3` 为特定缺环境。本仓惯例优先于 sysexits。
- 三条正常分支体**逐字不动**。
- 两处都改，保持同构。
- `switch -CaseSensitive` 保留（复核确认它正确覆盖了三个枚举值、不会错派）。

## 任务 B：补一条「真实 launcher 形态」的断言

现有大小写反例断言（`tools/tests/relay-agent-tool.ps1` 第 88~91 行附近）用的是 `pwsh -NoProfile -File`，
**不带 `-NoExit`**，因此漏掉了真实调用形态。补一条用真实形态的断言：

1. 用 `Start-Process` 或等价方式以 **`pwsh -NoProfile -NoExit -File <entry> ... -Cli CLAUDE -DryRun`** 启动。
2. **有界等待**（例如最多 15 秒，轮询进程是否退出）。
3. 断言：进程**已退出**（不是仍在运行）**且退出码 = 4**。
4. `finally` 里兜底 kill 残留进程——**绝不允许测试留下挂起的 pwsh**。

断言名建议：`worker entry exits nonzero under real -NoExit launcher on miscased cli`。

**红相位自证**：把 `default` 临时改回 `throw`，该断言必须变红（进程仍在运行或退出码非 4）；确认后改回。结果记 `progress.md`，不留改动。

## 任务 C：登记复核方的其余结论

在 `findings.md` 新增条目（编号接着现有最大号往后排，**先看清当前最大号再定**，本卡已发生过一次编号偏差）：

1. **主控裁定 3 被修正**（P3，resolved）：复核方判「教训被套到错误形状的代码上」**说过头了**。其修正口径是：
   CLI 分派同样是冻结枚举，用 `-ceq` 本身**符合**候选-5；真正的错误是**二分代码把「不是精确 claude」等同于「必为 codex」**——
   即 `else` 分支不完备，而非算子选错。把这条如实记下，并注明主控接受该修正。
2. **复核方的一条观察，主控不接受**（P3，记为「已评估不采纳」）：复核方称「本 diff 同时新增 zcode，应作为独立行为变更单独验收」。
   实际情况相反——**新增 zcode 才是本卡的主交付**（见 backlog `DHR-BL-10`、brief 目标节），大小写修复是接线时被迫触发的副产物。
   复核方缺卡片上下文导致主次颠倒。如实记录该观察与不采纳理由，不要偷偷略过。
3. **F-009 的「已知局限」应予撤销**（更新原条目）：其理由是"测试红相位会真的拉起 CLI"，但本轮任务 B 已证明
   用有界等待 + 退出码断言即可安全覆盖真实 launcher 形态，无需真的拉起 CLI。

## 任务 D：回填

- `progress.md`：日志 + 证据（红相位 / 绿相位 / 全量回归）。
- `visual_map.md`：新增步骤行置 present。
- `lesson_candidates.md`：追加候选——「`-NoExit` 下 `throw` 不等于进程退出；给由 launcher 拉起的脚本设计失败路径时，
  必须按**真实 launcher 形态**验证退出行为，不能只在裸 shell 里试」。
- **不动 `review.md` 的独立复核区与人类签名区**。
- 变异点登记表：核锚点行号有没有漂，漂了就更新。

## 完成信号

结构化 DONE，含：两处 default 最终代码片、任务 B 断言的红/绿实测输出、findings 新增编号与内容摘要、
`pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` 末行原文、最终断言数、以及确认无残留 pwsh 进程。
