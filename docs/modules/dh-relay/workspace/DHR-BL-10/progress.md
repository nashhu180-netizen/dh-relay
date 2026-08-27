<!-- progress.md — 施工日志 + 证据账本。🟢 边做边记。 -->
# progress — DHR-BL-10

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|------|----|---------|------|--------|
| 2026-08-27 | 主控(Claude Opus) | 摸清 zcode 形态：非 PATH CLI，是 Electron 桌面端内置的 `resources/glm/zcode.cjs`（zcode 0.16.5 / GLM-5.3）。反推出 CLI 独立配置 schema 并跑通无头调用 | E-001 | 落户 + 建工作区 |
| 2026-08-27 | 主控(Claude Opus) | 机器准备：建 PATH shim `%APPDATA%\npm\zcode.cmd`；凭据放进 zcode 私有配置 `~/.zcode/cli/config.json`（与 `~/.claude`、`~/.codex/auth.json` 同构的环境自带认证）；干净 shell 验证 | E-002 | 派 zcode 施工 |
| 2026-08-27 | 主控(Claude Opus) | 用户对话确认档位（标准档 · normal）与接线形态（只接 headless 位）；backlog 立 `DHR-BL-10`；工作区八件套落主树 | E-003 | 开 worktree 派活 |
| 2026-08-27 | 施工worker(zcode) | 接手盘点：步骤 0~4 已由上一棒在 worktree 完成但未记日志（**失序补录**于本行）；复验单测 36 断言 SUITE PASS、全量 16 套件 `RELAY ALL PASS (SKIPPED: 1)`；HEAD=master(f04d797) 无需 rebase | E-004/E-007 | TDD 红态实证 |
| 2026-08-27 | 施工worker(zcode) | 红态实证：仅回退 worker-entry 至 HEAD 跑新套件 → 恰好 zcode 三断言 FAIL（bogus 拒绝旧码本就通过）；pop 后转绿。红→绿闭环成立 | E-005 | as-built 同步 |
| 2026-08-27 | 施工worker(zcode) | as-built/relay-psmux-host.md 两处明写 `claude\|codex` 的行（实际在第 9/57 行，非 task_plan 所记 21 行）改为 `claude\|codex\|zcode`，57 行补 zcode headless 一次性形态说明；未动其余内容（含过时的套件计数表→F-005） | E-010 | G3 真实拉起 |
| 2026-08-27 | 施工worker(zcode) | G3 沙盒真实拉起一棒 zcode worker（夹具 receipt-A1 + %TEMP% 隔离 run root）：按 brief 四步走完，checkpoint/result/handoff/session-tail 四工件落盘、无 .partial 残留，冻结 schema 双 ok=True，`cli exited 0` | E-009 | 密钥闸 |
| 2026-08-27 | 施工worker(zcode) | 密钥闸：新增行口径零命中；naive 全 diff grep 唯一命中有甄别为既有 F-003 prose 上下文行（F-004 登记），另登记 as-built 计数表快照过时（F-005） | E-008/F-004/F-005 | 回填记录收口 |
| 2026-08-27 | 第1棒(zcode/Flash) | 返工轮1 任务A完成：`-Cli CLAUDE`/`-Cli CODEX` 两条大小写派发断言加入并 PASS；随后步骤 0~8 后续返工项中途因网络错误中断（ECONNRESET，非逻辑失败），工作树完好无 stash；遗留 stub 坏体由第2棒接手 | rework-round1-cont.md「已完成/当前实际状态」 | 第2棒 B-fix |
| 2026-08-27 | 第2棒(zcode/Flash) | 接棒核态：39 断言唯一红=`worker entry launches zcode with prompt-form argv`，根因同 cont-brief 诊断（stub 体从未落盘 argv、`Replace('CAP',…)` 空操作）。修复：占位符改真实存在的 `__ARGV_CAPTURE__`，stub 落盘 `$Rest -join ' '` 后 `exit 0`。复跑 `SUITE PASS`（断言数 39） | E-012 | 有效性自证 |
| 2026-08-27 | 第2棒(zcode/Flash) | stub 有效性自证：落盘内容临时换成不含 `--prompt` 的固定串 → 恰好该断言红（`SUITE FAIL (1)`）→ 还原 → 复跑 `SUITE PASS`。自证期间改动未留痕 | E-012 | 任务D变异 |
| 2026-08-27 | 第2棒(zcode/Flash) | 变异点验证：worker-entry:31 `zcode --prompt`→`--invalid` 施加后恰 `zcode dry run prints prompt-form command without launch` 红（`SUITE FAIL (1)`）；SHA256 施加/还原两值不同，还原后 hash 与 diff stat 回到变异前（6 行改动形态）。九字段已登记 review.md「有效单测·变异点登记」，hash 口径=文件 SHA256（非 commit sha，施工 worker 无提交权） | E-013 / review.md 变异点表 | 任务C复跑 |
| 2026-08-27 | 第2棒(zcode/Flash) | G3 真实拉起复跑一棒 zcode worker（夹具 receipt-A1 + %TEMP% 隔离沙盒 + 一次性四步 brief）：exit code **0**，checkpoint/result/handoff/session-tail 四工件齐、零 `.partial`，schema 身份七字段与夹具 receipt 一致；证据七份已拷入仓 evidence/e2e/（拷前逐份密钥扫描零命中），**不再依赖临时目录**（沙盒用后即清） | E-011 | 任务E回填 |
| 2026-08-27 | 返工轮2(zcode/Flash) | 收敛 F-007 备料时主控发现 F-006 处置与教训库候选-5 冲突，派返工轮2 反转：①断言先改 fail-closed 立红态——恰新 2 断言 FAIL、其余 37 绿（对旧不敏感 switch 正确变红=断言有效）；②worker-entry 两处 `switch` 翻转 `-CaseSensitive` + `default throw`，复跑 39 断言 SUITE PASS；③全量回归通过；④候选-5 固定动作全库算子巡检完成，字面/枚举比对零"不敏感且有风险"。ID 偏差补记：brief 写「新增 F-007/F-008」，但两号已被返工轮1占用，顺延为 **F-009/F-010**；变异点锚 worker-entry:31 行号未漂移（仍含 `zcode --prompt $prompt`）、review.md 登记表无需更新 | E-014/E-015/E-016/E-017/F-009/F-010 | 见文末 DONE 块 |
| 2026-08-27 | 返工轮3(zcode/Flash) | 任务 A 落地途中 brief 处方前提被本仓实测推翻：按处方落 `stderr+exit 4` 后绿相位首跑恰新断言红（E-018）——`exit` 在真实 `-NoExit` launcher 的 `-File` 形态**不退进程**；三段对照诊断（E-019）定性后，两处 default 定稿 `[Console]::Error.WriteLine(...)；[Environment]::Exit(4)`（`exit 4` 换硬退出机制、错误文案与退出码语义不变），三条正常分支体逐字未动、两处同构 | E-018/E-019/F-013 | 红相位自证 |
| 2026-08-27 | 返工轮3(zcode/Flash) | 任务 B：新增真实 launcher 形态断言 `worker entry exits nonzero under real -NoExit launcher on miscased cli`——Start-Process 按 run-dogfood 同形（`pwsh -NoProfile -NoExit -File <entry> … -Cli CLAUDE -DryRun`）拉起，有界等待≤15s 轮询，断言「进程已退 ∧ 退出码=4」，finally 兜底 kill＋Dispose。红相位自证：default 临时回滚 throw → 该断言**唯一变红**（SUITE FAIL(1)，子进程存活至超时由 finally 杀灭）→ 还原定稿后内容核验（Exit(4)×2／throw×0）→ 复绿 SUITE PASS(40) | E-020/E-021 | 全量回归 |
| 2026-08-27 | 返工轮3(zcode/Flash) | 任务 C/D：findings 新增 **F-011**（主控裁定3被复核修正·接受）/ **F-012**（复核方观察·已评估不采纳）/ **F-013**（成功路径尾部 `exit $code` 在 -File+-NoExit 下同样不终结进程·范围外只登记）；F-009「已知局限」撤销；L-005 教训候选追加；visual_map 补返工轮2/3 两步骤行置 present；变异点锚点复核：worker-entry:31 行号未漂移（行内仍含 `zcode --prompt $prompt`）、review.md 登记表无需更新；全量回归 16 套件通过；各阶段前后残留 pwsh 扫描均为 0 | E-022/F-011~F-013/L-005 | 文末 DONE 块 |
| 2026-08-27 | 返工轮4(zcode/Flash) | 任务 B：仓外探针实证引号缺陷真实后果——`-DryRun` 开关被整个吞进 `-WorkDir` 值（子进程 `bound.DryRun=False`），即返工轮3 断言实际一直打**第 34 行**而非主控认定的第 31 行（偏差已 F-018 登记）；修复两端配对引号后复跑 40 断言 SUITE PASS（该断言自此才真正按意图覆盖第 31 行） | E-023 | 任务A |
| 2026-08-27 | 返工轮4(zcode/Flash) | 任务 A：第 34 行实拉分支 default 直接断言落地——三哨兵 stub（claude/codex/zcode 各写己方哨兵文件后 exit 0）+ 真实 launcher 形态（`-NoExit -File`、**无 -DryRun**）拉起 `-Cli CLAUDE`/`CODEX`，断言「进程真退 ∧ 退出码=4 ∧ claude/codex 哨兵均不存在」，42 断言 SUITE PASS；变异对照：临时去掉第 34 行 `-CaseSensitive` → 恰两新断言红 `SUITE FAIL (2)`，还原后 SHA256 与变异前一致复绿 | E-024/E-025 | 全量回归 |
| 2026-08-27 | 返工轮4(zcode/Flash) | 全量回归 16 套件通过，末行原文 `RELAY ALL PASS (SKIPPED: 1)`（agent-tool=42 断言） | E-026 | 任务C |
| 2026-08-27 | 返工轮4(zcode/Flash) | 任务 C：e2e provenance 复跑一棒真实 zcode worker（exit 0），落 `evidence/e2e/provenance/`（launch-command/process/zcode-session/README 四件套）+ `evidence/e2e/run3-prov/`（本棒八工件）；OS 进程生存期 ⊂ zcode 仓外会话日志窗 ⊃ 工件 written_at 三时间线咬合（RQ-3 收敛，F-016）；rollout jsonl 只记文件名/字节数/mtime，并做本棒归因甄别（编排方会话滚动写入已排除） | E-027/E-028 | 任务D回填 |
| 2026-08-27 | 返工轮4(zcode/Flash) | 任务 D：findings 顺延 **F-014~F-018**（当前最大号 F-013 核过，无偏差）；lesson_candidates 按教训复核裁决修订（L-001/L-003→rejected、L-002/L-004 改措辞）并追加 **L-006**；visual_map 补返工轮4 步骤行；review.md 独立复核区与人类签名区未动（变异点锚 worker-entry:31 复核未漂移，登记表无需更新）；全程各阶段残留 pwsh/node 扫描=0 | F-014~F-018/L-006 | 文末 DONE 块 |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|----|------|-----------|------|------|
| E-001 | probe | `zcode --prompt "..." --cwd <tmp> --json`（经 shim） | observed：返回 `sessionId` / `usage` / `contextWindow=1000000`；另测 `-c` 续会话、写文件+跑 python 均成功；`--max-turns` 报 `Unknown option` | zcode 无头能力可用（F-002 由此登记） |
| E-002 | probe | `pwsh -NoProfile -Command "Remove-Item Env:ZCODE_API_KEY -EA SilentlyContinue; zcode --prompt '只回复两个字：就绪' --no-color"` | pass：输出 `就绪` | zcode 具备与 claude/codex 同构的环境自带认证，worker-entry 无需任何凭据注入 |
| E-003 | decision | 对话内 AskUserQuestion 点选 | observed：接线形态=只接 headless 位；档位=标准档 · `task_type=normal` | 入口闸（宪章#1 / G1）已过，开工获授权 |
| E-004 | test | `pwsh -NoProfile -File tools/tests/relay-agent-tool.ps1`（仓根跑） | pass：末两行 `ASSERTIONS 36` / `SUITE PASS`；含新增 4 条 zcode/bogus 断言全绿，既有 codex dry-run 断言保持绿 | 完成条件 1 / 2 / 3 |
| E-005 | test-red | `git stash push -- tools/host/relay-worker-entry.ps1` → 同上跑套件 → `git stash pop` | observed：旧实现上新断言红——`FAIL worker entry dry run accepts zcode` ×3 条，`SUITE FAIL (3)`，`ASSERTIONS 36`；恢复后 E-004 全绿 | TDD 红→绿闭环（测试先于实现） |
| E-006 | probe | `(Get-Command ./tools/host/run-dogfood.ps1).Parameters['WorkerCli'].Attributes.Where({$_.ValidValues}).ValidValues` | pass：输出 `claude,codex,zcode`（默认值 `'claude'` 保留在文件内未动） | 完成条件 4 |
| E-007 | test | `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | pass：末行原文 `RELAY ALL PASS (SKIPPED: 1)`，16 个 `=== <suite> ===` 头；唯一 skip=`relay-psmux-real`（需 `RELAY_REAL_TERMINAL=1` 起真实窗口） | 完成条件 5 |
| E-008 | gate | `git diff \| grep -E '^\+' \| grep -n -i -E "apikey\|api_key\|sk-\|Bearer \|Program Files\|\.zcode"` | pass：**零命中**（naive 全 diff 口径唯一命中=既有 F-003 prose 上下文行，见 findings F-004） | 完成条件 6（宪章#6 密钥红线） |
| E-009 | e2e | 沙盒 `%TEMP%\relay-zcode-e2e-1787826855`：复制夹具 receipt → 写一次性 brief → `pwsh -NoProfile -File tools/host/relay-worker-entry.ps1 -Receipt …FAKE-RUN\launches\L-0001.json -BriefRef …brief.md -Cli zcode -WorkDir …work` | observed：exit code **0**；`attempts/A/1/` 下 checkpoint.json.tmp / result.json.tmp / handoff.md / session-tail.txt 齐、零 `.partial`；按 suite 同法（`ConvertFrom-Json -AsHashtable -DateKind String`）`Test-RelayCheckpoint`/`Test-RelayResult` 均 ok=True；result 全文已随 DONE 输出待人验 | 完成条件 7（G3 人验项·AI 侧证据） |
| E-010 | docs | `grep -n "zcode" docs/modules/dh-relay/as-built/relay-psmux-host.md` | present：2 处命中（第 9/57 行），57 行附「headless 一次性形态、进程跑完即退不驻留」说明 | brief「触及子系统」as-built 同步义务 |
| E-011 | e2e | G3 复跑（2026-08-27）：沙盒 `%TEMP%\relay-zcode-e2e-rerun-dfb785b5`；复跑命令（一键可重放，沙盒路径可任换）：①复制 `tools/tests/fixtures/host/receipt-A1.json` → `<沙盒>\FAKE-RUN\launches\L-0001.json`，写一次性 brief；②`pwsh -NoProfile -File tools/host/relay-worker-entry.ps1 -Receipt <沙盒>\FAKE-RUN\launches\L-0001.json -BriefRef <brief> -Cli zcode -WorkDir <沙盒>\work` | pass：exit code **0**；stdout 末行 `[relay-worker] cli exited 0`；证据已入仓 `workspace/DHR-BL-10/evidence/e2e/`（checkpoint.json ← checkpoint.json.tmp、result.json ← result.json.tmp、handoff.md、session-tail.txt、worker-stdout.log、exit-code.txt、one-shot-brief.md 共七份），拷前逐份密钥模式扫描零命中；**不再依赖临时目录** | 完成条件 7（G3 人验项·AI 侧证据）返工轮1 重证 |
| E-012 | test | `pwsh -NoProfile -File tools/tests/relay-agent-tool.ps1`（B-fix 三段：基线→修复→自证还原） | pass：基线 `ASSERTIONS 39 / SUITE FAIL (1)` 唯一红 stub 断言；修复后 `SUITE PASS`(39)；stub 换固定串自证恰该断言红再复绿——断言真实有效 | 返工轮1 任务 B / F-007 收敛 |
| E-013 | mutation | worker-entry:31 施加 `--prompt`→`--invalid` 后同上命令：施加 hash `10EE818DDC8013DB411A6B4405F447AD587CCAB49CB630C0B6A36E0B2621F6BF`，还原 hash `1E68D66B593DFF74ED4FBE6410494C44B97C00C7BE348CFC539264B6EAF52853`（与变异前一致） | observed：唯一红=`zcode dry run prints prompt-form command without launch`（即**断言失败**，变异判定通过）；还原后 `git diff --stat` 回到 6 行改动形态 | 任务 D 变异点登记（review.md 表已填）。返工轮2 核验：31 行行号未漂移、行内仍含 `zcode --prompt $prompt`，锚与登记表继续有效 |
| E-014 | test-red | 只改测试两条断言为 fail-closed（实现未动）后跑 `pwsh -NoProfile -File tools/tests/relay-agent-tool.ps1` | observed：`ASSERTIONS 39` / `SUITE FAIL (2)`，唯一两红=`worker entry rejects miscased cli instead of silently dispatching` / `worker entry rejects miscased codex instead of silently dispatching`——对旧的 `switch($Cli)` 不敏感派发正确变红＝新断言真实有效（候选-1/6 口径的红相证明） | F-009 红→绿闭环的红相 |
| E-015 | test | 实现翻转后同上命令复跑 | pass：`ASSERTIONS 39` / `SUITE PASS`；规范大小写三连（codex/zcode dry-run 打印、stub 抓实拉 argv）与 bogus-ValidateSet 拒绝断言保持绿；报错文案含实际收到的值（断言正则钉 `unsupported -Cli value 'CLAUDE'/'CODEX'`） | F-009 绿相；完成条件 3「分支体逐字不变」维持 |
| E-016 | test | `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | pass：末行原文 `RELAY ALL PASS (SKIPPED: 1)`（唯一 skip 仍为 relay-psmux-real 需真实窗口） | 全量回归无回归 |
| E-017 | probe | 双口径 grep 于 tools/host/ + tools/adapters/：brief 原口径 `\-(cin\|cne\|ceq\|in\|notin\|eq\|ne) ` ＋ 胶连态补扫 `\-(c?notin\|c?in\|c?eq\|c?ne)([^A-Za-z0-9_]\|$)`（仓内单行胶连风格 `-ceq'x'` 必须后者才扫得到）；范围外对照 tools/tests/policy/dogfood 另跑一轮不计入分类 | observed：字面匹配/枚举派发语义全部已用 `-c` 敏感算子（36 处），不敏感命中皆为 null/整数/布尔/空串/单字符比较（大小写不适用）；误报 5 处＝`'not-used-in-p1'` 字面量内含 `-in`。分类明细见 findings F-010 | 候选-5 固定动作执行完毕 |
| E-018 | test-red(observed) | 按 brief 处方落两处 `default{…WriteLine(...);exit 4}` 后跑 `pwsh -NoProfile -File tools/tests/relay-agent-tool.ps1` | observed：`ASSERTIONS 40` / `SUITE FAIL (1)`，唯一红=`worker entry exits nonzero under real -NoExit launcher on miscased cli`——**`exit 4` 在真实 `-NoExit` launcher 的 `-File` 形态下不退进程**，brief「-NoExit 遵守显式 exit」的前提被推翻（其成立面仅限 -Command 形态，见 E-019） | 任务 A 机制修正的直接动因 |
| E-019 | probe | 三段对照诊断脚本（临时 /tmp/diag-noexit.ps1，全部有界等待＋finally kill，未触碰仓内文件）：①同步无 `-NoExit` 裸跑 entry；②`Start-Process pwsh -NoExit -Command 'exit 4'`；③`Start-Process pwsh -NoExit -File <微脚本>`（微脚本=[写 marker]＋末句 `exit 4`），8s 上限轮询 | observed：②exited=True；③marker 已写（脚本完整执行到末句 exit 4）但 exited=False（超时被兜底 kill）。结论：脚本级显式 `exit` 的进程终止保证**依赖形态**——`-Command` 生效、`-File` 不生效；确定性终结须 `[Environment]::Exit(N)` | E-018 的定性依据；findings F-013 成功路径推断的判据 |
| E-020 | test-red | 两处 default 定稿 `[Environment]::Exit(4)` 后，自证红相位：default 临时回滚为 `throw` 再跑同套件 | observed：`ASSERTIONS 40` / `SUITE FAIL (1)`，唯一红=`worker entry exits nonzero under real -NoExit launcher on miscased cli`（子进程存活至 15s 上限、由 finally 兜底 kill，无残留）——throw 版既挂 idle 进程又被断言逮住，断言有效性与 Exit(4) 必要性双证 | 任务 B 红相 |
| E-021 | test | 还原定稿后复跑同套件＋内容核验 | pass：`ASSERTIONS 40` / `SUITE PASS`；Select-String `[Environment]::Exit(4)`=2 处、`throw`=0 处；文件 SHA256=`7170F74D060B49C8176CE0C8A84ACA1971EC39096A544685CA7F780F6D381834`（回滚前后一致=真还原） | 任务 A+B 绿相 |
| E-022 | test | `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` 全量回归；另各阶段前后以 Win32_Process 扫描命令行含 `relay-worker-entry`/`relay-test-agent-tool` 的 pwsh 计数 | pass：末行原文 `RELAY ALL PASS (SKIPPED: 1)`（16 套件头齐，唯一 skip 仍为 relay-psmux-real 需真实窗口；agent-tool=40 断言）；残留扫描=0 | 全量无回归＋绝无挂起 pwsh（返工 brief 红线） |
| E-023 | probe | 仓外引号探针（`%TEMP%\dhrbl10-rw4\probe-quotes.ps1`，子进程回显实收参数，缺陷/修复两形态对照，Start-Process 均有界等待） | observed：缺陷形态（`` `"{path}`' ``）子进程实收 `bound.WorkDir=<path>' -DryRun`、`bound.DryRun=False`——`-DryRun` 开关被吞进值里；修复形态（`` `"{path}`" ``）WorkDir 干净、`DryRun=True` | 任务 B 实证；F-018（返工轮3 断言的实打分支与主控前提相反） |
| E-024 | test | `pwsh -NoProfile -File tools/tests/relay-agent-tool.ps1`（任务 A 断言落地后） | pass：`ASSERTIONS 42` / `SUITE PASS`；新增 `worker entry real-launch branch rejects miscased cli without invoking any cli`（-Cli CLAUDE）与 `worker entry real-launch branch rejects miscased codex without invoking any cli`（-Cli CODEX）双绿；既有 40 条全程绿；哨兵 stub 隔离目录 finally 恢复 PATH/PATHEXT＋清目录＋兜底 Kill | 任务 A 绿相；完成条件 10（两处 default 各有直接断言）；F-017 收敛绿相 |
| E-025 | mutation | 临时去掉 worker-entry **第 34 行** `-CaseSensitive`（第 31 行不动）后跑同套件，随后还原 | observed：`ASSERTIONS 42` / `SUITE FAIL (2)`，恰两条新断言红（CLAUDE→`& claude` 拉起 stub→claude 哨兵落盘被逮；CODEX→codex 哨兵落盘被逮；变异进程存活至 15s 上限由 finally 兜底 kill，无残留）；还原后 worker-entry SHA256=`7170F74D060B49C8176CE0C8A84ACA1971EC39096A544685CA7F780F6D381834` 与施加前一致（=E-021 登记值），复跑 42 断言 SUITE PASS | 候选-6 变异对照红相（去掉敏感比对必红）；F-017 收敛闭环 |
| E-026 | test | `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | pass：末行原文 `RELAY ALL PASS (SKIPPED: 1)`（16 套件头齐，唯一 skip=relay-psmux-real 需 `RELAY_REAL_TERMINAL=1`；agent-tool 段=42 断言） | 全量回归无回归 |
| E-027 | e2e | provenance 复跑（仓外 `prov-run.ps1`：有界 240s 轮询＋超时 kill 中止不落证据；`Start-Process pwsh -NoProfile -File <entry> … -Cli zcode -PassThru`，存活期抓 Win32_Process 原始命令行；沙盒 `%TEMP%\relay-zcode-e2e-prov-abbfaa4d43ec4f9a898e20d7c251fbc7`） | pass：pid=45680，start=2026-08-27T14:01:49.6083986Z，exit=2026-08-27T14:04:07.3704556Z，**exit code 0**；checkpoint.written_at=14:03:12.4460367Z、result.written_at=14:03:45.1028672Z 均⊂进程生存期；rollout 预快照 3 份，本棒**新增** `model-io-sess_011c9160-3a05-4856-886c-a983d7b5df94.jsonl`（1,158,261 bytes，mtime=14:04:01.1993113Z）落生存期内（预快照已存在的 50e60d0f 末写早于 spawn 2.8s，甄别为编排方会话写入、已排除）；stdout 末行 `[relay-worker] cli exited 0`，stderr 0 字节 | 完成条件 7（G3 人验项）返工轮4 重证；RQ-3 收敛（F-016）；证据落 `evidence/e2e/provenance/`＋`evidence/e2e/run3-prov/` |
| E-028 | gate | provenance 四文件＋run3-prov 八文件逐份值形态模式扫描（`api[_-]?key:值`/`sk-…`/`Bearer …`/`ZCODE_API_KEY=值`/`password=值`/zcode 安装绝对路径）；rollout jsonl 全程只取 Name/Length/LastWriteTime 元信息；收尾残留进程扫描 | pass：全部 SCAN OK 零命中（verdict CLEAN）；`zcode-session.txt` 仅含文件名/字节数/mtime 三列元信息，无任何内容摘录；残留 pwsh/node=0（扫到的唯一进程为扫描脚本自身，即查即逝） | 密钥闸（宪章#6）＋绝无挂起 pwsh（返工 brief 红线） |

## 返工轮2 · 结构化 DONE（2026-08-27，zcode/Flash）

按 review-briefs/rework-round2-case.md「完成信号」逐项：

**① 两处 switch 最终代码片**（worker-entry 第 31 行 dry-run / 第 34 行实拉，行内追加 default、物理行号未变）：

```powershell
# L31（dry-run 回显处）
switch -CaseSensitive ($Cli){'claude'{Write-Host "claude --dangerously-skip-permissions $prompt"}'codex'{Write-Host "codex --yolo $prompt"}'zcode'{Write-Host "zcode --prompt $prompt --mode yolo --no-color"}default{throw "relay-worker-entry: unsupported -Cli value '$Cli' (case-sensitive: claude|codex|zcode)"}}
# L34（实拉处）
switch -CaseSensitive ($Cli){'claude'{& claude --dangerously-skip-permissions $prompt}'codex'{& codex --yolo $prompt}'zcode'{& zcode --prompt $prompt --mode yolo --no-color}default{throw "relay-worker-entry: unsupported -Cli value '$Cli' (case-sensitive: claude|codex|zcode)"}}
```

三条分支体（含 zcode 的 `--prompt … --mode yolo --no-color`）逐字未动；`default` 只 throw 不 exit，错误信息带实际收到的值。

**② 改后的断言名与实跑结果**：
- 旧两条（语义过期已删）：`worker entry dispatches case-insensitively for claude/codex`
- 新两条：`worker entry rejects miscased cli instead of silently dispatching`（-Cli CLAUDE）、`worker entry rejects miscased codex instead of silently dispatching`（-Cli CODEX）——各断言条件＝退出码非 0 ∧ 输出含 `unsupported -Cli value '<实际值>'` ∧ 不含 `claude --dangerously-skip-permissions` ∧ 不含 `codex --yolo`（反向证据——证明没掉进旧 else 拉 codex 的陷阱——已并入同一条）
- 实跑：红相位 E-014（恰此两条 FAIL）/ 绿相位 E-015（全绿）。保留不动：规范大小写三条既有断言 + `-Cli bogus` ValidateSet 拒绝断言继续绿。

**③ 全库巡检命中清单**：见 findings **F-010** 与 E-017——已敏感 36 / 不敏感但无害≈30（非字符串语义）/ 不敏感且有风险 **0** / 误报 5。

**④ `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` 末行原文**：`RELAY ALL PASS (SKIPPED: 1)`

**⑤ 最终断言数**：agent-tool 套件 `ASSERTIONS 39`（两换二，总数不变）；全套件 16 个套件头齐全。

补充登记：本卡 ID 偏差（brief 的新增 F-007/F-008 → 实际落 F-009/F-010）见上方日志行；变异点登记表复核无需改动（锚行号未漂移）。

## 返工轮3 · 结构化 DONE（2026-08-27，zcode/Flash）

按 review-briefs/rework-round3-noexit.md「完成信号」逐项：

**① 两处 default 最终代码片**（worker-entry 第 31 行 dry-run / 第 34 行实拉；三条正常分支体逐字未动，物理行号未变）：

```powershell
# L31（dry-run 回显处）
switch -CaseSensitive ($Cli){'claude'{Write-Host "claude --dangerously-skip-permissions $prompt"}'codex'{Write-Host "codex --yolo $prompt"}'zcode'{Write-Host "zcode --prompt $prompt --mode yolo --no-color"}default{[Console]::Error.WriteLine("relay-worker-entry: unsupported -Cli value '$Cli' (case-sensitive: claude|codex|zcode)");[Environment]::Exit(4)}}
# L34（实拉处）
switch -CaseSensitive ($Cli){'claude'{& claude --dangerously-skip-permissions $prompt}'codex'{& codex --yolo $prompt}'zcode'{& zcode --prompt $prompt --mode yolo --no-color}default{[Console]::Error.WriteLine("relay-worker-entry: unsupported -Cli value '$Cli' (case-sensitive: claude|codex|zcode)");[Environment]::Exit(4)}}
```

**⚠ brief 处方偏差声明（实测定稿，非自由发挥）**：brief 处方为 `…;exit 4`（依据复核方「-NoExit 遵守显式 exit」的实测）。本仓首跑即证伪其普适性：`exit` 只在 `-Command` 形态退进程，在真实调用方使用的 `-File` 形态**不生效**（E-018 红相＋E-019 三段对照诊断：微脚本末句 `exit 4` 跑完、marker 已写、进程仍存活）。故机制换为 `[Environment]::Exit(4)`——stderr 文案、退出码语义（4=输入校验失败，对齐 relay-agent-tool.ps1:128 惯例）、fail-closed 方向全部保持处方原意。

**② 任务 B 断言的红/绿实测输出**——断言名：`worker entry exits nonzero under real -NoExit launcher on miscased cli`（Start-Process 按 run-dogfood 同形 `pwsh -NoProfile -NoExit -File <entry> … -Cli CLAUDE -DryRun` 拉起，≤15s 有界轮询，断言「已退出 ∧ 退出码=4」，finally 兜底 kill＋Dispose）：

```text
红相位（default 临时回滚 throw，E-020）：
FAIL  worker entry exits nonzero under real -NoExit launcher on miscased cli
ASSERTIONS 40
SUITE FAIL (1)
绿相位（还原定稿 [Environment]::Exit(4)，E-021）：
PASS  worker entry exits nonzero under real -NoExit launcher on miscased cli
ASSERTIONS 40
SUITE PASS
```

内容核验：还原后 Select-String `[Environment]::Exit(4)`=2、`throw`=0；SHA256=`7170F74D060B49C8176CE0C8A84ACA1971EC39096A544685CA7F780F6D381834` 与回滚前一致。既有 39 条断言全程绿。

**③ findings 新增编号与摘要**（现有最大号为 F-010，顺延无偏差）：
- **F-011**（P3，resolved）：主控裁定 3 被复核修正·主控接受——CLI 分派同为冻结枚举、`-ceq` 本身符合候选-5，真错是 else 分支不完备（把「不是精确 claude」当成「必为 codex」），非算子选错。
- **F-012**（P3，已评估不采纳）：复核方「新增 zcode 应独立验收」观察如实记录但不采纳——zcode 才是本卡主交付，大小写修复是接线副产物，复核方缺卡片上下文致主次颠倒。
- **F-013**（P3，open，范围外只登记）：成功路径尾部 `exit $code`（worker-entry:35）在同一 `-File`+-NoExit 形态下同样不终结进程，属 DHR-BL-1/BL-6 痛点域，建议 backlog 消费。
- **F-009 更新**：「已知局限」（大小写拒绝不可入套件）撤销——任务 B 证明有界等待＋退出码断言即可安全覆盖真实 launcher 形态。

**④ 全量回归末行原文**：`RELAY ALL PASS (SKIPPED: 1)`（16 套件头齐，唯一 skip=relay-psmux-real 需 RELAY_REAL_TERMINAL=1）

**⑤ 最终断言数**：agent-tool 套件 `ASSERTIONS 40`（39+1 新增）；全套件 agent-tool 段同样回读 40。

**⑥ 无残留 pwsh 确认**：各阶段前后以 Win32_Process 扫描命令行含 `relay-worker-entry`/`relay-test-agent-tool` 的 pwsh 进程，计数均为 **0**；红相位挂住的子进程由测试 finally 兜底 kill 自证过（超时→Kill→WaitForExit）。仓内文件零遗留改动（仅任务 A/B 的定稿 diff 与本文档回填），未做任何 commit/stash/reset。

补充登记：visual_map 顺带补上返工轮2 缺登记的步骤行（该轮证据 E-014~E-017 已在账，行当时漏记）；变异点登记表锚点 worker-entry:31 行号与行内锚串复核无漂移，登记表无需更新。

## 返工轮4 · 结构化 DONE（2026-08-27，zcode/Flash）

按 review-briefs/rework-round4-line34.md「完成信号」逐项：

**① 任务 A：断言名与红/绿实测输出**（第 34 行实拉分支 default 的直接断言；三哨兵 stub：`claude.ps1`/`codex.ps1`/`zcode.ps1` 各往己方哨兵文件写标记后 `exit 0`；真实 launcher 形态 `pwsh -NoProfile -NoExit -File <entry> … -Cli CLAUDE/CODEX`，**不传 -DryRun**，≤15s 有界轮询，finally 恢复 PATH/PATHEXT＋清临时目录＋兜底 Kill）：

```text
绿相位（E-024，实现未动）：
PASS  worker entry real-launch branch rejects miscased cli without invoking any cli
PASS  worker entry real-launch branch rejects miscased codex without invoking any cli
ASSERTIONS 42
SUITE PASS
红相位（E-025，变异=临时去掉第 34 行 -CaseSensitive，第 31 行不动）：
FAIL  worker entry real-launch branch rejects miscased cli without invoking any cli
FAIL  worker entry real-launch branch rejects miscased codex without invoking any cli
ASSERTIONS 42
SUITE FAIL (2)
还原后：worker-entry SHA256=7170F74D060B49C8176CE0C8A84ACA1971EC39096A544685CA7F780F6D381834（与施加前=E-021 登记值一致），复跑 SUITE PASS
```

变异机理自证：`-CaseSensitive` 去掉后 `CLAUDE` 命中 `'claude'` 分支 → `& claude` 被 PATH stub 截获 → claude 哨兵落盘 + 进程存活至 15s 上限 → 「退出码=4 ∧ 哨兵不存在」两条件同时破，恰两新断言红、其余 40 条绿。

**② 任务 B：前后写法**（`tools/tests/relay-agent-tool.ps1` 返工轮3 断言的 ArgumentList）：

```text
前（不配对）：'-WorkDir',"`"$(Join-Path $root 'work')`'"   ← 开头转义双引号、结尾转义单引号
后（配对）  ：'-WorkDir',"`"$(Join-Path $root 'work')`""
探针实测（E-023）：缺陷形态下子进程实收 bound.WorkDir=<path>' -DryRun、bound.DryRun=False——-DryRun 开关被吞进值；
修复后 WorkDir 干净、DryRun=True。复跑 40 断言 SUITE PASS（此时尚未加任务 A 断言）。
⚠ 主控前提偏差（F-018 登记）：返工轮3 断言虽写了 -DryRun，但因该缺陷实际一直打第 34 行；修复后它才真正覆盖
第 31 行（其本意），第 34 行由任务 A 断言接管——最终两处 default 各有直接断言（完成条件 10），无覆盖真空期
（修复前第 34 行有返工轮3 断言误打误撞覆盖、修复后有任务 A 断言覆盖）。
```

**③ 任务 C：provenance 落点与三条时间线实际值**（一律 UTC）：

```text
落点：docs/modules/dh-relay/workspace/DHR-BL-10/evidence/e2e/provenance/（launch-command.txt / process.txt / zcode-session.txt / README.md）
      + 本棒工件 evidence/e2e/run3-prov/ 八份（checkpoint/result/handoff/session-tail/one-shot-brief/worker-stdout/worker-stderr/exit-code）
