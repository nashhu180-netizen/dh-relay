# review-brief（第二轮 · 返工收敛复检） — DHR_26

> 你是**复核 worker**，零上下文：读这一份就够，不要加载任何流程框架或规范文档。
> **只读不改**：不要修改或创建任何文件。产出只有一份文字结论。
> 只写事实与级别，不替主控做验收裁决。卡住就在结论里写「无法核验：X」，不要停下等人。

## 背景

`dh-relay` 项目 P4 阶段的 DHR_26：一个**只读**的树外 DSH（DeepSeek Harness，基于 Cordis 的终端 AI 工作台）Host 插件，把上一张卡冻结的 fixture 原样透传进 DSH 进程，暴露为 `ctx.relayPilot`。

**上一轮（同后端、不同会话）的复核提了 4 条 P1 + 3 条 P2，施工方已逐条返工。你这一轮只做一件事：核这些修法是否真的成立，以及修的过程有没有引入新问题。**

不需要重做全面复核；上一轮已确认成立的部分（只读 API 边界、普通 JSON、`__proto__` 防护、无 side channel、版本基线证据链、无凭据泄漏、无越权三态裁定）不必重复。

## 东西在哪

- worktree（治理工件 + 仓内代码镜像）：`D:\MyFiles\ai-workflow\dh-relay-wt\DHR_26-host-fix`
  - 工作区：`docs\modules\dh-relay\workspace\DHR_26\`
  - 镜像：`…\workspace\DHR_26\artifacts\relay-control-pilot\src\{dsh-host,dsh-absence-probe}\`
- **仓外权威落点**（真正跑的那份）：`D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\src\{dsh-host,dsh-absence-probe}\`
  fixture：`…\relay-control-pilot\testdata\fake\`
- 本轮新证据：`…\workspace\DHR_26\evidence\round2-lifecycle\`

跑测试（41 例，不需要设环境变量）：

```
cd D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot
node --test src/dsh-host/test/*.test.mjs
```

> 只读沙盒里跑不动的部分，如实申报「仅静态审」，不要假装跑过。

## 逐条核这四条 P1 的修法

### P1-A：卸载清理没有动态证据（原结论：`present:false` 只是「禁用着启动、从没注册」，证明不了「注册后卸载会清理」）

修法两条，都在 `evidence/round2-lifecycle/`：

1. 新包 `@personal/dsh-relay-absence-probe`（`src/dsh-absence-probe/`）把 absence 探针搬到 Host **包外**，于是 `dsh plugin remove` 之后探针还活着。三份转录：装着 → `present:true` 退 1；remove 后 → `present:false` 退 0；装回 → `present:true` 退 1。
2. `src/dsh-host/scripts/service-lifecycle-probe.mjs` 用本机真 Cordis 建 Context → `ctx.plugin(host)` → 读活服务 → `fiber.dispose()` → 再读，产出 `service-lifecycle.json`（`result: CLEANED`）。

**请核**：这两条加起来，是否真的证明了「已注册的 `ctx.relayPilot` 在插件卸载后被清理」？有没有仍然没覆盖到的路径（比如 profile 内 disable 与 fiber dispose 是不是同一条清理路径）？`service-lifecycle-probe.mjs` 自己的判据可靠吗（它读的是不是真服务、dispose 后的断言会不会因为时序而假绿）？包外探针有没有可能因为别的原因报 `present:false`（比如它压根没加载）？

### P1-B：转录校验器能把缺失 detail 判成一致

修法：`src/dsh-host/scripts/verify-transcript.mjs` 改为期望清单由调用方传入（`--expect-list` / `--expect-details`），新增：转录自称读的文件集必须等于期望集、`details` 的 key 集不得多出、缺 detail 的 run 集由磁盘算出后对上、`fixture_hash` 从磁盘重算再比、`detail_missing_returns_null` 必须严格为 `true`。

变异对照见 `evidence/round2-lifecycle/mutant-*.report.json`（掏空 details / 改 hash / 篡改 detail，三条都判 `DIFF`），真转录 `transcript-report.json` 仍 `IDENTICAL`。

**请核**：现在还有没有能让它误判 `IDENTICAL` 的输入？三条变异是否覆盖了主要的伪造面？有没有新引入的误判（把正常转录判成 DIFF）？

### P1-C：侦察落档缺「类型定义位置」

修法：`findings.md` 新增「侦察落档补齐」一节，登记了 `dsh-client-modules/lib/types/client/{manifest,index,system}.d.ts` 与 `lib/types/index.d.ts` 的内容，以及官方 client 插件 `@deepseek-ai/dsh-api-gateway` 的 `dsh.client` + `exports['./client']` 逐字样板，并记了本机共 39 个包声明 `dsh.client`。

**请核**：这些路径与内容在本机是否属实？作为下一张卡（做树外 Client bundle + 面板）的开工输入，还缺什么关键事实？

### P1-D：evidence 总索引发布已被推翻的结论

修法：`evidence/README.md` 重写为六批总表，明确标注 `target-web/` 的「必须装 tgz」结论已被 `zero-import/` 推翻，并补登记了新批次。

**请核**：索引与各批 README 现在是否自洽？还有没有别的地方（`findings.md` / `progress.md` / 插件 README / patch yml 注释）仍在发布过期结论？

## 另外三条 P2 的修法（一并核）

1. **零 bare import 契约测试可绕**：改为从 `package.json` 的 `files` 派生运行时文件清单（外加一条断言：包根下每个 `.mjs` 都要在清单里），并禁 `import(expr)` / `createRequire` / `require()`。新增可复跑的变异harness `scripts/contract-mutation-check.mjs`，5 个变异体全部见红（`evidence/round2-lifecycle/contract-mutations.txt`）。
   > 施工方自述：第一版这条断言里的 `\b` 被写成了字面退格字符 0x08，导致 createRequire 变异体没见红，是变异 harness 逮出来的。**请核这条自述是否属实、现在的正则是否干净**（文件里是否还有非打印字符）。
2. **`check-drift.ps1` 非逐字节**：改为直接哈希原始字节，行尾差异单独标注；覆盖两个包；脚本头明确它是收口必跑的采集命令、不是自动闸（原自述「新增了一条契约测试」不实，已改口径）。
3. **`absence.patch.yml` 注释自相矛盾**：改为只声明管 disabled 态，并指向包外新探针。

## 还要看的两件

- **有没有引入新问题**：新包 `dsh-absence-probe` 是否越界（它会不会自动进 profile bundle 列表、会不会带写路径）？新脚本是否被打进 Host 包（不该进）？`package.json` 的 `files` 与 `exports` 是否仍然自洽？
- **有没有越权**：本卡不得给 DSH 桌面控制面轨的三态结论（`passed` / `passed-with-constraints` / `stopped-by-pilot`），那是下一张卡由人判收敛的。

## 输出

1. **核验形态**：跑了什么、哪些只能静态审、哪些无法核验。
2. **逐条判定**：对上面 4 条 P1 + 3 条 P2，每条给 `已收敛 / 未收敛 / 部分收敛`，附你自己核到的事实。
3. **新引入的问题**：有就按 P0/P1/P2/NIT 列出（位置 + 事实 + 为什么是问题 + 建议）。
4. **还剩什么**：仍未清零的 P0/P1 清单。只给事实，不做验收决定、不给三态标签。
