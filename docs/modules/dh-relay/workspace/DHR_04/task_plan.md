<!-- dh:v1 · task_plan.md — 施工图（实施方案的家）。🔵 开工那一刻才写，一次性消耗品：跑偏了去 progress.md 记实际，不回头改这里。 -->
# task_plan — DHR_04 隔离/禁改/落点 fail-closed 守卫

> **执行契约头（zero-context）**：执行者默认"只知道本文件 + `brief.md` + DevPlan 任务卡"，不得靠脑补上下文施工；按步骤照做，偏离路线只记 `progress.md` 不回写本文件；每批跑完本批验证并在 `progress.md` 记一行，再继续下一批。

## 要读的上下文 (Context Packet) ★前置

| ID | 来源 (path / url) | 为什么 |
|----|------------------|--------|
| C-001 | `docs/modules/dh-relay/workspace/DHR_04/brief.md` | 终点与边界；完成条件逐字口径 |
| C-002 | `docs/modules/dh-relay/dev_plan/P2-完整流水-开发方案.md` §3.2 `DHR_04` + §2.2 复用与禁改边界 | 唯一权威验收口径 + 落点白名单原文 |
| C-003 | `docs/modules/dh-relay/design/02-完整流水-产品设计与验收.md` 第 269 行 B9 整行 | 允许集、取证方式、两条不得误杀反例的原文定义 |
| C-004 | `tools/relay/contracts/relay-schema.ps1` 第 1~60 行（`New-RelayValidationOk` / `New-RelayValidationError` / `Test-RelayAllowedFields`） | **必须复用**的返回形状与 reason 码风格，不另造一套 |
| C-005 | `tools/relay/tests/relay-runner-failures.ps1` | 套件写法样板：`Assert-True` + `ASSERTIONS n` + `SUITE PASS` + `finally` 清临时目录 |
| C-006 | `tools/relay/tests/relay-contract-reason-coverage.ps1` 第 57 行 `$productionRoots` | 新增 `policy/` 必须进扫描根，否则新 reason 码逃过覆盖闸 |
| C-007 | `tools/relay/tests/run-relay-tests.ps1` 第 3~19 行 `$suites` | 新套件登记位置 |

## 落点约定（先看清楚再动手）

- 新建目录 `tools/relay/policy/`，两个文件：
  - `relay-policy.ps1`——**纯决策函数**，dot-source 使用，不 `exit`、不 `Write-Host`、不碰文件系统以外的东西（读文件只在 CLI 层做）。
  - `Invoke-RelayPolicyCheck.ps1`——`-File` 黑盒 CLI 入口，读夹具/快照 → 调纯函数 → 打印 JSON 报告 → `exit 0/1`。
- 新建套件 `tools/relay/tests/relay-policy.ps1`，夹具目录 `tools/relay/tests/fixtures/policy/`。
- 返回形状统一 `@{ok=$true}` / `@{ok=$false;reason='<kebab码>';violations=@(...)}`；**reason 码必须是字面量字符串**（`relay-contract-reason-coverage.ps1` 会静态扫描，非字面量直接 FAIL）。
- 路径比较一律 **OrdinalIgnoreCase**（Windows 上 `Tools/Relay/x` 与 `tools/relay/x` 是同一文件；对允许集这是正确判等，对禁改集这是更严的方向）。分隔符统一转 `/`，去掉前导 `./`，目录前缀比较必须带尾 `/` 防止 `tools/relayX/` 被 `tools/relay` 前缀误吞。

## 施工步骤 (Steps)　★详细级

> 五拍循环：① 写失败测试 → ② 跑红 → ③ 最小实现 → ④ 跑绿 → ⑤ 在 `progress.md` 记一行。
> 单套件跑法：`pwsh -NoProfile -File tools/relay/tests/relay-policy.ps1`
> 全量回归：`pwsh -NoProfile -File tools/relay/tests/run-relay-tests.ps1` → 末行须为 `RELAY ALL PASS (SKIPPED: 1)`

