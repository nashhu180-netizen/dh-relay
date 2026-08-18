# DHR_26 预检记录

执行环境：Linux 容器，Node 22.16.0，npm 10.9.2；未安装 pnpm、dsh、PowerShell，无法访问 Windows 实验根。

已执行：

```text
node --test test/*.test.mjs
npm run check
npm pack <absolute-host-root> --dry-run
node run-mock-probe.mjs ...
node scripts/verify-transcript.mjs ...
```

结果：18/18 单测通过；语法检查通过；pack dry-run 仅含 8 个运行文件，约 3.4 kB；mock transcript 对两份 fixture 给出 `RESULT: IDENTICAL`，普通 JSON 检查为 true。

这些证据验证代码逻辑、包声明和操作器契约。它们没有执行 DSH rc.6/rc.7、profile 安装、独立 Home、真实 `ctx.relayPilot`、禁用或卸载，因此不得作为 DHR_26 完成证据。
