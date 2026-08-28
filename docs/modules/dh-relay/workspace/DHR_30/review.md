<!-- dh:v1 -->
# review — DHR_30 Relay CLI 与可选 DSH/Pi Bridge

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

**第一轮·批次小审合集**（施工按 A/B/C 三批推进，每批施工完即派 fresh-context 只读小审；此处合集即第一轮代码复核）

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|
| codex exec `--sandbox read-only`（GPT-5，fresh-context，未参与实施）· 批次 A 小审 | 步骤 1~3：canonical repo root / owner-aware 端点 / contracts 连接闸 / legacy 只读投影 | F-012（P1 error_response.data.receipt 未 required）、F-013（P1 孤儿 Store 未落只读）、F-014（P1 discovery 完整性判据不可靠）等，总结论 changes-requested（R-A-01~04），均在批次 A 返工轮闭合（E-015~E-019） | e:E-014 | E-014 |
| 同上 · 批次 B 小审 | 批次 B 四提交（CLI 七命令 + pending 账 + 崩溃收敛） | 8 项清单逐条对证，登记 F-018~F-025（P1×5 / P2×2 / P3×1） | e:E-026 | E-026 |
| 同上 · 批次 B 返工定向复审（轮 1） | 342e740 + 返工三提交 | **5 闭 3 未闭**：closed = F-022/F-024/F-025；closed-with-note = F-018/F-021；not-closed = F-019（R-D-01 陈锁回收无 owner token）、F-020（R-D-02 mkdir mode 不收权）、F-023（R-D-03 并发回归杀伤力不足）。R-D-04 范围指控经 `git diff --name-only` 核实**不成立，主控驳回** | e:E-033 | E-033 |
| 同上 · 批次 B 返工定向复审（轮 2） | 返工二轮四提交 | F-023 与 2784f38 判 closed；F-019/F-020 仍 not-closed（R-E-01 无原子围栏 / R-E-02 win32 无 DACL 证明 / R-E-03 权限断言非确定性），总结论 changes-requested | e:E-040 | E-040 |
| 同上 · 批次 B 返工定向复审（轮 3） | 主控直修 a3cdc4f | R-E-03 closed-with-note；R-F-01/R-F-02/R-F-03 三条新问题使 R-E-01/R-E-02 仍 not-closed。**满 3 轮未收敛 → 按 G6 停损摆用户裁决** | e:E-042 | E-042 |
| 同上 · 批次 C 小审 | `db57cf0..60018a0`（含此前从未被复核的用户裁决直修 6133507、F-026 直修 336b389、批次 C 三提交） | **changes-requested**：R-G-01（P1 Bridge 间接致凭据被创建）、R-G-02（P1 订阅重连耗尽静默停止 + close 不 reject pending 致 120s 超时）、R-G-03（P2 镜像断言②字段面无牙 + 测试轮询无超时）、R-G-04（P3 删锁指引把 pid 当所有权凭据）→ F-028~F-031 | e:E-047 | E-047 |
| 同上 · 批次 C 返工定向复审 | `37d7bb9..0ce5ab3`（RW3 三提交 + 主控两笔 docs） | **changes-requested** 但大件全确认：F-029①/F-030 closed、F-028 closed-with-note、deliveredSeq 高水位改动被独立验证为真 bug 修复；新出 R-H-01（P1）/R-H-02（P2）→ F-032/F-033（主控直修 E-052） | e:E-051 | E-051 |
| 同上 · 窄幅三审 | 仅 `5327cfb`（F-032/F-033 直修 + 两回归） | **approved，零新发现**：R-H-01/R-H-02 双 closed，回归有牙，范围合规 | e:E-053 | E-053 |

**第二轮·增量复核**

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|------|
| codex exec `--sandbox read-only`（GPT-5，**fresh 会话**，不继承轮1任何上下文，只读仓内已落账记录；会话身份≠轮1各批小审会话） | 全卡 `e52a45b..4061e76` 终态 | 抽查 F-012/F-013/F-019/F-020/F-026/F-029 六条**全部成立**；验收口径 4 pass + B1 并列断言缺口；一致性三行独立裁决全过；收口风险与 DSH 移交口径背书；新发现 R-J-01/R-J-02 → F-034/F-035（主控半采纳直修 `2602eab`，157/157 绿，E-055） | changes-requested → 修复后待窄审收口 | e:E-054；log:`scratchpad/codex-round2-review.log` | E-054 |

**返工收敛**

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|------|--------------|----------------------|---------|
| 批次 A 返工 | 3（F-012/F-013/F-014） | 逐条 TDD 先红后绿；全量 123→ 绿 | 是 |
| 批次 B 返工轮 1 | 5（F-018~F-022） | RW-1~RW-5 + F-025；全量 142/142 绿（E-030/E-031） | 部分（F-019/F-020/F-023 未闭） |
| 批次 B 返工轮 2 | 3（F-019/F-020/F-023） | RW2-1~3 + 附带修 F-018 残余竞争；全量 144/144 绿（E-038/E-039） | 部分（F-019/F-020 未闭） |
| 批次 B 返工轮 3（主控直修） | 2（F-019/F-020） | pid 存活双判据 + icacls DACL + 确定性权限断言；CLI 17/17、全量 144/144（E-041） | 否 → **触发 G6 停损，摆用户裁决** |
| 用户裁决落地 | 2（F-019/F-020） | 用户选「取消自动回收」+「迁独立私有子目录」；主控直修 6133507，CLI 17/17、全量 144/144（E-043） | 是（待批次 C 小审复核确认） |
| 批次 C | 1（F-026） | worker 实抓架构缺口 → 主控裁定为 B-13 实现缺口，直修 336b389 并把排序规则冻结进 design/06 §14.4；worker 按规则修断言（E-044/E-045） | 是 |
| 批次 C 返工轮 1 | 2（F-029/F-030；F-028 部分驳回、F-031 主控直修已闭） | RW3-1 注释精化 / RW3-2 订阅失败路径闭合（close 立即 reject pending + 重试耗尽回调宿主，附带实抓修正重连快照高水位误滤 cursor 补发）/ RW3-3 镜像断言②字段面钉子与轮询超时；worker 三提交 0287c1e/0ee57b5/dfb8f00，主控复验 153/153（E-050） | 部分（定向复审 E-051 出 R-H-01/R-H-02 两条窄边界） |
| 批次 C 返工轮 2（主控直修） | 2（F-032/F-033） | 零预算路径统一 `onClosed`；gap 恢复不占预算；两条新回归 + 变异双验；全量 155/155（E-052）；窄幅三审 **approved 零新发现**（E-053） | **是——批次 C 收敛，第一轮全闭** |
| 轮 2 全卡复核后修复 | 2（F-034/F-035） | R-J-01 半采纳（删零消费者 re-export + 控制面 import 双钉，驳回删 DHR_51 宿主原语——fencing 仲裁 + 合同限定词 + 生产零调用三重依据）；R-J-02 直修 B1 并列四断言；157/157（E-055） | 部分（窄审 E-056 出 R-K-01/R-K-02） |
| 轮 2 修复窄审后修复（主控直修） | 2（F-036/F-037） | 窄审判 F-035 closed、宿主入口不删半支**独立确认成立**，但推翻驳回中 `createRunWithNumbering` 一支（R-K-01 P1 fencing 外写路径）并指出钉子 service 豁免口（R-K-02 P2）；直修 `de79d05`：残缺目录 fail-closed（`E_REQUEST_CONFLICT:run-root-exists` + 回归钉三点）+ 删钉子豁免；变异双验必红；158/158 + audit 0 违规 + validator 48/48 + hash 零漂移（E-057） | 是（待 F-036/F-037 定向复审确认） |

> **换人纪律说明**：批次 B 的 F-019/F-020 在返工轮 1 后即出现「修完引入新问题」，按止损换人规矩，返工轮 3 起改由主控直修（不再派同一施工方 GLM）；换人未重置轮次计数，满 3 轮仍不收敛即按 G6 停下摆用户，未硬收口。

**五路复核登记**（代码轮1/轮2 见上表；其余三路）：

| 路 | 复核者（fresh 只读实例） | 结论 | 处置 | 证据 |
|---|---|---|---|---|
| 需求复核 | codex exec read-only（GPT-5，未参与实施与代码轮） | changes-requested（R-M-01~06） | R-M-01 采纳：冒烟重跑转录落仓 `evidence/cli-smoke-20260828.txt`（E-061）；R-M-02/03/04 按 G11 车道裁定部分采纳（机器项单测即证据 + E-061 场景补充）；R-M-05/06 采纳：review 三处统一 + DevPlan 移交登记 + 元数据表补全（E-062）。整改窄审（E-063）：R-M-02/03/04 车道裁定独立确认成立；余三条精度问题 R-P-01~03 直修（转录重生成 17/17 全 0、DHR_31 范围补树外承接、计数照实），终审（E-064）**approved 全 closed——需求路收敛** | e:E-060/E-061/E-062/E-063/E-064；log:`scratchpad/codex-requirement-review.log` |
| 教训复核 | codex exec read-only（GPT-5，未参与实施与代码轮） | changes-requested（R-N-01~11） | 候选-17/18/22/23 收窄/拆分；新增候选-24~29；miner 映射完备性说明落档（E-062）。整改窄审（E-063）判 **R-N-01~11 全 closed——教训路收敛** | e:E-059/E-062/E-063；log:`scratchpad/codex-lessons-review.log` |
| 一致性复核 | 轮2全卡复核者独立裁决三行（pilot schema 演进 / 排序纪律 / 幂等口径） | 全过 | 已回填上方一致性表 | e:E-054 |

## 第 4 路·一致性复核（横向：本次动的口径 vs 同类路径既有定义）

<!-- dh:consistency-review:v1 task=DHR_30 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|---------|-------------|------|---------|
| `relay.client-read-model/v1` 四视图与 `run_summary` 字段面（design/06 §14） | P4 pilot 两份冻结 schema：`relay.pilot-read-model/v1` + `relay.pilot-run-list/v1`（DHR_25/27/49 消费） | 字段级起点即两份 pilot schema（B-13 钉死）；`group` 词表差异（pilot 含 `blocked` → v2 收窄）出自 DHR_28 v1 缺口处置表显式裁决 | **有意演进已落账**（轮2独立复核确认：「design/06 §14 明确以两份 P4 pilot schema 为起点，v1-gap-disposition 明确记录 group 词表差异与原因，不是静默漂移」） | e:E-054 |
| `group`/排序的「源头给」纪律 | v1 CLI（`tools/` PowerShell 渲染）与 pilot DSH 面板（各自从 fixture 重建） | v2 把架构约束升为合同条款（§14.4）+ 双镜像断言，收严方向 | **一致**（轮2确认：「P4 的源头给、客户端不推导被收紧为正式合同；discovery.mjs 实现与 §14.4 一致」） | e:E-054 |
| 控制请求幂等口径 | v1 无 control 幂等；design/02 B1 幂等子命题 | v2 以 `(client_id, request_id, method)` + JCS digest 持久幂等，CLI 与 Bridge 同口径 | **一致**（轮2确认：「CLI 与 Bridge 都通过同一 RPC/ledger；Bridge requestId 由宿主提供，未私自建立 pending 账」） | e:E-054 |

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**（我最没把握的三处，如实说）：

1. **F-016 同族偶发超时**：`rpc-service.test.mjs` 的 subscribe 用例在高负载全量跑时偶发 timeout（本卡期间出现 1 次，隔离复跑 11/11 绿；最近三次全量 153/153、155/155 均未现）。根因疑为真实 detached 进程 + 固定等待窗口，未根治，只在观察。若收口后偶发频率上升，按 F-016 建议改有界轮询。
2. **win32 ACL 收权的环境依赖**：icacls 三步收权在本机（Windows 11 中文版）实测真过且测试预埋外来 ACE 验证被清，但不同 Windows 版本/语言环境/域策略下 icacls 行为差异未穷尽——测试在 CI/他机跑仍可能暴露边界。
3. **凭据引导语义是「设计如此」而非「本卡验证过威胁模型」**：凭据由首次 bind 的 service 创建（design/07 §3.4），CLI/Bridge 同构只读。批次 C 小审曾把它当缺陷（F-028），我按设计文档驳回——但「该引导设计本身是否是对的威胁模型」不属本卡验收面，P7/P8 权限阶段应重新审视。

