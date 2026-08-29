<!-- dh:v1 · workspace/DHR_32/rework-1.md · 复核轮1返工清单（主控裁决后，worker 照做） -->
# DHR_32 · 返工清单 1（源：review-code1-opus.md ×13 + review-req-opus.md ×14，主控 2026-08-29 裁决）

> 边界不变：仍以 brief.md allowed-paths 闭集为准。凡下述修改全部落在既有 allowed-paths 内。
> 完成后重跑：新测单跑绿 + `node profiles/validate-profiles.mjs profiles/fixtures/golden-registry.json` **在真实环境（不注入任何环境变量）exit 0** + 仓外注册表同样 exit 0 + audit-contracts 0 违规；输出全部贴 progress.md；变异有效单测按新变异点重做（含前后 sha256）。最后 `git add`（只加 allowed-paths 内文件）+ `git commit -m "fix(dh-relay): DHR_32 复核轮1返工（wt/DHR_32）"`。禁止 push。

## A. 必改（代码/fixture/测试）

1. **[代码P1-1/需求P1-1] 注册表真实环境校验被拒**：
   - `test/profiles.test.mjs` 删掉 `environment: {...CLI_PROXY_HOME...}` 注入与硬编码绝对路径；测试一律用真实 `process.env`。
   - golden 与仓外注册表中 `herdr.codex.ninth` **去掉 `config_fingerprint_rule`**（可选字段）；`audit-codex-ninth.md` 补注「配置指纹不可证：配置根仅经 shim 内部变量可达，仓外未冻结该环境变量」。
   - 修完后 golden + 仓外注册表都必须在**不注入任何变量**的真实环境下 validate exit 0；若其余四条有同样解析失败，逐条按同法处置（真实可解析的保留，解析不了的去掉 rule 并标不可证），全部记 progress。
   - 仓外注册表同步重写 + 重算 sha256 登记 evidence。
2. **[代码P1-3] schema `path_template` 收紧**：pattern 改为必须以 `${VAR}` 开头：`^\$\{[A-Z_][A-Z0-9_]*\}(?:/[A-Za-z0-9._ -]+)+$`（JSON 转义自理）；补 `negative-username-path.json`（裸 `C:/Users/nash/...` 形态）+ `.expect.json` 期望 `E_SCHEMA`。
3. **[代码P1-2+P3-6/需求P3-2] 能力位交叉断言重做**：匹配范围从整份 evidence 收窄到「## 能力位」段内该能力位自己那一行（按 `` `<capability>` `` 定位，定位不到即断言失败）；行内匹配开关正则且不得含否定词（`不支持`/`不可证`/`未发现`/`无`）；补反向断言：`unsupported`/`unproven` 的行内必须出现否定词。`headless` 正则回归规格 `/\bexec\b|-p\b|--print/`。
4. **[代码P2-1/需求P2-6] 凭据 negative fixture 重做成「除违规点外完全合法」**：`negative-credential-field.json` 把 `api_key` 塞进合法 entry 内层；`negative-credential-value.json` 把假 `sk-ant-api03-...`（16+ 位）塞进合法 entry 的 `quota_detector_id` 或 `account_alias`。**有效单测变异点改为短路 `CREDENTIAL_VALUE` 正则数组**，按步骤 5 流程重做红→还原→绿（含 sha256 两算一致），三段贴 progress。
5. **[代码P2-2] `E_UNRESOLVED_ALIAS` 拒收路径补测试**：`negative-unresolved-alias.json`（`command_alias: "dhr32-no-such-alias"`）+ expect；测试循环按 fixture 名对它单独开 `resolveAlias: true`。
6. **[代码P2-3] pwsh 兜底收窄**：`Get-Command` 加 `-CommandType Application,Function,Alias,ExternalScript`（排除 Cmdlet）。
7. **[代码P2-4①] 不可证身份绑定断言**：测试补一条——golden 中缺 `expected_identity` 的 profile，其 `audit-<alias>.md` 必须含「不可证」字样。
8. **[代码P3-1/需求P2-8] 一致性规则**：校验器加 `headless_supported === (capabilities.headless === 'supported')`，违反报 `E_SCHEMA`（或自定错误码），如影响既有 fixture 则同步修。

