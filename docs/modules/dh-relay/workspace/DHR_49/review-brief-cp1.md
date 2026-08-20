# review-brief — DHR_49 CP1（批 1 小审）

> **你是复核 worker，不是主控。** 只读不改。禁止再拉终端 / 派活 / 起 watcher，禁止调 AskUserQuestion 或以任何方式回头问用户。规则全在本 brief 里——**别自己去加载 dev-harness skill、别自加「先读一下流程规则」这类步骤**，这份就是你的完整指令集。卡住 / 缺信息，就把 `blocked` 连同缺什么写进你的结论里，不要停在原地。

## 你的任务

对 DHR_49 批 1（树外 DSH Client Bundle 可行性探针）做**只读**复核，按级别逐条给发现。

## 范围（只读，零写权）

| 路径 | 是什么 |
|---|---|
| `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\src\dsh-client\` | 本批新建的包（`package.json` / `lib/index.mjs` / `lib/client.js` / `lib/typert.host.js` / `lib/typert.remote-client.js` / `cordis.patch.yml`） |
| `…\relay-control-pilot\test\dsh-client-package-contract.test.mjs` | 包契约测试 |
| `…\relay-control-pilot\test\dsh-client-typert-drift.test.mjs` | 描述符防漂移测试 |
| `…\relay-control-pilot\test\helpers\load-client-bundle.mjs` | 在 Node 里跑浏览器 bundle 的测试夹具 |
| `…\relay-control-pilot\scripts\mutate-dsh-client-contract.mjs` | 变异验证脚本 |
| `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\evidence\dhr49\` | 本批证据（侦察采集 + 真机转录 + 截图） |
| `D:\MyFiles\ai-workflow\dh-relay\docs\modules\dh-relay\workspace\DHR_49\` | `brief.md` / `task_plan.md` / `progress.md` / `findings.md` |

**范围外**：`src/dsh-host/`、`src/cli/`、`src/read-model/`、`src/render/`、其它任务卡的工作区。范围外发现只记一行，不展开、不动手。

**你可以跑只读命令**（`node --test <上述测试文件>`、`node scripts/mutate-dsh-client-contract.mjs`、`git log`、读文件）。**不要**跑 `dsh plugin add/remove`、不要起 DSH、不要 `npm pack`、不要改任何文件。

## 本批声称做到了什么（你要核的就是这些）

1. 树外 client bundle 可**手写**、零打包器；安装进 profile 的 `lib/client.js` 与源文件 SHA256 逐字节相同。
2. `ctx.remote.$mount(手写 TYPERT_REMOTE)` 对树外包生效，不必进 `dsh-api-remotes` 一方闭集。
3. 面板在 `settings.section` 渲染，显示的 `fixture_hash` = `67fb18b3d7d84fa8a3f188f0db67539eb0421aeac4e5c3aadbf536807d39612c`，与 DHR_26 四轮转录逐字符相同。
4. `src/dsh-host/`（DHR_26 产物）一行未改。
5. 客户端 bundle 零 bare import（含 zod）；宿主侧描述符用真 zod。
6. 包契约 4/4 绿、防漂移 3/3 绿、7 条变异逐条见红 + 正控全绿、全量回归 167/167。

## 专挑这几类（按此顺序）

- **目标范围漂移**：有没有做超出 `brief.md` 完成条件的事？`src/dsh-host/` 真没动？（`git` 管不到这个目录——它不在任何仓库里，要靠读代码与 `progress.md` 判断）
- **行为回归**：新增测试有没有削弱既有断言？`test/helpers/load-client-bundle.mjs` 用 `vm` 跑 bundle，会不会因为 realm 差异让断言变松（比如 `deepEqual` 被 JSON 归一化后漏掉类型差异）？
- **证据缺口**：`progress.md` 的 E-002~E-009 每条是否真能复跑？声称的结论与证据是否对得上？有没有"结论比证据强"的地方？
- **隐性逻辑**：`lib/client.js` 的 `apply` 里 `ctx.inject` 作用域、disposer 返回、React `useEffect` 的 `alive` 守卫、`loadHash` 的稳定性——有没有泄漏或竞态？`markRemote()` 手工调用装饰器的写法（`lib/index.mjs`）是否会因未来 cordis/typert 变动而静默失效？
- **边界 / 权限 / 安全**：有没有引入写权？有没有凭据、绝对路径、机器名进入产物？`cordis.patch.yml` 是否只声明存在、不带配置？
- **断言是否在咬**：变异脚本覆盖够不够？有没有明明该拦却没拦的写法（想到就直说，不必真去改）。
- **过早收口 / 流程被跳过**：有没有把"未验证"写成了"已成立"？§4.4 止损条件的"已定不命中"两条，证据够不够硬？

## 输出格式（直接把结论文本返回，不要写文件）

```
## 结论
<approved / changes-requested / 需人裁决>

## 发现
| 级别 | 位置(file:line) | 问题 | 为什么是问题 | 建议 |
|---|---|---|---|---|
| P0/P1/P2/P3 | | | | |

## 我核过但没问题的点
- <逐条列，让主控知道你的覆盖面；"全部一致"要写明扫了什么>

## 范围外发现（只记不做）
- <一行一条>

## blocked（如果有）
- <缺什么、卡在哪>
```

级别口径：P0 = 会导致结论不成立 / 数据错 / 安全问题；P1 = 会导致返工或验收不过；P2 = 该改但不阻塞；P3 = 建议。

**只写事实与级别，不替主控做验收裁决。**