**设计契约传导声明**（本卡动过的契约面与传导去向）：

| 契约变更 | 落点 | 传导证据 |
|---|---|---|
| Read Model 字段级定义冻结（四视图 + run_summary 六字段 + run_status_view 七字段 + 排序规则） | design/06 新增 §14（`cea0b74`；§14.4 排序条款随 F-026 直修补入 `336b389`） | 双端 `whitelist-exception-closed: DHR_30` 标记：design/06 §14 与 P4 §0.2 rg 双命中；镜像断言与字段面钉子常驻 `test/read-model-mirror.test.mjs` |
| P4 §0.2 列表投影白名单例外**关闭** | `dev_plan/P4-DSH工作台最小Pilot-开发方案.md` §0.2 机械回注（`cea0b74`） | 同上 rg 双端命中 |
| pending 落点合同：`<repo>/.dh-relay/private/` owner-only | design/08 §2 补落点条款（`6133507`，随 F-020 用户裁决） | `cli/pending.mjs` 实现 + `test/cli.test.mjs` 权限用例（预埋外来 ACE 断言被清） |
| `error_response.data.receipt` 收 required（F-012，批次 A 返工） | `contracts/relay.rpc.v1.schema.json` + 三份基线同批重生 | `capability_hash` 2971189e→**a990fdda** 后全程零漂移（E-046/E-050/E-052 三度复证） |
| 新拒绝码 `E_ORPHAN_STORE_READ_ONLY`（F-013） | `contracts/reason-codes.md`（含与相邻码边界与重试语义） | 孤儿只读回归常驻 |
| **未回写待用户确认**：F-008 保守 seed、F-009 孤儿投影语义、F-010 subscribe legacy 码语义 → design/08 §3 | 未动（G8：待决策不写成已决策） | findings 三行 open，随 E10 摆用户 |

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| CLI 是 DSH 未安装时可独立使用的控制面 | 真实 service 进程 + 真实 CLI 子进程跑七命令（零 mock），全程无 DSH | E-020~E-024、E-030、E-037、E-046 | 满足（机器证；机器可完整证明 → 按 G11 不入人验栏） |
| Bridge 接缝可被中立客户端消费 | 真实 service + 真实 Bridge 做查询 / 订阅 / 重连 / 窄控制；五份纯 JSON fixture 由不 import 任何 relay 运行时代码的解析路径消费 | E-046 + `test/dsh-bridge.test.mjs`、`test/client-fixtures.test.mjs` | 满足（机器证） |
| **真实 DSH 页面渲染 Bridge 数据的截图** | 见下方「条件 5 取证路径分析」 | **未取得** | **用户已裁决（2026-08-28 对话原话「DSH 不需要管，现在重点是CLI终端侧跑通」）**：本卡不追 DSH 渲染，截图半部移交 DHR_31；本卡按带风险放行口径收口（风险项 = 真实 DSH 渲染未证），E10 时随放行证据包整包确认 |
| **CLI 终端侧真实跑通**（用户点名的重点） | 真实终端、真实仓、真实 service：七命令逐个人工路径操作（非单测）；含 list text/--json 同一 Run 同源对照、stop 后 Run 不取消、follow 挂住时另一进程 stop 的实时推送、follow 客户端消亡后账面零影响 | E-049 + **E-061 重跑转录落仓 `evidence/cli-smoke-20260828.txt`**（需求复核 R-M-01 指出 E-049 原转录在 scratchpad 不可追溯，已重跑并落仓：15 条命令全 exit=0，run `R001-smoke2-20260828`） | 满足（真实场景证 + 转录可追溯） |

**条件 5 取证路径分析（G3 硬闸，供 E10 判断用）**

- **卡面原话**：DHR_30 档位注 = 「标准（客户端接线；DSH Bridge 部分**若执行**需真实截图作需求境证据）」；P5-X 机器证（条件执行）= 「DSH Bridge **重连并重建 UI**；Pi 客户端读取同一 Run 的 fixture 示例可解析」。
- **条件已触发**：执行判据是 P4 DHR_50 结论——「无结论→记『未执行，待 DHR_50』，判否→只留合同接口」。DHR_50 已于 2026-08-21 收敛为 `passed-with-constraints`（非无结论、非判否），故 Bridge **确应执行，也确实执行了**（adapter 已交付）。截图义务随之成立。
- **为什么现在拿不到**：本卡交付的是**库接缝**（`connectDshBridge`），不是 DSH 插件。要在真实 DSH 里渲染出来，必须改**树外** DSH Host Plugin——DHR_49 建的列表屏 / 详情屏当前是从 DHR_25 冻结 fixture 重建的，得把它改成经 Bridge 取活数据，再 `npm pack` → `dsh plugin add <tgz>` 重装。该插件源码在本仓之外，也不在 DHR_30 的**变更范围**内（范围 = `cli/`、`adapters/dsh-bridge/`、`fixtures/clients/`、`runtime/`、`rpc/`、`contracts/` 及相应 tests/fixtures）。本卡**非目标**亦明写「不实现完整 DSH Client UI」。
- **它本来是谁的活**：P5 计划 DHR_31 卡面写着「**DSH 作为附加客户端连接只验展示一致性**，P4 判否时记不适用」，且 §卡表注「DHR_31 … DSH 附加客户端项按 DHR_50 结论执行（B-11）」——真实 DSH 渲染与展示一致性的取证落点在 DHR_31。
- **裁决状态**：方向已由用户在 2026-08-28 对话裁决（原话「DSH 不需要管，现在重点是CLI终端侧跑通」）——条件 5 一分为二：「Bridge 接缝可被中立客户端消费」由机器证满足记达成；「真实 DSH 渲染截图」**显式移交 DHR_31**（本 review、DevPlan P5 卡表同步登记）。DHR_30 按**带风险放行**收口（`release_mode=risk-accepted`，风险项 = 真实 DSH 渲染未证），**绝不写成「全验收通过」**；风险接受的**整包最终确认**仍在 E10 随放行证据包做，AI 不预填。
- **另一条可选路径**（若用户要在本卡就拿到截图）：授权我做树外 DSH 插件接线（改 DHR_49 面板数据源 → repack → 重装 → 截图）。这是**超出本卡变更范围的扩范围决定**，须用户明确授权；成本约半天，且会把树外插件仓拉进本卡的收口面。

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---------|------|-------------|------|
| 1 | DSH 未安装时，`relay list/status/inspect/events --follow/start/stop/resume` 均可经 RPC 使用，CLI 不依赖 DSH。 | AI | E-020~E-024（CLI 八用例全走真实 service 进程 + 真实 CLI 子进程，零 mock）、E-030（7 组新回归，CLI 8→15）、E-037（CLI 15→17）、E-046（全量复验）；**真实终端场景证 E-049/E-061（转录落仓 `evidence/cli-smoke-20260828.txt`）** | 达成（轮2 E-054 对证 pass + E-061 场景转录可追溯） |
| 2 | CLI 文本与 JSON 同源于 Runtime Read Model；字段定义以两份 P4 pilot schema 和 v1-gap 处置表为起点，`group` 两条镜像断言成立，P4 白名单例外按指定标记关闭。 | AI | 字段定义冻结于 design/06 §14（提交 `cea0b74`）；P4 §0.2 例外关闭 + 双端 `whitelist-exception-closed: DHR_30` 标记（同提交，rg 双端命中）；两条镜像断言 E-045 双证；排序规则 E-044；**同一 Run 的 list text/--json 真实终端对照进 E-061 转录**。车道裁定（对 R-M-02）：同源/镜像/标记是机器可完整证明的事实，按 G11 走机器项，真实场景对照为补充而非替代 | 达成（机器证 + E-061 场景补充） |
| 3 | 客户端断开、退出或 SSH 断链不取消 Run；重连从 Runtime 重建状态。重复 control request 以 request id 幂等，Receipt 唯一。 | AI | E-011（订阅无缝重挂、保留号幂等、stop/resume 时序）、E-018（F-015 断连不取消 Run）、E-029/E-030（pending 账 + 崩溃收敛，同 request_id 收敛到同一 Receipt）、E-037（双 CLI 并发 mutating 收敛语义）；**「断开不取消」真实场景在 E-061 转录 §5/§6（follow 客户端消亡后 Run 与账面零影响）**。车道裁定（对 R-M-03）：request-id 幂等 / Receipt 唯一是机器项（并发与崩溃窗口只有自动化能穷举），按 G11 单测即证据 | 达成（机器证 + E-061 场景补充） |
| 4 | DSH Bridge 经 RPC 做查询、订阅、重连与窄控制；Pi/其他客户端 fixture 与 RPC 示例可解析；Bridge 不直接写 Store。 | AI | E-046（adapter 零 `store/**` import 抽查）+ F-034 链收口后的 `test/control-plane-imports.test.mjs` 静态钉（E-055/E-057）、批次 C `test/dsh-bridge.test.mjs`（真实 service + 真实 socket 断线补发/耗尽通知/gap 重快照，E-050/E-052）、`test/client-fixtures.test.mjs`（五份 JSON 过冻结契约 + Pi 式中立解析不 import 运行时代码）。车道裁定（对 R-M-04）：Bridge 是库接缝，其「真实消费场景」= 真实 DSH 渲染，已按用户裁决整体移交 DHR_31（见条件 5）——本卡内不存在残余未入账的场景义务，机器项按 G11 以真 service/真 socket 集成测试为证 | 达成（机器证；真实 DSH 消费随条件 5 移交） |
| 5 | Bridge 若执行，有真实 DSH 渲染截图作为需求境证据；目标机 UI/H-e2e 未验证边界如实保留。 | AI + 人判 | DHR_50 结论 = passed-with-constraints → Bridge 确应执行且已执行；真实 DSH 渲染截图**按用户 2026-08-28 对话裁决移交 DHR_31**（DevPlan P5 卡表同步登记），本卡风险项如实保留 | 二分达成：接缝机器证达成；截图移交 DHR_31，本卡**带风险放行**待 E10 整包确认 |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|----------|--------|-------|---------|-------------|---------|-----------|-----------|----------------|------------------|---------------------|
| CLI 七命令无 DSH 可用 | 真实 RPC 端到端测试 + 真实终端转录 | machine | DHR30-M1 | 等价覆盖 | 每个命令经同一 Runtime/RPC 成功 | CLI 17 用例绿（E-046）+ 终端 17 命令头/17 exit 码全 0（E-061/E-063 转录，含自检行） | win32 · node ≥18 · 2026-08-28 | RPC server + test + 落仓转录 | DHR_31 闭环不在本卡 | relay.rpc/v1 | node test | 自动 |
| Read Model 同源与字段定义 | text/json 对照、镜像断言、design 双端标记 | machine | DHR30-M2 | 等价覆盖 | 共享 Read Model，断言均通过 | 镜像双证 E-045 + 字段面钉子 E-050 + rg 双端命中 + E-061 同 Run text/json 对照 | 同上 | frozen schemas | 后续客户端未接入 | relay.run-state/v1 | node test/rg | 自动 |
| 断连与 control 幂等 | 真实 socket 回归 | machine | DHR30-M3 | 等价覆盖 | Store 零 cancel、重连同态、Receipt 唯一 | E-011/E-018/E-029/E-037 全绿 + E-061 §5/§6 场景复证 | 同上 | Store event/state | 完整 workflow 留 DHR_31 | relay.rpc/v1 | node test | 自动 |
| 条件 Bridge/Pi 接缝 | RPC adapter、fixture 解析（截图义务移交 DHR_31） | machine | DHR30-M4 | 部分（截图半部移交后，本卡面等价覆盖） | 无 Store 直写且 DSH/Pi 消费同一对象 | dsh-bridge 7 用例 + client-fixtures 2 用例绿（E-050/E-052）+ import 静态钉（E-057） | 同上 | RPC protocol | 目标机 UI/H-e2e 未证（风险项，随 E10 整包） | relay.rpc/v1 | node test | 自动 |

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [x]（八件套齐 + evidence/ 落仓转录；progress 至 E-062；第一轮批次小审合集 + 轮2 + 五路登记 + 返工收敛表在上方）

