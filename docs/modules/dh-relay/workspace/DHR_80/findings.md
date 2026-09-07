<!-- dh:v1 -->
# findings — DHR_80

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|----|------|------|------|------|------|
| F-8000 | P3 | DHR_79 的独立 worktree/分支仍在，且其最终收口等待 DHR_80；两卡不得共享工作树或混合 staging。 | `git worktree list --porcelain`；DevPlan DHR_80 依赖说明 | DHR_80 使用独立 `wt/DHR_80`；每批审计精确路径，DHR_79 仅作并行边界。 | open |
| F-8001 | P3 | `dh wt new DHR_80` 实际从落后的 `origin/master@a8b96f4` 起树，而非输出语境中需要的本机最新 master。 | E-8001；命令创建输出 | 新树未改动时已 rebase 到 `master@8918461` 并核三 SHA 一致；仅记录工具行为，不在本卡修 `dh`。 | resolved |
| F-8002 | P2 | 当前人工 retry 产生的 fresh Receipt 经正式 v2 `submit-executor-result` 入口仍稳定返回 `E_IDENTITY_MISMATCH`，未形成 committed Result。 | E-8002、E-8005、E-8006 | `attempt-retry.mjs` 仅为 fresh retry Receipt 增加 immutable `result_submission_mode='receipt-bound/v1'`；正式 RPC succeeded/failed 均已形成 committed Ack/Result，恢复与负例继续由现役 gate/Store 路径处理。 | resolved |
| F-8003 | P2 | 批次 1 红测同时断言当前 `E_IDENTITY_MISMATCH` 与最终 committed Ack；生产修复后若不删除旧拒绝断言，会制造假红。 | E-8004、E-8006 | 已删除正例中的旧 `E_IDENTITY_MISMATCH` 断言；该 reason 仅保留在历史缺 mode、旧/非当前/未知 Receipt 等对应负例。 | resolved |
| F-8004 | P1 | fresh `/root/dhr80_batch2_review` 指出：历史旧 Receipt 在 retry 前没有保存完整文件字节，合法 retry 后也没有用旧 Receipt 经正式 submit RPC 验证 `E_IDENTITY_MISMATCH` 与完整 mutationSnapshot 零变化。 | E-8011、E-8014、E-8019 | 专项保存旧 Receipt 原始 bytes；合法 retry 后逐字节复核未变；旧 Receipt submit 正式入口返回 `E_IDENTITY_MISMATCH`，submit 前后完整 mutationSnapshot 相等，并复核字节仍不变；定向复审 approved。 | resolved |
| F-8005 | P1 | fresh `/root/dhr80_batch2_review` 指出：non-frozen profile、snapshot drift、unknown pause、same-key conflict、closed pause 只比较 retryFacts/末计数；合法 retry/replay 的唯一合法变化没有独立 oracle。 | E-8011、E-8014、E-8019 | 每个拒绝 RPC 现在即时保存并 `assert.deepEqual` 完整 mutationSnapshot；合法 retry 精确约束 receipt/resolution/事件/state delta，replay 全 snapshot 不变；定向复审 approved。 | resolved |
| F-8006 | P2 | `attempt-contract` 历史初跑出现 Windows `EPERM`（13/14），立即复跑 14/14；根因不可证。 | E-8012、E-8015 | 保留为环境观察，不把立即复跑绿色解释为根因已证；整改后要求的专项与组合命令均自然终态全绿，未因该历史事件伪造逻辑结论。 | open |
| F-8007 | P3 | 唯一默认 `npm test` 在用户授权终止卡死的 `identity-quota.test.mjs` 后为 exit 1：370 tests、365 pass、5 fail、0 cancelled。B-51 对称 A/B：四个失败测试文件相对 master 零 diff；CLI、DHR_69/F、DHR_76/B 两侧同绿；DHR_76/C 同断言红；identity-quota 同位置挂起；五点小并发同为 4/5、唯一同一 DHR_76/C 红。只证明“未观察到 DHR_80 特有失败”，不证明默认全量健康或原负载下全部根因。 | E-8029、E-8037～E-8044、DHR-B-50/B-51 | 原代码轮 2 reviewer `APPROVED_RESOLUTION`：`resolved-as-DHR80-blocker`。正式验收 5 只要求专项/受影响回归、heavy 五路与变异，均已满足；本项作为模块级 baseline residual 保持 open，继续由 DHR-BL-17 承接，E11 必须分流。 | open |
| F-8008 | P2 | heavy 教训复核发现 as-built DHR_80 边界仍停在 E-8024“未得终态”，与后续 E-8029 的真实 exit 1 冲突。 | E-8032 | 最小同步为 exit 1 / 370 / 365 / 5 / 0，并区分两项历史同形与三项未证明基线同形；原 reviewer 定向复审 P0~P3=0。 | resolved |
