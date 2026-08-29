<!-- dh:v1 -->
# DHR_32 · Progress

- 2026-08-29 主控（claude-fable-5 主会话）：G01-P5 过闸落档、`DHR-B-22` B-调整落档；建工作区 8 件套；任务类型冻结 normal。用户外出，代决策授权见 DevPlan §0.2 B-22。
- 2026-08-29 主控：B-22 预审回收（opus·Herdr pane w1:p7·`rev-b22`，23 条），主会话独立复算 P1 事实后裁决——P1/P2 全采纳、P3-1① 驳回；DevPlan/brief/task_plan 已按裁决回写。worktree 依赖已装（`npm install` exit 0）。下一步：worktree 同步 master 后派 codex terra high 施工。
- （worker 施工记录从此往下追加）

## Worker construction log

- 2026-08-29 worker：已阅读工作树根 `AGENTS.md` 的编排协议段，以及本卡 `brief.md` / `task_plan.md` / `findings.md`。本节点仅施工 DHR_32；不改 DevPlan、不启动后续节点、不做复核。
- 2026-08-29 worker：按步骤 1 开始本机五入口只读审计。所有 `Get-Command`、`--version`、`--help`、目录名清单和字段名提取均为只读；不执行 login/logout 或会刷新凭据的命令。`codex login status` 被计划作为只读身份查询，不触发凭据刷新；若实测异常将停止并记为不可证。
- 2026-08-29 worker：步骤 1 已取得只读事实（未落 shim 正文）：`codex` / `codex-ninth` 可运行且均报 `codex-cli 0.150.1`；`claude` / `claude-grok` 均报 `2.1.251 (Claude Code)`；`claude5` 指向的 CLI 文件不存在，版本与能力均不可证。`codex login status` 为只读查询，返回已通过 ChatGPT 登录；`codex-ninth login status` 返回未登录。配置目录只读列名与字段名审计已完成，未读取或记录任何凭据值。
- 2026-08-29 worker：**blocked**。复现：`Get-Command claude-grok -All` 返回 `CommandType=Function`，而 `where.exe claude-grok` 返回 `where_exit=1`。这与步骤 3 的 `where.exe` alias 校验和步骤 5 的五入口 golden 必须 `resolveAlias:true` 通过冲突。已写 `findings.md` 的 `BLOCKED-1`；依据施工说明书「卡住怎么办」，停止在步骤 1，不创建注册表/schema/fixture/测试、不写用户级注册表、不提交。
- 2026-08-29 主控：BLOCKED-1 裁决取①（两级解析：where.exe → pwsh Get-Command 受控只读兜底），task_plan 步骤 3 规则 6 已修订，evidence 需补登记每入口解析形态。worker 继续施工。
- 2026-08-29 worker：步骤 1 完成。已新建 `evidence/audit-{codex,codex-ninth,claude,claude-grok,claude5}.md`；每份均登记解析形态、版本/产品、只读配置结构、身份信号、能力位、quota、fallback、Herdr 与 Linux 延后。`claude-grok` 明确登记为 `function`，`where.exe` 不命中而受控 `pwsh Get-Command` fallback 可解析；其余入口按 evidence 记录的 executable/cmd-shim/ps1-shim/function 形态解析。未收录 shim 正文或凭据值。
- 2026-08-29 worker：步骤 2--5 完成。新增 closed schema、fail-closed validator、五入口 golden 与五组 negative fixture、`profiles.test.mjs`；`package.json` 仅在 `scripts.test` 末尾追加 `test/profiles.test.mjs` 一个 token。`codex-ninth` 的非家目录配置以 `${CLI_PROXY_HOME}` 模板登记；测试仅注入已审计的实际只读根，未写环境或配置。
- 2026-08-29 worker：有效单测变异。变异前 `validate-profiles.mjs` SHA-256 = `14FBAEDE62A52BF67F5A248AC1ECBF8FAD3D08EF72128968A2ADBE92A6E3D6C2`。临时短路 `E_CREDENTIAL_FIELD` 分支后运行 `node --test test/profiles.test.mjs --test-name-pattern "negative-credential-field"`：exit 1；目标反例由预期 `E_CREDENTIAL_FIELD` 退化为 `E_SCHEMA`，因此红。恢复原分支后 SHA-256 仍为 `14FBAEDE62A52BF67F5A248AC1ECBF8FAD3D08EF72128968A2ADBE92A6E3D6C2`，随后 `node --test test/profiles.test.mjs`：8 pass / 0 fail。
- 2026-08-29 worker：步骤 6 完成。写入 `%USERPROFILE%\\.dh-relay\\executor-profiles.json` 前 `Test-Path=False`，故无备份；写后 SHA-256 = `55C9361AA8D2069AE72CBFFDE7A7F4A63FCC3977786C8D5BCBEC0CEB1DD51100`。
- 2026-08-29 worker：步骤 7 凭据扫描命令与结果：
  - 仓内：`rg -n -e "sk-[A-Za-z0-9_-]{16,}" -e "eyJ[A-Za-z0-9_-]{10,}" -e "Bearer \\S+" -e "[A-Fa-f0-9]{40,}" -e "[A-Za-z0-9+/_-]{40,}={0,2}" -e "api[_-]?key" -e "(?i)token" --glob "docs/modules/dh-relay/workspace/DHR_32/**" --glob "relay-core/profiles/**" --glob "relay-core/test/profiles.test.mjs"`：exit 0；命中均已逐类核对为规则自述（brief/task_plan/review 与 validator/test 黑名单）、测试样例（两份 credential negative fixture）、或白名单允许的 shim 环境变量名（仅名、无值）；无其他命中。
  - 仓外：`rg -n -e "sk-[A-Za-z0-9_-]{16,}" -e "eyJ[A-Za-z0-9_-]{10,}" -e "Bearer \\S+" -e "[A-Fa-f0-9]{40,}" -e "[A-Za-z0-9+/_-]{40,}={0,2}" "$env:USERPROFILE\\.dh-relay\\executor-profiles.json"; Get-FileHash "$env:USERPROFILE\\.dh-relay\\executor-profiles.json"`：rg exit 1（零命中，符合预期）；hash 为 `55C9361AA8D2069AE72CBFFDE7A7F4A63FCC3977786C8D5BCBEC0CEB1DD51100`。