**as-built 更新了没**：`as-built/relay-core.md` 已覆盖更新？ [x]（`ed851ad`：§3.8~§3.10 DHR_30 增量 + §10 路由表更新）

→ 当前状态：**待人验 / E10 确认**（五路复核全收敛 E-064；收口汇报与放行证据包已在对话给出；带风险放行口径，风险项 = 真实 DSH 渲染未证 · RISK-DHR30-DSH-RENDER，移交 DHR_31）

---

## 人类签名区　✅ 凭你在对话里的确认解锁

本卡没有独立人判验收项；若后续证据显示必须由用户裁决 Bridge 实用性或 DHR_50 约束解释，先停下补入该项，不得预填通过。

- [x] **E10 整包确认（带风险放行）**：用户 2026-08-28 对话内 AskUserQuestion 三题点选——①「认可，执行本地收口」②设计回写「随收口一并回写」③尾巴「整批入验收池」。放行语义 = **带风险放行**（`release_mode=risk-accepted`，Risk-Count=1，风险项 `RISK-DHR30-DSH-RENDER`=真实 DSH 渲染未证→移交 DHR_31）；确认对象 = 放行证据包整包（E9 七段收口汇报 + 证据展示区，见对话与 progress E-065）。chat-confirm 代签，G5 满足。

## B-adjust 独立审核

### 1. 方案问题（P0–P3）

- **P1-BA-01：descriptor 的代次、所有权和双 launcher 竞态没有形成可验证的 fencing。**
  - **事实**：草案只规定 `endpoint/pid/generation/runtime_version/capability_hash`、原子发布、服务自删和下一 launcher 回收（`b-adjust-draft.md:9-11,18`），没有仓级 claim/锁、generation 的生成与持久化规则、compare-and-delete 或 live-service 的原子复核。现有冻结握手字段只有 `protocol_version/runtime_version/capability_hash/client_id/request_id`（`design/05...:187-205`），`rpc/server.mjs` 实际只比较 `capability_hash`，没有 generation 绑定（`rpc/server.mjs:203-217`）。因此两个 launcher 都看到空/陈旧 descriptor 时可以同时拉起；旧服务退出清理与新服务发布之间也存在 ABA/TOCTOU，PID 复用还会把别的进程误判为 owner。
  - **影响**：CLI 可能连到错误代次、两个服务争抢同一 endpoint，或旧进程删除新服务 descriptor；这会破坏“陈旧回收但不误杀活服务”的目标，属于正式 CLI 接缝的 P1 阻塞。
  - **建议**：先落 descriptor schema（含 descriptor 版本、规范化 repo 身份、唯一 owner nonce/代次、endpoint ownership 证明），用仓级启动锁完成 claim→bind→ready→publish；服务清理只能对“仍等于自己完整快照”的 descriptor 做 compare-and-delete。客户端必须通过 service-side challenge/合同返回值验证代次，而不是仅信任文件；覆盖双 launcher、服务 crash、旧 descriptor、endpoint 残留和 PID/代次 ABA 的真实进程测试。

- **P1-BA-02：repo-level service 与现有 per-run host/Store 的唯一写者边界未落地，`control` 没有安全实现路径。**
  - **事实**：现有 host 明确只是生命周期保持器，不含 workflow/executor 且不开 RPC（`runtime/host.mjs:1-7`）；`runHostSession` 按单 Run 取得 lease、以 `writeGuard` 写 Store 并续租（`runtime/host.mjs:27-40,55-90`），`startDetachedHost` 只返回已 unref 的子进程 PID，没有 ready、stop、resume 或控制通道（`runtime/host.mjs:103-112`）。Run 创建则由 `startrun.mjs` 直接建 Store、写 `run_created` 后才返回句柄（`runtime/startrun.mjs:46-83`）。草案同时要求 service 组合 `start/control/subscribe`、写账且不让客户端直写 Store，并把 workflow/executor 留给 DHR_31（`b-adjust-draft.md:12-13`），但没有说明 service 是如何跨多个 Run 读取投影、如何在 host 持 lease 时发送 stop/resume、如何避免 service 与 host 并发写同一 Store。
  - **影响**：实现者可能直接打开/写 Store、杀 host PID 或重复启动 host，绕过 lease fencing；也可能为使 `start` 看似可用而把 `basic-agent-task` 或 executor 偷塞进 DHR_30，既破坏唯一写者又越过 DHR_31 边界。
  - **建议**：在计划中明确一个仅负责控制面/宿主生命周期的 Runtime broker：查询走 Runtime 生成的 Read Model，控制走持久化且 lease-fenced 的 control request/Receipt，不以客户端直写 Store 或裸杀 PID 代替；明确 service 是单一 repo 进程、如何管理多个 Run、service 重启如何重新发现 host。加多 Run 并发 start/control、host 接管时旧写拒绝、service crash/restart 的隔离测试，并明示 service 不 import `workflows/` 或 executor。

- **P1-BA-03：request_id 幂等与 Receipt 只写在草案承诺中，现有 RPC seam 没有持久去重或可用的业务错误回包。**
  - **事实**：草案要求同一 `start/control request_id` 的同摘要返回同一 Receipt、摘要冲突拒绝（`b-adjust-draft.md:12,19`）。但现有 server 明确“不做 start/control、幂等 request_id 去重”（`rpc/server.mjs:16-17`），只是把任意 handler 分派出去（`rpc/server.mjs:219-249`）；handler reject 会直接 `dropConnection`，不产生稳定业务错误响应（`rpc/server.mjs:165-168,246-252`）。`design/05` 虽要求 RPC 支持幂等请求（`design/05...:187-205`），现有实现未定义 `(client_id, request_id, method)` 的作用域、摘要规范化、并发 in-flight 合并、服务重启后的回放位置或冲突 reason。
  - **影响**：CLI 重试可能重复创建/停止 Run；不同客户端复用 ID 的行为不确定；服务或 host 失败时客户端只看到断线，无法区分拒绝、已接受或可安全重试，不能证明 DHR_30 的 Receipt 唯一性。
  - **建议**：把幂等键、canonical digest、Receipt 生命周期和冲突 reason 写进 service/RPC 合同；在 Runtime/Store 中原子记录并可在 service 重启后重建，合并同键并发请求，摘要不同时返回稳定的既有错误而不执行第二次操作。测试同 ID 并发、断线重试、service 重启重放、字段顺序/等价输入和摘要冲突；不要把去重放在 CLI 内存中。

- **P1-BA-04：七方法与七条 CLI 验收之间缺少正式 method contract、Read Model 和 subscribe replay 设计。**
  - **事实**：草案列出 `listRuns/inspectRun/subscribe/start/control/contracts/validate`，但未规定它们分别如何覆盖 `list/status/inspect/events/start/stop/resume`、参数/结果/错误和 cursor 语义（`b-adjust-draft.md:12,17-20`）。计划要求 `status` 的完整形态还包括 v2 与 legacy v1 双根发现、legacy 只读且拒绝 resume（`dev_plan/...:213-225`），草案未承接这条边界。现有 `subscribe` 仅是连接本地的内部 sink，明确不是正式客户端 Read Model，也只有未来通知，没有首帧快照、历史回放或 seq gap 规则（`rpc/server.mjs:8-15,64-72,175-200`）；现有 server 也没有 per-method 参数 schema（`rpc/server.mjs:16-17`）。
  - **影响**：`relay events --follow` 重连可能漏事件或乱序，CLI/Bridge 可能各自解释事件；legacy Run 可能被错误地当作可 resume；未知业务输入无法在边界 fail-closed，因而不能证明同一 Runtime/Read Model。
  - **建议**：补一张 method-to-command 合同表和每方法参数/结果/错误 schema；由 Runtime 生成唯一 Read Model，明确 `subscribe` 的 snapshot→live 原子切换、起始 seq、重连补发、重复/缺口处理；把双根 discovery 与 legacy 只读拒 resume 写入 `listRuns/inspect/control` 验收。增加未知字段、重连 cursor、并发事件和 legacy Run 的真实 RPC 测试。

- **P2-BA-05：descriptor 发布没有明确继承 `.gitignore` 前置闸。**
  - **事实**：草案允许 launcher/service 直接原子发布 `<repo>/.dh-relay/runtime.json`（`b-adjust-draft.md:10,17`），但没有写发布前检查。计划明确 `.dh-relay/` 必须预先被 Git 语义忽略、Relay 不得改业务仓 `.gitignore` 且缺失时 start fail-closed（`dev_plan/...:90-99`）；现有 `startrun` 与 host 都在任何落盘/取得 lease 前调用 `assertStoreRootIgnored`（`runtime/startrun.mjs:58-61`、`runtime/host.mjs:37-40`）。
  - **影响**：仅执行 `relay start` 就可能创建未忽略的 descriptor/temp/endpoint，违反 P5-M8 的零误跟踪与 fail-closed 约束，即使后续 Run 创建被拒也已污染业务仓。
  - **建议**：把同一 Git 忽略语义检查放在 launcher 的 descriptor 创建之前；失败时不创建 `.dh-relay`、descriptor、临时文件或服务，回收也不能改 `.gitignore`。补 absent/任意深度规则、`git status`/`git ls-files` 和启动失败后的残留检查。

- **P2-BA-06：`start` 的成功时点与 detached host 的失败/就绪信号没有定义。**
  - **事实**：`startDetachedHost` 只 spawn、丢弃 stdio、unref 并立即返回 PID（`runtime/host.mjs:103-112`）；host 后续仍可能在 `.gitignore`、lease 或 `openStore` 阶段失败（`runtime/host.mjs:23-25,37-40,55-90`）。草案只说 `relay start` 拉起 service 并回 Receipt，未说明 Receipt 是“Run 已建”“service 已 ready”还是“host 已取得 lease”，也未定义 child 早退时 descriptor 和 Receipt 如何收敛（`b-adjust-draft.md:17-19`）。
  - **影响**：CLI 可能在宿主马上退出时显示成功，失败不可诊断且重试会触发重复 start；descriptor 可能指向一个仍未 ready 或已死亡的服务。
  - **建议**：规定 bind/ready/host-lease 的顺序与 bounded timeout；只有达到约定状态才回成功 Receipt，spawn/endpoint bind/lease/openStore 失败要返回稳定错误并清除自身临时状态，且不取消既有 Run。用真实子进程覆盖早退、超时、重启和重试。

- **P2-BA-07：禁止客户端直写 Store 目前是意图，不是可守卫的边界。**
  - **事实**：草案作出“CLI/Bridge 不得写 Store”的声明（`b-adjust-draft.md:12,20`），但 `createRpcServer` 的公开参数仍包含 `store`，handler 是任意注入 seam（`rpc/server.mjs:54-75,219-249`），没有 import 依赖守卫或运行时能力隔离。
  - **影响**：CLI/Bridge 只要错误地依赖 Store 或拿到写句柄，就能绕过 host lease 和 Runtime 的 Receipt/Read Model，静态回顾很难发现，且会与 DHR_31 的端到端职责混淆。
  - **建议**：把 service 作为唯一 Store/Runtime 依赖者，RPC server 只接收受限 Runtime handler/context；CLI、Bridge、fixture 做 import-graph/写 API 守卫，并以断言证明客户端进程无法打开或写 `.dh-relay/<run_id>`。将该守卫列为 DHR_30 的机器证，而非只写在草案中。

### 2. 用户理解风险

- **输入**：用户提供的 start request、stop/resume 参数和 `request_id` 必须先经 RPC/方法级 schema；当前 server 只有顶层信封校验，摘要规范化、ID 作用域和未知业务字段仍未定。用户应理解“CLI 只读 descriptor 再走 RPC”不等于输入已经被 Runtime 接受。
- **存储**：`runtime.json` 是服务发现元数据，Run 真相仍在 `<repo>/.dh-relay/<run_id>/` 的事件账/快照，跨仓发号索引在用户级 `runs.json`；三者的原子性、忽略闸和 lease fencing 不是同一件事。descriptor 存在不代表 Run 或 host 存活。
- **承诺**：同一 request 的“同 Receipt”只有在持久账本原子记录并可重启回放后才成立；`start` 的成功必须明确是已接收、Run 已建还是 host 已取得 lease，且不承诺 DHR_31 的 workflow/executor/Process 完成。DSH 未安装时的 CLI 主线与 DSH Bridge 的 DHR_50 条件项也必须分开。
- **独立验证**：不能以单测或 `0 failures` 代替需求境证据。至少需真实进程验证双 launcher、旧 descriptor/endpoint、service crash/restart、host lease 接管、无 DSH 七命令、断连重连 cursor、同 ID 并发重试、legacy 只读拒 resume；Bridge 若执行仍需真实渲染截图，DHR_50 未收敛则如实记待执行。
- **失败处置**：descriptor 非法、代次/能力不符、endpoint/PID 不可用必须 fail-closed；host spawn/lease/openStore/`.gitignore` 失败要有稳定错误和清理边界，客户端断开只清订阅、不得生成 cancel；任何失败都不能退回 CLI 直读/直写 Store。

