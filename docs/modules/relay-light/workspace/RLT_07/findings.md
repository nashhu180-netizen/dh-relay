<!-- dh:v1 -->
# findings — RLT_07

> 只登记事实与建议；状态变化由主控裁决后回填，不由施工者自改。

## 登记项

| ID | 发现 | 影响 | 状态 |
|---|---|---|---|
| F-001 | 正式依赖 RLT_01（仓内 skill 骨架 + 安装器）在 DevPlan 仍标「未开始」；`tools/relay-light/skill/` 目前仅有 RLT_05 交付的 `roles.toml`/`dh-mapping.toml`，无 `install_skill.py` | 2026-09-12 用户裁决「那就先做01」：RLT_01 先开（Issue #12 / PR #13 / `wt/RLT_01`），本卡待其合入后 rebase 再 D-start；骨架三件由 RLT_01 建，本卡填业务内容不覆盖 | resolved · 2026-09-12 用户裁决 |
