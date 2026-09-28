<!-- lesson_candidates.md — RLT_18 教训候选。 -->
# lesson_candidates — RLT_18

## 教训候选

| ID | 分类 | 一句话教训 | 状态 |
|---|---|---|---|
| L-01 | 编码陷阱 | `derive_status().agents` 对已终态 agent 永久保留（首个 `agent_launch` `setdefault`）；凡取「在场 agent」必须按 `last_event ∉ TERMINAL_EVENTS` 过滤，否则重挂/重拉逻辑会给已结束实例再开线程。触发现场：batch-1 `_watch_present_agents`（tools/relay-light/relay_log.py）；规则：读投影先过滤终态再消费 | 候选 |
| L-02 | 编码陷阱 | FakeClock 下两条虚拟时间坑：① watch 启动期的 tick 锚点绑定当时的 `_now`——启动后立刻 `advance_to(150)` 会把锚点推到 1350，确定性节拍用例须先 `advance_to(0)` 落定初始化再推进；② 重试 `clock.sleep(2)` 是**相对**释放时刻而非绝对时刻表，断言重试落点要按「推进时刻+2」算。触发现场：batch-2 `test_a83_1`（docs/modules/relay-light/workspace/RLT_18/evidence/batch-2/red.txt 中 [1350,2550] 漂移）、`test_a83_12c/12d`；规则：虚拟时钟用例先 `advance_to(0)` 锚定，sleep 落点按执行时刻推算 | 候选 |
| L-03 | 领域知识 | adapter 交付给 stage-lead/编排的 watch 存活核 `pgrep -f -- 'relay_log.py watch --plan <dir> --notify <名> --level stage'` 在 `bash -c`/agent Bash 工具包装内执行时，包装壳 cmdline 自带模式全文 → `pgrep -f` 命中调用壳自身 → 已死 watch 被判「存活」（幻 PID 即包装壳 PID，命令结束即消失）。触发现场：batch-3 H12-②，阶段级 watch 已随 pane 死亡，lead-claude 仍答「Watch 存活（幻 PID），无需重启」；driver 复现同一 pgrep 返回自身包装壳 PID（docs/modules/relay-light/workspace/RLT_18/evidence/batch-3/raw/pgrep-selfmatch.txt）。规则：存活核须排除调用壳自身且不得锚定解释器——落地写法 `pgrep -af -- <模式>` 后丢含 `pgrep` 与 `$$`/`$PPID` 的行（循环壳或 python 任一命中即算在；锚定 `^python` 会把重启循环 `sleep` 窗口误判死、撞出双 watch）；Windows 对应 `Get-CimInstance Win32_Process` + `-notlike '*Get-CimInstance*'` + `-ne $PID`。已落两 adapter 存活核与钉字断言，`test_c1_1` 真进程实测三段（旧写法幻 PID / 新管道排己 / 循环壳载体命中与死后归零，docs/modules/relay-light/workspace/RLT_18/evidence/workflow-final-remediation-1/pgrep-self-exclusion.txt） | 候选 |
| L-04 | 领域知识 | Claude Code 探针两条实测行为：① 长命令一律自动后台化（`sleep 240`、`python3 -c time.sleep` 均「Running in background」+ 回合 done），靠 shell TASK 造不出持续 `working` 窗口，忙碌形态是「排队消息+后台完成事件」驱动的连串微回合；② 发给忙碌 agent 的 prompt 以排队预览形态滞留输入框（`❯` 前缀，backspace/esc 删不掉，`send-text` 只临时覆盖显示，`agent prompt` 到达时按序处理）。触发现场：batch-3 H11/H12 各 pane（docs/modules/relay-light/workspace/RLT_18/evidence/batch-3/）；规则：探针设计按「排队即送达」理解 herdr prompt 语义，勿把输入框 `❯` 文本当未送达 | 候选 |
| L-05 | 领域知识 | 兜底 / 看门机制的计时与触发源不得依赖被兜底对象——「watch 给 watcher 发 tick」的方案会随 watch 死亡同步停摆。评估兜底方案先问：被兜对象死亡时，兜底的节拍源还在走吗。触发现场：UD-3 D16 定稿（docs/modules/relay-light/workspace/RLT_18/task_plan.md D16 理由列；decisions.md UD-3）；规则：兜底节拍由兜底方自身定时 | 候选 |
| L-06 | 行为流程 | driver 自起的观测 / 轮询后台脚本必须进收尾清单：探针 tab 与 watch 进程零残留不代表收尾完成——U2 driver 的 nohup 轮询脚本漏关约 18 小时，并持续向已入库证据文件追加噪声，造成提交后漂移。触发现场：docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/H12.md 收尾核验节、raw/agent-status-poll.log 行 71 起（f4c2661 补记）；规则：收尾单列「driver 自起后台写者」（自记 PID），先杀写者再提交证据，观测输出不写已入库文件，补救命令 tee 进 raw | 候选 |
| L-07 | 行为流程 | Devin 长会话停在 `Connection error, send a message to continue retrying` 后不会自动恢复，herdr 状态显示 done / idle，看起来像收工。触发现场：UD-3 U2 coder 提交前、requirement ud3 r1 reviewer 落 review 前各一次（docs/modules/relay-light/workspace/RLT_18/execution_strategy.md 对应行注记）；规则：派活方等 signal 时同时检查 pane 末行的连接错误，发现后发一条无害续跑消息，不按「仍在干活」无限等 | 候选 |
| L-08 | 行为流程 | 带周期节拍职责的 agent 派单后须确认「节拍已武装」（后台 sleep 或合并调用已经起了），首回合 done 不代表已进入节拍；推迟武装会直接拉长首个检查间隔。评估发现时延以实际武装时刻为基准。触发现场：docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/raw/nudge-1.txt（两侧 watcher 各需一次轻推），watcher-o 首个间隔约 14 分钟（review.workflow-final.requirement.ud3.review-round-1.md RQ-U3-3）；规则：拉起 watcher 后核一次节拍已武装再离开 | 候选 |
| L-09 | 领域知识 | pane 输入框里未提交的文字可能是客户端自动建议或残留草稿，不得据此归因「用户 / 操作者键入」；判断是否构成介入，只看其后有没有对应的回应回合。向 agent 转述用户意图前，先确认文本已提交。触发现场：review.workflow-final.requirement.ud3.review-round-1.md RQ-U3-2、docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/H12.md 操作者介入节（三处输入框文字）；规则：输入框文字只记「未提交，键入者不可考」 | 候选 |

