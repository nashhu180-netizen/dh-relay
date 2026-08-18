# DHR_26 evidence boundary

这里仅保存当前 sandbox 的代码级证据，环境为 Linux / Node 22，不是 DevPlan 的 Windows rc.7 目标机证据。

已复跑：Host `11/11`；`npm pack --dry-run` 为 9 个运行文件、零 bundled dependency；去除 Cordis dependency/peer copy 后结果不变。Host 运行时仍只 import DSH 安装方公开的 `@deepseek-ai/cordis`，由 profile module fallback 解析。

以下项目仍缺失：rc.6/rc.7 快照与差异、DSH probe 转录、install/disable/enable/remove 生命周期、两轮独立复核与 verify。
