# progress · DHR_26

## 当前状态

`进行中`。GitHub 侧代码、操作器与预检已落盘；Windows DSH 现场证据和两轮 fresh 独立复核待补。草稿 PR #1 保持 Draft。

## 2026-08-18 施工记录

1. 读取 dh-relay 的 DHR_26 任务卡、仓库 AGENTS 约束及 dev-harness 标准档模板/节点要求。
2. 核对 DHR_25 已销户，确认本卡授权、依赖与实施边界。
3. 阅读 DeepSeek Harness rc.7 上游实现和文档，确认 Cordis Service、profile plugin bundle、`--patch`、`ctx.appExit`、client metadata 与 profile 扫描锚点。
4. 发现并发草案已写入同一任务分支，保留其工作区历史并做差异审查。
5. 发现草案的 `@deepseek-ai/cordis` 与 `@deepseek-ai/schemastery` 版本被误写为 rc.7，且缺少 `dsh.bundle.patch`，profile 安装后无法自动加入 Host 行。
6. 用零构建 ESM Host bundle 替换该草案运行包，改为 `@deepseek-ai/cordis ^4.0.0`，移除 Schemastery 与 TypeScript 构建依赖。
7. 增加 fixture schema guard、逐调用重读、普通 JSON 校验、Host 生命周期单测、profile bundle、一次性 probe、禁用/卸载 absence probe、版本快照、差异、fixture 发现、Client 侦察与 PowerShell 操作器。
8. 阅读 DSH `profile-boot.ts` 后确认普通 profile 会建立配置监听，补接 `ctx.appExit`，保证 probe 输出后由启动器有界清理并退出。

## 预检结果

| 检查 | 结果 | 证据 |
|---|---|---|
| Node 单测 | 18/18 通过 | `evidence/preflight-unit-tests.txt` |
| 语法检查 | 通过 | `evidence/preflight-syntax-check.txt` |
| npm pack dry-run | 通过，8 个运行文件，约 3.3 kB | `evidence/preflight-pack-dry-run.txt` |
| mock DSH probe 对证 | `RESULT: IDENTICAL`，plain JSON=true | `evidence/preflight-host-probe-report.json` |
| 源文件清单 | 已生成 sha256 | `evidence/preflight-source-inventory.sha256` |
| 当前执行环境 | Node 22.16.0、npm 10.9.2；pnpm/dsh/PowerShell 不可用 | `evidence/preflight-environment.txt` |

预检使用自生成 mock fixture，只证明 Host 逻辑和操作器契约。它不替代 DHR_25 真 fixture 与真实 DSH 进程证据。

## 待办

- [ ] 在用户 Windows 机器复制 artifacts 并运行 `Invoke-Dhr26Pilot.ps1`。
- [ ] 回填 rc.6/rc.7 快照、差异和版本标签。
- [ ] 回填真实 `ctx.relayPilot` 首次调用及 `RESULT: IDENTICAL`。
- [ ] 回填显式禁用、卸载、重启后服务缺失证据。
- [ ] 回填本机 Client 侦察路径。
- [ ] 两轮 fresh 独立复核。
- [ ] 用户需求境确认。
- [ ] 通过后才更新为待验收并生成 verify 提交。