## 已知候选复发登记

| ID | 分类 | 复发注记 | 状态 |
|---|---|---|---|
| L-R1 | 行为流程 | dh-relay 教训候选-34「证据转录必须由脚本现场采集写入，不得手抄/摘要——手抄在独立复核复算时才会露馅」在本卡完整复发：batch-3 初审 FAIL 的 F-1~F-8 共 8 条全部为手工转录与 raw 的偏差（docs/modules/relay-light/workspace/RLT_18/check.batch-3.md F-1~F-8；docs/modules/relay-light/workspace/RLT_18/check.batch-2.md O-2 证据头日期笔误同族）；整改 e144dac 后文字与 raw 逐字一致、round-2 PASS。对候选-34 升格属加权证据；后续同类卡教训账建议固定设「已知候选复发登记」位 | 已登记 |
| L-R2 | 行为流程 | 已知坑「后台进程回收」以 driver 侧新形态复发：探针与 watch 零残留成立，但 driver 自己的 nohup 轮询脚本漏关约 18 小时并写入已入库证据文件（docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/H12.md 收尾核验节，f4c2661）。规则扩展见 L-06 | 已登记 |
| L-R3 | 行为流程 | dh-relay 教训候选-34（证据手抄）小形态再复发：H12.md 4 处行号 / 出处偏差，事实本体无误（review.workflow-final.requirement.ud3.review-round-1.md RQ-U3-4），整改 401defb 闭合。同族轻于 L-R1 | 已登记 |

> 字段口径：候选 ID、触发现场/证据路径、下一次可执行规则、分类、状态；证据一律 repo-relative，不抄 pane/mtime/运行日志细节，不含凭据。升格进 `docs/modules/dh-relay/knowledge/教训库-候选.md` 是单独的人裁决动作。