- 2026-08-29 worker：步骤 8 其余机器证：`node tools/audit-contracts.mjs` exit 0（未登记开口 0、$ref 失败 0、厂商 token 违规 0、meta-schema 拒绝 0）。`node --test test/runtime.test.mjs` exit 0（26 pass / 0 fail）。
- 2026-08-29 worker：**blocked**。全量 `npm test` 两次终态均 exit 1、191 tests / 190 pass / 1 fail；第一次为 `runtime.test.mjs` detached-host 用例 `kill ESRCH`，第二次为 `agent-node.test.mjs` 批4③ `settledState` 30000ms 超时。未将单跑通过误报为全量回归通过；已写 `findings.md` 的 `BLOCKED-2`，停止于步骤 8，未执行提交。
- 2026-08-29 主控：BLOCKED-2 裁决取①——master 基线独立复算同样红（runtime.test.mjs detached-host kill ESRCH），坐实既有环境抖动；机器门槛改判见 findings，抖动记 F-2 留维护卡。指示 worker 完成步骤 8 提交。
- 2026-08-29 worker：提交前核对。`git status --short` 仅见 allowed-paths 内的 `workspace/DHR_32/{findings,progress,task_plan,evidence/**}`、`relay-core/profiles/**`、`relay-core/test/profiles.test.mjs` 与 `relay-core/package.json`；无范围外项。`git diff --check` exit 0（无空白错误）。`relay-core/package.json` diff 仅为 `scripts.test` 命令末尾追加 `test/profiles.test.mjs` 一个 token；`git diff --stat -- relay-core/profiles/validate-profiles.mjs` 无额外输出，确认有效单测变异恢复后无残留差异。

## DONE

- 完成条件 1（机器证）：达成。五个 Profile 均有审计 evidence；`validateProfiles` 对 golden 执行 config/alias 解析，`claude-grok` 按裁决走 `where.exe` 后的只读 `pwsh Get-Command` fallback。不可证身份未写入 `expected_identity`，且不作为账号身份验收依据。
- 完成条件 2（字段闭集与零凭据）：达成。schema entry 与顶层均 `additionalProperties:false`；五组 negative fixture、credential field/value 拒绝与仓外注册表零命中见步骤 5/7 记录。
- 完成条件 3（脱敏工件）：达成。evidence 只含白名单路径、字段名、掩码身份和 shim 环境变量名；无 shim 正文或凭据值。仓内命中均已分类，无其他项。
- 完成条件 4（能力位）：达成。对所有 golden 中 `supported` 位，`profiles.test.mjs` 均交叉断言到对应 `audit-<alias>.md` 的命令依据；Claude 无机器只读如实标 `unsupported`，claude5 不可执行如实标 `unproven`。
- 验证结论：新增 `node --test test/profiles.test.mjs` 初版为 8/8 绿，复核轮1返工后为 12/12 绿；两次有效单测均红后恢复且哈希一致；`node tools/audit-contracts.mjs` 为 0 违规；`node --test test/runtime.test.mjs` 为 26/26 绿。全量 `npm test` 如实为两次 190/191、非确定性环境抖动，详见 `findings.md` 的 `BLOCKED-2`（已裁决）和 `F-2`；不写作全绿。
- 未决/不可证：Linux 入口均延后；codex 主账号主体与 claude-grok/claude5 主体不可证；codex/claude 主入口 quota 样本缺；claude5 alias/config 可解析但目标 CLI 当前不可执行；quota detector 定义留 DHR_33，本卡不预置 ID。上述均已落入对应 evidence/findings，未伪造。

## Rework 1 closure