### 3. 需要用户决定的问题

1. **service 与 host 的控制所有权**：确认 DHR_30 是否承接“仅控制面/宿主生命周期”的 Runtime broker，并允许为 stop/resume/subscribe 增加 lease-fenced 的持久 control seam；若不承接，需明确把该接缝回补 DHR_51/DHR_52 或另立任务。无论选择哪条，`basic-agent-task` workflow/executor 仍不得进入 DHR_30。
2. **代次绑定方式**：现行 `relay.rpc/v1` 握手没有 generation 字段。请决定采用不改变顶层冻结字段的 service-specific challenge/`contracts` 回证，还是为代次绑定开一次明确的协议调整；不能只把 generation 写进 descriptor 后声称已验证。
3. **幂等键作用域**：请决定 Receipt 去重是全局 `request_id`，还是按 `(client_id, request_id, method)` 作用域，并确认同 ID 不同摘要的既有 reason code；该选择必须能跨 service 重启和并发请求稳定回放。

VERDICT: changes-requested

## A-full 定向复审

### 1. 方案问题（P0–P3）

本轮按用户原始决定『按你的建议把』，将草案第 2 节的三项承诺视为已确认范围；以下只复审这些承诺能否由当前仓库的接缝落地，不重新缩小目标。

- **P1-AF-01：service、per-run host 与 Store 的唯一写者及控制通道仍未闭合。**
  - **事实**：草案要求 service 是唯一导入 Store/runtime host 的控制面，并让每个 Run 由 service 内会话持 lease、串行写事件和 Receipt（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:53-63`）。但现有 `runHostSession` 自己取得 lease、打开 Store、追加 `lease_expired/lease_acquired` 并续租（`relay-core/runtime/host.mjs:27-40,55-90`）；`startDetachedHost` 只 detached spawn、丢弃 stdio、返回 PID，没有 ready、stop、resume 或控制通道（`relay-core/runtime/host.mjs:103-112`）。Run 创建也由 `createRunWithNumbering` 直接建 Store、写 `run_created` 后才返回句柄（`relay-core/runtime/startrun.mjs:50-83`），而当前 RPC server 明确不含 Runtime/Store 依赖且不实现业务方法（`relay-core/rpc/server.mjs:16-17,33-34`）。
  - **影响**：无法证明 `start` 回 Receipt 前 host 已持 lease，也无法由 `control` 安全地通知持 lease 会话停止或恢复；实现者可能重复启动 host、裸杀 PID 或让 service 与 host 并发写同一 Store，直接破坏 fencing 和 DHR_31 的边界。
  - **建议**：在输入原子前冻结一种拓扑：要么 service 进程内运行可取消的 host session，要么保留子进程但增加明确的 service↔host IPC、ready/lease 回执、stop 信号和接管协议。补充多 Run 并发、旧 session 失租拒写、service crash/restart 和优雅 stop 的时序证据；无论哪种拓扑，workflow/Process/executor 继续排除在 DHR_30 外。

- **P1-AF-02：`start` 的幂等原子边界没有覆盖“尚未有 run_id”的创建窗口。**
  - **事实**：草案只承诺 `(client_id, request_id, method)` 加规范化摘要对应同一持久 Receipt（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:20-22`）。现有 `createRunWithNumbering` 的输入没有 request key/digest，先创建 Store 并追加 `run_created`，再写用户级 `runs.json` 索引（`relay-core/runtime/startrun.mjs:46-83`）；当前 server 也明确不做 request_id 去重，只把请求交给任意 handler（`relay-core/rpc/server.mjs:16-17,219-249`）。
  - **影响**：service 在 Run 创建、取得 lease、写 Receipt之间崩溃时，重启只从事件账恢复无法必然把重试请求关联回原 Run；同一请求可能创建第二个 Run，或客户端无法区分已提交、处理中和未提交，不能兑现“重复操作只生效一次”。
  - **建议**：冻结 canonical digest（字段顺序、默认值、数组/Unicode/数字规则）和持久 request-ledger/`start_intent` 事件；在同一原子边界把请求 key、Run ID、lease 结果和 Receipt 状态绑定，service 重启可回放 `accepted/committed/failed/in-flight`。摘要冲突要返回既有稳定 reason，不能靠 CLI 内存去重。

- **P1-AF-03：确定性 endpoint 的设计与当前传输 seam 不一致，launcher/readiness 流程未定义。**
  - **事实**：草案要求 endpoint 由规范化 `repo_root` 的稳定 hash 导出，并以成功 bind 作为唯一 fencing（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:41-50`）。但 `localEndpoint()` 每次调用都生成随机 UUID（Windows named pipe 和非 Windows UDS 均如此，`relay-core/rpc/transport.mjs:24-35`）；`createRpcServer` 只能绑定调用方传入的 endpoint，既不计算该 hash，也不发布/读取 `runtime.json`（`relay-core/rpc/server.mjs:54-75,255-283`）。
  - **影响**：descriptor 损坏、服务崩溃或双 launcher 时无法从同一仓库重新推导并争夺同一 endpoint；CLI 也没有规定拉起 service 后如何等待 bind/ready、何时重读 descriptor，机器验收的复用和竞态场景不可执行。
  - **建议**：冻结 repo canonicalization（realpath/大小写/UNC 等）、hash 算法、跨平台路径长度和 descriptor schema；让 launcher 与 service 共用确定性 endpoint 函数，以 bind→ready→原子 publish 的顺序收口，失败方只读回当前 owner，绝不按 PID 回收。为双 launcher、陈旧/损坏 descriptor、bind 后早退和 ready 超时补真实进程测试。

- **P1-AF-04：`contracts` 回证没有被设计成连接级强制身份闸。**
  - **事实**：草案要求顶层冻结握手不变，再由 `contracts` 回证 `repo_id/generation/runtime_version/capability_hash/descriptor_version`（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:17-19,78-80`）。当前 server 在每个请求上只比较 `capability_hash`，随后直接按 `handlers[method]` 分派，没有“先完成 contracts 才能调用业务方法”的连接状态或 generation 校验（`relay-core/rpc/server.mjs:203-224`）；`client_id` 也只是信封字段，不是授权检查。
  - **影响**：客户端可能只凭一个可复用的能力指纹访问错误代次/错误仓库，或在尚未完成身份比较前调用 `start/control`；`runtime.json` 中的 generation 变成展示字段而不是可验证的服务身份，且同机其它进程的控制权限边界不清楚。
  - **建议**：把 service-specific `contracts` 定义为每连接首个必需请求，服务端在未回证前拒绝所有业务方法；冻结完整请求/响应 schema、descriptor 全字段比较和 mismatch reason。另明确本地 endpoint 是“同一 OS 用户可信”还是需要 Named Pipe/UDS ACL，按选择加入可复跑的越权拒绝测试。

- **P1-AF-05：七条 CLI 路径的 method contract、Read Model 和 subscribe replay 仍是名录而非可执行协议。**
  - **事实**：草案列出 `listRuns/inspectRun/subscribe/start/control` 及 `contracts/validate`，并要求 snapshot、seq、cursor 与 legacy 只读（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:65-80`）。但当前 `subscribe` 明确只是连接本地 sink、非正式客户端 Read Model，无快照、历史回放或 gap 规则（`relay-core/rpc/server.mjs:8-17,175-200`），所有业务方法仍是任意 handler 分派，没有 per-method 参数/结果 schema（`relay-core/rpc/server.mjs:219-249`）。此外表格称 legacy 明示只读，却只写了 legacy `resume` 拒绝，没有明确 `stop` 等控制的拒绝合同。
  - **影响**：`events --follow` 重连会漏/重放/乱序，CLI、Bridge、Pi 可能各自解释事件；未知业务字段无法在边界拒绝，legacy Run 可能被错误控制，无法证明所有客户端同源于一个 Read Model。
  - **建议**：冻结 method-to-command 矩阵、每方法输入/输出/错误和 v1/v2 映射；规定事件 seq 的唯一来源、snapshot→live 的原子切换、cursor 重连、重复和缺口拒绝，并把 legacy 全部控制动作（至少 stop/resume）写成只读拒绝。用真实 RPC 覆盖未知字段、并发事件、断线重连和 legacy fixture。

- **P1-AF-06：草案承诺稳定失败回包，但当前 RPC 对 handler 拒绝只断连接。**
  - **事实**：草案规定 bind、Store、`.gitignore`、lease 失败均返回稳定错误且不得误报成功（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:60-63`）。现有 server 的协议说明明确 handler 抛错/拒绝没有内部错误码，直接 `dropConnection`；业务 handler 的 rejection 也走该路径（`relay-core/rpc/server.mjs:19-26,165-168,246-252`）。host 和 startrun 的初始化失败目前是抛错/退出，而 `startDetachedHost` 又在子进程真正初始化前立即返回 PID（`relay-core/runtime/host.mjs:23-25,103-112`）。
  - **影响**：客户端无法区分输入拒绝、endpoint/bind 失败、lease 已被占用、已接受但尚未完成和 service 崩溃；重试既可能重复操作，也可能误把断线当失败，和持久 Receipt、fail-closed 目标冲突。
  - **建议**：把可预期的 service/lease/store/gitignore 失败映射到冻结的既有 reason 或新增并登记 service reason；仅坏帧/协议违规断连接。service 必须等待 bind、ready、Run lease 的有界确认后再回成功 Receipt，并为 child 早退、超时、重启和安全重试定义终态。