## 收口 miner 候选（2026-09-28）

### 候选-M1 · 临时诊断探针脱离正式命令的环境约束，会产生游离副产物污染路径审计
触发场景：batch-1 复核发现 `tools/relay-light/__pycache__/` 新增，且 §1.1 第 4 条审计命令（`git status --porcelain --ignored | grep __pycache__`）当时未跑未录；根查为一次未登记的 `python3 -c` AST 闭包 sanity-check 探针，没带 `PYTHONDONTWRITEBYTECODE=1`，import 编译产生了两个 `.pyc`。 · 建议分类：行为流程 · 来源：check.batch-1.md P1-1
疑似重复：无
- 现象：正式命令都带 `PYTHONDONTWRITEBYTECODE=1`，但施工过程中顺手起的一次性 python 探针没带，留下了未登记的字节码副产物，且审计清单只跑了前 3 条就没跑第 4 条。
- 反思：任何 ad-hoc 诊断/探针命令只要会调用同一解释器或同一工具链，就必须复用正式命令的环境变量约定；审计清单要逐条全跑全登记，不能因为前几条通过了就默认后面也会通过。
- 建议后续动作：施工前把「正式命令环境变量前缀」写进一次性备忘（或 alias），任何随手探针也套用；§1.1 类审计清单执行时逐条打勾登记，不允许跳条。
状态：待裁决

### 候选-M2 · 引入简化状态语义（如统一退出码）前必须核对现有函数的真实返回值契约
触发场景：plan-review round 2 P1-A：整改把 watch 参数/计划/账本/无 open stage 各类失败统称退出码 2、只在 `rc∉{0,2}` 时重拉，但 `relay_log.py` 现有实现里计划/配置失败走退出码 3、账本失败走退出码 4；计划没写「重映射」，coder 复用现有函数自然得到 3/4，导致启动时计划一坏就陷入每 5 秒空转的循环——正是该整改本要防的情况。 · 建议分类：编码陷阱 · 来源：review.plan.md（round 2）P1-A
疑似重复：无
- 现象：计划文本描述的退出码合同（0/2 两态）与被复用的既有函数实际产出（0/2/3/4 四态）不一致，直到 review 用实测命令核对才发现。
- 反思：新写的状态机/契约文字如果要落在会调用既有代码的实现上，必须先跑一遍现有函数在各失败分支下的真实返回值，不能凭「计划里这么写」就假定实现会自然吻合；否则契约与实测的落差会在运行期放大成死循环或误判。
- 建议后续动作：设计涉及退出码/状态码/错误分类等「有限状态集合」的改动时，写文字前先用一条命令实测各分支的现状返回值，把实测结果列进设计依据，而不是凭经验或语感统称。
状态：待裁决

### 候选-M3 · 路径审计/hunk 计数类机械判据的基准点要钉死稳定 commit，不能用会漂移的 origin/master
触发场景：plan-review-ud3 round 1 #11：`task_plan.md` §1.1 系列审计命令以 `git diff origin/master` 为基线；因为 master 在本卡开工后合入了别的 PR（#67，改了 SKILL.md），`origin/master` 已经前进，导致「SKILL.md hunk ≤3」这条与本卡无关的机械判据在 U1 施工前就先失败了。 · 建议分类：编码陷阱 · 来源：review.plan.ud3.md（round 1）#11，findings.md F-012
疑似重复：无
- 现象：审计脚本用浮动分支名（`origin/master`）当基线，外部并行 PR 一合入，历史上从未变过的判据就无缘无故报错。
- 反思：凡是拿「与基线的差异」做机械判据（hunk 数、文件名单等），基线都必须钉死成一个不会被别的分支活动改变的 commit（如本卡分支的 merge-base），用浮动引用等于把判据的稳定性交给了与本卡无关的外部提交节奏。
- 建议后续动作：写路径审计/差异类命令时，先用 `git merge-base` 或明确记录的起点 SHA 代替 `origin/master`/`main` 等浮动引用；如果确实要对比最新远端，另开一条「知悉但不阻断」的观察项，不要用它做通过/失败判据。
状态：待裁决

