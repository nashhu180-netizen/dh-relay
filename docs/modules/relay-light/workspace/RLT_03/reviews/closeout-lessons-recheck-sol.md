<!-- dh:v1 -->
# RLT_03 · heavy Recipe lessons 同路径复验（Sol）

## 复验身份与基线

| 项 | 实测 |
|---|---|
| review_path_id | `lessons` |
| 角色 | lessons 同路径复验 worker；非主控、非施工者 |
| pane / session | `w15:pD` / `kpi-agg` |
| Codex session | `01a08a6f-9b1d-7d41-b261-b04e675deeb8` |
| 实际模型配置 | `gpt-5.6-sol`，`model_reasoning_effort=medium` |
| worktree | `/home/nash/work/dh-relay/.dh-worktrees/RLT_03` |
| branch / HEAD | `wt/RLT_03` / `e4b4cd68c163f32ef4324ea16d49dda53b5f44bc` |
| 受审状态 | HEAD 后已有主控 closeout rework WIP；本复验不把历史 HEAD 当当前文件内容 |
| 唯一写入 | 本报告；未改代码、brief/progress/findings/lesson_candidates/review、DevPlan，未 commit/push |

## VERDICT

**VERDICT=CHANGES_REQUESTED**

| 级别 | open |
|---|---:|
| P0 | 0 |
| P1 | 0 |
| P2 | 1 |
| P3 | 0 |

`P2-LESSONS-1` 已由 L-001～L-003 闭合；`lessons-absent=false` 合规。`P2-LESSONS-2` 只关闭了初审列举的四个 detail 绑定，没有关闭同类集合：现役测试仍有两处把未冻结 detail 当断言。因此 lessons 路径尚不能 APPROVE。

## 初审 findings 复验

### P2-LESSONS-1 · lessons 工件只有占位

**CLOSED。** `lesson_candidates.md` 已删除 `L-000`，形成三条可核查结论：

- `L-001` 明确复用在册候选-25，并如实登记 A69 多轮根因翻新及未及时形成止损判断；这满足初审“至少显式登记候选-25 的本卡重蹈”。
- `L-002` 抽出本卡 F-037 的新教训：JSONL 写读必须共用 LF 记录边界，不能用 Python `splitlines()` 扩大记录分隔集合。全库候选关键词扫描只发现候选-16 的“超长流式 NDJSON 帧丢弃至 LF”；候选-16处理超长帧后的流式重同步，L-002处理合法 Unicode JSON 字符被文件读侧误切行，触发条件和根因不同，不是重复候选。
- `L-003` 明确复用候选-61，并指向 E-054；是否真正闭合见下一节。

文件末尾明确写出 `lessons-absent=false`、复用候选-25/61、存在新候选 L-002，不再是空占位或不可核查 N/A。故本项闭合。

### P2-LESSONS-2 · 负例绑定未冻结诊断 detail

**PARTIAL，仍 open。**

E-054 对初审点名的四处整改是真实的：当前测试已把以下断言收窄为稳定前缀/code，并保留退出码、stdout/零写入或字节不变判据：

| 初审位置 | 当前断言 | 行为判据 |
|---|---|---|
| 缺 plan | `^error: HC-RL-A18 ` | rc=3、stdout 空 |
| 坏 marker 首行 | `^error: HC-RL-A18 ` | rc=3、stdout 空 |
| append OSError | `^error: ledger ` | rc=4、账本不存在 |
| 末行无 LF | `^error: ledger ` | status/add rc=4、stdout 空、账本 bytes 不变；并已增加 trailing-space/no-LF 形态 |

`progress.md` E-054 记录隔离副本只改这四处 detail 后 3 个目标测试 exit 0、真实树 54 tests 全绿；本复验又以 `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tools/relay-light/test_relay_log.py -q` 独立复跑，得到 `Ran 54 tests in 55.057s / OK / exit 0`。因此 E-054 对这四处的局部结论可信。

但初审 finding 使用的是“例如”并要求移除**未冻结 detail 的同类绑定**，不是只改单列四行。当前仍有：

1. `test_relay_log.py:178`：`^error: HC-RL-A18 marker cards=`。冻结合同只要求空/缺 `cards=` 以 A18、rc=3 fail closed，不要求诊断 message 必须包含 `marker cards=`；合法改写 detail 会使该测试假红。
2. `test_relay_log.py:775`：`^error: ledger line 1: `。冻结合同只要求坏账本 rc=4 和统一 `error: <code> <message>`，未冻结 message 的 `line 1:` 字样；该组测试已经逐项制造坏第一行，稳定行为无需靠 detail 定位。

`test_relay_log.py:1040` 的 `.*coder#1` 不计入本 finding：design/01 的 HC-RL-A17 明文要求不可关原因“列出该 agent”，这里的 agent 身份是冻结语义，不是任意诊断措辞。

整改要求：把上述两处收窄为稳定 code/退出码/零写入或状态不推进判据；随后对这两处做 detail-only 变异并复跑目标测试。`lesson_candidates.md` L-003 与 `findings.md` F-042 在此之前不能写成全称“不会因合法改写 detail 假红 / resolved”。

## lessons-absent 合规性

**合规：`lessons-absent=false`。** 本卡有两条复用候选（25、61）和一条非重复新候选（L-002），显然不满足 absent；没有借 `lessons-absent` 删除 lessons 路径，也没有把有命中事实写成空 N/A。

## 新增 P0～P2 扫描

- 新 P0：0。
- 新 P1：0。
- 新 P2：0。上述 P2 是初审 `P2-LESSONS-2` 的同类残留，并非另起根因；`P2-LESSONS-1` 未见回归。
- L-002 与候选-16 已按触发场景和根因做过判重，未发现需合并或降为复用的 P2。

## 独立证据 E-061

| ID | 类型 | 手段 | 结果 |
|---|---|---|---|
| E-061 | lessons recheck | 回读 AGENTS、workspace 指定五件、初审报告、初审引用候选；核 `lesson_candidates.md` L-001～L-003；对照 F-042/E-054；静态枚举全部 stderr 正则；无字节码复跑 focused suite；`git diff --check` 与 pycache 检查 | 54 tests OK；L-001/L-002/L-003 与 `lessons-absent=false` 合规；P2-LESSONS-1 closed；P2-LESSONS-2 partial/open（残留 2 处非冻结 detail）；P0=0/P1=0/P2=1/P3=0 |

本报告只复验 lessons 路径，不替主控裁决整卡，不代签 verify，不修改其它工件。
