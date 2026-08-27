# 技术裁定复核 · DHR-BL-10（附加路径 · 非 normal 配方必做项）

- **复核身份**：codex CLI · `/codex` 插件（`codex-companion.mjs task`，app-server 共享 runtime）· 只读 · 2026-08-27
- **独立性**：未参与实施；独立 thread（`--fresh`），零施工上下文
- **触发原因**：主控自行裁定了「大小写派发」的技术方案（F-006 → 返工轮 2），自裁自实施自验收，链条闭合，需外部砸一遍
- **对象**：主控的四条裁定（见 `../review-briefs/` 无对应文件——本路由主控直接在 prompt 里出题，题面全文誊录于下）

## 出题（主控四条裁定）

1. `ValidateSet` 校验大小写不敏感且不规范化取值，`-Cli CLAUDE` 能过校验且 `$Cli` 保持 `"CLAUDE"`
2. `-ceq` 大小写敏感 → 落入 `else` → **静默拉起 codex**（fail-open 错派）
3. 该 `-ceq` 源自教训库候选-5；但候选-5 针对**校验闸**，套到**二选一派发**上效果相反
4. 正确修法是 `switch -CaseSensitive` + `default{throw}`

## 结论

| 裁定 | 判决 | 复核方要点 |
|---|---|---|
| 1 | **成立** | 自写复现实测：`bound=<CLAUDE>` / `dispatch=codex` / `exit=0`。另实证 `ValidateSet(..., IgnoreCase=$false)` 可让校验本身大小写敏感 |
| 2 | **成立** | 同一实测直接证明；复现未真实启动 codex，仅复现参数绑定与路由条件 |
| 3 | **部分成立** | 「套到错误形状上」**说过头了**。CLI 分派同样是冻结枚举，用 `-ceq` 本身**符合**候选-5；真错是**二分代码把「不是精确 claude」等同于「必为 codex」**，即 `else` 不完备，而非算子选错。另指出「候选-5 是该行历史来源」**仓内文本无法独立证明**，属主控推测 |
| 4 | **部分成立** | `switch -CaseSensitive` 覆盖三枚举值正确、不会错派；但**实际调用链**（`run-dogfood.ps1:57`、`psmux-adapter.ps1:96`）用 `pwsh -NoExit -File`，该形态下 `throw` 只中止脚本、**不终结进程**（实测 `running_after_800ms=True`），psmux 会把仍活着的 pane 观察成 `idle` 而非启动失败。**当前修法未真正 fail-closed** |

**总评**：应补「显式退出」及针对真实 launcher 形态的测试，再收口。

## 主控处置

- 裁定 3 的修正**已接受**，登记 F-011。
- 裁定 4 的缺口 → 返工轮 3。复核方建议 `exit 64`；主控改用 **`exit 4`**（对齐同目录 `relay-agent-tool.ps1:128` 的「输入校验失败」惯例，本仓惯例优先于 sysexits）。
- 返工轮 3 实测**再次推翻**：`-NoExit` + **`-File`** 形态下连显式 `exit` 也不终结进程（复核方那次实测用的是 `-Command` 形态）。最终定稿 **`[Environment]::Exit(4)`**，登记 L-006。
- 复核方另一条观察「新增 zcode 应作为独立行为变更单独验收」**不采纳**——zcode 是本卡主交付、大小写修复才是副产物，复核方缺卡片上下文致主次颠倒。如实登记为 F-012（已评估不采纳）。
