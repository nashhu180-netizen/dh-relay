<!-- dh:v1 -->
# DHR_32 · Review

## 独立复核区

**第一轮（代码）**

| 复核者 | 结论 | 派出证据 |
|---|---|---|
| rev-dhr32-code | changes-requested 后经返工闭合 | log:review-code1-opus.md |

**需求复核结论**：changes-requested 后经返工闭合｜由 rev-dhr32-req｜派出=log:review-req-opus.md

**教训复核结论**：零否决，4 项漏项采纳并回流｜由 rev-dhr32-req（inline）｜派出=log:review-lessons-opus.md

| 路径 | 复核者 | 结论 | 原始记录 |
|---|---|---|---|
| 代码轮 1 | rev-dhr32-code · `--model opus`；SessionStart=fable-5（候选-40待裁） | changes-requested 后闭合 | 本文件「代码轮 1」 |
| 需求方向 | rev-dhr32-req · `--model opus`；SessionStart=fable-5（候选-40待裁） | changes-requested 后闭合 | 本文件「需求方向复核」 |
| 教训 | rev-dhr32-req · 复用需求轮实例（inline） | 零否决，4 漏项采纳 | 本文件「教训复核」 |

## AI 提交区

### 需求对齐证据

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| 注册表真实解析、字段闭集、零凭据与能力位可证 | 真实环境零注入 validate，逐份 evidence 对表，credential 正反扫描与 mutation | E-3201~E-3205 | 满足 |

> 任务类型 normal：代码轮 1 + 需求方向复核 + 教训复核 + 有效单测；轮 2 未被用户点名、不做。
> 复核形态：claude opus 经 Herdr 拉起，**侦测型只读**（提示词硬约束 + 主控回收后 `git status` 核对零改动；非机器只读，如实登记）。

## B-22 预审（B-调整 fresh 审核，opus）

- 审对象：DevPlan P6 §0.2 `DHR-B-22` 三条调整 + 本工作区 brief.md / task_plan.md。
- 复核实例身份：claude opus fresh 实例，Herdr `pane run` 拉起（pane w1:p7，agent `rev-b22`，2026-08-29），与调整③冻结形态一致；回收后 `git status` 核对仅新增 `review-b22-opus.md` 一文件，零越权。
- 结论：共 23 条（P1×8 / P2×11 / P3×4），原文见 [review-b22-opus.md](review-b22-opus.md)。核心：npm test 显式清单不会拾取新测、§4.3 与调整①冲突、禁改边界指错 `tools/` 位置、凭据正则漏 `sk-ant-`/base64、扫描范围漏注册表本体、shim 全文引用是泄露口、验收①与字段闭集互斥（P1-8）。
- 主会话裁决（2026-08-29，主控独立复算 P1 关键事实后裁决）：
  - **P1×8 全采纳**：P1-1 取方案 (a)（allowed-paths 增列 `package.json` 仅 `scripts.test` 追加一个 token）；P1-8 取方案 (a)（解析做成校验器行为 `E_UNRESOLVED_CONFIG`/`E_UNRESOLVED_ALIAS`，不扩字段闭集，已回写 DevPlan §2.3）；其余按建议落实。
  - **P2×11 全采纳**：P2-7 落位定为 `relay-core/profiles/`（与 contracts 平级），DevPlan 三处已改。
  - **P3-1① 驳回**：复核者自称「非 Herdr 拉起」有误——`herdr agent get rev-b22` 证实其运行于 Herdr pane w1:p7，形态与调整③一致，无需补登记差异；P3-1②（复核形态迁移路径）采纳记 findings。P3-2/3/4 采纳。
  - 全部采纳项已回写 DevPlan / brief.md / task_plan.md（同批提交）。

## 完成条件逐条挂证据（验收靶子）

