<!-- dh:v1 · workspace/DHR_33/rework-1.md · 复核轮1返工清单（主控裁决后，worker 照做） -->
# DHR_33 · 返工清单 1（源：review-code1-opus.md ×19 + review-req-opus.md ×16 + 主控实证，2026-08-29 裁决）

> 边界不变：brief allowed-paths 闭集照旧；contracts/ 仍一个字不动。
> **主控补充实证（升为 A-0）**：全量 `npm test` 在本工作树会**挂死不退出**（worker 12:13 与主控 12:27 两次实测均未终止，被强杀；伴随孤儿 `runtime/service` 进程与一个烧 422 CPU 秒的子进程）——与 R-2/P2-3 的「轮询无退出条件 + 每秒灌事件」同根。返工后的硬门槛含「全量 npm test 能自行终止」。
> 完成门槛（步骤 F）：新测单跑全绿 + **全量 `npm test` 自行终止**（结果如实记录，既有抖动照旧留档）+ audit-contracts 0 违规 + contracts/fixtures/profiles/store/rpc/adapters 六目录 diff 为空 + smoke 重做证据齐。最后 `git add`（只加 allowed-paths）+ `git commit -m "fix(dh-relay): DHR_33 复核轮1返工（wt/DHR_33）"`。禁止 push。

## A. driver / adapter 代码必改

1. **[代码P1-1] done/idle 分支崩溃**：`workflow-driver.mjs:166-167` 的 `appendEvent` 补 `observation_status:'alive'`（event schema 对该 kind required）；`driveHerdrNode` 外层包 try/catch，事件写入失败降级为可见终态或 Attention，不许让整届 driver 静默死。
2. **[代码P1-2/需求R-2] 判定器注入口**：`startWorkflowDriver` 增 `herdrJudge = null` 参数（与 herdrCli/herdrPollMs 同层），透传 `captureHerdrResult({ judge: herdrJudge })`；**done 且无判定器时设有界上限**（参数化 `doneTimeoutMs`）：超时 → 发一条 `human_input_requested`（needs_input 语义，detail 走 observationDetail）后停止轮询该节点（保持 running、无 Result），绝不无限轮询。
3. **[代码P1-3] blocked 沿触发**：用 `lastStatus` 做转移判定，只在 `prev!=='blocked' && now==='blocked'` 沿上发 `human_input_requested`；working/observation_lost 分支复位 blocked 标志。观测断恢复时 `lostAttention` 一并复位（[代码P2-3]「断→恢复→再断」第二段要能再发）。
4. **[代码P1-4] launch 盲区真轮询**：`launchHerdrAgent` 内按 `readyTimeoutMs` 轮询 `agent get`（可用本机 `herdr agent wait --state` 简化）直到 idle/working 或超时；`blind` 只在「观测成功但状态不是 idle/working」时为真；观测失败不算盲区、走 reconcile。
5. **[代码P1-5] ORPHANED 恢复路径最小闭环**：driver 起届时扫「`running` 且 executor_kind='herdr-agent' 的未决 attempt」，用事件账里的 `executor_ref`（agent_name）反查 `herdr agent get`：查得到 → 接管续观测；查不到 → `appendResult({outcome:'orphaned', reason:'E_EXECUTOR_ORPHANED'})`。
6. **[代码P2-3/需求R-3+主控实证] 事件与轮询治理**：`host_observation_changed` **只在 observation_status 或 herdr_status 相对上一轮变化时落账**（kind 语义就是 changed）；`state_change_seq` 相同的重复观测不产生新事件（design/03 §123 冻结口径）；所有轮询循环必须有生命周期出口（stop / done 上限 / lost 升级后停发）。**返工后全量 npm test 必须自行终止**——测试里 driver 一律 finally stop。
7. **[代码P2-1] 分叉顺序**：process 先、herdr 后，与规格逐字对齐。
8. **[代码P2-2/需求R-11] detail 编码统一**：三处破格（`:144` 裸串、`:126` herdr_status=needs_input、seq 硬编码 0）全部改走 `observationDetail`；`<s>` 位只放真实 herdr 状态（盲区用 unknown）；seq 传最后已知值；**按 brief 裁决 3 修订版增补第 6 键 `profile=<executor_profile_id>`**（launch 时从 registryProfile 带入 handle）。
9. **[代码P2-4] launch 失败码分界（主控裁决）**：参数校验失败（如 workDirRoot 缺）→ `E_BAD_VALUE`；herdr 侧起不来（paneSplit/agentStart 失败）→ `E_EXECUTOR_HOST_LOST`；两类都把包装层子码放进 `structured.reason_detail` 保住信息。
10. **[代码P2-5] reconcile 判据收紧**：只有「CLI 调用成功且明确答复无此 agent/无此 pane」才 `host_lost`；CLI 自身失败（spawn 失败/超时/解析失败）一律 `observation_lost`。`herdr-cli.mjs` 区分「非零退出且明确 not found」与「spawn/超时失败」。
11. **[代码P2-6] send 语义**：文本输入走 `herdr agent prompt`（或 `pane send-text` + enter 按键）；`send-keys` 只留纯按键场景。progress 写明「出口已备、控制通道接线归 DHR_34/35」。
12. **[代码P3-1~P3-6] 小修全做**：stop 返回值检查（关不掉别写已杀）；renderFocus 无 executor_ref 时不输出假指令；删 `main.mjs:328` 死参数；`'result' in value` 兜底；openAttempt 迁回裁决注释；kill 加独立短超时。attach 模板双份问题（需求R-14）：测试里断言 `attachHerdrAgent().instruction` 与 `renderFocus` 输出的 attach 行字符串一致（钉住不漂移）。

