<!-- dh:v1 -->
# DHR_65 · Findings

## 问题

| ID | 级别 | 状态 | 描述 | 处置 |
|---|---|---|---|---|
| F-6501 | P2 | resolved | DHR_63 已复现完整 registry 坏 alias 被 formal validator 拒绝、却被 runtime loader 接受；DHR_65 必须在 loader 层闭合，不能以 validator 负例替代。 | E-6502 红测复现；最小修复 `resolveAlias:true` 后 E-6513、E-6515 证明 loader/driver 均启动前 fail-closed。 |
| F-6502 | P2 | resolved | DHR_63 golden fixture 与 live fallback 值级分歧，不能直接充当本卡所需完整正式 registry 结构等价副本。 | 专属 fixture 只编码已落账结构：Codex main 空 fallback、Claude main、ninth 无 config rule；不读取用户级 registry 或记录配置正文/凭据。 |
| F-6503 | P1 | resolved | fresh code/requirements/lessons review 指出初版 fixture 仅含 3/5 已登记 Profile，不能声称完整 registry fail-closed。 | fixture 补齐 `herdr.claude.grok`、`herdr.claude.account5`、已知 fallback 图；E-6513 逐条 alias/config loader 负例。 |
| F-6504 | P2 | resolved | fresh review 指出 driver 仅测 alias、用固定短等待且未直接记录 Agent/Result 侧效应。 | alias/config 各一 driver 负例改为等待 `driver.done`、失败 timeout 仅作保险并在 settle 时清除；直接断言 Attempt、Agent、pane、Result/receipt 全为零（E-6513）。 |
| F-6505 | P2 | resolved | fresh lessons review 指出专属测试未纳入 package 显式 `npm test` 清单。 | 用户授权 B-26 后最小修改 package script；E-6514 记录被列入清单，整体 suite 未得终态未充作绿色。 |
| F-6506 | P2 | resolved | fresh code reverify 发现 alias driver 的 8 秒测试保险等待小于 Windows alias 外部探测耗时，无法稳定取得专项终态。 | 仅将专项 timeout 调为 60 秒，仍在 timeout 时失败且 settled 时 cleanup；E-6518 loader 3/3 + driver 2/2 均 exit 0。 |
