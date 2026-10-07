# RLT_32 — relay-lite 默认角色模型档

- Issue: #153 https://github.com/nashhu180-netizen/dh-relay/issues/153
- 档位：轻档；task_type=light；复核路径：教训、一致性（独立只读 reviewer，分别记录结论）。
- 用户授权（2026-10-07，时间未知）：修改 relay-lite 默认设置，watcher luna medium；coder/batch-reviewer gpt-6.1-sol high；decider gpt-6-astra medium；reviewer gpt-6.1-sol-high。
- 目标与范围：将上述四组分配写入仓内默认模板及 single-task 默认提案；reviewer 拆为模型 gpt-6.1-sol、推理档 high。未点名角色维持现状；保留模型确认闸及在途已确认快照。
- 交付：nashhu180-netizen/dh-relay，remote=origin，任务分支 wt/RLT_32-issue-153，目标 master；基线 039f54d6bcd8e9070fcd1608bcf8950b978e8945。授权内执行 Issue、精确提交、push、PR、必要 CI/复核后合并、合入复验与同步，用户安装副本作为默认配置实际落点。
- 停止边界：不启动演练/业务角色，不改在途分配、确认闸、其它角色或业务代码；无真实用户人验项，不代签人验。

<!-- dh:allowed-paths:v1 -->
- `tools/relay-light/skill/roles.toml`
- `tools/relay-light/skill/SKILL.md`
- `tools/relay-light/skill/references/adapter-codex.md`
- `tools/relay-light/skill/references/adapter-claude-code.md`
- `docs/modules/relay-light/workspace/RLT_32/task.md`
- `docs/modules/relay-light/workspace/RLT_32/review.md`

## 验收

1. watcher=gpt-6-luna/medium；coder 与 batch-reviewer=gpt-6.1-sol/high；decider=gpt-6-astra/medium；reviewer=gpt-6.1-sol/high。
2. roles.toml 的 model/launch 对齐；两份 adapter 引用 single-task 同源默认；其它角色字段保持不变。
3. 安装包复制校验通过；独立教训/一致性复核闭合；Windows/Ubuntu PowerShell 与 Python CI 全部成功。
4. PR 实际合入 master，精确合入态复验，报告安装副本同步范围与限制。

## 施工步骤

先登记任务，再更新 roles.toml、核心默认提案表、两侧 adapter 的引用；验证 TOML 和真实 CLI 参数解析、安装器回归；独立教训/一致性复核；PR + CI 合入并复验，同步用户 skill 副本。

## 过程与证据

- 2026-10-07：Issue #153 先创建，从核对的 origin/master 创建本卡唯一 worktree，未夹入本地 master 的其它任务提交。状态：施工中。
- 施工验证：5 个角色条目的 TOML/model/launch 对齐与真实 CLI --version 参数解析通过；未点名角色与基线逐项相等。安装器初次回归 18/19 通过、1 个结构检查失败（模板注释出现 single-task 字样）；保留完整模式模板定位，单卡仅参考提案，修正注释后复验。
- 修正后安装器 19/19 回归通过；git diff --check 通过。结构检查保留完整模式模板定位与既有确认语义；本卡按 light Recipe 派独立 reviewer 分别做一致性/教训复核，复核 pending。
