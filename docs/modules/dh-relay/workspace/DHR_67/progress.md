<!-- dh:v1 -->
# DHR_67 · Progress

## 日志

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-08-30 | 主控 | 用户明确 D-start；B-29 已 fast-forward 至 `master@7bb423f`，主树创建标准档八件套。已在 Herdr managed pane 中只读核实 `pane run`、`agent list`、`agent rename`、`pane close` 语法；未控制任何 pane/agent。 | E-6700 | 建立 `wt/DHR_67` 后 self-rebase，先写 fake Herdr 红测。 |
| 2026-08-30 | 主控 | `wt/DHR_67` 已从工具的 `origin/master` 基线 self-rebase 到 `master@4c28b51`，无冲突。 | E-6701 | 写 Claude 启动顺序红测。 |
| 2026-08-30 | 主控 | fake Herdr 红测证明现役 Claude 仍错误调用 `agentStart`，没有 `paneRun/agentList/agentRename` 序列。 | E-6702 | 仅在 DHR67 允许路径增加 CLI wrapper 与 Claude 分支。 |
| 2026-08-30 | 主控 | Claude 现走 `paneRun → 按新 pane 唯一筛 agent → agentRename`；零/多/rename 失败均只关闭 `pane-1`。Codex 断言仍为既有 `agentStart`；定向 4/4、contracts audit 0 均有终态。 | E-6703、E-6704 | 补第二轮指定 mutation、独立复核与 E10 证据包。 |
| 2026-08-30 | 主控 | 全量 `npm test` 未得通过终态；其中 DHR33 两例失败在未改代码的 `master` 以同一断言复现，故不可归因 DHR67。已完成本卡改动文件与工件的敏感词形态扫描，唯一代码命中是既有 fixture 的 `nonsecret` classification。 | E-6705、E-6706 | 不修改 DHR33 基线；等待独立复核者选择 mutation 并完成 heavy 五路复核。 |
| 2026-08-30 | 主控 | `dh dh-relay` 已取得失败终态：DHR35 在本树缺其六份既有未跟踪八件套；另 R30 将本树 DHR67 diff 标为 DHR66 超范围。两项均不通过篡改 DHR66 scope 或复制 DHR35 并行 WIP 消除。 | E-6707 | 保留 DHR35 WIP 与 DHR66 原始边界，待主控/用户处理工作树基线和 checker 归属。 |
| 2026-08-30 | 主控 | 五路独立复核派出后，前两轮发现真实 Herdr 的 `agent` 是类型而 rename target 应为新 pane。已在本卡 allowlist 内改为同 pane 唯一 Claude + `agentRename(paneId, name)`，并补非 Claude 与延迟识别测试；两轮 fresh 复验均 P0–P3=0。需求复核另发现 driver 先开 Attempt 的既有顺序与本卡“不绑定 Attempt”字面冲突，须 B-adjust。 | E-6713、E-6714、E-6716、E-6717 | 等一致性复核；不改 driver、Store 或验收文字。 |
| 2026-08-30 | 主控 | 一致性复核指出“唯一对象”不能先过滤类型；已改为先统计同 pane 全部对象、再要求唯一对象为 Claude，补 Claude+Codex 同 pane 负例。两名 fresh 复验 P0–P3=0。 | E-6719、E-6720、E-6721 | F-6702 仍为唯一 open P1，等待 B-adjust。 |
| 2026-08-30 | 主控 | 用户确认 B-30 收窄 Attempt 边界；fresh B-adjust 审核 P0=0。补 driver 回归：Claude adapter rename 失败时保留既有 Attempt、进入 `waiting_human`、不写 Result；未改 driver。 | E-6722 | 自动收口继续：miner、as-built、E9/E10 备料。 |
| 2026-08-30 | 主控 | 只读 miner 已生成 DHR67 简报；独立教训复核 P0–P3=0，未产出非重复候选，故不写知识库。as-built 无需改：既有 relay-core 快照已描述 adapter 与 Result 边界。gate 已识别五路复核与完成条件，唯一硬拦为尚无 verify（未获授权）。 | E-6723 | E9/E10 证据包已备妥，等待用户查看后决定是否进入本地收口授权包。 |

