<!-- dh:v1 -->
# findings — RLT_08

> 只登记施工期发现的合同冲突、范围外事实与建议；状态变化由 orchestrator/decider 裁决，worker 不自改。W 阶段核对的 A34 design 原文与两 adapter 标头同构，未发现需登记的冲突。

## 登记项

| ID | 发现 | 影响 | 状态 |
|---|---|---|---|
| F-1 | AGENTS.md「dev-harness 落点 / slug」原有行「拆仓时由 `tools/relay/` 提级一层，独立仓里只有 relay 一份代码」与 B1 新增的 `tools/relay-light/` 代码根并存；若按现役态读该句已陈旧。B1 合同三处改动位置未含该行，exec 未顺手改 | 措辞歧义（历史叙述 vs 现役描述），不影响 A29 机器证 | 待复核/收口裁决 |
| F-2 | 本 Linux worktree 环境 PATH 中无 `rg`，已用 `apt download ripgrep` + `dpkg -x` 免 root 装至 `~/.local/bin/rg`（14.1.0），B1 红绿证据均用它产出；`dh` 在 `~/.local/bin/dh`，已能枚举 `dh-relay`/`relay-light` 两模块 | B3 的 `dh relay-light` 解析证据在本环境可跑 | 已记录 |