| # | 命题（brief 完成条件） | 事实证明方式 | 最终裁决者 | 稳定 ID | 覆盖态 | 证据 | 结论 |
|---|---|---|---|---|---|---|---|
| 1 | B4·P6-M2：注册表条目解析到真实 cli/config_dir；每个启用 Profile 有可重复身份探测或明确标不可证 | 机器证：golden-registry 条目 ↔ evidence 审计命令输出逐条对得上 | 机器+复核 | E-3201 | 已覆盖 | golden 与仓外注册表在真实环境（零注入）`validate-profiles.mjs` PASS（progress 返工记录 + 主控独立复算）；不可证项经测试断言绑定 evidence「不可证」字样；claude 主号补可复跑探测命令 | 通过（F-3 已按用户代决策授权移交 DHR_35，ninth 未登录事实不变） |
| 2 | §7.1：注册表只含 §2.3 允许字段；凭据零出现（扫描+白名单双证） | 机器证：schema `additionalProperties:false` + negative fixture + rg 扫描输出 | 机器+复核 | E-3202 | 已覆盖 | schema 顶层+entry 闭集；七组 negative fixture 各中期望码；五条模式四处语义等效，其中 rg 的 `Bearer \S+` 与代码的 `Bearer\s+\S+` 字面不同；仓内扫描命中全归类、仓外零命中+sha256 | 通过 |
| 3 | 宪章#6：审计工件零凭据、白名单脱敏 | 机器证：progress 里的扫描记录 + 复核抽查 | 机器+复核 | E-3203 | 已覆盖 | progress 双跑扫描记录；代码轮复核「脱敏合规」专项核对（shim 正文未入仓、路径 `%USERPROFILE%` 形态、返工后仓内硬编码路径已移除）；主控对提交 diff 独立扫描 | 通过 |
| 4 | B15⑤：capabilities 逐项对应真实 CLI 开关，不支持者标不支持 | 机器证：evidence 能力位表每格挂命令依据或「不可证」 | 机器+复核 | E-3204 | 已覆盖 | 交叉断言返工后为行级定位+否定词护栏+反向断言（正反两向都焊死）；12/12 绿；代码轮 P1-2 的三例 FALSE-PASS 已不可复现 | 通过 |
| 5 | 有效单测：登记变异点改坏必红 | 机器证：progress 里红→还原→绿三段输出 | 机器 | E-3205 | 已覆盖 | 变异点经复核裁决从 `E_CREDENTIAL_FIELD`（有 schema 冗余保护，证据力不足）改为 `CREDENTIAL_VALUE` 正则数组：短路后目标反例被错误接受（红）→ 还原 sha256 两算一致 → 12/12 绿（progress 返工记录） | 通过 |

## 代码轮 1（fresh 只读侦测型）

- 实例身份：claude fresh 实例，Herdr `pane run` 拉起（pane w1:p9，agent `rev-dhr32-code`，2026-08-29），未参与实施、未读需求轮输出。**模型登记（如实）**：拉起参数 `--model opus`，pane 状态栏显示 Opus 5，但实例自报「实际模型 claude-fable-5」（其 SessionStart hook 所告）；矛盾证据并存，待用户裁定是否影响「复核=opus」的形态追认。
- 只读核验：回收后 `git status` 仅新增 review-code1-opus.md / review-req-opus.md 两文件，零越权。
- 结论：13 条（P1×3 / P2×4 / P3×6），原文 [review-code1-opus.md](review-code1-opus.md)。P1：①golden/仓外注册表真实环境被自家校验器拒（测试注入假环境变量糊绿）；②能力位交叉断言可被反向文本满足（实测三例 FALSE-PASS）；③schema 用户名防线是死代码。另留档 7 项「已核对通过」（边界零越界、五正则四处一致、脱敏合规等）。
- 主会话裁决：P1 全采纳、P2 全采纳、P3 中 P3-1/P3-6 转代码修，其余转 findings 登记。修法冻结于 [rework-1.md](rework-1.md)，派原施工 worker 执行（返工第 1 轮）。

## 需求方向复核（fresh 只读侦测型）