### 批 A · 路径规范化 + 开发期隔离（完成条件 1）

| # | 改动文件（Create/Modify/Test + 路径） | 怎么改（代码片 / 签名） | 怎么验（命令 → 预期输出） |
|---|---|---|---|
| A1 | Create · `tools/relay/tests/relay-policy.ps1` | 照 C-005 样板搭壳（`Assert-True`/计数/`finally` 清临时目录），先写 4 条**会红**的断言：`Get-RelayPolicyPath 'Tools\Relay\x.ps1'` → `'tools/relay/x.ps1'`；`Test-RelayPolicyUnderRoot 'tools/relayX/a' 'tools/relay/'` → `$false`（前缀不得误吞）；`Test-RelayPolicyUnderRoot 'TOOLS/RELAY/a' 'tools/relay/'` → `$true`；空串/`$null` 输入 → 抛错或返回 `$false`（fail-closed，不得当成"在根内"）。 | `pwsh -NoProfile -File tools/relay/tests/relay-policy.ps1` → 因函数不存在报错、退出码非 0（跑红） |
| A2 | Create · `tools/relay/policy/relay-policy.ps1` | 实现 `Get-RelayPolicyPath([string]$Path)`（`-replace '\\','/'`、去前导 `./`、去首尾空白、空值 throw）与 `Test-RelayPolicyUnderRoot([string]$Path,[string]$Root)`（Root 强制补尾 `/`，`$normalized.StartsWith($root,[StringComparison]::OrdinalIgnoreCase)`；Path 为空返回 `$false`）。文件顶部 dot-source `../contracts/relay-schema.ps1` 以复用 `New-RelayValidationOk/Error`。 | 同上 → 4 条 PASS，`SUITE PASS` |
| A3 | Test+Modify · 同两文件 | 加断言再实现 `Get-RelayDevIsolationVerdict([string[]]$ChangedPaths,[hashtable]$Policy)`：`$Policy` 形如 `@{production_root='tools/relay/';forbidden_roots=@('docs/modules/dh-crew/','skills/','tools/protocol/','.dh-runtime/');doc_roots=@('docs/modules/dh-relay/')}`。判定顺序 fail-closed：命中 `forbidden_roots` → `dev-isolation-violation:forbidden-root`；不在 `production_root` 也不在 `doc_roots` 且以 `.ps1/.mjs/.js/.psd1` 结尾 → `dev-isolation-violation:production-outside-relay`；其余不在任何已知根 → `dev-isolation-violation:unclassified-path`（**默认拒绝**，不放行未知）。`violations` 逐条带 `path` 与 `reason`。断言至少 5 条：全在 `tools/relay/` → ok；混入 `docs/modules/dh-crew/x.md` → `forbidden-root`；混入 `tools/dh-console/a.mjs` → `production-outside-relay`；混入 `.dh-runtime/relay/x.json` → `forbidden-root`；混入 `README-新的.md` → `unclassified-path`。 | 单套件 → 全 PASS |

**批 A 检查点**：`progress.md` 记一行（做了什么 + 断言数 + 证据 ID）。

