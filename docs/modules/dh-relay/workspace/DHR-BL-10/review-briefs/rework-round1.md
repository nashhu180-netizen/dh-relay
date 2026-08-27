# rework-brief · DHR-BL-10 返工轮 1（收敛代码轮 1 的 R1/R2）

你是 dh-relay 的施工 worker（手动派活）。上一棒是你自己；本棒只做**复核提出的收敛**，不扩范围。

## 铁律

- 禁止再派活 / 起 watcher / 回头问用户。
- 禁止 `git commit` / `git push` / `git stash` / `git reset` / `git checkout` 丢弃改动——工作树里有未提交成果，**弄丢即事故**。
- 只动下面点名的文件，别顺手改别的。范围外想法记 `findings.md`。
- 卡住写 `progress.md` 后输出 `DONE(blocked)`。

## 背景

代码轮 1 由 codex（只读、独立）完成，结论 `approved-with-P2`，0 个 P0/P1。你要收敛 R1 与 R2 两条 P2。
复核原文要点已抄在下面，无须去找。

---

## 任务 A（收敛 R2）：给大小写派发语义补回归断言

**问题**：旧码 `$Cli -ceq 'claude'` 大小写敏感，`ValidateSet` 校验却不敏感 → `-Cli CLAUDE` 旧码会错拉 codex。改 `switch` 后修好了，但**没有断言钉住**，下个人可能改回去。

**做法**：在 `tools/tests/relay-agent-tool.ps1` 已有 zcode 断言之后追加两条 `-DryRun` 断言：

- `-Cli CLAUDE`（全大写）→ 输出必须含 `claude --dangerously-skip-permissions`，且**不含** `codex --yolo`
- `-Cli CODEX`（全大写）→ 输出必须含 `codex --yolo`

断言名建议：`worker entry dispatches case-insensitively for claude` / `... for codex`。

**验**：`pwsh -NoProfile -File tools/tests/relay-agent-tool.ps1` → SUITE PASS，断言数 +2。

---

## 任务 B（收敛 R1 前半）：补一个非 DryRun 的实拉 argv 断言

**问题**：现有 zcode 断言全走 `-DryRun`，只验了第 31 行**打印**的命令行；真正执行的是第 34 行，两段是独立代码，可能不一致。

**做法**：在 `tools/tests/relay-agent-tool.ps1` 里加一个**不依赖真实 zcode** 的 stub 测试：

1. 建临时目录 `$stubDir`，在里面写 `zcode.cmd`，内容把收到的全部参数写进一个文件再 `exit 0`，例如：
   ```
   @ECHO OFF
   ECHO %* > "<argv 落点文件路径>"
   EXIT /B 0
   ```
   （argv 落点路径用绝对路径硬写进 cmd 文件，别依赖当前目录）
2. 备份 `$env:PATH`，把 `$stubDir` **前置**到 PATH。
3. 非 DryRun 调用 worker-entry：`-Cli zcode`（其余参数照既有 dry-run 用例）。
4. 读回 argv 文件，断言同时含 `--prompt`、`--mode`、`yolo`、`--no-color`。断言名：`worker entry launches zcode with prompt-form argv`。
5. `finally` 里恢复 `$env:PATH` 并清临时目录——**必须恢复，否则污染后续套件**。

注意：worker-entry 实拉后有 `Start-Sleep -Seconds 5`，本用例会慢 5 秒，正常。

**验**：套件 SUITE PASS；且把 stub 的 `zcode.cmd` 改成不回显参数时该断言必须变红（自己试一次，结果记 progress，别留改动）。

---

## 任务 C（收敛 R1 后半）：重跑真实 zcode 一棒，证据**落进仓**

**问题**：E-009 那次真实拉起用的 `%TEMP%` 沙盒已被清理，只剩自述，复核方无法独立核验。这条支撑唯一的人验项。

**做法**：

1. 重跑一次真实拉起（沿用 E-009 的夹具与做法）。
2. **跑完把证据拷进仓**：`docs/modules/dh-relay/workspace/DHR-BL-10/evidence/e2e/`，至少含
   `checkpoint.json`、`result.json`、`handoff.md`、`session-tail.txt`、以及 worker 的 stdout 日志与 exit code。
   （运行现场本身不入仓，只拷这几份证据工件——这是本仓既有做法，见 DHR_03 的 evidence 目录）
3. **拷进仓前逐份过一遍密钥**：夹具是 FAKE 身份，但 session-tail 类文件必须确认无凭据形态残留。有疑虑就不拷该份并在 findings 说明。
4. 在 `progress.md` 新增 E-011，写清：复跑命令（可一键复跑）、exit code、证据落点、以及"证据已入仓、不再依赖临时目录"。

---

## 任务 D：变异点登记（`task_type=normal` 必填）

代码轮 1 已选好锚点，你负责**实施并登记**到 `review.md` 的「有效单测·变异点登记」表：

- 锚点：`tools/host/relay-worker-entry.ps1` 第 31 行（dry-run 回显那行）
- 变异：`zcode --prompt` → `zcode --invalid`
- 语义类别：`改条件`
- 对应测试 ID / 断言名：`zcode dry run prints prompt-form command without launch`
- 运行命令：`pwsh -NoProfile -File tools/tests/relay-agent-tool.ps1`

九个字段要齐：锚点(path:line) / 原值→变异值 / 语义类别 / 对应测试 ID / 运行命令 / **施加 hash** / **还原 hash** / 登记人 / 施加后结果。

**hash 怎么来**（你不能 commit，所以用文件内容哈希，不是 git commit sha）：
施加变异后对 `tools/host/relay-worker-entry.ps1` 求 SHA256 取全部 64 位十六进制作「施加 hash」；还原后再求一次作「还原 hash」。两者必须不同。
命令：`(Get-FileHash tools/host/relay-worker-entry.ps1 -Algorithm SHA256).Hash`
在表格下方补一行说明：本卡 hash 口径 = 文件 SHA256（非 commit sha），因施工 worker 无提交权。

登记人写：`codex（代码轮1，选点）/ zcode-Flash（施加与还原）`。
`施加后结果` 只能填 `断言失败` / `未变红` / `构建错误` 三选一——**只有 `断言失败` 算通过**。老实填，未变红就写未变红。

**做完必须还原**：确认 `git diff tools/host/relay-worker-entry.ps1` 回到变异前状态。

---

## 任务 E：回填

- `findings.md`：F-006 状态由 open 改 resolved（处置写：代码轮 1 R2 判为可接受的随带修复，已补大小写回归断言钉住）；新增 R1/R2 的收敛登记。
- `progress.md`：日志 + 证据账（E-011 起）。
- `visual_map.md`：新增步骤行并置 present。
- **不改 `review.md` 的独立复核区与人类签名区**——那是主控和用户的地盘；你只填「有效单测·变异点登记」表。

## 完成信号

输出结构化 DONE，含：
- A/B/C/D/E 各自结果
- `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` 末行原文
- 新的断言总数
- 变异点九字段实际值（含两个 hash 与「施加后结果」）
- C 的证据落点与 exit code
- 还原确认：`git diff --stat` 里 worker-entry 的行数是否与返工前一致