- 实例身份：claude fresh 实例，Herdr `pane run` 拉起（pane w1:pA，agent `rev-dhr32-req`，2026-08-29），与代码轮互相独立、未读对方输出。模型登记同上（`--model opus` 拉起、实例自报 fable-5，如实并存）。
- 结论：14 条（P1×3 / P2×8 / P3×3），原文 [review-req-opus.md](review-req-opus.md)。P1：①同代码轮①（独立命中）；②claude 主号（唯一入册 expected_identity 者）缺可复跑探测命令；③注册表表达不了「当前可派」，`codex-ninth` 未登录威胁 DHR_35 的 B4/P6-M1（跨卡阻断风险未上 findings）。方向判断：诚实性达标；「不可证项不影响后续使用」不成立；「派活不靠猜」兑现一半。另点出需求传导丢失：`work_dir_root` 从 design/02 B4 抄进 DevPlan 时被摘掉。
- 主会话裁决：P1 全采纳；P2-1（work_dir_root）取其方案 (a)——归 DHR_33 承接、主控回写 DevPlan；字段闭集类建议（P2-2/P2-5/P2-7/P2-8、P1-3b）一律不扩字段、转 findings 交 B-事件；其余采纳并入 rework-1.md。

## 教训复核

- 实例身份：复用需求轮实例（rev-dhr32-req，pane w1:pA）——教训复核不要求 fresh，其对本卡上下文的掌握有利于查漏；只读形态不变。
- 结论：6 条候选零否决（L-2/L-6 小改采纳，L-1/L-3/L-4/L-5 按其成稿改写后采纳），另补 4 条漏项（漏-A 需求项逐级复制静默丢失【优先】、漏-B 机读清单缺「当前可用性」维度、漏-C 布尔吞「未证」、漏-D 变异点选在冗余保护分支）。原文 [review-lessons-opus.md](review-lessons-opus.md)。
- 主会话裁决：全部采纳，按其成稿回流 `knowledge/教训库-候选.md`；**一处驳回**——其「L-3② 修法尚未落实」的指控经主控复算不成立（现 HEAD `validate-profiles.mjs:57` 已含 `-CommandType Application,Function,Alias,ExternalScript`，功能级实测 `Get-ChildItem` 被 `E_UNRESOLVED_ALIAS` 拒收；复核者读到的是返工前版本），不另立 findings。

## 收敛与验收靶子回填（2026-08-29 主控）

- 复核收敛：代码轮 13 条 + 需求轮 14 条 → rework-1（`fadd742`）全部闭环；主控独立复算返工硬门槛（真实环境 golden/仓外 validate PASS、12/12、注入移除、schema 收紧）通过。教训复核零否决。P0/P1 清零（open findings 均为下游移交项 F-3~F-10，非本卡缺陷）。

## 一致性复核（2026-08-30 治理补审）

<!-- dh:consistency-review:v1 task=DHR_32 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| Profile schema/validator/tests/evidence/DevPlan/findings/as-built | DHR_32 七条链路与 `2667f4a` 实现范围 | 主干一致；发现 1 条确认口径冲突、4 条 P2 与 5 条 P3 | P1 口径统一；范围/as-built/evidence 文档整改；生产正则与测试环境耦合遗留 DHR_35 | log:review-consistency-opus-20260830.md |

## 人类签名区（待用户回归，AI 不得代勾）

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| 注册表真实性与脱敏 | 读 E-3201~E-3205 账本及五份审计 evidence | 五入口事实可回链、零凭据、不可证项未冒充 | [ ] |
| ninth 当前状态 | 查看 findings F-3/F-4/F-6 与 DHR_35 前置动作 | 看清「未登录、机读层不表达可派性、DHR_35 必须先裁」三项事实 | [ ] |

- [ ] **追认 `DHR-B-22` 代决策**：①Linux 项延后 ②审计读取范围与脱敏白名单 ③派发形态。做什么：读 DevPlan P6 §0.2 B-22 + 本卡 evidence 任一份，判断范围与脱敏是否可接受。通过标准：对话内明文/点选认可。
- [ ] **E10 收口确认与 verify**：已查看证据，认可收口（注：squash 合入已按 2026-08-29 委托先行执行，用户如不认可可指令回滚）。
