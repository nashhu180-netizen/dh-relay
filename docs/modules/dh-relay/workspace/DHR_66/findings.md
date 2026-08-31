<!-- dh:v1 -->
# DHR_66 · Findings

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|
| F-6601 | P1 | `herdr.codex.main` 的 registry 仍声明旧 `/profiles`，但现役 Codex main 入口没有 overlay selector，基础配置已无该键；既有 reader 因此 fail-closed。向产品配置伪造标量不代表入口身份且可能破坏 strict config。 | E-6602、E-6603 | B-31 fresh 审核及定向复审 P0/P1=0；registry 仅删 `/profiles`、保留 `/model`，Codex config hash 不变；写后 validator/live freeze/23 tests 全绿。 | resolved（E-6606、E-6607） |
