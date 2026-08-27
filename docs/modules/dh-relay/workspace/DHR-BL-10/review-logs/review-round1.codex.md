# review-round1 · DHR-BL-10（代码复核轮 1）

- **复核身份**：codex CLI · `codex exec -s read-only`（只读沙盒）· 2026-08-27
- **独立性**：未参与实施（施工方 = zcode / GLM-5.3 + GLM-5.3-Flash）；独立进程、独立会话、零施工上下文继承
- **复核范围**：工作树 `.dh-worktrees/DHR-BL-10`（分支 `wt/DHR-BL-10`，基线 `master` = `f04d797`）的全部 7 份未提交改动
- **指令集**：[../review-briefs/review-round1.md](../review-briefs/review-round1.md)
- **原始日志**：`scratchpad/dispatch/DHR-BL-10.review1.log`（临时位，结论已全文誊录于本文件）

## 结论：`approved-with-P2`（0 个 P0/P1）

## 发现

| ID | 级别 | 问题 | 证据 | 建议处置 |
|---|---|---|---|---|
| R1 | P2 | zcode 的新增自动化断言全是 `-DryRun`，未覆盖实际执行分支；E-009 临时目录已清理，只留自述，不能独立复核 G3 所需的 result 内容与 exit code | `tools/tests/relay-agent-tool.ps1:82-87`；实际执行在 `relay-worker-entry.ps1:34`；`progress.md:29` 说明临时沙盒已清理；只读环境复跑时 Temp 目录创建被拒 | 人验前重跑真实 zcode worker 并展示 result 全文与退出码；补一个不依赖真实 zcode 的非 DryRun stub 测试，校验实际 argv |
| R2 | P2 | F-006 所述大小写派发语义确实改变：旧 `-ceq` 下 `-Cli CLAUDE` 会走 codex，新 `switch` 会走 claude。方向合理，但并非「既有分支完全不受影响」，且没有回归断言 | `tools/host/relay-worker-entry.ps1:31,34`；`findings.md` F-006 | 明确作为随带修复接受，并增加 `CLAUDE`/`CODEX` 派发断言；若不接受该语义变化则恢复旧语义 |

## 变异点建议（供主控实施）

锚点 `tools/host/relay-worker-entry.ps1:31` ｜ `zcode --prompt` → `zcode --invalid` ｜ 语义类别 `改条件` ｜ 预期变红的断言：`zcode dry run prints prompt-form command without launch`

## 核过且无问题的点（逐条）

1. 7 份已跟踪改动及未跟踪 review brief 均在 `brief.md` 允许路径清单内；`git diff --check` 无错误，`git stash list` 为空（无残留）。
2. `claude` / `codex` 两条命令字符串在 diff 中**逐字未变**。
3. `switch` 无 `default` 分支对正常入口无遗漏：`ValidateSet` 在执行前限制输入，三个允许值均有分支；各分支均在读取 `$LASTEXITCODE` 前执行 CLI。
4. `run-dogfood.ps1` 默认值仍为 `claude`；参数元数据实际输出 `claude,codex,zcode`。
5. 新增生产代码未含凭据值或 zcode 安装绝对路径；密钥检索仅命中既有脱敏测试文本（`relay-agent-tool.ps1:49` 的 `<REDACTED:api_key>` 夹具）。
6. F-001 结论与现有资料相符：`relay-core/contracts/compat-matrix.md:77` 明示 psmux/CLI 属 process executor 实现细节、不进协议。

## 返工去向

R1 / R2 由 [../review-briefs/rework-round1.md](../review-briefs/rework-round1.md) 承接（返工轮 1，施工方 zcode / GLM-5.3-Flash · reasoning=max）。
