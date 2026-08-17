# review-brief · DHR_02 轮2 返工复验（fresh 会话 · 只读 · 不继承任何先前会话）

你是被派进本仓库的**复核 worker**（headless）。当前目录=任务工作树根（分支 `wt/DHR_02`）。零上下文，光读本文件即可开工；不要加载别的流程框架、不要回头问人。

## 任务
复验返工轮2 commit `ffbaf92`（`git show ffbaf92 --stat`；注意 codex DONE 自报 SHA `5b6ceb9` 为笔误，以 git log 为准）是否把下列 findings「真修+锁住」：

- F-014 P1：空文件/非对象 JSON 的 result/checkpoint 提交必须 fail-closed（不抛、有 `result_rejected`/`checkpoint_rejected` 事件 reason `unparseable-*`、relay-state.json 字节不变）
- F-015 P2：`Open-RelayRun` 读入即校验 state；`Submit-RelayProposal` 在写任何文件前对更新后 state 副本校验，不过→`proposal-rejected:state-invalid` 且 authority/active-plan 不落盘
- F-003 残余 P2：replan 里「旧节点 depends_on 被删」分支有夹具+断言
- F-013 P3：reason 守卫能看见 `Add-RelayProposalRejection ... 'proposal-rejected:<sub>'` 行
- F-016（主控裁 P3）：Runner 落账顺序统一「先 Save state 再 Add event」+ README 说明
- F-017 P3：paused 节点的依赖者永久 waiting 有断言
- F-018 P3：fake adapter stop 后不再吐该 session 的 host 事件

## 必读
`docs/modules/dh-relay/workspace/DHR_02/findings.md`（F-003、F-013～F-018 原文）、`review-logs/review-round2.account9.md`（上一轮复核证据）、`rework-round2.md`（返工说明书）、`git show ffbaf92`。

## 做法
1. 逐条读 diff 判「真修+锁住 / 修了未锁 / 未修」。
2. 至少对 F-014、F-015、F-003 残余各做一支**变异探针**（删掉修复处→对应断言应红；主控已做：删 json-not-object 守卫→ingest 崩溃红、删 state 前置校验→authority 崩溃红、删 depends_on 被删检查→authority FAIL 1、改名子码→守卫红——你可以挑不同做法，例如把空文件夹具换成 `null` 字面文件、或把 `Open-RelayRun` 校验去掉），**探针后 `git checkout -- tools/relay` 复原并确认 `git status --short tools/` 干净**。
3. 顺手对抗：返工是否引入回归（例如 F-016 顺序统一后，probe_error 路径的事件与状态是否仍一致；`Read-RelayJson` 抛 `json-not-object` 是否波及 `Read-RelayActivePlan` 等正常路径）。
4. 亲跑 `pwsh tools/relay/tests/run-relay-tests.ps1` 记每套件断言数与末行。

## 输出（写文件，不改代码）
`docs/modules/dh-relay/workspace/DHR_02/review-logs/review-round2b.fresh.md`：首行 `VERDICT: approved` / `VERDICT: changes-requested`；逐条判定 + 证据；新发现（P 级·无则写"无"）；探针记录；亲跑结果。只读、只写事实与级别、不做验收裁决。写完即结束。