## B. 测试补齐（对照 task_plan 步骤 6 的 11 组，缺的全补）

13. 按代码轮 §四的核对表补齐 4 组缺失 + 4 组替身转真（骨架照代码轮 §七提示：临时仓 + 真 createStore + 真 startWorkflowDriver + fake-herdr，注入 herdrPollMs 小值）：
    - #1 心跳 N 次 N 条（含 checkpoint_id 唯一性）；
    - #2 blocked 全链：落账 waiting_human → 只发一次 → **blocked→working→blocked 第二沿再发**（钉 P1-3）→ 重放持久 → send 后恢复；
    - #3 done 分支：无判定器保持 running + host_observation_changed（钉 P1-1 崩溃）+ done 超时 Attention；注入 herdrJudge 后 succeeded 且 executor_kind='herdr-agent' 逐字；
    - #4 观测断：恰好一条超阈值 Attention、不落 Result、恢复后再断可再发；**seq 相同不落新事件、状态不变不落新事件**（钉 A-6）；
    - #5 host_lost 落 Result E_EXECUTOR_HOST_LOST；
    - #7 盲区正例（小 readyTimeout + 永不 ready 的桩）；
    - #8 driver 级 ref 未命中零事件；
    - #9 事件账重放与 state.json 逐字节一致；
    - 新增：ORPHANED 恢复两例（接管 / 判 orphaned，钉 A-5）。
14. **[需求R-10] herdr-cli 层覆盖**：按 task_plan 原要求做可执行桩（node 脚本注入 `herdrBin`，桩状态落临时文件），把 6 个动词的参数序列与 `{id,result,type}` 信封解析各钉一次（含超时/非零退出/not-found 三分支）。
15. **[需求R-7] Headless(Linux) 桩剧本补产出**：`test/helpers/` 增 SSH 断连语义剧本（断连=观测不中断），测试标注「Linux 真实 SSH 证据延后（B-22①），桩不冒充」。
16. **[需求R-15] 候选-39 取证**：记录用例总数基线差（改前 N / 改后 N+M）贴 progress。

## C. 真实 smoke 重做（一次跑全，逐字贴 progress）

17. ①DSH 未运行取证（进程/服务查询输出，脱敏）；②起一个**真 Run**（fake-herdr 注入或真实 herdr 均可，H1 要的是「DSH 不在时 CLI 能查能附着」）→ 逐字跑 `relay status/inspect/events/focus <run_id> <node_id>` 贴命令与输出（需求R-6/R-12）；③preflight 三条补齐：handle 1:1（已有）+ pane 可交互一次按键回显 + stop 到 pane 消失的耗时数字（需求R-8）；④herdr 版本号照旧记 progress。
18. **[需求R-3 取证]** `herdr --help` 全子命令清单贴 progress，确认 CLI 是否暴露事件订阅面；不暴露则 findings 登记「快路受 CLI 能力所限，本卡慢路+沿变化落账交付」，挂阶段闸。

## D. 文档与 findings

19. findings.md 追加（状态 open，处置写清交给谁）：
    - F-3 (P1→DHR_35)：herdr 节点成功终态依赖 herdrJudge 注入，判定器语义（何为「干完且对」）由 DHR_35 冻结；
    - F-4 (P2→DHR_34)：注册表字段除 product/profile_id 外仍未消费（command_alias/account_alias/expected_identity/capabilities），身份链接线归 DHR_34；
    - F-5 (P2→DHR_34/35)：Attention 出口（send/attach）已备但无控制通道调用方，需 DHR_34/35 定 RPC/CLI 接线；
    - F-6 (P2)：事件快路（订阅提前触发 tick）按 C-18 取证结果登记；
    - F-7 (P3)：work_dir_root 恒等于 repoRoot，run/node 级来源留 DHR_35；
    - F-8 (P3)：fake-herdr 桩状态在内存闭包，跨进程 smoke 需换文件桩（B-14 部分解决）。
20. progress 的 DONE 段重写：补「11 组断言逐组落地状态表」；完成条件自评按事实改（③ 在 C-17 完成前不得计入已有机器证）；E-3301 措辞与事实对齐（桩剧本已补则照实写）。
21. DevPlan 由主控收口时统一回写，worker 不动。

## E. 裁决说明（不执行，仅背景）

- 需求R-4 的完整字段消费、R-5 的控制通道、快路实现——本卡不扩范围，走 findings 交下游（上面 D-19 就是落点）。
- detail 第 6 键 profile 是 brief 裁决 3 的主控修订（复核轮1），不是 worker 改冻结格式。
- 两位复核实例自报模型均为 claude-fable-5（拉起参数 --model opus）——已按候选-40 双证登记 review.md，待用户裁定。
