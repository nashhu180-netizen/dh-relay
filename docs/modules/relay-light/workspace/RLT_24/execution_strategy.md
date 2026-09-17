# execution_strategy — RLT_24

## 执行分工

W1 builder 建合同与分批计划；W2 plan-reviewer 独立审核，REVISE 只由编排重新派 W1 修订。C1→C4 各由 coder 在一个回合完成 RED→GREEN、证据和提交，checker 逐批核验；未获 PASS 不进下一批。发生 BLOCKED 由 decider 按派单判定，coder 不自作方向裁决。施工后按 normal Recipe 先代码轮 1，闭合后需求方向与教训两路；R/F 由编排分发。

## 批次依赖与证据

| 批次 | 前置 | 产出 | 证据 |
|---|---|---|---|
| C1 | W2 PASS | A155 + A2 的事件、基础 wire format、add/lint 共用语义校验及单测 | `progress.md` E-C1-*、`check.C1.md` |
| C2 | C1 checker PASS | A156 的 reason 条件与检索、状态 JSON 冻结证明 | `progress.md` E-C2-*、`check.C2.md` |
| C3 | C2 checker PASS | A158 历史 71 行与旧实现稳定状态比较、关闭行 fixture | `progress.md` E-C3-*、`check.C3.md` |
| C4 | C3 checker PASS | A157 两类终端空间的受控失败取证 | `evidence/`、`progress.md` E-C4-*、`check.C4.md` |

不得把 `status --json` 动态时间字段当稳定比较对象；基线实现取 `git show master:tools/relay-light/relay_log.py` 到 `/tmp/rlt24-*`，不入仓。历史计划/账本从 `rlt12-win-01` 只读复制到临时 fixture；原文件不改。两类终端空间失败可实跑不存在的测试 id 或打桩，必须记录方式、观察、合法失败行、seq/object_id 检索与待人工处理状态；不操作真实在用的 herdr 资源。

## 停止闸

施工仅允许 README 闭集路径；每批提交只 add 点名文件，不 push。每批产出按派单信号停。复核、verify、人验、GitHub 远端动作、合并与清理均需各自后续闸门；W1 不预作判断。
