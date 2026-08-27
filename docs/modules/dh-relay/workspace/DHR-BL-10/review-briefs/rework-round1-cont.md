# rework-brief 续棒 · DHR-BL-10 返工轮 1（第 2 棒）

前一棒（zcode / GLM-5.3-Flash）在执行 [rework-round1.md](./rework-round1.md) 途中**因网络错误中断**
（`ECONNRESET` / TLS 握手失败，`Turn execution failed`），不是逻辑失败。工作树完好、无 stash、HEAD 未动。

铁律同前：不 commit / 不 push / 不 stash / 不 reset / 不 checkout 丢弃改动；不派活；不问用户；卡住写 progress 后输出 `DONE(blocked)`。

## 已完成（主控已核，别重做）

- **任务 A 已完成且通过**：`tools/tests/relay-agent-tool.ps1` 已加 `-Cli CLAUDE` / `-Cli CODEX` 两条大小写派发断言，实跑 PASS。
- 步骤 0~8 的既有成果全在。

## 当前实际状态（主控实跑）

`pwsh -NoProfile -File tools/tests/relay-agent-tool.ps1` → `ASSERTIONS 39` / **`SUITE FAIL (1)`**，
唯一红的是 `worker entry launches zcode with prompt-form argv`。

## 任务 B-fix（最优先）：修好 stub，它现在是坏的

**根因（主控已定位，直接照修）**：你写的 stub 体是

```powershell
$stubBody=@'
param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Rest)
exit 0
'@
```

它**从未把 argv 写进 `$stubArgv`**；后面的 `$stubBody.Replace('CAP',$stubArgv)` 想替换占位符 `CAP`，
但 `$stubBody` 里根本没有 `CAP` 这个子串 —— 整个 Replace 是空操作。
于是 `$stubArgv` 文件永不生成，`$argvOut` 为空串，断言必红。

**修法**：在 stub 体里真正落盘 argv。要点：
- 占位符要**真的出现在**字符串里（例如用 `__ARGV_CAPTURE__`），再 `.Replace('__ARGV_CAPTURE__',$stubArgv)`；
  或者干脆别用 Replace，直接用双引号 here-string `@"..."@` 把 `$stubArgv` 插值进去（注意 stub 体内其它 `$` 变量要转义）。
- 落盘内容用 `$Rest -join ' '`，写文件用 `[IO.File]::WriteAllText(...)` 或 `Set-Content`。
- stub 仍 `exit 0`。
- PATH / PATHEXT 的前置与 `finally` 恢复逻辑你写得对，**保留别动**。

**验**：
1. `pwsh -NoProfile -File tools/tests/relay-agent-tool.ps1` → `SUITE PASS`，断言数 39。
2. **有效性自证**：把 stub 落盘的内容临时改成不含 `--prompt` 的固定串，该断言必须变红；确认后改回。结果记 `progress.md`，不留改动。

## 任务 C、D、E（原 brief 未做，照原文执行）

见 [rework-round1.md](./rework-round1.md) 的「任务 C」「任务 D」「任务 E」三节，逐条照做：
- **C**：重跑真实 zcode 一棒，证据拷进仓 `docs/modules/dh-relay/workspace/DHR-BL-10/evidence/e2e/`，拷前过密钥，progress 记 E-011。
- **D**：变异点登记进 `review.md` 的「有效单测·变异点登记」表，九字段齐，hash 用文件 SHA256（口径说明要写），做完必须还原。
- **E**：回填 findings（F-006 转 resolved）/ progress / visual_map；**不动 review.md 的独立复核区与人类签名区**。

## 完成信号

结构化 DONE，含：B-fix 的修法与自证结果、C 的证据落点与 exit code、D 的九字段实际值、
`pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` 末行原文、最终断言数、
以及还原确认（`git diff --stat` 中 `relay-worker-entry.ps1` 是否仍为 6 行改动）。
