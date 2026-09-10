# RLT_03 R29 规划事件方向裁决

**VERDICT=REQUIRE_NEW_EVENT**

本次 Astra REVISE 包含新的 A-full / B-adjust 实质合同决定。不能以 fresh planning-no-event 将整包定性为旧 A04/B04 的机械收口同步。应为此次已确认的合同补充登记 fresh A/B 事件及真实的当前变化集证据，保留旧事件历史；R29 闭合前不能继续发送“已具备确认条件”的 E10 releasePacket。

## 1. 本轮范围和独立证据

- 日期：2026-09-10；工作树 `/home/nash/work/dh-relay/.dh-worktrees/RLT_03`；HEAD `e4b4cd68c163f32ef4324ea16d49dda53b5f44bc`。
- 已读仓根 AGENTS.md、当前 progress.md（含 E-070、E-080 和一次性例外记录）、review.md、正式 design/01 与 DevPlan 顶部 markers 及当前正文 diff。
- 按用户指定核对当前 `/home/nash/.codex/skills/dev-harness/tools/dh-console/scan.mjs`；其 SHA256 为 `954109826155ba30640468aa164671209535df87ef99bac080b97cc6901fcd23`。另只读 A/B 动作参考的“事件边界”和 R29 测试，作为待核合同资料，没有加载施工流程、派活或执行主控动作。
- 本轮直接运行 Node 导入 `derivePlanningEvidence()`，对真实模块目录求值：design 为 `A-full/design-input`、DevPlan 为 `B-adjust/dev-plan`，两者 `substantive=true`、`suppressed=false`；issues 恰为 design `EVENT_COUNT=3`、DevPlan `EVENT_COUNT=4`。这是本轮独立结果，不依赖 DeepSeek 的自报。
- E-080 的“保留旧 A04/B04 后 14 fail”“fresh no-event 后 0 fail”为既有隔离探针记录，本轮未重新创建隔离树、未复跑该两组探针；其分支行为与所读源码吻合。不把 R29 局部结果冒称完整 dh-check 或 E10 全部检查结果。
- 仅写本新报告。未改既有文件、未改 marker、未改工具、未 commit/push/rebase、未派活、未问用户。

下文模块相对路径根为 `docs/modules/relay-light/`；scan.mjs 行号对应上述当前 hash。

## 2. current R29 到底检查什么

| 规则 | 真实实现与结论 |
|---|---|
| 何时入闸 | scan.mjs:1403 起 `planningFingerprint()` 去除状态块、流程 marker、机械状态列和部分格式；:1716–1723 比较 HEAD 与当前 fingerprint，或发现声明改变才入闸。历史 marker 并非在每轮无条件重审 |
| 本轮声明个数 | :1777–1784 对当前被检查工件要求恰好一条 event。没有“历史 event 自动忽略、仅取最新一条”逻辑；直接追加 A05/B05 而保留原 3/4 条仍然失败 |
| fresh 的含义 | :1425 起 `markerIsFresh()` 比 raw 文本与 ordinal，不比日期、不判断审批是否曾经存在。旧 A04/B04 与 HEAD 相同，因此不 fresh；仅删其他 marker 不能让其变 fresh |
| no-event 分支 | :1754–1772：既有文件、一条 fresh 声明、精确 artifact、非占位 reason，可设 `suppressed=true`；与 event 共存则报冲突。代码不解析 reason 的业务真假，也不证明“目标或验收未改变” |
| event/证据三向绑定 | :1801–1837：精确 artifact、合法 stage、模块唯一 event ID、review/understanding 各一条，两个不同精确锚点 |
| 证据时效和锚点 | :1840–1882：证据目标在白名单且在当前 HEAD 变化集；对应 evidence marker 也必须 fresh。:1455 起 `exactAnchorSectionContains()` 要求独立 `<a id="…"></a>` 显式锚点，Markdown 标题自动锚点不能替代 |
| 反向检查 | :1898–1939：变化的 evidence 绑定必须由同快照当前规划 candidate 承接。不能只补 evidence、不改正式工件事件 |

工具测试 `tools/dh-console/test/planning-evidence-r29.test.mjs:517–544` 的合法 no-event 示例写的是“仅措辞澄清，不改变目标或验收”。测试证明该声明渠道存在，不证明任何实质变更都能借它免责。

因此 E-080 的探针绿灯是**语法与结构条件满足**，不是对业务事件分类的裁决。R29 对本次正文变更入闸符合其设计；没有足够证据将这次问题裁为 BLOCK_TOOL_DRIFT。R14 旧卡头兼容警告是另一项已登记事实，不足以推翻 R29 的当前两项阻塞。

## 3. 四问裁决

### 3.1 是否属于新 A/B 实质事件

**属于。设计为 A-full，已有 DevPlan 为 B-adjust。**