## B. 必补（evidence / DONE / findings，零代码）

9. **[需求P1-2]** `audit-claude.md` 补可复跑身份探测命令（粘贴即可执行的只读命令：读 `~/.claude/.claude.json` 的 `oauthAccount.email` 字段 + 掩码规则「保留首2字符+`***`+域名」→ `hy***@gmail.com`），掩码规则一并落 evidence。
10. **[需求P2-2]** 五份 evidence 各补一行「拉起方式约束」：可直接 spawn / 必须经 shell（claude-grok=Function 不可直接 spawn）/ 经 `herdr agent start` / 经 `herdr pane run`。
11. **[需求P1-3/代码P2-4②]** `audit-codex.md` fallback 段与 DONE 未决清单补：「`herdr.codex.ninth` 当前未登录，系预登记候选而非可用备选，DHR_33 切换前必须先验登录态」。
12. **[需求P3-1]** evidence（可集中在一份或每份一句）：「`supported_platforms:["win32"]` 是『Linux 未证·延后（B-22①）』的保守表达，非否定结论，P6 阶段闸裁决后需回填」。
13. **[代码P2-3/P3-5]** DONE 未决清单补：「入口可解析 ≠ 目标 CLI 可用（claude5 alias/config 校验通过但目标缺失）」「quota detector 定义留 DHR_33，本卡不预置 ID」。
14. **[汇总] findings.md 追加下列条目**（状态 open，处置栏写清交给谁）：
    - F-3 (P1)：`codex-ninth` 未登录 → design/02 B4 点名的 ninth 交棒与 P6-M1 在 DHR_35 存在阻断风险；待用户回归决定（登录 / 换目标 Profile / 记受限）。
    - F-4 (P2)：注册表无法表达「Profile 当前可派/停用」（字段闭集无 `enabled`），`unverified`+全`unproven`=跳过只是约定；交 DHR_33 前的 B-事件裁决。
    - F-5 (P2)：quota 正反样本 0 条入册，DHR_34 开工前需先定取样方式（真实触发 / 历史日志捞 / 记受限）。
    - F-6 (P2)：codex 侧 fallback 互指成环且 ninth 不可用，fallback 链当前不成立；环检测为 DHR_34 校验器需求。
    - F-7 (P2)：design/05 §7.1 与 DevPlan §2.3 对 `dsh.*` 是否属 executor profile 口径冲突，待 B-事件澄清。
    - F-8 (P2)：`claude-grok` 为网关壳、后端非 Anthropic，注册表机读层不可观察（是否加 `backend_vendor` 类字段交 B-事件）。
    - F-9 (P3)：alias 解析经加载用户 profile 的 pwsh，非 hermetic 且慢（~1.7s/次）；DHR_33 Adapter 应探测一次后缓存。
    - F-10 (P3)：校验器 errors 首错即返（除 schema），建议后续统一收集式；`profiles` 无 `minItems`、ID 无唯一性校验、fallback 可自引用，schema 演进时补。
    - 另在 **F-1 处置栏追加**：「注：当前注册表机器只读可用 Profile 实际仅 `herdr.codex.main` 单点（claude 系全 unsupported、ninth 未登录），两轮换人与机器只读不可兼得的约束带入 DHR_33」。

## C. 不改（裁决说明，勿动）

- 需求P2-1（work_dir_root 传导丢失）：主控已裁决归 DHR_33 承接，DevPlan 由主控回写，worker 勿动 DevPlan。
- 需求P2-5 / P2-7 / P2-8 的字段闭集扩展、需求P1-3(b)：一律不扩字段，走 findings（见 B-14）。
- 需求「五条平铺 vs 三条可派」结构：保留五条占位，可派性经 F-3/F-4 表达。
