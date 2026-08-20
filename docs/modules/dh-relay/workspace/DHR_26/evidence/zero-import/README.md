# zero-import — 去掉最后一个外部依赖后的复验（2026-08-18 晚）

环境：Windows 11 · Node v24.12.0 · `dsh 0.1.0-rc.7`
`DSH_HOME`：`D:\MyFiles\ai-workflow\dh-relay-p4-pilot\dsh-home`（DevPlan 指定的独立 Home）
Profile：**`web`**

## 改了什么

`index.mjs` 原来唯一的外部依赖是 `import { Service } from '@deepseek-ai/cordis'`。改为：

```js
export function apply(ctx, config = {}) {
  ctx.provide('relayPilot', createRelayPilotApi(config))
}
```

`ctx.provide` 是 mixin 到 context 上的公开 API（`cordis/lib/index.js:735-741`），DSH 自己注册 `appExit` 用的就是它；Cordis 的 `Service` 构造函数内部也只是 `ctx.reflect.provide(...)`。`provide` 包在 `ctx.fiber.effect(...)` 里，插件卸载自动释放服务行——与 `Service` 语义一致。

改完后运行时文件**零 bare import**（只有相对路径与 `node:` 前缀），由 `test/package-contract.test.mjs` 钉死。

## 关键验证：之前必然失败的装法现在通了

| 装法 | 改造前 | 改造后 |
|---|---|---|
| `dsh plugin add ./src/dsh-host`（`link:` 目录安装） | ❌ `Cannot find package '@deepseek-ai/cordis'`，稳定复现两次 | ✅ **退出码 0，stderr 空** |
| `dsh plugin add <tgz>`（打包安装） | ✅ 通过 | ✅ 通过 |

`probe-transcript-link-install.txt` 与 `probe-transcript-tgz-install.txt` **逐字节相同**（`diff` 无差异）。`fixture_hash` 仍为 `67fb18b3…`——与 smoke-rc6 / smoke-rc7 / target-web 前三轮**完全一致**，说明改注册方式没有动到任何对外数据。

## 其余复验（均在 `link:` 目录安装下）

| 文件 | 结论 |
|---|---|
| `host-tests.txt` | **40/40**，在 materialize 后的树里跑，**未设任何环境变量** |
| `transcript-report.json` | `RESULT: IDENTICAL`；list 与 5 份 detail 逐字段一致，`0006`/`0007` 按降级契约返回 null |
| `absence-disabled.txt` | `present:false` 退出 0 |
| `absence-enabled.txt` | `present:true` 退出 1（正控） |
| `--dump-config` | 502 行，`relay-pilot-host` 行在位 |

## 为什么这算「修根因」而不是「换装法」

改造前，「不打包 Cordis」这个设计的成立条件是**包必须被物理拷贝进 profile 树**——正确性押在安装拓扑上，而这个条件从未被任何测试或文档保证过，是靠 tgz 装法碰巧满足的。改造后插件不再需要解析任何外部包，两种装法都成立，条件消失。

契约测试也从「恰好一个 `@deepseek-ai/cordis` import」改成了「零 bare import」——这条断言直接对应根因，而不是对应症状。

## 这批证据**不**覆盖什么

两轮独立换人复核**已完成**（轮 1 claude-grok / grok-4.5，轮 2 codex-ninth / gpt-5.6-sol，见 `review.md`）；仍缺 verify 收口与用户签收。
