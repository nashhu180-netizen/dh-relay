<!-- dh:v1 · task_plan.md — 施工图。🔵 开工那一刻写，一次性消耗品：跑偏了去 progress.md 记实际，不回头改这里。 -->
# task_plan — DHR-BL-10

## 要读的上下文 (Context Packet) ★前置

> **执行契约头（zero-context）**：执行者默认「只知道本文件 + `brief.md` + backlog `DHR-BL-10` 条目」，不得靠脑补上下文施工；按步骤照做，偏离路线只记 `progress.md` 不回写本文件。
> **你是 worker，不是主控**（仓根 `AGENTS.md`「编排协议段」）：禁止再拉终端 / 派活 / 起 watcher，禁止回头问用户；范围外新想法记 `findings.md`，不顺手做。

| ID | 来源 (path) | 为什么 |
|----|------------|--------|
| C-001 | `AGENTS.md`「不可违反的硬规则」+「编排协议段」 | 本仓宪章与 worker 铁律，进场必读 |
| C-002 | `docs/modules/dh-relay/workspace/DHR-BL-10/brief.md` | 完成条件 8 条 + 允许路径 + 边界 |
| C-003 | `docs/modules/dh-relay/backlog.md` `DHR-BL-10` 条目 | 需求全文、zcode 实测参数、已知坑、待核风险 |
| C-004 | `tools/host/relay-worker-entry.ps1` 全文（36 行） | 唯一要改的核心文件；注意第 21~23 行那段继承环境清理的注释是 F-012 事故留痕，**不要动** |
| C-005 | `tools/tests/relay-agent-tool.ps1` 第 78~81 行 | 现有 dry-run 断言的写法样板，新断言照此风格 |
| C-006 | `tools/host/run-dogfood.ps1` 第 17 行 | `-WorkerCli` 的 ValidateSet |
| C-007 | `docs/modules/dh-relay/as-built/relay-psmux-host.md` 第 21 行与第 57 行 | 两行都明写「`claude|codex`」，收口要同步 |

### 已由主控完成、你不要重做的机器准备

- `zcode` 已装成 **PATH 命令**（shim 在 `%APPDATA%\npm\zcode.cmd`，内部转 `node <安装目录>/resources/glm/zcode.cjs`）。仓内代码因此只写 `& zcode ...`，**绝不允许出现 zcode 的安装绝对路径**。
- zcode 凭据已放进它自己的私有配置 `~/.zcode/cli/config.json`（与 `~/.claude`、`~/.codex/auth.json` 同构的环境自带认证）。**worker-entry 不需要、也不允许做任何凭据注入**——三条 CLI 分支一律靠各自的环境认证。
- 已在干净 shell（无 `ZCODE_API_KEY`）验证 `zcode --prompt "..."` 可直接跑通。

## 施工步骤 (Steps) ★详细级