### 候选-M4 · 写否定式（assertNotIn 类）验收断言时，要先拿计划里规定的目标文案模拟跑一遍再定案
触发场景：plan-review-ud3 round 1 #9：计划规定编排位改写后的 tick 句子必须含「不做 watch 存活判定」，同时验收断言 R-U3-1 却要求该句「不含『存活』」——按计划规定的文案，这句话必然含「存活」二字，这条断言永远不可能变 GREEN，是断言设计本身与计划规定的文案自相矛盾。 · 建议分类：编码陷阱 · 来源：review.plan.ud3.md（round 1）#9 R-U3-1
疑似重复：无
- 现象：验收断言的否定关键词选取时只考虑了「旧文案里有什么该消失」，没有代入「新规定文案本身长什么样」去验算断言是否真能通过。
- 反思：设计 RED/GREEN 断言（尤其是排除式的 assertNotIn/不含某词）时，仅凭对旧文案的印象选关键词是不够的，必须把计划里明文规定的新文案原句代入断言逻辑跑一遍，确认改完之后真的会变 GREEN，否则断言可能写死后永远不过、要等复核才发现。
- 建议后续动作：起草否定式断言前，先写下「规定后的文案应该长什么样」的具体例句，用它自检断言逻辑（哪怕是口算/字符串代入），再落笔断言代码。
状态：待裁决

### 候选-M5 · 在授权范围内改写规范文档措辞时，容易顺手夹带无依据的新增机制声明
触发场景：consistency review round 1 CS-1：UD-2 只授权改写 SKILL.md 三处既有过时措辞，但改写时新增了一句「120 秒空闲上报由程序负责」——这既不在 design 冻结的 watch 三项行为里，也不在实现的任何常量/逻辑里；「120 秒」实际专属 single-task 的人肉 `phase=monitor` 节拍，被错误地挪给了程序能力，且与同一文件里刚改的另一处「single-task 无账本」自相矛盾。 · 建议分类：行为流程 · 来源：review.workflow-final.consistency.review-round-1.md CS-1
疑似重复：无
- 现象：改写授权范围内的一句话时，为了让句子读起来完整/顺畅，顺手加了一个语感上说得通但实际没有设计或代码依据的具体机制细节。
- 反思：改写规范性文档（SKILL/adapter/README 等）时，即使改动点位和大方向已被批准，新句子里的每一个具体机制描述（数字、动作、归属方）都要单独核对是否有 design 字面或实现代码支撑，不能靠「读起来通顺、方向没错」就当作忠实改写。
- 建议后续动作：改写规范文档措辞后，逐句反查新增的具体断言（尤其是数字/周期/归属方）是否能在 design 或实现里找到出处；找不到出处的具体细节一律删除或改成中性表述，交由后续裁决补全。
状态：待裁决

### 候选-M6 · 计划里明文要求写入证据的披露句，不能因为读者能自行推导而省略
触发场景：requirement(UD-3) review round 1 RQ-U3-1：`task_plan.md` §5.6 明文要求 `H12.md` 写明「阶段级 × Codex watcher、编排级 × Claude watcher 组合未实测」这句披露；实测证据里虽然从探针分配表能推导出这一缺口，但正文全文没有这句话，用户必须自己反推才能知道两侧组合覆盖不完整。 · 建议分类：行为流程 · 来源：review.workflow-final.requirement.ud3.review-round-1.md RQ-U3-1
疑似重复：无（与 L-09「输入框文字不可考」相关但不同：L-09 是归因克制，本条是明文必写披露句被省略）
- 现象：计划里逐字规定了「必须在证据文档写这句话」，成文时因为「反正从别的数据能推出来」而没有照写。
- 反思：计划里点名要求写入证据文档的披露句，其价值就在于替用户省去推导的功夫、明确划出证据边界；只要计划写了「须写明 X」，交付就必须原样落笔，不能用「能推出来」替代明文要求。
- 建议后续动作：证据/报告成文前，把计划里所有「须写明/须标注/须披露」的语句列成清单逐条勾核，跟正文一一对应，而不是只核对数据本身是否齐全。
状态：待裁决