### 批 B · 业务仓内容白名单（完成条件 2）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| B1 | Create · `tools/relay/tests/fixtures/policy/authority-2cards.json` | 合成 authority snapshot 夹具（**本卡只消费，不生成**）：`{"schema_version":"relay/policy-fixture/v1","run_id":"RUN-FAKE-DHR04","cards":[{"card_id":"FAKE_01","module_slug":"alpha","change_scopes":["src/alpha/","docs/modules/alpha/design/"]},{"card_id":"FAKE_02","module_slug":"beta","change_scopes":["src/beta/util.ts"]}]}` | 文件存在、`ConvertFrom-Json` 不报错 |
| B2 | Test+Modify | 先写红断言再实现 `Get-RelayContentAllowSet([hashtable]$Snapshot)` → 返回**排序去重**的前缀数组：固定两根 `.dh-relay/`、`docs/relay/`；逐卡追加 `change_scopes` 原样 + 由 `module_slug` 派生的四条 dev-harness 路径 `docs/modules/<slug>/dev_plan/`、`docs/modules/<slug>/workspace/`、`docs/modules/<slug>/knowledge/`、`docs/modules/<slug>/as-built/`。**snapshot 缺 `cards` 或某卡缺 `module_slug`/`change_scopes` → throw**（不得静默降级成"只有两根"）。断言：允许集含 `src/alpha/`（卡授权的业务代码路径）、含 `docs/modules/beta/workspace/`、**不含** `docs/modules/alpha/` 裸根、缺字段 snapshot 抛错。 | 单套件 → 全 PASS |
| B3 | Test+Modify | 实现 `Get-RelayContentPolicyVerdict([string[]]$WrittenPaths,[hashtable]$Snapshot)`：任一写入路径不在允许集任一前缀下（或不等于某条精确文件 scope）→ `content-policy-violation:outside-allow-set`；`WrittenPaths` 为空 → ok；`$Snapshot` 为 `$null` → `content-policy-violation:missing-authority`（**默认拒绝**）。断言至少 6 条：`src/alpha/a.ts` 放行（**卡授权业务代码必须可写**）；`src/beta/util.ts` 精确文件放行；`src/beta/other.ts` 拒（同目录但未授权）；`.dh-relay/RUN-x/events.jsonl` 放行；`docs/relay/runs/RUN-x/index.md` 放行；`src/gamma/a.ts` 拒；`$null` snapshot 拒且 reason 为 `content-policy-violation:missing-authority`。 | 单套件 → 全 PASS |

**批 B 检查点**：`progress.md` 记一行。

### 批 C · 落点守卫 + 两条不得误杀反例（完成条件 3 前半）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| C1 | Test+Modify | 实现 `Test-RelayPolicyModuleRelayFolder([string]$Path)`：把规范化路径按 `/` 切段，**只有** `docs/modules/<任意>/relay/...`（即第 4 段恰为 `relay`）才算命中；`docs/modules/relay/...`（第 3 段是 relay = 合法模块 slug）**不算**。另实现 `workspace/<卡>/relay/` 命中判定（`docs/modules/<slug>/workspace/<卡>/relay/...`）。断言：`docs/modules/alpha/relay/x.json` → `$true`；`docs/modules/relay/design/01.md` → `$false`（**不得误杀反例②**）；`docs/modules/relay/workspace/X/progress.md` → `$false`；`docs/modules/alpha/workspace/A_01/relay/run.json` → `$true`。 | 单套件 → 全 PASS |
| C2 | Test+Modify | 实现 `Get-RelayLandingVerdict([string[]]$AfterPaths,[string[]]$BeforePaths,[scriptblock]$MarkerProbe)`：只判 `After - Before` 的**新建**路径（`BeforePaths` 里已存在的一律放行 = **不得误杀反例①**）；新建路径命中 C1 两种形态 **且** `& $MarkerProbe $path` 为真 → `landing-violation:module-relay-folder` / `landing-violation:workspace-relay-folder`；新建路径落在 `.dh-runtime/` → `landing-violation:legacy-root-write`（**无条件**，legacy 根只读）。`MarkerProbe` 为 `$null` → 视为"探不到 marker"，命中形态仍记 `landing-violation:marker-unprobed`（fail-closed，不静默放行）。断言至少 6 条，含反例①：同一路径 `docs/modules/alpha/relay/x.json` 出现在 `BeforePaths` 时 → ok。 | 单套件 → 全 PASS |
| C3 | Test+Modify | 实现 `Get-RelaySideEffectLedger([hashtable[]]$Observations)`：每条观察 `@{category='content|git|user-level|cli|psmux';detail='...'}`，按 category 分组返回 `@{content=@();git=@();user_level=@();cli=@();psmux=@();ok=$true}`；未知 category → `ok=$false` + `side-effect-unclassified`。断言：五类各一条能分开取到；`content` 组之外的条目**不进**内容白名单判定（用一条 `git` 类 `refs/heads/relay-staging` 观察证明它不触发 `content-policy-violation`）。 | 单套件 → 全 PASS |