> 五拍循环：写失败测试 → 跑红 → 最小实现 → 跑绿 → 记录。测试命令一律在仓根跑。

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---------|--------|--------|
| 0 | Read · 无改动 | 查证 `findings.md` F-001：v1 被 v2「只读作 Oracle」的 Oracle 面到底覆盖什么。查法：`grep -rn "Oracle\|oracle" docs/modules/dh-relay/as-built/relay-core.md relay-core/README.md relay-core/adr/` ，看 Oracle 引用的是 `tools/contracts/` 契约与转换矩阵，还是也含 `tools/host/` 宿主层。把结论（含引文行号）写进 `findings.md` F-001 的「证据」与「处理」列并置为 resolved 或升级为阻塞。 | 结论落 `findings.md`；若结论是「宿主层也在 Oracle 面内」→ **立即停工**，把 blocked 写进 `progress.md` 并结束本节点，不要自行改设计 |
| 1 | Test · `tools/tests/relay-agent-tool.ps1` 第 81 行后追加 | 在既有 codex dry-run 断言之后，追加 zcode 分支的同构断言：<br>`$dryZ=@(& pwsh -NoProfile -File $entry -Receipt $receipt -BriefRef (Join-Path $fixtures 'brief-A.md') -Cli zcode -WorkDir (Join-Path $root 'work') -DryRun 2>&1);$dryZText=$dryZ-join"``n"`<br>`Assert-True ($LASTEXITCODE-eq0) 'worker entry dry run accepts zcode'`<br>`Assert-True ($dryZText-match'RELAY_RECEIPT='-and$dryZText-match'RELAY_RUN_ROOT='-and$dryZText-match'RELAY_ATTEMPT_DIR=') 'zcode dry run prints injected environment'`<br>`Assert-True ($dryZText-match'FAKE worker brief'-and$dryZText-match'zcode --prompt') 'zcode dry run prints prompt-form command without launch'`<br>再追加一条**拒绝非法值**断言：用 `-Cli bogus` 调用，断言退出码非 0（`ValidateSet` 未被放宽）。 | `pwsh -File tools/tests/relay-agent-tool.ps1` → 预期 **红**：`-Cli zcode` 被现有 ValidateSet 拒绝，新断言 FAIL。把这段红输出摘要贴进 `progress.md` |
| 2 | Modify · `tools/host/relay-worker-entry.ps1:4` | `[ValidateSet('claude','codex')]` → `[ValidateSet('claude','codex','zcode')]` | 单独跑步骤 1 的测试，环境断言应转绿、命令行断言仍红 |
| 3 | Modify · `tools/host/relay-worker-entry.ps1:31` 与 `:34` | 两处 `if/else` 二分支改成三分支。**既有两条命令行逐字不变**，只加第三条。第 31 行（dry-run 回显）与第 34 行（实拉）用同一套分支形状，例如：<br>`switch($Cli){`<br>`  'claude'{...claude --dangerously-skip-permissions $prompt...}`<br>`  'codex'{...codex --yolo $prompt...}`<br>`  'zcode'{...zcode --prompt $prompt --mode yolo --no-color...}`<br>`}`<br>zcode 分支**不传 `--cwd`**——第 27 行 `Set-Location $WorkDir` 已把进程 cwd 切好，与 claude/codex 同构。**不加任何凭据注入代码。** | `pwsh -File tools/tests/relay-agent-tool.ps1` → 预期 **绿**（含既有 codex 断言仍绿） |
| 4 | Modify · `tools/host/run-dogfood.ps1:17` | `[ValidateSet('claude','codex')][string]$WorkerCli='claude'` → 加 `'zcode'`。默认值保持 `claude` 不变。 | `pwsh -NoProfile -Command "(Get-Command tools/host/run-dogfood.ps1).Parameters['WorkerCli'].Attributes.ValidValues"` → 预期输出含 claude / codex / zcode 三个值 |
| 5 | Test · 全量回归 | 不改文件 | `pwsh -File tools/tests/run-relay-tests.ps1` → 预期末行 `RELAY ALL PASS`。整段输出摘要贴 `progress.md` 并挂 Evidence ID |
| 6 | Test · 密钥与绝对路径闸 | 不改文件 | `git diff` + `git status`，然后 `git diff | grep -n -i -E "apikey|api_key|sk-|Bearer |Program Files|\.zcode"` → 预期**零命中**。有命中即 P0，停下记 `findings.md` |
| 7 | Modify · `docs/modules/dh-relay/as-built/relay-psmux-host.md` 第 21 / 57 行 | 两处 `claude|codex` 改为 `claude|codex|zcode`，并在第 57 行那格补一句说明 zcode 走 `--prompt` 一次性形态、不驻留。**不要重写整份文档。** | `grep -n "zcode" docs/modules/dh-relay/as-built/relay-psmux-host.md` → 预期 2 处命中 |
| 8 | Record · `progress.md` / `visual_map.md` | 逐步回填日志表与证据账本（每条结论挂可复跑命令）；`visual_map.md` 步骤证据表把 0~7 步的证据状态填成 present。**不提交 git**——提交与合并由主控在收口时做。 | `progress.md` 证据账本至少 4 条 E-xxx，均带可复跑命令 |

## 关键决策（一句话各一行）

- Worktree：**是**，分支 `wt/DHR-BL-10`，目录 `.dh-worktrees/DHR-BL-10`
- 派子 agent：**否**（你是被派的 worker，禁止再派）
- Review：施工者 = zcode，故**复核必须另派他人**（施工者不复核自己的卡）；`task_type=normal` → 代码轮 1 + 需求复核 + 教训复核 + 有效单测，不做代码轮 2
- TDD：适用，按步骤 1→3 的红/绿顺序走，不许先实现后补测试

## 完成信号（手动派活模式）

做完把结论写成结构化 DONE 输出，至少含：改了哪几个文件、全量回归末行原文、`git diff --stat` 摘要、findings 里 F-001 的结论、以及任何未做完的事项。**卡住不许憋死**——遇阻塞把原因写进 `progress.md` 再输出 DONE(blocked)。