当前 A/B 参考定义很明确：

- `references/动作-A-立项.md:62–66`：“A-完整”包括实质改变范围、验收或关键决策；仅措辞/排版、机械链接和状态等回填不形成新事件。
- `references/动作-B-拆计划.md:55–58`：“B-调整”不只包括增删卡和改批次，也包括改变目标、验收、范围、用户取舍，影响可用结果、更新承诺或风险。

本次虽为 doc-only，且没有新增 ID、改变卡数或第 3 批安排，但发生了这些独立可验证的合同变化：

| 变化 | 为何不是纯机械同步 |
|---|---|
| A128 | 旧原文要求本卡“逐项覆盖四个例外”；现文把 A120 明确为跨卡兼容引用，其完整“两正四反”不作为 RLT_03 独立实现取证义务。改变本卡何时可以宣称验收条件完整满足 |
| A129 | 旧正文无条件允许表尾追加；现文明确产品终态与 RLT_03 严格基础 lint 的阶段性区别，许可本卡先以拒绝交付。此前顾问已将其分类为阶段性行为边界改变，而非纯勘误 |
| DevPlan RLT_03 / RLT_09 | 同步改变本卡机器验收边界，并给 RLT_09 增加临时限制切换、合法 fixture、硬约束守恒的交接判据。owner 号没变，不等于验收职责和可用结果描述没变 |

A5、A59 的勘误和 as-built 同步可以单独属于非实质整理，但不能用这些部分覆盖整包 A128/A129 的实质性。

既有 A04/B04 决定是前一轮 parser/status/template 原子分域；旧合同当时仍留下本次需要裁决的 A128/A129 张力。本次用户另行“按照 Astra 的决策来”（当前 progress:30、review“合同补充落账”所记录），正是新的决定来源。**已有用户确认说明新决定已获内容授权，不会把新决定变回旧决定。**本裁决不要求重新问同一个产品选择，也不推翻已经完成的实现或复核。

### 3.2 删除旧 markers，改留 fresh no-event 是否合理

**对本次整包不合理。**理由首先是 no-event 语义不真实，而非“所有旧 markers 永远不能动”。

current R29 把工件内 event 声明当作本轮声明而不是累积历史列表。下一次实质修改时，用一条 fresh 当前 event 替换旧 active markers 是合理的接口使用；原 :1746 的诊断也允许以合法 fresh 声明替代既有声明。但要区分：

1. **合理**：把旧 A02/A03/A04、B01/B02/B03/B04 的历史改为普通文字索引，保留 ID、原 stage/artifact、证据路径与确认形成史；当前正文仅留新的 A05/B05 活动 event。
2. **不合理**：用 no-event 否认当前 A128/A129 实质决定，或删掉旧事件的出处与历史含义，只剩“无规划事件”一句来换机械 0 fail。

不需移动/修改原 evidence/01–05，也不重写已推送历史。旧证据继续在原路径、旧 Git 版本可还原；新证据内可以用普通表格登记七条旧 marker 的字段与替换缘由。**不要把原始可解析 `dh:planning-event` 注释复制到新 evidence 当作历史清单**，以免被后续消费者再误当活动声明。

历史索引迁移保持业务方向；错误使用 no-event 则会抹掉此次用户取舍和阶段性验收变更的因果链。即使文件尚在 Git 历史里，也不能据此称当前治理语义没有损失。

### 3.3 正确路线及授权

在**保留当前已确认的 Astra 正文改动、不改 checker、不回滚业务决定**的约束下，正确路线是：**fresh A-full + fresh B-adjust + 当前变化集 review/understanding 证据对 + 旧事件历史索引**。不是只把 A04 改一个字符满足 fresh，也不是新事件与旧 3/4 条一起堆叠。

推荐 ID 为 `RLT-A-05` / `RLT-B-05`。本轮模块检索仅在 E-080 方案描述中见这两个号，未见已登记活动事件；实际写入前须再核唯一性，不能抢占其他并发已用号。

推荐一份新证据文件承载两个事件的四个独立段：

`docs/modules/relay-light/design/evidence/06-交叉审核记录-RLT03阶段合同补充.md`

四个显式锚点：`review-rlt-a05`、`understanding-rlt-a05`、`review-rlt-b05`、`understanding-rlt-b05`。每段用独立 `<a id="…"></a>` 起头，其后分别放一条匹配 event/artifact/kind 的 fresh evidence 声明。

正式 design 留一条活动声明，字段值：

- id=`RLT-A-05`，stage=`A-full`，artifact=`design/01-RelayLight-产品设计与验收.md`；
- review=`evidence/06-交叉审核记录-RLT03阶段合同补充.md#review-rlt-a05`；
- understanding=`evidence/06-交叉审核记录-RLT03阶段合同补充.md#understanding-rlt-a05`。

