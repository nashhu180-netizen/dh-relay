# review-brief · DHR_02 轮2 换人增量复核（fresh · 只读 · 对抗证伪 · 未参与施工与轮1）

你是被派进本仓库的**复核 worker**（headless）。当前目录=任务工作树根（分支 `wt/DHR_02`）。零上下文，光读本文件即可开工；不要加载别的流程框架、不要回头问人。

## 背景（只读事实）
- 施工：codex 4 批 commit + 返工轮1 `39425b2`（`git log --oneline master..HEAD`）。
- 轮1 记录（仓内已落账，可只读参考，不要继承其会话）：`docs/modules/dh-relay/workspace/DHR_02/review-logs/review-round1.account4.md`、`e4e5.subagent.log`；发现清单 `findings.md` F-003～F-013；主控探针见 `progress.md` E-003/E-006。

## 必读
1. `docs/modules/dh-relay/workspace/DHR_02/brief.md`、`task_plan.md`（K-1～K-10、数据形状、每批断言要求）、`findings.md`
2. `docs/modules/dh-relay/design/01-产品设计与验收.md` §3～§4；`as-built/relay-contracts.md`
3. `git diff master..HEAD -- tools/relay`（重点增量：`git show 39425b2`）；`review-logs/replay-signatures.txt`

## 你要做的
A. **核轮1 结论**：F-003～F-012 逐条判「真修+锁住 / 修了未锁 / 未修」——每条给证据（读 diff + 至少对 P2 项 F-003/F-004/F-005/F-011 各做一支变异探针：删掉修复处，对应断言应红；**探针后 `git checkout -- tools/relay` 复原并确认 `git status --short tools/` 干净**）。
B. **对抗证伪（新角度，别重复轮1 的 11 角度）**，至少覆盖：
   1. 多节点同 tick 事件顺序确定性（F-008 改按 plan 顺序遍历后是否真确定：连跑 decision 回放 3 次签名逐字节相同？）
   2. `Open-RelayRun` 重开后继续 tick/摄入是否与不重开等价（状态/事件一致）
   3. blocked→replan 后 fresh A 的 receipt 是否绑定新 generation 与 plan v2 hash；旧 attempt 的 checkpoint 迟到（用旧身份链）是否 `checkpoint_rejected`
   4. `Submit-RelayResultFile` 传入路径指向 **不存在的文件 / 目录 / 空文件** 时是否 fail-closed（不抛出、不改状态、有 `result_rejected` 事件）；节点 id 不存在时行为
   5. relay-state.json 被外部改坏（多一个键 / task_state='done'）后 `Open-RelayRun` + 任一操作是否 fail-closed（Save 前 Test 抛？读入时呢？）
   6. events.jsonl 追加是否可能因 `Add-RelayEvent` 抛出（Test-RelayEvent 不过）留下半状态：找一条 Runner 路径其 state 已 Save 但事件未追加/反之，评估是否违反"事件追加与状态 CAS 可重放"
   7. `Get-RelayReadyNodes` 在节点 `paused` 且其依赖者 waiting 时——依赖者是否永久 waiting（预期是），有没有断言
   8. fake adapter 是否有任何路径把业务状态写回或读 fixture 以外的东西；`emit_observation` 对已 stop 的 session 是否还吐 host 事件
   9. 越界复查：`git diff master..HEAD --name-only` 全在允许路径；contracts 只有 params 一键；`.dh-runtime` 零引用；夹具无真实凭据；`.ps1` UTF-8 无 BOM
C. **亲跑** `pwsh tools/relay/tests/run-relay-tests.ps1` 记每套件断言数与末行。

## 输出（写文件，不改代码）
`docs/modules/dh-relay/workspace/DHR_02/review-logs/review-round2.account9.md`：
- 首行 `VERDICT: approved` / `VERDICT: changes-requested`
- A 段：F-003～F-013 逐条「真修+锁住/修了未锁/未修」+ 证据
- B 段：新发现清单 `P0/P1/P2/P3 - 问题 - 文件/函数 - 证据`（无则写"无"）
- 探针记录（做了什么、红了哪条、已复原）
- 亲跑结果
只读、不改代码、只写事实与级别、不做验收裁决。写完文件即结束。
