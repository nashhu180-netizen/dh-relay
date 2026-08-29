<!-- dh:v1 -->
# DHR_32 · 教训候选（主控 miner 备料，2026-08-29）

| # | 候选教训 | 来源事实 | 建议落点 |
|---|---|---|---|
| L-1 | **机器证禁「测试注入自证」**：验收要求「真实环境可解析」时，测试用 `environment:` 注入不存在的环境变量把 golden 糊绿 = 机器证被掏空；有效单测与机器证必须在真实 `process.env` 下跑 | 代码轮1 P1-1 / 需求轮 P1-1：`CLI_PROXY_HOME` 本机不存在，测试硬编码注入后 golden 才过，两路复核独立命中 | lessons 库（复核判据类） |
| L-2 | **全篇正则断言会被证伪句喂饱**：能力位断言对整份 evidence 做全文正则，「不支持 `--sandbox read-only`」这句反而让 `supported` 断言通过；文本锚定断言必须行级定位 + 否定词护栏 + 反向断言 | 代码轮1 P1-2 实测三例 FALSE-PASS | lessons 库（测试设计类） |
| L-3 | **Windows 入口解析要两级**：`where.exe` 只认 PATH 可执行文件，PowerShell Function/Alias 形态入口（如网关壳函数）必须 `pwsh Get-Command -CommandType Application,Function,Alias,ExternalScript` 兜底（排 Cmdlet 防过宽），且此类入口**不可被直接 spawn、只能经 shell 拉起** | BLOCKED-1（claude-grok=Function，where 必败）+ 代码轮1 P2-3（兜底裸用会收下 Get-ChildItem） | knowledge/herdr-派活操作.md 或 DHR_33 输入 |
| L-4 | **relay-core `scripts.test` 是显式文件清单**：新增 `test/*.test.mjs` 不追加进 `package.json` 就永远不被 `npm test` 拾取，「自动拾取」是错觉 | B-22 预审 P1-1（施工前抓住，否则有效单测成假证据） | 项目 knowledge（repo 事实） |
| L-5 | **派出的复核实例要核实实际运行模型**：`claude --model opus` 拉起、状态栏显示 Opus 5，但实例自报 fable-5（SessionStart hook 所告）；模型身份有矛盾证据时如实并存登记，不采信单一来源 | 本卡两个复核实例登记（review.md） | knowledge/herdr-派活操作.md 补一条 |
| L-6 | **审计类卡的下游阻断事实必须升 findings**：「codex-ninth 未登录」「quota 样本 0 条」这类事实只躺 evidence 叙述里，主控与用户在收口时看不见；audit 卡的 findings 是把审计价值传给下游卡的唯一通道 | 需求轮 P1-3 / P2-3（初版 findings 里一条下游阻断都没有） | lessons 库（流程类） |