DevPlan 留一条活动声明，字段值：

- id=`RLT-B-05`，stage=`B-adjust`，artifact=`dev_plan/P1-RelayLight-开发方案.md`；
- review=`../design/evidence/06-交叉审核记录-RLT03阶段合同补充.md#review-rlt-b05`；
- understanding=`../design/evidence/06-交叉审核记录-RLT03阶段合同补充.md#understanding-rlt-b05`。

证据内容必须是真实发生的本次审核、裁决、向用户解释和用户确认：引用 Astra 六项报告、E-070、E-071/E-072、E-074/E-075 及实际授权来源；A/B 分别说明覆盖了什么。B 的核对要有以本次正式设计为输入的承接、验收分域、依赖/批次审查，不能把 A 审核改标题当作 B 审核。已有证据满足的部分可复用并明确原日期、版本/差分与范围；若不足，补实际的定向审核，不能虚构一次 fresh review 已经发生。

`understanding` 是证据类别，不要求为凑 marker 再进行用户已拒绝的形式化理解测验；如实登记已有解释、用户“按照 Astra 的决策来”的确认、停止形式化测验的历史指示及适用范围。没有的问答不能编造。应注明本次是**已确认合同补充的事件/证据补登记**、记录实际先后，不伪装这些 markers 在 E-070 写正文前已经存在；不得将此称为未经授权改产品的“失序施工”，也不能伪造完整的先登记后落盘顺序。

**授权判断**：E-070 已记录用户对 Astra 决定与七个精确路径的授权，无须再请求同一内容授权。本轮用户只允许写本报告；E-080 两条路径机械整理授权亦不能推出新 evidence 文件权限。主控需取得或核实已有授权明确覆盖上述**一个新证据路径**、两份正式文档的当前事件替换/历史索引，以及必要的 workspace 事实同步。不能扩大成 `design/evidence/**` 或新增 RLT_03 allowed-paths 通配；b7f4ecc 的一次性既有 patch 例外不覆盖这次新文件。

## 4. 精确路径清单

**本轮唯一实际允许写入且写入的文件**：

`docs/modules/relay-light/workspace/RLT_03/reviews/closeout-r29-decision-astra.md`

**后续推荐执行包（须由有权主控在范围授权成立后执行；本报告不授予写权限）**：

| 精确路径 | 允许的最小后续改动 |
|---|---|
| `docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md` | 原三条活动 marker 转历史索引指针，保留一条 fresh A05；补当前事件来源，不重新改产品行为 |
| `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` | 原四条活动 marker 转历史索引指针，保留一条 fresh B05；记录此次补充，不改任务状态/依赖/批次/allowed-paths |
| `docs/modules/relay-light/design/evidence/06-交叉审核记录-RLT03阶段合同补充.md` | 新建；四段真实当前事件证据、七条旧事件历史索引、实际时序与确认来源。此项为必要新增路径授权 |
| `docs/modules/relay-light/workspace/RLT_03/progress.md` | 新事件补登记、当前源版 R29 复跑、E10 旧展示已被阻塞发现 supersede 的事实 |
| `docs/modules/relay-light/workspace/RLT_03/review.md` | 原五路结论保持；补 R29 治理状态与 E10 准入结论，闭环后按新证据更新，不代签人类区域 |

不需要为本问题改 Python、测试、as-built、brief、task_plan、历史 reviews、历史 evidence/01–05、dev-harness scan.mjs 或 R14 的整份卡头格式。若后续实际发现超出该包的问题，另行明示范围。

## 5. 当前是否继续 E10

**不能继续把 E10 当作可供一次确认执行收口包的 releasePacket 发出。**

当前 E-080 已记录 R29 两项 fail，本轮独立扫描仍复现；review 的“足以进入 E10”依据是发现该阻塞前的五路结果。五路 APPROVE 和 54 tests 不替代规划证据准入。已发送的 `RLT_03-E10-20260910-01` 不可继续沿用为当前无阻塞版本。

可以保留内部备料，并向用户作阻塞事实报告；这不等于继续发可确认的收口包。本轮按用户要求不向用户提问、不改旧 packet。

恢复条件：真实新事件证据齐备，当前源版 R29 对实际变化集通过；完整收口检查结果重新如实登记，若之后暂存也核对同一完整证据包的 index 快照；R14 保持已知警告/基线事实，不伪报全绿；E-078 所记主干重叠 WIP 等其他既有阻塞分别按其边界处理。然后更新 releasePacket 展示版本，再由主控沿既有授权门推进。此裁决不放行 verify、merge、push、清理或 RLT_05 开工。

**最终结论：REQUIRE_NEW_EVENT。**新事件记录的是已经产生并获确认的实质合同补充；它不要求重做全部施工，也不允许以 no-event 或篡改历史获得机械绿灯。