**批 C 检查点**：`progress.md` 记一行。

### 批 D · 黑盒 CLI + 真实临时 Git 仓联证 + 接线（完成条件 1/2/3 收口）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| D1 | Create · `tools/relay/policy/Invoke-RelayPolicyCheck.ps1` | `param([ValidateSet('dev-isolation','content','landing','all')][string]$Mode='all',[string]$RepoRoot,[string]$SnapshotPath,[string]$BeforePath,[string]$AfterPath)`；dot-source `relay-policy.ps1`；缺必需输入 → `Write-Error` + `exit 2`（**fail-closed，绝不因缺参数放行**）；判定通过 `exit 0`，有 violation 打印 JSON（`ConvertTo-Json -Depth 10`）到 stdout 并 `exit 1`。 | `pwsh -NoProfile -File tools/relay/policy/Invoke-RelayPolicyCheck.ps1 -Mode content` → 退出码 2；带齐参数的干净输入 → 退出码 0 |
| D2 | Test+Modify · 套件 | **联证用例（B9 取证方式四者交叉）**：在 `$env:TEMP` 建真实临时 Git 仓（`git init`、首提交），按 `authority-2cards.json` 建 `src/alpha/a.ts`（授权）与 `src/gamma/x.ts`（未授权），前后各取一次路径快照，跑 `git status --porcelain` 取实际改动，再调 `Get-RelayContentPolicyVerdict`。断言：① `git status` 列出的路径集与 After−Before 快照一致；② policy 判 `src/gamma/x.ts` 违规、`src/alpha/a.ts` 放行；③ 通过 `-File` 调 D1 的 CLI 得到同样结论（退出码 1 + JSON 含该路径）——**独立检查与纯函数结论必须一致**。`finally` 里删临时仓。 | 单套件 → 全 PASS |
| D3 | Modify · `tools/relay/tests/run-relay-tests.ps1` 第 3~19 行 | `$suites` 数组末尾、`'relay-contract-reason-coverage.ps1'` **之前**插入 `'relay-policy.ps1',`（覆盖闸必须最后跑）。 | `pwsh -NoProfile -File tools/relay/tests/run-relay-tests.ps1` → 见到 `=== relay-policy.ps1 ===` |
| D4 | Modify · `tools/relay/tests/relay-contract-reason-coverage.ps1` 第 57 行 | `$productionRoots` 加 `'../policy'` → `@('../contracts','../runner','../adapters','../host','../policy')`。 | 全量回归 → 若有 reason 码没被断言覆盖会 `FAIL uncovered-reason: <码>`，逐条补断言直到 `PASS  production reason codes covered: N`（N 比 65 大） |
| D5 | Verify · 全量 | 跑全量回归 + 用本卡守卫自查本卡 diff（自举第一次真跑）：`git -C <任务树> diff --name-only master` 取变更路径集，喂给 `Invoke-RelayPolicyCheck.ps1 -Mode dev-isolation`。 | `RELAY ALL PASS (SKIPPED: 1)` **且** dev-isolation 退出码 0 |

## 关键决策（一句话各一行）

- Worktree：是，分支 `wt/DHR_04`，树 `D:\MyFiles\ai-workflow\dh-crew\.dh-worktrees\DHR_04`
- 派子 agent：是——**本卡由 dh-relay 自身（stage0 冻结驱动器）接力驱动**：`build` 棒 = grok（`~/.claude-grok`）施工，`review1`/`review2` 棒 = 另两个账号 fresh 复核；主控只做汇合与收口
- Review：两轮换人复核经 relay 接力节点完成，结论落 `review.md`；第二轮实例/会话必须与第一轮不同
- TDD：适用，按五拍循环逐批红→绿
