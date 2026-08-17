# review-brief · DHR_02 轮1 全面复核（fresh · 只读 · 非施工者）

你是被派进本仓库的**复核 worker**（headless）。当前目录是任务工作树根（分支 `wt/DHR_02`）。你零上下文，光读本文件即可开工；不要加载 dev-harness skill、不要找别的流程框架、不要回头问人。

## 你复核什么

DHR_02「实现最小 Runner 与确定性 fake replay」——codex 施工的 4 个 commit（`git log --oneline master..HEAD`），全部落在 `tools/relay/runner/**`、`tools/relay/adapters/**`、`tools/relay/tests/**`（新套件 `relay-runner-*.ps1`、新夹具 `fixtures/runner/**`、`run-relay-tests.ps1`、`relay-contract-reason-coverage.ps1` 扫描范围）、`tools/relay/contracts/relay-params.psd1`（只追加一键）。

## 必读（按序）

1. `docs/modules/dh-relay/workspace/DHR_02/brief.md`（完成条件 = 验收靶子）
2. `docs/modules/dh-relay/workspace/DHR_02/task_plan.md`（施工说明书：K-1～K-10 决策、数据形状、批A~批D 每条断言要求）
3. `docs/modules/dh-relay/design/01-产品设计与验收.md` §3～§4（行为权威语义）
4. `docs/modules/dh-relay/as-built/relay-contracts.md`（DHR_01 契约现状）
5. `git diff master..HEAD -- tools/relay`（全部施工 diff）+ `docs/modules/dh-relay/workspace/DHR_02/progress.md`、`DONE`、`review-logs/replay-signatures.txt`

## 复核角度（逐条给结论）

1. **契约调用 vs 复制**：Runner 是否只调 DHR_01 契约函数（`Test-Relay*` / `Get-Relay*Verdict` / `Test-RelayTransition*` / `Get-RelayNodeFreezeSet`）做判定，有没有自己重写判定逻辑或绕过契约。
2. **A1/A2**：CAS 冲突、迟到、重复、错版本、错 session 是否真的"不推进"（active-plan.json / authority.json / relay-state.json 字节不变），事件 kind/reason 是否按 K-1/K-2。
3. **A3**：blocked→replan→B→fresh A 的事件序列是否严格；旧 A 迟到结果只产 `result_stale`、不关当前 session（无对 S-0003 的 stop）；fresh A 是否拿到 resume_from。
4. **A4**：decision checkpoint 后只冻结依赖节点（frozen_by）、无依赖节点继续；错 session 的后续 checkpoint 拒；Runner/adapter **零** resume/suspend 调用（调用日志 + 源码扫描）；终端 idle→running 只靠宿主磁带。
5. **A5**：`succeeded + next_action=review` 后 task_state 仍 active、节点记录无任何"完成/失败"键。
6. **A6**：launch 期限超时 / probe 连败 / 停滞（K-4 心跳不算进展）/ exited 无结果 / 非法观测转换 / 半写坏 JSON / worker 自报 interrupted / quota 兜底（K-7）——每条是否 paused 且不再 probe、authority 字节不变。
7. **receipt 先于 spawn**（K-3）：receipt CreateNew + `launch_receipt` 事件是否都在 adapter.launch 之前；句柄不等→`launch_failed`。
8. **确定性**：Runner 是否只从 `$run.clock` 取时间、事件 ID 是否确定性、拒收路径是否不改 relay-state.json。
9. **测试有没有牙**：任选 ≥3 处做变异探针（例如删掉 frozen_by 写入 / 去掉 CAS 比对 / 让心跳刷新 last_progress_at / 去掉 stop 调用 / receipt 改在 launch 之后写），跑对应套件应变红；**探针后必须 `git checkout -- tools/relay` 复原并确认 `git status --short tools/` 干净**。主控已做 5 处探针（见 progress E-002），你可以挑不同的。
10. **越界与卫生**：有没有改 `tools/relay/contracts/*.ps1`（params 除外）、DHR_01 六套件正文/既有夹具、`tools/protocol/**`、`.dh-runtime`；夹具是否全 FAKE 无真实凭据；`.ps1` 是否 UTF-8 无 BOM；reason 码是否全为字面量并被 `Assert` 行覆盖。
11. **亲跑**：`pwsh tools/relay/tests/run-relay-tests.ps1` 必须 `RELAY ALL PASS`，记每套件断言数。

## 输出（写文件，不改代码）

把结论写到 `docs/modules/dh-relay/workspace/DHR_02/review-logs/review-round1.account4.md`：

- 首行 `VERDICT: approved` 或 `VERDICT: changes-requested`
- 发现清单：每条 `P0/P1/P2/P3 - 一句话问题 - 文件/函数 - 证据（命令/探针结果）`；没有就写"无"
- 探针记录（做了什么、红了哪条、已复原）
- 亲跑结果（每套件断言数 + 末行）
- 上述 11 个角度逐条一句话结论

只读代码、不改代码、不写 DONE 到别处；只写事实和级别，不做验收裁决。写完文件即结束。
