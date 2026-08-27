# rework-brief · DHR-BL-10 返工轮 2（收敛 F-007：大小写派发改为 fail-closed）

铁律同前：不 commit / push / stash / reset / checkout；不派活；不问用户；卡住写 progress 后 `DONE(blocked)`。
**工作树里有大量未提交成果，弄丢即事故。**

## 为什么返工（主控在教训复核备料时发现）

`knowledge/教训库-候选.md` **候选-5** 明写：

> PowerShell 默认比较大小写不敏感（`-in/-eq/-ne/-notin`），冻结枚举必须用 `-cin/-ceq/-cne` 或 Ordinal 比对，且修一处要全库 grep 同类算子
> 来源：DHR_01 F-001 + F-008——`Test-RelayEnumValue` 用 `-notin` 致 `"role":"Worker"` 过校验，fail-closed 形同虚设

原实现 `$Cli -ceq 'claude'` 正是这条教训的产物。本卡把它换成**大小写不敏感**的 `switch`，方向与该教训相反。
代码轮 1（codex）给出的 R2 只有「接受 / 恢复旧语义」两个选项，因为教训库不在它的 brief 里。

**但原码也不对**：`ValidateSet` 自身大小写不敏感、会放 `CLAUDE` 进来，`-ceq` 挡不住，只是让它**静默掉进 else 去拉 codex**——
这是静默错派（fail-open），不是候选-5 想要的 fail-closed。

## 目标形态（主控裁定）

`tools/host/relay-worker-entry.ps1` 第 31 行与第 34 行两处 `switch` 都改成**大小写敏感 + 无匹配即炸**：

```powershell
switch -CaseSensitive ($Cli){
  'claude'{ ... }
  'codex' { ... }
  'zcode' { ... }
  default { throw "relay-worker-entry: unsupported -Cli value '$Cli' (case-sensitive: claude|codex|zcode)" }
}
```

要点：
- **三条分支体逐字不动**（claude / codex 的命令行仍必须逐字未变，zcode 的 `--prompt … --mode yolo --no-color` 也不变）。
- 两处都要改（dry-run 回显那处与实拉那处），保持同构。
- `default` 抛错即可，不要自己 `exit`——让 `$ErrorActionPreference='Stop'` 走既有失败路径。
- 错误信息里要带实际收到的值，便于排障。

## 断言要改（把上一棒刚加的两条反过来）

上一棒加的这两条**语义已过期，必须改**：

- `worker entry dispatches case-insensitively for claude`
- `worker entry dispatches case-insensitively for codex`

改成 fail-closed 断言（断言名也要换，别留旧名误导）：

- `-Cli CLAUDE` → **退出码非 0**，且 stderr/输出里含 `unsupported -Cli value`，且**不含** `claude --dangerously-skip-permissions`、**不含** `codex --yolo`
  断言名建议：`worker entry rejects miscased cli instead of silently dispatching`
- `-Cli CODEX` → 同上，非 0 退出

**保留不动**：`-Cli claude` / `codex` / `zcode` 三条规范大小写的既有断言必须继续绿；`-Cli bogus` 被 ValidateSet 拒的断言也保留。

再补一条**反向证据**断言（钉住"这不是回到静默错派"）：
- `-Cli CLAUDE` 的输出**不得**出现 `codex --yolo`（即证明它没掉进旧的 else 陷阱）。可并进上面那条。

## 教训库全库巡检（候选-5 明文要求的动作）

候选-5 的「建议后续动作」里写死了一步：**修此类 finding 时固定包含"全库扫同类算子"**，不能只改被点名的行。
执行：`rg -n '\-(cin|cne|ceq|in|notin|eq|ne) ' tools/host/ tools/adapters/` （或等价 grep），
把命中里**属于「精确字面匹配 / 枚举派发」语义**的行列进 `findings.md`（新开 F-008），逐行判「已敏感 / 不敏感但无害 / 不敏感且有风险」。
**只登记不顺手改**——超范围的留给 backlog。

## 回填

- `findings.md`：新增 **F-007**（本条返工的根因与处置，级别 P2，状态 resolved）；F-006 处置更新为「经教训复核备料发现与候选-5 冲突，已改为 fail-closed，见 F-007」；新增 **F-008**（全库巡检结果）。
- `lesson_candidates.md`：追加一条候选——「顺带修复不能只看『比原来好』，要先查本仓教训库有没有相反口径的既有结论；候选-5 就是被本卡差点撤销的那条」。
- `progress.md`：日志 + 证据（返工轮 2 的红/绿、巡检输出）。
- 变异点登记表若已填，检查锚点行号是否因本次改动漂移，漂了就更新。

## 完成信号

结构化 DONE，含：两处 switch 的最终代码片、改后的断言名与实跑结果、全库巡检命中清单、
`pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` 末行原文、最终断言数。