- **P2-AF-07：多 Run 恢复时 `runs.json` 与事件账的权威关系没有定义。**
  - **事实**：草案要求 service 重启按 Store/lease 重新发现 Run，并让 `listRuns` 同时发现 v2 与 legacy（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:60-61,70-76`）。现有创建流程却先在 Run Store 写 `run_created`，随后才在用户级 `runs.json` 原子更新索引（`relay-core/runtime/startrun.mjs:69-83`）；两者之间崩溃会留下已存在但未入索引的 Run，草案没有规定扫描、重建或冲突裁决。
  - **影响**：service 重启或 `list` 可能漏掉已创建 Run，或者把陈旧索引当成事实；多 Run 的 control/lease 接管无法证明完整性。
  - **建议**：明确 Store 事件账是 Run 真相、`runs.json` 仅发号/加速索引（或反过来并给出事务协议），定义崩溃后的扫描、索引重建、legacy 迁移和重复 run_id 裁决；把索引断点加入 crash/restart 验收。

### 2. 用户理解风险

- **输入**：`start/stop/resume` 的方法参数、`request_id`、摘要和 `contracts` 都必须先经过方法级 schema；当前仓库只有顶层信封校验，能力指纹不等于请求已授权或已被 Runtime 接受。
- **存储**：`runtime.json` 只是服务发现元数据；Run 事件账/快照、per-run lease 和用户级 `runs.json` 的写入边界不同。descriptor 存在不代表 service、Run 或 host 存活，且 start 的 request-ledger 尚未有明确落点。
- **承诺**：按用户原始决定『按你的建议把』确认的是 Runtime broker、当前 service 回证和幂等目标，不是 DHR_31 的 workflow/Process/executor 完成。相同请求返回同一 Receipt 只有在创建窗口也被持久原子记录并可重启回放时成立；`start` 成功应明确为 host 已取得 lease，而不是 workflow 已完成。
- **独立验证**：不能用单测或“0 failures”替代需求境证据。至少需真实进程覆盖双 launcher、确定性 endpoint、descriptor/代次 mismatch、host ready/早退/接管、service crash/restart、同 key 并发与摘要冲突、七命令无 DSH、snapshot/cursor gap、legacy 全部只读控制；若执行 Bridge，仍需真实渲染截图。
- **失败处置**：descriptor、contracts、能力或 endpoint 不符必须 fail-closed；bind、`.gitignore`、Store、lease、host spawn/ready 的失败须有稳定 reason、明确清理边界和可安全重试状态。客户端断开只清订阅，不生成 cancel，也不能退回 CLI 直读/直写 Store。

### 3. 需要用户决定的问题

1. **service 与 host 的进程拓扑**：DHR_30 已确认承接控制面/宿主生命周期，但请确认采用 service 内嵌 host session，还是允许独立 host 子进程并新增 service↔host IPC；这会决定唯一写者、stop/resume 和 crash 接管合同。
2. **start 崩溃窗口的持久账本**：请确认 request-ledger/`start_intent` 放在仓库级 Run Store（推荐）还是另设 service 账本，以及“已创建 Run 但 Receipt 尚未回包”重试时必须返回的终态；不能继续只依赖 `runs.json` 或 CLI 内存。
3. **本地 endpoint 的授权边界**：请确认同一 OS 用户的本地客户端是否全部可信；若不是，需要在 DHR_30 冻结 Named Pipe/UDS ACL 或等价授权合同。另请确认 legacy “只读”是否意味着 `stop` 与 `resume` 均拒绝，以消除当前表格只明示拒绝 resume 的歧义。

VERDICT: changes-requested

## A-full 定向复审（二）

本轮为 fresh-context 定向复审。用户已明确确认 service 内嵌 host session、启动先记项目级可恢复账本、仅当前 OS 用户私有 capability 客户端可连接、legacy v1 全部 control 拒绝；因此不再把这四项作为待决定项。草案对确定性 endpoint、ready 发布顺序和 DHR_31 排除边界已有方向性修正，但仍有以下阻塞输入原子的方案缺口。

### 1. 方案问题（P0–P3）

- **P1-AF2-01：内嵌 host session 的 ready/stop/control 单写者合同仍未落到现有 host seam。**
  - **事实**：草案声称 session 提供 `ready / stop / lost_lease`，并在自己的 `writeGuard` 内串行写事件、control request 和 Receipt（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:71-80`）。现有 `runHostSession` 只有外部轮询的 `shouldStop`/内部 `stopping`，自己取得 lease、打开 Store、追加 lease 事件并在循环结束后才返回摘要（`relay-core/runtime/host.mjs:27-45,55-80,92-100`）；没有向 service 回报“已 ready”的 promise，也没有接收持久 control request 的接口。RPC server 仍是零 Runtime/Store 依赖、任意 `handlers[method]` 分派（`relay-core/rpc/server.mjs:16-17,33-34,219-249`）。
  - **影响**：`start` 无法证明回 Receipt 前 lease 已就绪，`stop` 无法证明先持 lease 写入再优雅停机，`resume`/失租接管也可能重复打开 Store 或并发写入；实现者若沿用 detached PID 路径会直接违背用户已确认的内嵌拓扑，并把宿主控制误推给 DHR_31。
  - **建议**：在输入原子前冻结一个 session actor 接口：创建即返回有界 `ready` 结果，提供 lease-fenced 的 `submitControl`/`stop`、`lost_lease` 终态和唯一释放路径；service 仅按 Run 持有 actor，actor 是该 Run Store 的唯一写者。补多 Run 并发、stop 与续租竞态、失租拒写、service crash/restart 接管的真实时序证据；保持不 import workflow/Process/executor。

- **P1-AF2-02：项目级 start 账本覆盖了状态名，但没有形成可恢复的幂等原子协议。**
  - **事实**：草案新增 `accepted -> run_id_reserved -> created -> lease_ready -> receipt`/`failed` 和“绝不发第二个号”（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:20-22,81-85`），但没有给出 `runtime-requests.json` 的记录 schema、`(client_id, request_id, method)` 与 canonical digest 的持久字段、摘要冲突记录、锁/原子替换/耐久化边界，也没有规定各阶段崩溃后如何从 ledger 与 Run 事件账唯一收敛。当前 `createRunWithNumbering` 仍是先建 Store/写 `run_created`，再写用户级 `runs.json`，且无 request key/digest（`relay-core/runtime/startrun.mjs:46-83`）；RPC 当前也没有 request 去重（`relay-core/rpc/server.mjs:16-17,219-249`）。
  - **影响**：在 reserved、created、lease_ready 或 receipt 之间崩溃时，重试可能无法回到同一 Run/Receipt，或把“已提交但未回包”误判为失败；同键不同摘要也无法证明返回既有冲突而未执行第二次操作。
  - **建议**：冻结账本 schema、canonical digest（字段顺序、默认值、数组/Unicode/数字规则）、每个状态的持久写入与 fsync/原子替换边界，以及崩溃恢复真值表；把 request key、digest、reserved run_id、Receipt 状态绑定在同一服务级协议中，并禁止绕过 service 直接调用旧的 Run 创建入口。补同 key 并发、各阶段 crash、等价 JSON 与摘要冲突的重启实测。

- **P1-AF2-03：local-user capability 的生成/持久化存在双 launcher 竞态，可能使活 service 与 credential 不匹配。**
  - **事实**：草案按字面要求 service 启动时生成随机 capability 并写用户私有 `credential.json`（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:61-69`），同时要求先 bind、再 ready/publish descriptor（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:44-59`）。若两个 launcher 同时启动，失败的候选 service 仍可能先覆盖 credential；成功 bind 的 service 继续使用旧随机值，而 descriptor 的 `capability_hash` 与客户端刚读取的 credential 不同。当前 server 只在每帧比较一个固定 `capability_hash`，没有 credential 轮换或连接级 capability 合同（`relay-core/rpc/server.mjs:75-81,203-217`）。
  - **影响**：合法 CLI/Bridge/Pi 会被活 service 拒绝，或服务重启期间出现不可预测的授权窗口；“只有当前 OS 用户私有 capability 客户端可连接”的边界无法稳定复现，双 launcher 验收可能偶发失败。
  - **建议**：冻结 capability 的生命周期：推荐按 repo 持久复用并只由已取得 endpoint ownership 的 service 读写；若必须轮换，使用 owner claim/独占创建把 credential、generation、descriptor hash 原子绑定，失败候选不得覆盖文件。明确 Windows/Unix 私有 ACL、临时文件清理和旧 credential 的失效时机，并测试双 launcher、crash/restart、缺失/错误 capability。

- **P1-AF2-04：`contracts` 连接级闸门、方法 schema 与 Read Model/replay 仍是承诺，不是可执行协议。**
  - **事实**：草案说 `contracts` 是首个必需请求并返回完整 descriptor 身份（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:90-107`），但只说“同批冻结”，没有给出请求/响应/错误字段和连接授权状态。当前 server 每帧校验后立即按 `handlers[method]` 分派，没有“未完成 contracts 则拒绝业务方法”的连接状态或 generation 比较（`relay-core/rpc/server.mjs:203-249`）。草案对 `subscribe` 只规定“快照→seq→cursor”，没有 seq 唯一来源、snapshot/live 原子切换、cursor 过期/缺口/重复规则；现有实现也明确只有连接本地 sink，不是客户端 Read Model（`relay-core/rpc/server.mjs:8-17,175-200`）。这与 design/05 §6.2 的统一 JSON-RPC 查询/订阅/重连/幂等合同及 design/06 §2–§3 的同一 Read Model 约束尚未闭合。
  - **影响**：未授权连接可能在回证前调用业务方法；CLI、Bridge、Pi 对字段、事件重放或缺口各自解释，重连可能漏事件/乱序，未知输入不能在边界 fail-closed。
  - **建议**：冻结连接状态机（握手→唯一 `contracts`→完整 descriptor 比较→业务）、每方法输入/输出/既有 reason/未知字段规则和 method-to-command 矩阵；由 Runtime 生成唯一 Read Model，规定 snapshot_seq、事件 seq、cursor 补发、重复/缺口终态。把 legacy `stop`、`resume` 及未来所有 control method 都写成明确拒绝，而非只在表格概括“只读”。

- **P1-AF2-05：草案承诺稳定失败回包，但现有 RPC 对可预期 handler 失败仍直接断连接。**
  - **事实**：草案要求 bind、Store、`.gitignore`、lease 失败均稳定返回且不误报成功（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:81-88`），但当前 server 的协议边界写明 handler 抛错/拒绝没有内部错误码并 `dropConnection`，实际 rejection 也走该路径（`relay-core/rpc/server.mjs:19-26,163-168,246-252`）。
  - **影响**：客户端无法区分输入拒绝、capability/descriptor mismatch、lease 被占用、已接受未完成、service crash 和可安全重试；断线重试会重新触发 start/control，直接削弱持久 Receipt 和 fail-closed 目标。
  - **建议**：为可预期的 service/ledger/Store/lease/host 状态冻结已有或登记的新 reason 与 JSON-RPC error envelope；只有坏帧/协议违规断连接。规定 `accepted/in-flight/committed/failed` 的可观察 Receipt 和重试行为，并以真实 socket 测试覆盖 bind/ready 超时、失租、Store 损坏、service 重启。

- **P2-AF2-06：service 重启发现、legacy 双根和 `runs.json` 修复的裁决仍未具体化。**
  - **事实**：草案称 Run Store 是真相、service 重启会重新发现 Run，`listRuns` 同时列 v2 与 legacy（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:77-85,96-102`），但没有规定扫描哪些 Run 根、如何识别未入 `runs.json` 的 Store、`runtime-requests.json` 残留状态与旧 lease 的优先级，亦没有 legacy 根的迁移/只读投影规则。现有创建流程在 Store 与 `runs.json` 之间本就有崩溃窗口（`relay-core/runtime/startrun.mjs:76-83`）。
  - **影响**：restart/list 可能漏 Run、重复显示或对陈旧索引作出控制决策；接管 lease 和 legacy 全控制拒绝无法由同一 Read Model 证明。
  - **建议**：写出发现顺序、Run 根/ledger/index 的真值与冲突裁决、孤儿 Store/残留 ledger 的终态、legacy 只读投影和索引重建规则，并加入 crash/restart 后 list/inspect/control 的实测。

### 2. 用户理解风险

- **输入**：`contracts`、`start`、`control` 的方法级 schema、request key、canonical digest 和 cursor 仍未冻结；顶层 `relay.rpc/v1` 握手字段存在并不等于连接已完成 capability/descriptor 授权。design/05 §6.2 的生产协议和 design/06 §2 的七条 CLI 输入必须都经过同一 Runtime 边界。
- **存储**：`runtime.json` 仅是发现元数据；local-user credential、`runtime-requests.json`、Run 事件账、per-run lease 和用户级 `runs.json` 是不同持久对象。descriptor 存在不代表 service ready，ledger 的阶段名也不自动提供崩溃原子性。
- **承诺**：本稿没有越过 DHR_31：`start` 成功只应承诺 Run 已创建且 host 已取得 lease，不承诺 `basic-agent-task`、Process、Agent executor 或 workflow 执行；control 只承诺宿主生命周期。用户已确认 legacy v1 所有 control 均拒绝，不能把“只读”解释成可 stop。
- **独立验证**：不能用单测或“0 failures”替代需求境证据。至少需真实进程覆盖双 launcher credential/endpoint 竞态、contracts 前置闸、同 key 各账本阶段 crash/retry、host ready/stop/lost_lease、service restart 接管、snapshot/cursor gap、legacy stop/resume 全拒绝、无 DSH 七路径和未授权客户端；若执行 Bridge 仍需真实渲染截图。
- **失败处置**：descriptor、capability、contracts、bind、`.gitignore`、Store、ledger、lease、host ready 的失败都须有稳定 reason、清晰清理边界和安全重试终态；客户端断开只清本地订阅，不生成 cancel，也不能回退 CLI 直读/直写 Store。

### 3. 需要用户决定的问题

无。service 内嵌 host session、启动先记项目级可恢复账本、当前 OS 用户私有 capability、legacy v1 全部 control 拒绝均已由用户明确确认。本轮剩余问题是 DHR_30 输入原子前必须冻结的实现/协议合同；除非要改变上述边界，否则不需要再次询问用户。

VERDICT: changes-requested

## A-full 定向复审（三）