## 证据账本

| ID | 类型 | 命令 / 路径 | 结果 | 支撑什么结论 |
|---|---|---|---|---|
| E-6700 | setup | `herdr --help`、`herdr pane --help`、`herdr agent --help`、相关子命令 `--help` | pass | 当前 CLI 明确支持 DHR67 所需的 `pane run`、`agent list`、`agent rename`、`pane close`；未执行控制命令。 |
| E-6701 | worktree | `git rebase master` in `wt/DHR_67` | pass：HEAD `4c28b51`，无冲突 | 任务树与 D-start 后主干一致。 |
| E-6702 | test-red | `node --test --test-name-pattern DHR_67 relay-core/test/herdr-adapter.test.mjs` | fail：Claude 实际为 `agentStart`，与 `paneRun/agentList/agentRename` 期望序列不一致；zero case 未 fail-closed | 旧实现未满足 Windows Claude 启动前置。 |
| E-6703 | test | `node --test --test-concurrency=1 --test-name-pattern 'DHR_67|DHR_33 herdr-cli' test/herdr-adapter.test.mjs` | pass：4/4，exit 0 | Claude 成功与三类失败序列、Codex 不变及新增 CLI argv 均受 fake Herdr 断言。 |
| E-6704 | audit | `npm run audit` | pass：24 schemas、227 `$ref`、未登记开口 0、结构 token 漂移 0，exit 0 | 本卡未破坏 contracts/audit 基线。 |
| E-6705 | regression-baseline | `node --test --test-concurrency=1 --test-name-pattern 'DHR_33 窄路径|DHR_33 driver #3/#5|DHR_33 driver：stop 撞' test/herdr-adapter.test.mjs`，分别于 `wt/DHR_67` 与未改代码 `master` 执行 | 两处均 fail 2/2：`timeout:judge result` 与 `E_EXECUTOR_KILLED` 断言未得事件；全量 `npm test` 因此不记为绿 | 失败可在本卡前基线复现，DHR67 不改越权的 DHR33 runtime 行为。 |
| E-6706 | hygiene | 对 DHR67 四个改动代码/测试文件和本工作区执行 `rg -n -i '(api[_-]?key|secret|password|token|credential)'` | 命中仅既有 fixture `classification: 'nonsecret'` 与工件中的术语；无配置正文、投影值或凭据值 | 满足本卡工件与测试夹具零敏感值边界。 |
| E-6707 | module-health | `dh dh-relay` in `wt/DHR_67` | fail 7：DHR35 缺 six-suite 6 项；R30 将 DHR67 的 7 个允许路径改动归给 DHR66 | 是外部并行 WIP/多活卡归属现象；本卡不越权修改或搬运。 |
| E-6708 | review-dispatch | dh dispatch | observed | 复核派出：codex-review-dhr67-code1（独立只读审查）｜DHR67 code_round_1：只读审查本卡 diff、Claude/Codex 分支、失败关闭与测试断言；不修改文件。 |
| E-6709 | review-dispatch | dh dispatch | observed | 复核派出：codex-review-dhr67-code2（fresh-context 独立只读审查）｜DHR67 code_round_2：只读全程增量审查；必须独立选择一个 production mutation 点及预期红测，不修改文件。 |
| E-6710 | review-dispatch | dh dispatch | observed | 复核派出：codex-review-dhr67-requirements（独立只读审查）｜DHR67 requirement_direction：只读比对 brief、DevPlan、design/12 和需求对齐证据；不修改文件。 |
| E-6711 | review-dispatch | dh dispatch | observed | 复核派出：codex-review-dhr67-lessons（独立只读审查）｜DHR67 lessons：只读检查教训库相关条目与本卡是否重蹈；不修改文件。 |
| E-6712 | review-dispatch | dh dispatch | observed | 复核派出：codex-review-dhr67-consistency（独立只读审查）｜DHR67 consistency_review：只读横向比对 Herdr adapter 同类实现和错误/cleanup 语义；不修改文件。 |
| E-6713 | review-dispatch | dh dispatch | observed | 复核派出：codex-review-dhr67-code1-reverify（独立只读审查）｜DHR67 code_round_1 复验：只读复核 rename target/type/轮询修复及完整窄测；不修改文件。 |
| E-6714 | review-dispatch | dh dispatch | observed | 复核派出：codex-review-dhr67-code2-reverify（fresh-context 独立只读审查）｜DHR67 code_round_2 复验：只读复核修复增量、既定 mutation 账本与未收敛 P1；不修改文件。 |
| E-6715 | review-dispatch | dh dispatch | observed | 复核派出：codex-review-dhr67-consistency（独立只读审查）｜DHR67 consistency_review：只读横向比对 Herdr adapter 的 rename target、候选筛选、失败 cleanup 与 CLI wrapper 语义；不修改文件。 |
| E-6716 | test | `node --test --test-concurrency=1 --test-name-pattern 'DHR_67|DHR_33 herdr-cli' test/herdr-adapter.test.mjs`；`npm run audit` | pass：5/5，exit 0；audit 24 schemas、227 `$ref`、0 failure | rename target/type/轮询修正后，Claude 与 Codex 窄回归及 contracts audit 均通过。 |
| E-6717 | mutation | 临时将 `herdr-executor.mjs` 的 `candidates.length === 1` 改为 `>= 1`，运行 multiple 场景后还原 | red：multiple 的 `launched.ok` 实为 true，断言期望 false；还原后 E-6716 green | 第二轮独立指定的唯一性 production mutation 有效。 |
| E-6718 | regression | `node --test --test-concurrency=1 test/dhr64-result-bridge.test.mjs` | pass：10/10，exit 0 | 既有 Result bridge 仅接受当前 Receipt-bound submission；early submission 不从 pane 推导，missing done submission 进入 Attention。 |
| E-6721 | test-review | `node --test --test-concurrency=1 --test-name-pattern 'DHR_67|DHR_33 herdr-cli' test/herdr-adapter.test.mjs`；两名 fresh P2 复验 | pass：5/5；code 与 consistency 复验均 P0–P3=0 | 先 pane 唯一、后 Claude 类型校验；混合类型同 pane fail-closed 且仅关闭新 pane。 |
| E-6722 | b-adjust-test | B-30 审核 `design/evidence/28-DHR67-Attempt边界-B调整审核记录.md`；`node --test --test-concurrency=1 --test-name-pattern 'DHR_67|DHR_33 herdr-cli' test/herdr-adapter.test.mjs` | 审核 P0=0、旧工件同步为唯一 P1；测试 pass 6/6，Claude rename 失败后既有 Attempt=`waiting_human`、零 Result | B-30 收窄不改 driver/Receipt/Result 合同，且有直接机器证。 |
| E-6723 | e6-e10-prep | `dh mine dh-relay DHR_67`；`dh gate dh-relay DHR_67` | miner 只读简报、无新增候选；gate 五路与完成条件均识别，唯一 ❌ 为无 `verify(...)` 提交 | E6/E7/E9/E10 已备料；verify 属未授权的 E11/E12 后续。 |
| E-6719 | review-dispatch | dh dispatch | observed | 复核派出：codex-review-dhr67-code-reverify-p2（fresh 独立只读审查）｜DHR67 P2 修复复验：只读核对同 pane 混合类型对象拒绝、唯一性与 cleanup；不修改文件。 |
| E-6720 | review-dispatch | dh dispatch | observed | 复核派出：codex-review-dhr67-consistency-reverify-p2（fresh 独立只读审查）｜DHR67 一致性 P2 复验：只读核对先按 pane 唯一再验证 Claude 类型，与 task plan/Herdr 语义一致；不修改文件。 |
