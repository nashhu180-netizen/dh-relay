<!-- dh:v1 -->
# findings — DHR_77

## 问题

当前 S0～S2 未发现需登记的 P0～P3；施工期发现只追加本表，不回写 `task_plan.md`。

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|----|------|------|------|------|------|
| F-7701 | P1 / resolved-by-B-44 | event/v2 schema 要求 alive 持久化非空 `host_ref`，但 Store 的封闭事件构造器未复制该输入字段；其唯一修复落点 `relay-core/store/store.mjs` 原先不在 DHR_77 allowed-paths。 | 初始：`relay-core/store/store.mjs:439-457`；E-7706 exit 1 / 0 of 2。B-44 后：更新 brief/DevPlan 将该路径限定为 `emitEvent` 单字段复制；E-7708 exit 0 / 2 of 2。 | 已按 B-44 只增加 `host_ref: input.host_ref ?? null`；未改 Store 其他校验、写入、回放、通知、lease、fencing 或事件语义。 | resolved · construction resumed |
| F-7702 | P2 / scope-blocked | B-45 批次 2 后，已由窄对照确认的范围外阻塞有两项：① DHR_76/C 的 60s registry budget 断言漂移（`dhr76-profile-validation-lease.test.mjs`，属 DHR_76 卡）；② DHR_34 identity-quota 第四测试 `driver.done` 长时间 pending（`identity-quota.test.mjs:131/146`），且连带完整 `npm test` 无终态——本 worker 原命令实跑 30 分钟与带 `--test-timeout=180000` 的运行超 90 分钟（E-7721）均未得自然终态，主控中断。完整集无终态，不能据此穷举其他潜在失败；修复上述已知项需改 DHR_77 范围外的兄弟测试/预算并单独诊断 workflow-driver 测试契约。原 DHR_69/C、DHR_75/B 两项已由本批次两条授权测试文件的最小夹具输入补齐解决（E-7717→E-7718）。 | E-7717（红复现）、E-7718（17/17 转绿）；E-7721（完整 npm 两次实跑未得终态）；对照：E-7719/E-7720 定向与根测试终态通过；主控主干窄对照：DHR_76/C 与 identity-quota 在 master 同样失败/挂起。 | DHR_69/C、DHR_75/B：resolved（仅夹具输入，未弱化断言/schema/来源校验）。DHR_76/C 与 identity-quota：保持范围外 open，只登记与主干基线的关系；完整 npm 不宣称全绿，是否另卡扩范围由主控决定。 | partially resolved · full npm 仍无终态 |
| F-7703 | P2 / resolved（代码轮 1 changes-requested） | 测试承重缺口：`relay.host-observation/v1` v0 shape 的 host_ref alive/lost 纪律与 event/v2 不对称地缺正反 schema 断言——alive+合法 ref、alive null/缺 ref 拒、非法 ref 拒、lost null/缺省 ref 通过四档没有测试钉住，schema 约束被改坏时四道闸全绿。 | 代码轮 1 review（E-7722）；整改后 E-7723 首跑绿、E-7724 承重变异证明：临时清空 then.required 后新测试在 alive 缺 ref 断言处报 AssertionError（断言失败），`git checkout --` 字节级还原后 25/25 复绿，`git status contracts/` 无输出证明 schema 未被弱化。 | `contracts.test.mjs` 新增与 event/v2 对称的 v0 shape 断言（六例：alive 合法通过、alive null 拒、alive 缺失拒、alive 非法 ref 拒、lost null 通过、lost 缺失通过）；schema 文件未改。 | resolved |
| F-7704 | P2 / resolved（代码轮 1 changes-requested） | 测试承重缺口：workflow-driver cold recovery 的 host_ref 生命周期序列没有可读断言——same ID 保持 ref、different ID replacement 换 ref、初始无历史 lost 缺省 ref、有历史 lost 保留最后成功 ref、旧账事件不被回写五条仅在 polling 路径有部分覆盖，`recoverHerdrAttempts` 恢复路径无测试钉住。 | 代码轮 1 review（E-7722）；整改后 E-7723/E-7725：`dhr77-host-ref.test.mjs` 新增 `recoveryFixture`（seed receipt/观测历史 + `makeFakeHerdr`）与四条 cold recovery 测试，每条含旧账事件 deepEqual 快照断言；定向组 111/111 绿。 | 新增四条 cold recovery 序列断言覆盖五条语义（same+不回写、replace+不回写、初始 lost 缺省、probe 失败 lost 保留、seeded 事件不回写）；未改生产实现，未重复既有普通 polling 测试。 | resolved |
| F-7705 | P1 / scope-blocked（代码轮 2 + 一致性） | 升级前缺 `host_ref` 的合法 alive `relay.event/v2` 会被现行 `loadEvents` 按新 schema 判 `E_EVENT_LOG_CORRUPT`，无法兑现 HC-HR-A4“旧账本只显示 legacy 缺省”。 | `relay-core/store/store.mjs:915`；design/14 §3.2、HC-HR-A4；代码轮 2/一致性 Review Batch。 | B-46 候选仅允许 `loadEvents` 精确只读兼容该 legacy 形状；不写回、不猜 ref，其余坏 schema 继续拒绝。 | resolved · B-46 construction remediation（待窄复核） |
| F-7706 | P1 / scope-blocked（一致性） | `contracts/CANONICALIZATION.md` 仍把旧固定 v1 hash 写成现役兼容常量，与本卡已实现且 design/14 冻结的 v1/v2 共用完整 baseline 冲突。 | `relay-core/contracts/CANONICALIZATION.md:64-66`；design/14 §3.2；一致性 Review Batch。 | B-46 候选新增该精确文档路径，只同步双轨说明，不改算法。 | resolved · B-46 construction remediation（待窄复核） |
| F-7707 | P1 / open（代码轮 2；一致性同项报 P2） | CLI 把所有无 `host_ref` 事件都标成“尚无可信 terminal 标签”，没有区分旧账字段缺失的“legacy 未提供”。 | `relay-core/cli/render.mjs:90-92`；代码轮 2与一致性 Review Batch。 | 与 F-7705 原子整改：按字段存在性分流并补 JSON/text 断言。 | resolved · B-46 construction remediation（待窄复核） |
| F-7708 | P2 / open（教训复核） | `ec8ef32` 把过度声称“残余收敛为两项”的旧结论原地改窄，现行边界正确但缺 append-only superseded 纠错留痕。 | `ec8ef32`；候选-10/12；教训 Review Batch。 | 只追加纠错账，引用旧结论、`ec8ef32` 与现行边界；不再改写原行。 | resolved · append-only superseded correction（待窄复核） |