本轮为第三位 fresh-context 定向复审。用户已确认 service 内嵌 host session、项目级可恢复 start 账本、当前 OS 用户私有 capability、legacy v1 全部 control 拒绝；本轮不重新提出这些选择，也不把 workflow / Process / executor 移入 DHR_30。草案新增的 actor、ledger、credential、连接闸门、方法与 replay 合同仍需以下输入原子收口后才能施工。

### 1. 方案问题（P0–P3）

- **P1-AF3-01：方法 contract 与正式 Read Model 仍未成为可施工的唯一来源，且 `status` 被错误折叠到 `listRuns`。**
  - **事实**：草案只给出方法名、最小输入和结果名录（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:150-185`），没有逐方法的完整输入/输出/错误 schema、未知字段/default/数组顺序规则，也没有 `listRuns` 列表投影、`inspectRun` 详情投影和 `status` 宿主三态的字段定义。当前冻结 RPC 仍将 `params` 留为 `additionalProperties: true`（`relay-core/contracts/relay.rpc.v1.schema.json:55-69`），server 仍按任意 `handlers[method]` 分派（`relay-core/rpc/server.mjs:219-249`）。草案表把 `list/status` 都映射到 `listRuns`，但既有 `runtime/status.mjs` 的输出明确包含 `host`、`host_detail`、账面状态和事件数（`relay-core/runtime/status.mjs:1-8,16-49`），不等于列表投影；design/06 的 `status <run_id>` 也不是无参列表（`docs/modules/dh-relay/design/06-多控制面与Headless-SSH运行-设计补充.md:57-76`）。
  - **影响**：施工者无法确定 CLI/Bridge/Pi 应发送或渲染的确切载荷；文本、JSON、列表、详情与宿主状态会各自补字段，未知输入无法在 RPC 边界 fail-closed，P5-M4 和 `status` 三态验收不能复跑。
  - **建议**：在开工输入中落单一 method-schema/Read-Model 工件，逐条冻结七方法的 params/result/error、`status` 与 `inspectRun` 的命令映射、v2/legacy 投影和 unknown/default 规则；按既有 pilot 列表/详情血统另定列表 schema，不复用带 `node_states` 的详情协议。契约变更后同步重算 capability baseline、fixture manifest 与独立校验器。

- **P1-AF3-02：新 ledger 的摘要算法与已冻结 JCS 口径冲突，复合幂等键也没有回写到 launch-receipt 合同。**
  - **事实**：草案宣称 canonical request 按 Unicode code point 排键、字符串逐字节比较、数字只允许安全整数（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:109-112`），并把键写成 `(client_id, request_id, method)`（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:20-22,97-103`）。已冻结口径要求 RFC 8785 JCS：对象键按 UTF-16 码元、数字按 ECMAScript `Number::toString`（`relay-core/contracts/CANONICALIZATION.md:14-28`）；`relay.launch-receipt/v2` 的 `request_digest` 也明确引用该口径（`relay-core/contracts/relay.launch-receipt.v2.schema.json:61-64`），reason-codes 仍把 `request_id` 作为冲突/幂等判别字段（`relay-core/contracts/reason-codes.md:34-44`）。
  - **影响**：同一 JSON 在 CLI、service、Bridge 之间可能得到不同 digest；同一 `request_id` 跨 method/client 的冲突或复用语义也无法从现有 Receipt 判断，重试可能重复创建 Run 或错误地返回冲突，破坏“同键同 Receipt”。
  - **建议**：直接复用 `tools/canonical.mjs` 的 JCS/digestExcluding 实现，明确 start/control 的摘要对象及排除字段；保留用户已确认的复合键，但将其序列化/作用域、与 Receipt 中 `request_id` 的关系写入正式 contract、reason-codes、负例和 fixture，不能另造一套 canonicalization。

- **P1-AF3-03：control 的持久 Receipt、状态和恢复边界仍没有落到现有 Store/事件合同。**
  - **事实**：草案只给出 `runtime-requests.json` 的 start 记录形状（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:89-120`），却要求 actor 写 `control_requested / Receipt`、并称 Receipt 随 Run 事件账恢复（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:76-87,131-145`）。冻结 `relay.event/v2` 的 kind 枚举没有 `control_requested`（`relay-core/contracts/relay.event.v2.schema.json:16-36`）；冻结 `relay.launch-receipt/v2` 没有 `state=in_flight|committed|failed` 或失败 reason（`relay-core/contracts/relay.launch-receipt.v2.schema.json:7-76`）；当前 `store.registerReceipt` 是要求 `node_id/attempt_id` 的 workflow attempt receipt，并写 `attempt_started`（`relay-core/store/store.mjs:161-190`），不是 launch/control Receipt。
  - **影响**：`stop`/`resume` 的 request key、Receipt 身份和失败状态无法在 service 重启后从持久对象唯一恢复；“先写 Receipt 再 stop”也不能说明是已受理还是已优雅完成，客户端会把进行中、失败和已提交混为一谈，重复 control 仍可能再次执行。
  - **建议**：明确 start 与 control 共用的 operation ledger/launch-receipt 持久形状、Receipt 状态与 method response envelope；为每个状态规定唯一写入顺序、fsync/原子替换边界和 ledger/Run Store 不一致时的裁决。若需扩展冻结事件或 launch-receipt，必须同批更新 schema、reason/fixture 与 capability baseline；不要复用 workflow attempt receipt 冒充控制 Receipt。

- **P1-AF3-04：subscribe 的 snapshot→live 切换和 cursor 不是无漏事件的可执行原子协议。**
  - **事实**：草案要求“先读取并发送 snapshot，再注册实时事件”，并以事件账 `seq` 补 cursor（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:177-190`）；当前 RPC 只有连接本地 sink，没有 Runtime Read Model/replay（`relay-core/rpc/server.mjs:8-17,175-200`），Store 只有串行写队列和追加事件，没有订阅注册屏障（`relay-core/store/store.mjs:28-35,124-158`）。冻结的 `runStateChanged` 通知载荷本身也没有 `seq`，只有 `event` 载荷带事件序号（`relay-core/contracts/relay.rpc.v1.schema.json:117-140`）。
  - **影响**：事件可能落在 snapshot 读取与订阅注册之间而永久漏发；若把状态通知和事件通知混发，cursor 又无法判定两者的顺序/覆盖关系，重连无法证明严格连续、只重复不丢失。
  - **建议**：冻结一个写队列内的 barrier：先取得 `snapshot_seq` 并注册带缓冲的订阅，再发送 snapshot，按 seq 排序排空缓冲，网络发送不得持有 Store 写锁；明确 `runStateChanged` 与事件 seq 的绑定、重复/缺口/过期 cursor 的终态和 retention 规则，并以真实并发事件/断线重连测试证实。

- **P1-AF3-05：确定性 endpoint、descriptor 与私有 credential 的安全链仍可把凭据送到错误服务，Unix 残留 socket 的回收竞态也未闭合。**
  - **事实**：草案把 endpoint 算法和“bind 是 fencing”写成方向（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:44-59`），但现有 transport 仍用随机 endpoint（`relay-core/rpc/transport.mjs:24-36`），尚无确定性 endpoint、完整 descriptor schema、残留 UDS 安全探测/重绑协议。客户端顺序是“读 descriptor→连 endpoint→contracts”，而 contracts 会提交 local-user capability（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:37-41,61-69,164-175`）；descriptor 目前只是项目内可被改写的发现文件，原子 rename 不提供来源/完整性证明。
  - **影响**：恶意或陈旧 descriptor 可把本机客户端导向非预期 endpoint，在 capability 闸门之前取得 bearer credential；Unix 崩溃留下的 socket 又可能让两个 launcher 在“无活服务”判断和 unlink/bind 间竞态，导致错误连接、活服务误回收或永远无法重启。仅凭 PID、Node 默认 pipe ACL 或 descriptor 存在都不能证明 owner。
  - **建议**：客户端在发送 credential 前由 canonical repo root 独立推导并严格比对 endpoint/descriptor 身份；为 descriptor 定完整 schema、权限/owner 规则和 generation mismatch 行为。对 UDS 只允许“探测无活 owner后由同一 bind 流程安全清理并重绑”，禁止盲删；双 launcher、残留 socket、descriptor 篡改和凭据不泄露都做跨平台真实进程证据。

- **P1-AF3-06：`client_id`/`request_id` 的客户端生命周期没有定义，真实断线重试无法保证命中同一个幂等键。**
  - **事实**：冻结握手只规定二者是每 request 必填 identifier（`relay-core/contracts/relay.rpc.v1.schema.json:42-52`）；草案规定复合键，却没有 CLI 如何持久化 client_id、如何在 service 超时/进程重启后重用 request_id，或 Bridge/Pi 如何保持实例身份（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:20-22,97-103`）。design/06 的 `relay start --request <file>` 也未规定 request 文件是否携带/保存这些值（`docs/modules/dh-relay/design/06-多控制面与Headless-SSH运行-设计补充.md:57-76`）。
  - **影响**：CLI 每次重启随机生成 client_id 或 request_id 时，用户看到的是超时，却会在重试时创建第二个 Run；复用 request_id 但换 client_id 又绕过复合键，不能兑现用户理解的 exactly-once。
  - **建议**：冻结私有用户级稳定 client_id、request_id 生成/持久化与显式重试携带规则；把 start request、control 命令和 Bridge fixture 的 identity 生命周期写入客户端 contract，并测试新进程/新连接/服务重启三种重试路径。

- **P1-AF3-07：先保留 run_id 再建 Store 的序号来源没有定义，且草案禁止继续调用现有发号入口。**
  - **事实**：草案要求 `run_id` 在 `run_id_reserved` 阶段先持久化，并禁止 RPC/CLI 调旧 `createRunWithNumbering`（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:113-120`）；但没有新的 `next_seq`/reservation 记录或锁协议。现有发号唯一从用户级 `runs.json` 的该仓 `max_seq+1` 得出，并在同一索引锁内建 Store、回写索引（`relay-core/runtime/startrun.mjs:62-83`）。草案又把 `runs.json` 降为发现后的加速索引修复对象（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:141-145,200-203`）。
  - **影响**：服务重启、已有未入索引的 v2 Store、legacy run 与并发 start 之间没有确定的序号裁决；即使 request ledger 不重复，也可能保留重复 run_id，进而破坏目录、事件账和 Receipt 身份链。
  - **建议**：在项目级 ledger/独占 service 队列中冻结序号 reservation（含与所有已发现根及旧索引的 seed、碰撞 fail-closed 和跨仓索引更新次序），再把该 reservation 与 request key 原子绑定；不要把“之后修复 runs.json”当作发号协议。

- **P2-AF3-08：草案引用的 service-specific reason 尚未进入 reason-code 权威和负例闭环。**
  - **事实**：草案列出“未完成授权、descriptor identity 不符、service 未就绪、request in-flight、cursor gap、legacy read-only”等稳定 reason（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:192-198`），但 reason-codes 当前 RPC 部分只有 `E_UNKNOWN_METHOD`、`E_TRANSPORT_FRAME_INVALID`，并明确内部 `E_STORE_CORRUPT:*`、`E_RUN_NOT_FOUND` 等不得上线（`relay-core/contracts/reason-codes.md:44,58-64`）。
  - **影响**：实现者只能临时发明未登记码或把内部异常前缀泄露到 RPC，客户端无法按稳定 reason 处理失败，且无法生成可审的 negative fixture/独立验证。
  - **建议**：在施工前登记每个新增 reason 的边界、错误数值码、负例和预期重试行为；若复用既有码则写清映射。不要把“同批冻结”留成草案散文。

- **P2-AF3-09：重启 discovery 的顺序已写出，但 v2/ledger/index/legacy 的投影和冲突裁决仍不可复跑。**
  - **事实**：草案只给顺序“扫描 v2 Store→对账 ledger→修复 runs.json→扫描 legacy”（`docs/modules/dh-relay/design/drafts/DHR_30-runtime-service.md:200-203`），没有“完整 Store”的判定、孤儿 ledger/Store 的终态、重复 run_id 的展示规则，或 `.dh-runtime/relay/` v1 到同一 Read Model 的字段映射；design/02 仅冻结 legacy 只读、控制拒绝和双根存在性（`docs/modules/dh-relay/design/02-完整流水-产品设计与验收.md:61-76`）。
  - **影响**：restart/list/inspect 可能漏 Run、重复投影或把索引误当真相；legacy 的 `read_only`、host 状态和未知字段在不同客户端上会产生不同结果，无法证明“同一 Read Model”。
  - **建议**：补 discovery decision table 和 v1/v2 fixtures：扫描根、必备文件、账本阶段与事件账的每种组合、重复/损坏/孤儿的 fail-closed 结果、legacy 字段映射及 list/inspect 的只读投影均逐项写死。