- 2026-08-29 worker：按 `rework-1.md` A/B 完成返工。`herdr.codex.ninth` 移除不可在真实环境展开的 `config_fingerprint_rule`；schema 的 `path_template` 已收紧为 `${VAR}` 开头；新增 username-path、unresolved-alias 反例，credential 两份反例已改为除违规点外合法的 entry；validator 补 alias CommandType 限定和 `headless_supported` 一致性拒收。
- 2026-08-29 worker：能力证据断言已收窄到 `## 能力位` 内同一 `` `<capability>` `` 行。`supported` 行须含对应开关且无否定词；`unsupported`/`unproven` 行须显式含否定词。缺 `expected_identity` 的 golden Profile 现要求对应 evidence 含「不可证」。
- 2026-08-29 worker：B 项补录完成：claude evidence 含可复跑、只输出掩码的身份探测命令；五份 evidence 均含拉起方式约束和 win32/Linux 保守表达；codex fallback 标明 ninth 未登录不可用；findings 已补 F-3 至 F-10，F-1 已补单点机器只读约束。
- 2026-08-29 worker：真实环境校验（未注入 `CLI_PROXY_HOME` 或其他测试环境变量）：`cd relay-core && node profiles/validate-profiles.mjs profiles/fixtures/golden-registry.json` 输出 `PASS`、exit 0；仓外 `%USERPROFILE%\\.dh-relay\\executor-profiles.json` 同命令输出 `PASS`、exit 0。仓外注册表已从新 golden 重写；旧 hash `55C9361AA8D2069AE72CBFFDE7A7F4A63FCC3977786C8D5BCBEC0CEB1DD51100`，已备份至 `%USERPROFILE%\\.dh-relay\\executor-profiles.json.bak-20260829-1113`，新 hash `E5F8A8AB733BF80DE92F1FF2EEB6015C6463C3FA30A10DEDCD03AAB7D8118F99`。
- 2026-08-29 worker：新变异有效单测。变异前 `validate-profiles.mjs` SHA-256 = `8D8A1DE601AD2226AF5BEE236F9B766BD0B4CFFABA88859FF54C4266FE795422`。临时短路 `CREDENTIAL_VALUE` 正则数组后执行 `node --test --test-name-pattern "negative-credential-value" test/profiles.test.mjs`：exit 1，唯一目标反例被错误接受，证明变异有效。恢复后 SHA-256 仍为 `8D8A1DE601AD2226AF5BEE236F9B766BD0B4CFFABA88859FF54C4266FE795422`；`node --test test/profiles.test.mjs`：12 pass / 0 fail。
- 2026-08-29 worker：`node tools/audit-contracts.mjs`：exit 0；未登记开口 0、$ref 失败 0、厂商 token 违规 0、meta-schema 拒绝 0。返工后凭据扫描沿用步骤7同一组命令：仓内 exit 0 的命中均为规则/复核文档自述、测试 fake 反例或白名单环境变量/字段名；仓外注册表 exit 1（零命中）。无其他项。
- 2026-08-29 主控：复核轮1返工独立复算通过（真实环境 golden/仓外 validate PASS、12/12、注入移除、schema 收紧）。教训复核（rev-dhr32-req 复用实例）零否决+4 漏项，全采纳；其 L-3② 指控经复算不成立（现 HEAD 已含 -CommandType 限定，cmdlet 名实测被拒）。E-3201~05 全部回填「通过」。收口：本工作区文档落盘后 squash 合入 master（按 2026-08-29 用户委托代执行，保留 worktree 待用户 E10 确认），卡转待人验。

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令/来源 | 结果 | 说明 |
|---|---|---|---|---|
| E-3201 | inspect | 五份 `evidence/audit-*.md`；真实环境零注入运行 `validate-profiles.mjs` | pass | golden 与仓外注册表均可解析；不可证身份保持不可证。 |
| E-3202 | test | schema closed-set 与七组 negative fixtures | pass | 初始五组见 task_plan；unresolved-alias 与 username-path 两组来自 rework-1。未知字段、凭据字段/值、路径、alias/config/fallback 反例均 fail-closed。 |
| E-3203 | inspect | 仓内/仓外凭据扫描与脱敏复核 | pass | 仓外注册表零命中；仓内命中均为规则自述或 fake 反例。 |
| E-3204 | test | `node --test test/profiles.test.mjs` | pass (12/12) | supported/unsupported/unproven 与证据行双向绑定。 |
| E-3205 | test | `CREDENTIAL_VALUE` 变异红→还原 hash→绿 | pass | 目标反例变异时被错误接受并使测试红；还原后 12/12。 |

## 收口补录（DHR_62 治理，2026-08-30）

- 教训抽取产出已由 rev-dhr32-req 形成 4 项漏项候选并回流 `knowledge/教训库-候选.md`；不是本轮伪称新跑 miner。
- as-built 现状快照已更新：`as-built/relay-core.md` 增补 Executor Profile/Herdr 现役边界。
- E9 交付汇报已发出：展示内容为五个 Profile 审计结果、定向 12/12、凭据扫描 audit 0，以及 `codex-ninth` 未登录/不可派与移交 DHR_35 的边界；对应 E-3201~E-3205。
- E10 人验证据展示区已发出：展示 `review.md` 的“注册表真实性与脱敏”“ninth 当前状态”两项核验以及 E-3201~E-3205 摘要；用户勾选与 verify 仍为空。