## B-46 整改追加纠错账（append-only）

- **superseded 纠错**：`ec8ef32` 前后旧结论把残余问题说成“仅两项”并原地收窄；Review Batch 实际形成 F-7705～F-7708 四项。本追加条不抹改旧行，只把该旧结论标为 superseded。
- **本轮闭合事实**：F-7705 仅对 otherwise-valid、alive、对象自身缺 `host_ref` 的 `relay.event/v2` 做浅拷贝 sentinel schema 校验，返回原事件且不迁移/写回/造 ref；显式 `host_ref:null`、邻近坏字段与新 writer 缺 ref 仍拒。F-7706 同步 v1/v2 共用完整 baseline，并将旧固定 v1 hash 明确为被拒历史值。F-7707 按 `host_ref` 自身字段存在性分出 `legacy 未提供` 与 `尚无可信 terminal 标签`，非空 ref 的当前/历史语义保持不变。F-7708 的纠错留痕已追加。
- **证据索引**：E-7735 TDD 红基线；E-7736 B46 最小定向 3/3；E-7737 两文件组 27/27；E-7738 六文件组首个可取终态 113/112（旧兄弟断言未同步，已在允许路径最小修正）；E-7739 六文件组 113/113；E-7740 capability baseline 与契约静态审计通过。
- **边界保留**：本轮不运行完整 `npm`，不修 DHR_76/DHR_34，不进入 reviewer/verify/merge/push/deploy；旧的完整 npm 未得终态事实继续由 F-7702/E-7721 承接。