### 2. 用户理解风险

- **输入**：当前草案让人容易把 `status` 当成 `listRuns`、把通用 `params` 当成已冻结 method schema，或把新自定义 digest 当成既有 JCS；`client_id`、`request_id`、local-user capability 与 descriptor generation 也不是同一层身份，必须按客户端 contract 逐项传递。
- **存储**：至少有 credential、descriptor、start/control operation ledger、Run `events.jsonl`/Store 工件、per-run lease、用户级 `runs.json` 六类状态；`runs.json` 只能做索引，Receipt/控制请求不能靠它补真相，跨文件崩溃窗口须按明确顺序恢复。
- **承诺**：本稿仍未越过 DHR_31；DHR_30 的 `start` 最多承诺 Run 与 host lease ready，`stop/resume` 只承诺定义清楚的持久控制操作，不承诺 workflow/Process/executor 已执行或成功。客户端断开仍不生成 cancel，legacy v1 所有 control 仍拒绝。
- **独立验证**：必须由真实进程覆盖 Windows Named Pipe 与 Linux UDS、双 launcher/残留 socket/descriptor 篡改、credential 不泄露、accepted→receipt 各阶段 crash/retry、同 key 新进程重试、snapshot 与事件并发、双根发现和 status/list/inspect 同源；单测或 `0 failures` 不能替代。Bridge 若执行仍需真实 DSH 渲染截图。
- **失败处置**：可预期失败必须回已登记 reason 和明确 `in_flight/committed/failed` 重试语义；坏帧才断连接；失租后 actor 拒绝迟到写；客户端断开只清订阅，不回退 CLI 直读/直写 Store。

### 3. 需要用户决定的问题

无。上述均是已确认边界内必须补齐的实现/协议合同；不改变 service 内嵌 host、项目级 ledger、本机私有 capability、legacy 全 control 拒绝或 DHR_31 排除，因此不需要新的用户选择。

VERDICT: changes-requested


## A-full 定向复审（四）

本轮为第四位 fresh-context 设计复审。最新两稿已经把 actor 的唯一写者/ready 边界、确定性 endpoint 的独立推导与 UDS 残留探测、next_seq reservation、客户端稳定 identity/pending record、legacy 只读投影和 discovery 顺序具体化；这些上一轮方向性 P1 不再重复泛化。未发现 P0，但两稿之间仍有会导致不同实现的合同冲突，且若干“同批扩展”尚未给出可验证的字段边界，故目前不能晋级正式设计输入或放行 DHR_30 开工。

### 1. 方案问题（P0–P3）

- **P1-AF4-01：start/control 的唯一 operation ledger 仍有两个互相冲突的版本。**
  - **事实**：DHR_30-runtime-service.md:89-120,141-145 将 .dh-relay/runtime-requests.json 定义成只收 start 的账本，键是字面量 <client_id>|<request_id>|start，阶段为 accepted/run_id_reserved/created/lease_ready/receipt/failed；DHR_30-rpc-read-model-contract.md:78-114 又将 .dh-relay/runtime-operations.json 定义成 start 与 control 的唯一账本，键是 JCS 的 client_id/request_id/method 三元组，阶段为 accepted/run_id_reserved/store_created/actor_ready/receipt_committed/failed，并多出 next_seq/receipt_id/reason。两稿没有声明其中一份废止或如何互相迁移。
  - **影响**：同一个 control 请求在 service 重启后没有唯一查找位置；start 的恢复阶段、Receipt 提交点和 runs.json 修复也会因 worker 选择不同文件而不同，无法证明“同 key 同 Receipt、绝不发第二个 run_id”。
  - **建议**：在输入原子中只保留一个文件名、一个 key 编码和一张 phase/recovery 表，且该表同时覆盖 start 与 control；记录至少统一 client_id/request_id/method/request_digest/run_id/receipt_id/phase/state/reason，并明确 ledger 与 Run Store event 的裁决顺序。不要让 runtime-requests 与 runtime-operations 同时声称唯一。

- **P1-AF4-02：canonical digest 的文字合同仍与已冻结 JCS 口径相冲突。**
  - **事实**：DHR_30-runtime-service.md:109-112 仍写 Unicode code point 排键、只允许安全整数、字符串逐字节比较；relay-core/contracts/CANONICALIZATION.md:22-23,52 已定死 RFC 8785 的 UTF-16 码元排序、ECMAScript Number::toString，以及对完整 RPC request 排除 handshake.request_id 和 id。RPC 补充稿:71-76 才改为复用 tools/canonical.mjs 的 digestExcluding()。这不是同义改写，非 ASCII key、数字和等价请求会产生不同摘要。
  - **影响**：不同 worker/客户端可能把同一请求归为不同 operation，或把不同请求错误合并；冲突检测和 launch Receipt 的既有 request_digest 口径会失去跨实现一致性。
  - **建议**：删除/改写 runtime-service 中的自定义 canonical 段，只引用 JCS 实现和 CANONICALIZATION.md；在同一 operation contract 明确摘要输入是完整 relay.rpc/v1 request、排除字段、复合 key 的 JCS 序列化，以及 request_digest 与 key 的保存关系。

- **P1-AF4-03：CLI method 路由仍自相矛盾，新增 Read Model 只有名称和字段摘要，不足以成为唯一输入。**
  - **事实**：RPC 补充稿:14-29 正确区分 list -> listRuns、status <run_id> -> inspectRun(view:"status")、inspect -> inspectRun(view:"detail")，并列出 run_status_view 的 host 三态；但 runtime-service.md:156-162 仍把 list / status 一起映射到 listRuns。现有 runtime/status.mjs:16-49 的 status 是带 run_id、host/host_detail、ledger 摘要和 event count 的单 Run 报告，不是列表。与此同时，补充稿只声明新增 relay.rpc-methods/v1 与 relay.client-read-model/v1，没有逐 method 的属性、必填/默认、result/error 分支；冻结 relay.rpc/v1:62-65 的 params 仍为 additionalProperties:true，现有 server:219-249 仍按任意 handler 分派。
  - **影响**：施工者可能把 status 错发成列表、把 node_states 塞入列表，或对未知业务字段放行；CLI、Bridge、Pi 无法由同一可验证载荷渲染，上一轮 method/Read Model P1 尚未真正闭合。
  - **建议**：将 runtime-service 的映射改为补充稿的三路映射；随后给出可被校验器引用的具体 method contract 和 Read Model 字段（include_legacy、view、after_seq、start/control request、列表/状态/详情/快照的 required、null/default、additionalProperties:false、error reason），并在 capability manifest 中以这些实际工件的 digest 为准。这里缺的是字段级合同和路线裁决，不是泛泛要求“冻结 schema”。

- **P1-AF4-04：operation Receipt、operation event 与稳定失败码尚未落到现有冻结协议。**
  - **事实**：当前 relay.launch-receipt/v2.schema.json:43-76 的 kind 只有 start/stop/resume，无 client_id/method/state/reason，且 additionalProperties:false；relay.event/v2.schema.json:16-82 的 kind 枚举没有 operation_accepted/operation_committed/operation_failed，对象也没有 receipt_id/request_digest 字段。补充稿:116-121 只说“同批扩展”，还把 event 的绑定称作 params，但 relay.event/v2 没有 params 属性；runStateChanged.caused_by_seq 也未出现在现有 relay.run-state/v1。同稿:130-134 列出的六个 DHR_30 reason（包括 E_CLIENT_NOT_AUTHORIZED、E_CURSOR_GAP、E_LEGACY_READ_ONLY）尚未进入 reason-codes.md 的全集；现有 rpc/server.mjs:165,242-248 对 handler reject 仍直接断连接。
  - **影响**：actor 不能按现有 Store 校验器写入这些操作事件，control 的 in_flight/committed/failed 无法在重启后形成唯一 Receipt；客户端也无法按稳定 reason 区分“已接受但未完成”“确定失败”和协议坏帧，exactly-once 只停留在叙述。
  - **建议**：逐项给出 operation Receipt 的 required/nullable、node_id 与 attempt_id 规则、operation event 的实际字段和 kind 条件、caused_by_seq 的落点；同步更新 launch/event/run-state schema、reason-codes（含 JSON-RPC 数值码/连接是否保持）、negative fixtures、capability baseline，并把可预期 handler failure 映射成 error response，只有坏帧才断连接。不得以“同批扩展”代替这些具体关系。

- **P1-AF4-05：subscribe 的 barrier 顺序在两份稿件中相反，仍可能漏事件。**
  - **事实**：runtime-service.md:187-190 写的是“先读取并发送 snapshot，再注册实时事件”；RPC 补充稿:138-142 写的是在 Store 单写队列内先注册 buffered subscriber、取得 snapshot_seq、读取 snapshot，发送后再排空 >snapshot_seq 缓冲。前一个顺序在 snapshot 读取与注册之间会丢事件；现有 rpc/server.mjs 的订阅仍明确只是连接本地 sink，不是 Runtime replay。
  - **影响**：不同实现会选择不同顺序；events --follow 在并发写或重连时仍不能证明只重复、不丢失，runStateChanged 与 event 的同一 seq 定位也因现有 schema 没有 caused_by_seq 而不可校验。
  - **建议**：只保留补充稿的 barrier 顺序（注册+取尾 seq → 读快照 → 网络发送 → 排空严格大于 snapshot_seq 的缓冲），把另一句改掉；同时在快照/事件 frame contract 中固定 snapshot_seq/next_seq/after_seq 的 retention、跨 Run、缺口和重复规则及 caused_by_seq 字段。

- **P2-AF4-06：endpoint/credential 方向已基本收敛，但仍有会误导施工的具体残留。**
  - **事实**：RPC 补充稿:31-46 已规定客户端独立推导 endpoint、bind 后才读/建 credential、UDS 只在无活 owner 时重试，实质消除了上一轮“凭据先发给错误 endpoint/盲删 socket”的 P1 方向；但 runtime-service.md:63-67 仍写成“service 启动时生成随机 capability”，:124-129 又规定仅成功 bind 后持久复用/缺失时创建。两稿也未给出 runtime.json 的完整文件路径/权限字段 contract；现有 transport.mjs:20-36 仍默认随机 endpoint，而 startrun.mjs:64-83 原有跨仓 runs.json.lock 的并发更新纪律未被新 discovery/index 修复条款承接。
  - **影响**：若按前一表述实现会在失败候选或 restart 时轮换 credential；若忽略全局 index lock，跨仓并发可能丢索引更新。它们不改变用户业务边界，但会使安全与发现验收不稳定。
  - **建议**：把 capability 文案统一为“成功 bind 后读取既有值，缺失才原子创建”；补出 descriptor 的实际落点/字段约束和 cross-repo index lock/更新次序，并将 transport 的随机 endpoint 迁移列为明确施工项。

### 2. 用户理解风险

- **输入**：status 不是 list；client_id、request_id、local-user capability、descriptor generation 和公开 capability_hash 是不同层的身份。当前顶层 RPC 只校验 envelope，method 参数必须经过 DHR_30 的字段级 contract；canonical digest 只能按既有 JCS 算。
- **存储**：runtime.json、私有 credential、pending operation、项目 operation ledger、Run 的 events.jsonl/state.json、per-Run lease 和用户级 runs.json 各自有真值边界；尤其两稿现有的 runtime-requests.json 与 runtime-operations.json 不能同时被当作唯一账本。
- **承诺**：start 只承诺 Store 创建、actor lease ready 和 operation Receipt committed；stop/resume 只承诺 lease-fenced 的宿主控制，不承诺 workflow/Process/executor 已运行或成功。客户端断开不产生 cancel，legacy v1 的所有 control 仍拒绝。
- **独立验证**：需真实进程覆盖双 launcher、descriptor 篡改、UDS 残留、同 key 各 phase crash/retry、JCS 等价/冲突请求、actor stop/renew/失租、barrier 并发写、双根 list/status/inspect 和 legacy 全 control 拒绝；单测或“0 failures”不能替代这些需求境证据，Bridge 若执行仍需真实渲染截图。
- **失败处置**：只有坏帧/非法顶层协议可断连接；未授权、代次不符、cursor gap、legacy read-only、Store/lease/actor 失败都必须按登记 reason 回稳定 error，并明确 pending record 与 Receipt 的可重试终态，不能回退到 CLI 直读/直写 Store。