① OS 进程账：pid=45680，start=2026-08-27T14:01:49.6083986Z，exit=2026-08-27T14:04:07.3704556Z，exit_code=0
   （存活期抓 Win32_Process 原始命令行，见 launch-command.txt）
② zcode 仓外会话日志：model-io-sess_011c9160-3a05-4856-886c-a983d7b5df94.jsonl
   1,158,261 bytes，mtime=2026-08-27T14:04:01.1993113Z——spawn 时预快照中不存在（全新）、末写在进程退出前
   （预快照已存在的 50e60d0f 末写早于 spawn 2.8s，甄别为编排方交互会话滚动写入，透明排除；只记元信息，零内容摘录）
③ 协议工件 written_at：checkpoint=14:03:12.4460367Z，result=14:03:45.1028672Z
咬合：③ ∈ ① ⊂ ②（written_at 落进程生存期中段；进程整段生存期落 zcode 会话文件创建～末写窗内）。
交叉验证法与伪造难度分析见 provenance/README.md。密钥闸：12 份文件逐份值形态扫描 CLEAN（E-028）。
```

**④ findings 新增编号**（现有最大号 F-013，先核后顺延，无偏差）：**F-014**（RQ-1 最终处置·用户已授权→resolved）/ **F-015**（RQ-2 处置·条件6重写+6b→resolved）/ **F-016**（RQ-3 处置·provenance 已补→resolved）/ **F-017**（教训复核判违反候选-1/5/6/12 收敛登记→resolved）/ **F-018**（任务 B 引号缺陷→resolved）。**F-013 保持 open**（成功路径 `exit $code` 在 `-NoExit -File` 下同样不终结进程，范围外，转 backlog 消费）。

**⑤ `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` 末行原文**：`RELAY ALL PASS (SKIPPED: 1)`（16 套件头齐，唯一 skip=relay-psmux-real 需 `RELAY_REAL_TERMINAL=1`；agent-tool 段回读 42 断言）

**⑥ 最终断言数**：agent-tool 套件 `ASSERTIONS 42`（40+2 新增：CLAUDE/CODEX 实拉分支各一）。

**⑦ 无残留 pwsh 确认**：任务 A 两次红相挂住的子进程均由测试内 finally 兜底 Kill（超时→Kill→WaitForExit）；任务 C 复跑有界 240s 内正常退出；收尾以 Win32_Process 扫描命令行含 `relay-zcode-e2e-prov|relay-test-agent-tool|relay-worker-entry|relay-clisentry|dhrbl10-rw4` 的 pwsh/node，计数 **0**（唯一命中为扫描脚本自身进程）。仓内零遗留改动=任务 A/B 定稿 diff + 本轮回填文档 + provenance/run3-prov 新证据目录；未做任何 commit/stash/reset。