### 3. 需要用户决定的问题

无。service 内嵌 actor、项目级可恢复账本、当前 OS 用户私有 capability、legacy v1 全 control 拒绝以及 DHR_31 不承接 workflow/Process/executor 均已由用户确认；本轮阻塞是两份草案内部的合同冲突和缺字段，不构成新的业务边界。

VERDICT: changes-requested

## A-full 定向复审（五）

本轮为第五位 fresh-context 定向复审，逐项对照第四轮六项与两份最新草案及现有冻结协议。JCS 文字口径已改为引用 RFC 8785 实现；`status` 已明确走 `inspectRun(view:"status")` 而非 `listRuns`；两稿的 subscribe barrier 顺序也已统一为先注册缓冲订阅并取得 `snapshot_seq`、再读快照、发送后排空；endpoint/credential 的独立推导、bind 后凭据和全局 runs index lock 方向已收敛。未发现 P0，但重启恢复仍命中废止的账本文件名，且 operation Receipt/event/reason 的“同批扩展”尚未成为现有协议的可验证输入，因此不能放行。

### 1. 方案问题（P0–P3）

- **P1-AF5-01：唯一 operation ledger 在 restart discovery 路径仍被旧文件名打破。**
  - **事实**：runtime-service.md:92-98 已明确 `runtime-requests.json` 被 rpc-read-model-contract.md:105-136 的唯一 `.dh-relay/runtime-operations.json` 替代，且不得并存或迁移读取；但同一 runtime-service.md:179-182 的固定 discovery 顺序第②步仍写“对 `runtime-requests.json` 对账、补齐保留号与 Receipt”。这不是历史说明，而是 service 重启时的实际恢复动作。
  - **影响**：按第②步实现的 service 会漏读唯一账本，或重新创建旧账本；`run_id` reservation、Receipt 恢复和随后 `runs.json` 修复便不再由同一 key/phase 真相决定，exactly-once 与“崩溃不发第二个号”无法证明。
  - **建议**：把 discovery 第②步改为只扫描/修复 `runtime-operations.json`，直接引用其 phase/recovery 表；在输入原子中删除 `runtime-requests.json` 的运行时引用，并为无根 reservation、Store event 与 ledger 不一致分别保留唯一的 fail-closed 结果。

- **P1-AF5-02：operation Receipt/event/reason 仍停留在“同批扩展”，未落到当前冻结 schema 与错误边界。**
  - **事实**：草案 rpc-read-model-contract.md:144-153 描述新增 Receipt 字段、operation event kind/detail 和 `runStateChanged.caused_by_seq`，:162-166 又列出六个新 reason；但现有 `relay.launch-receipt/v2.schema.json:43-76` 仍只有 `kind=start|stop|resume` 且 `additionalProperties:false`，`relay.event/v2.schema.json:16-35,76-83` 没有三个 operation kind 或 Receipt/request digest 字段，`relay.rpc/v1.schema.json:117-140` 仍把 `runStateChanged.params` 直接约束为 `relay.run-state/v1`（不接受草案所说的 `{state,caused_by_seq}`），`reason-codes.md:58-69` 也没有上述六码或其数值码/重试边界。当前 server 对 handler reject 仍在 `rpc/server.mjs:165-168,242-249` 直接断连接，而草案要求可预期业务失败保持连接。
  - **影响**：施工者无法同时满足草案和 `additionalProperties:false` 校验；operation event 不能被现有 Store 校验器写入，`in_flight/committed/failed` Receipt、`caused_by_seq` 和稳定 error response 也无法跨重启/订阅重放。不同实现会自行发明字段、reason 或连接语义，唯一 Read Model 与 exactly-once 仍不可复跑。
  - **建议**：在同一输入原子中实际更新 launch-receipt/event/run-state/rpc schema（含 required/nullable、kind 条件、Receipt 与 event 的绑定及 `runStateChanged` 外层形状），把六个 reason、JSON-RPC 数值码、保持连接/重试语义写入 reason-codes，并同步 negative fixtures、capability baseline 和 server 的可预期错误回包；不要只保留“同批扩展”承诺。

- **P2-AF5-03：确定性 endpoint 的 transport 迁移与 UDS 清理仍需把实现护栏写成施工边界。**
  - **事实**：草案已规定 service/launcher 只能使用 `endpointForRepo()`，并在无活 owner 后才 unlink/rebind（rpc-read-model-contract.md:53-73）；但现有 `relay-core/rpc/transport.mjs:24-36` 的 `localEndpoint()` 仍生成随机 pipe/UDS，`:174-183` 在 `server.close()` 后无 owner 复核地 unlink UDS。若直接复用该 helper，旧 service 的 close continuation 可能在新 service bind 后删除同一路径。
  - **影响**：错误复用会破坏确定性发现或把新服务 socket 清掉；这属于已锁定 endpoint/credential 边界的实现护栏，不是新的业务选择。
  - **建议**：施工输入明确 `localEndpoint()` 仅测试 seam；正式 service 使用确定性 endpoint，并以同一 owner/bind 身份做残留探测和 compare-and-clean，禁止无条件复用现有 UDS close unlink。

- **P2-AF5-04：JCS 的嵌套排除需要明确调用前处理。**
  - **事实**：草案 rpc-read-model-contract.md:98-103 已采用 CANONICALIZATION.md:49-53 的 `id` 与 `handshake.request_id` 排除；但 `tools/canonical.mjs:68-71,82-90` 的 `digestExcluding()` 只剔除顶层键，并明确要求调用方先处理嵌套 `handshake.request_id`。草案只写“直接复用 `digestExcluding()`”，未冻结这一调用形状。
  - **影响**：若实现者把 `['id','handshake.request_id']` 直接传给 helper，嵌套 request id 会留在摘要中，同一重试请求可能得到不同 digest，重新打开 operation conflict 漏洞。
  - **建议**：在 operation contract 明确“先从完整 envelope 的 handshake 副本移除 `request_id`，再用 `digestExcluding(envelopeWithoutHandshakeRequestId,['id'])`”，并加入非 ASCII/数字/嵌套 request-id 的 JCS golden/negative fixture。

### 2. 用户理解风险

- **输入**：`status` 已不是 list；JCS 必须沿 CANONICALIZATION.md 与 `tools/canonical.mjs`，而不是重新定义键序/数字规则。`client_id/request_id`、service generation、local-user capability 与公开 `capability_hash` 仍是不同层身份。
- **存储**：唯一 operation 真相是 `.dh-relay/runtime-operations.json`；Run Store event 是 Receipt/event 的恢复裁决，`runs.json` 只在对账后、持全局 lock 修复，不能代替 ledger。当前两稿若按旧 discovery 行实现会误读已废止文件。
- **承诺**：subscribe 的 barrier 方向已收敛为只重复不丢失；start/control 的成功仍只承诺 Store/lease/operation Receipt，不承诺 DHR_31 workflow、Process 或 executor 已运行。legacy v1 全部 control 拒绝、客户端断开不生成 cancel 仍保持。
- **独立验证**：除双 launcher、残留 UDS、同 key 各 ledger phase crash/retry、双根 list/status/inspect 外，还必须验证 operation schema/event/reason 的实际校验、`runStateChanged` 的 seq 绑定、可预期 error 不断线，以及嵌套 `handshake.request_id` 的 JCS 等价重试。
- **失败处置**：坏帧/非法顶层协议才断连接；未授权、身份不符、cursor gap、legacy read-only、operation/lease/Store 失败必须返回登记 reason 与明确 Receipt 状态，不得回退到 CLI 直读/直写 Store。

### 3. 需要用户决定的问题

无。上述是已确认的 service 内嵌 actor、项目级 operation ledger、本机私有 capability、legacy 全 control 拒绝和 DHR_31 排除边界内的合同/实现一致性修复，不引入新的业务选择。

VERDICT: changes-requested

## A-full 定向复审（六）

本轮为第六位 fresh-context 定向复审，仅核验第五轮两项 P1、两项 P2 及相邻的 subscribe 约束。最新两份 DHR_30 design drafts 已将其收敛为可施工输入；当前 schema、transport、startrun、host 尚未改动属于待施工状态，不构成设计阻塞。未发现新的业务边界或 P0–P3 硬缺失。

### 1. 方案问题（P0–P3）

- **第五轮 P1-AF5-01（唯一 operation ledger）：已闭合。** `DHR_30-runtime-service.md:90-98` 明确废止 `runtime-requests.json`；`DHR_30-rpc-read-model-contract.md:111-148` 冻结 `<repo>/.dh-relay/runtime-operations.json` 为 start/control 唯一账本，统一 key、phase、`run_id`/`receipt_id`/`request_digest`、`next_seq`、崩溃恢复和 `runs.json.lock` 对账；重启 discovery 仅读该账本（runtime-service:179-183）。
- **第五轮 P1-AF5-02（schema/Receipt/event/reason）：已在设计层逐字段列为施工输入。** `DHR_30-rpc-read-model-contract.md:8-12,31-49` 冻结 method/Read Model schema；`:150-159` 列出 Receipt 的 `client_id/method/state/reason` required/nullable、operation event kind/detail、`runStateChanged {state,caused_by_seq}` 和 `node_id/attempt_id` 规则；`:168-172` 列出 reason、negative fixture、JSON-RPC 数值码边界和保持连接语义。施工需同步更新 launch/event/run-state/rpc schema、reason-codes、fixtures、capability baseline、server error 回包；不要求本轮先改代码。
- **第五轮 P2-AF5-04（nested JCS）：已闭合。** `DHR_30-rpc-read-model-contract.md:101-109` 明确克隆完整 RPC envelope，先从 `handshake` 副本移除嵌套 `request_id`，再调用 `digestExcluding(...,["id"])`；与 `CANONICALIZATION.md:45-53`、`tools/canonical.mjs:67-90` 一致。
- **subscribe barrier：已闭合。** 两稿统一为 Store 写队列内先注册 buffered subscriber/取得 `snapshot_seq`，再读发送 snapshot，最后排空严格 `>snapshot_seq` 的缓冲（runtime-service:165-168；rpc-read-model-contract:174-180）；`after_seq` 连续补发，重复允许丢弃，跨 Run/过期 cursor/缺口返回 `E_CURSOR_GAP`。
- **第五轮 P2-AF5-03（endpoint owner cleanup）：已明确施工护栏。** `DHR_30-rpc-read-model-contract.md:53-78` 冻结确定性 endpoint、失败候选不碰 credential、owner-aware close 和新 owner 出现后旧 close 不 unlink；现有 `relay-core/rpc/transport.mjs:24-36,174-183` 的随机 endpoint/无条件 unlink 是待施工接缝，不是设计缺口。

本轮无 changes-requested 项；设计足以晋级施工/拆计划输入，但上述代码、schema、fixture、baseline 与错误回包必须按草案实施，设计通过不等于代码完成。

### 2. 用户理解风险

- 施工前须以新 method/Read Model schema、唯一 `runtime-operations.json`、JCS 调用顺序和 owner-aware transport 为准；现有旧 schema、`createRunWithNumbering`、`startDetachedHost` 及随机 transport 仅是待替换现状。
- 本轮只证明设计可晋级，不证明真实进程、需求境或人验收；start/control 不承诺 DHR_31 workflow/Process/executor，legacy v1 全 control 仍拒绝，客户端断开不生成 cancel。
- 施工验证仍需覆盖各 ledger phase 崩溃/重试、JCS 等价/冲突、schema/reason negative、subscribe 并发 barrier、UDS 新旧 owner 竞态与 service restart。

### 3. 需要用户决定的问题

无。service 内嵌 actor、项目级 operation ledger、当前 OS 用户私有 capability、legacy v1 全 control 拒绝和 DHR_31 排除边界均已确认；本轮没有新的用户选择。

VERDICT: approved
