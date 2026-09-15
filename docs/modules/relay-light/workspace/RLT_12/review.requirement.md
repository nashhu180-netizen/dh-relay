<!-- dh:v1 -->
# RLT_12 requirement 独立复核（补做）

## 结论

**REVISE**

- P1：3
- P2：4
- 复核身份：requirement 路 fresh 实例（Claude Opus 5），未参与 RLT_12 的任何施工、编排或监工；cwd = `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_12-review`（分支 `wt/RLT_12-review`，基线 master `2a9c4f4`）。本次只写本文件，未改任何其它文件、未跑 git 写操作。
- 判定边界：三条机器证（A32/A30/A31）我自己重跑取证，不采信卡内既有结论。五条人判（H1/H13/H5/H14/H10）我只判「记录是否成立」，**不代用户作任何主观判断、不改人类签名区**。本卡已于 2026-09-15 由用户整体授权验收并合入 master（squash `7981556`），本复核不因已合并放水，也不要求推翻用户已作的放行决定——整改动作一律落在「记录与口径」层。
- 一句话：**目标实质达成、机器闸真实成立、非目标守住；缺陷全部集中在「证据回填」与「把用户没说过的逐条结论记成通过」两处。**

---

## 我实际跑过的命令与原始输出

### 1. A32 三处哈希重算（不采信 E-001）

```bash
cd D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/RLT_12-review
for f in SKILL.md references/adapter-claude-code.md references/adapter-codex.md roles.toml dh-mapping.toml; do
  sha256sum tools/relay-light/skill/$f
  sha256sum /c/Users/nash/.claude/skills/relay-light/$f
  sha256sum /c/Users/nash/.codex/skills/relay-light/$f
done
```

原始输出（按文件归组）：

| 文件 | 仓内源 `tools/relay-light/skill/` | `~/.claude/skills/relay-light/` | `~/.codex/skills/relay-light/` | 三处一致? |
|---|---|---|---|---|
| `SKILL.md` | `896e58e817d5ba56964525a59a618177b39ed23a09f8afcdfcba502a8b80e67f` | `bcf7aa4721e47aeea81055e06528f8747b552212eb11dc23122c8b03b2774f7c` | `bcf7aa4721e47aeea81055e06528f8747b552212eb11dc23122c8b03b2774f7c` | **否** |
| `references/adapter-claude-code.md` | `11c54a82cc6e6f7fcc4aec7ed6fa2b8501915fad88ce61185781724a4399a91b` | `55e88780a5c6c3bf915692a4f95d9a76a3eb7faee030b4917abc474dd0e41967` | `55e88780a5c6c3bf915692a4f95d9a76a3eb7faee030b4917abc474dd0e41967` | **否** |
| `references/adapter-codex.md` | `35b75eabe517b2e29b2ce604f531c0612da5f4ae87eb42b4660a0427e174d8b0` | `7c95a337c8e713c67ec188b6560d178dc681259579e763e81b05fbb59aacd34a` | `7c95a337c8e713c67ec188b6560d178dc681259579e763e81b05fbb59aacd34a` | **否** |
| `roles.toml` | `61e55dc27660cb2dd90106aca3f6e07aac2010721263d1573ca0067a52284861` | 同左 | 同左 | 是 |
| `dh-mapping.toml` | `7479f11ec214537c8e1835408bbd9db18aa01761c177b28cd9dd4505db74c787` | `dcad3731699d6bb358070d70693086103c38127be6d32813ad6a9c453ebf698b` | `dcad3731699d6bb358070d70693086103c38127be6d32813ad6a9c453ebf698b` | **否** |

**判读**：两个用户级副本彼此完全一致（五文件全同），但与**当前 master 的仓内源**在 5 个文件里有 4 个不一致。原因是 RLT_21（`124a5c9`）与 RLT-A-09/A-10（`a6689f1`/`2a9c4f4`）在 RLT_12 之后改了 `tools/relay-light/skill/**`，而重同步按 DevPlan `:407`/`:429` 须另取用户当次授权，至今未做。E-001 记录的三处一致在其取证时点（HEAD `51d8062`，2026-09-14 23:30）成立——两副本侧的五个哈希与 E-001 原文逐字相同，可交叉验证 E-001 未造假。详见 P2-1。

### 2. A31 lint

```bash
python tools/relay-light/relay_log.py lint \
  --plan docs/modules/relay-light/relay/rlt12-win-01 \
  --config-dir ~/.claude/skills/relay-light/
```

```text
lint: ok
exit=0
```

### 3. A30 status（人读版 + `--json` 全量核对）

```bash
python tools/relay-light/relay_log.py status \
  --plan docs/modules/relay-light/relay/rlt12-win-01 \
  --config-dir ~/.claude/skills/relay-light/
```

```text
计划：docs/modules/relay-light/relay/rlt12-win-01   skill=0.1.0   session=rlt12-win-01
卡：RLT_21      decision_mode=auto
当班写入者：orchestrator（RLT_21:F#1）

阶段 RLT_21:W#1  closed   result=done
阶段 RLT_21:C#1  closed   result=done
阶段 RLT_21:R#1  closed   result=done
阶段 RLT_21:X#1  closed   result=done
阶段 RLT_21:F#1  closed   result=done
exit=0
```

`--json` 关键字段：`open_stages: []`、`errors: []`、`current_stage: null`、`pending_nodes: []`；6 个节点（W1/C1/C2/R1/X1/F1）`state` 全为 `closed`、`closable: true`、`reasons: []`；15 个 agent 实例 `last_event` 全为 `done`。

### 4. 账本机械核对（A30 的「launch 全有终态」自证）

```text
# 71 行账本逐行统计
by counter: {'orchestrator': 16, 'monitor': 55}
agent_launch: 15   done: 15
launches w/o terminal: []      # 无悬空 agent
dup launches: []               # 无重复 (node, agent) 启动
checkpoint count: 8
stage_id=RLT_21:W#1  0:21:05
stage_id=RLT_21:C#1  4:04:12
stage_id=RLT_21:R#1  0:42:24
stage_id=RLT_21:X#1  0:43:34
stage_id=RLT_21:F#1  0:36:54
全程 seq1->seq71: 7:02:27   2026-09-15T10:10:21+08:00 -> 2026-09-15T17:12:48+08:00
```

与 verify 提交 `dd3ac3c` 正文声称的「编排事件 16 条、监工事件 55 条、checkpoint 纠偏 8 次、阶段用时 W 21 分 / C 4 小时 04 分 / R 42 分 / X 44 分 / F 37 分、全程 7 小时 02 分」**逐项吻合**（X/F 为分钟取整）。该 verify 提交的数字部分可信。

### 5. 口径三处比对（design/01 → DevPlan → brief）

```text
# 逐字符比对 DevPlan #### RLT_12「验收口径」8 条 与 brief.md 完成条件表第 2 列
[1..7] identical=True
[8] identical=False
  DevPlan: 另做“只给账本”展示，用户判断能否复原现场。
  brief  : 另做"只给账本"展示，用户判断能否复原现场。
  first diff at char 36: DevPlan='“'(U+201C)  brief='"'(U+0022)
```

design/01 侧三条机器证的原文与 DevPlan 的表述**非逐字，但语义等价且带来源回链**，我不计缺陷：

| 验收 | design/01 原文 | DevPlan / brief 表述 | 判词 |
|---|---|---|---|
| A32 | `:1266`「当前机器两个派生副本的五文件各自与仓内唯一源 `tools/relay-light/skill/` 逐字节一致」 | 「两个用户级目录的五文件分别与 `tools/relay-light/skill/` 的同名文件逐字节一致」 | 等价 |
| A30 | `:1282`「全部阶段 `stage_close`、全部节点 `closed`，每条 `agent_launch` 都有配对终态事件，无悬空 agent」 | 「所有阶段关闭、节点 closed、launch 全有终态」 | 等价（压缩，「无悬空 agent」为冗余重述） |
| A31 | `:1283`「账本每行过 schema 校验，事件顺序满足状态机与阶段时序偏序」 | 「真账本每行 schema 与全时序合法」 | 等价 |

### 6. 其它只读取证

```bash
gh issue view 23                                  # 已知缺口接受记录原文
git show --stat dd3ac3c                           # verify 提交正文
git log --oneline -- docs/.../rlt12-win-01/relay_plan.md   # 仅 7981556 一条（squash）
find docs/modules/relay-light/workspace/RLT_12/evidence -maxdepth 2
#   -> 只有 linux-dry-run/ 与 win-dry-run/；无 win-real-run/
grep -c watch relay_plan.md relay_log.jsonl       # 0 / 0
```

---

## 靶子一：逐字对齐 8 条验收口径

### 三条机器证（我自己取证，不采信既有结论）

| # | 验收 | 我的判词 | 依据 |
|---|---|---|---|
| 1 | `HC-RL-A32` 两个用户级目录五文件与仓内源逐字节一致 | **达成（时点成立）／现状已不成立** | 取证时点 HEAD `51d8062`：E-001 原文的 15 个哈希与我在两个副本侧重算的结果逐字相同，可交叉验证；当前 master `2a9c4f4`：5 文件中 4 个与仓内源不一致（上表）。见 P2-1 |
| 2 | `HC-RL-A30` 所有阶段关闭、节点 closed、launch 全有终态 | **达成** | 我本次 `status` 与 `status --json`：5 阶段 closed、6 节点 closed、`open_stages`/`errors`/`pending_nodes` 全空；账本 15 条 `agent_launch` 对 15 条 `done`，悬空 0、重复启动 0。与 design/01 `:1282` 原文逐项对上 |
| 3 | `HC-RL-A31` 真账本每行 schema 与全时序合法 | **达成** | `lint: ok` exit=0。注意：我是用**当前 master 的 `relay_log.py`**（含 RLT_21 之后新增的校验）重跑仍 ok，比原始取证更严 |

### 五条人判

**这是本次复核的核心问题，我不绕。**

先把三份约束原文摆出来：

- `brief.md:90` ②：「**5 条人判条目必须用户亲看证据后判断，AI 不得代勾**」——这是本卡自己写死的停止线。
- `review.md:136`：「结果列只能在你对话确认后由 AI 回填，**AI 不得预勾**」；`:137`：「只报 ✅ 或『我跑过了』**不算人验**」。
- `progress.md:65`：「E-002～E-008 是预留槽位，不是结论……**任何人不得据此宣称已达成**」。

再摆事实：

- 用户 2026-09-15 的原话是**「授权，你帮我代签」**（`review.md:141`、`:185`）。这是一句**授权代签**，不是对五条命题中任何一条的判断内容。
- `progress.md:18-22` 的 E-002～E-006 至今为「待实跑（预留槽位）」；`evidence/win-real-run/` 在磁盘上**不存在**（我 `find` 过，只有 `linux-dry-run/` 与 `win-dry-run/`）。
- H10 要求的「只给账本」独立展示，`review.md:82`、`:109`、`:181` 三处自认**未实际进行**。

| # | 验收 | 我的判词 | 依据 |
|---|---|---|---|
| 4 | `HC-RL-H1` 用户判断是否省事、值得继续 | **未达成** | 口径要求的交付物是「用户的判断内容」。记录中无任何用户对 H1 的表述；E-002 为空槽；材料（`relay_plan.md` 全文 + 用时表 + 操作次数 + 产出清单）从未装配成展示件 |
| 5 | `HC-RL-H13` 用户判断三层结构、换监工与编排瓶颈 | **未达成** | 同上；E-003 为空槽。pane 操作序列与终端空间建立/关闭记录从未落盘（`win-real-run/` 不存在），账本里只有 `herdr=` / `workspace=` / `pane=` 的片段 note，不构成 E-003 口径要求的「逐条命令 + 时间戳」 |
| 6 | `HC-RL-H5` 用户仅看 status 判断阶段/轮到谁/阻塞/静默 | **未达成** | E-004 口径要求「运行中一次 + 收口后一次」两次 status 全文。收口后那次现在仍可复跑（我跑过了），**运行中那次已永久不可取证**——账本不保存 status 快照。且无用户判断内容 |
| 7 | `HC-RL-H14` 用户判断 checker 纠偏效果、批内不换人、成本 | **未达成（客观事实侧成立）** | E-005 为空槽、无用户判断。客观侧我核过了：账本 seq 20 `check.C1.md FAIL p1=3` → seq 25/26/27 三条 `checkpoint`（`checker#1` 写、`routed_to=coder#1`）→ seq 28 `coder#1 done`「三条 C1 遗留已闭合；C2 P1 整改 commit=4105da8」→ seq 29 `check.C2.md PASS p1=0 p2=1`。C2 节点内 `coder` 只有 seq 23 一条 `agent_launch`，**批内确实没换人、attempt 未 +1**。缺的只是「用户看过并给出判断」这一步 |
| 8 | `HC-RL-H10` 另做「只给账本」展示，用户判断能否复原现场 | **未达成（口径要求的活动本身未发生）** | 这条最硬：H10 的验收动作是「**另做**一次只给账本的独立展示」。该展示未做（三处自认），因此用户的判断输入从未存在。这不是「不可判」，是「未达成」 |

**对「该卡被标为已验收是否与人判未取得矛盾」的明确结论**：

分两层看，结论不同，必须分开说。

1. **卡级状态标签这一层：不矛盾，且落记是诚实的。** 本卡落的是「**已验收（带风险放行）**」而不是「端到端验收通过」（`review.md:130`、`:189`）；`:127` 的「材料齐没齐」明写「**仍不齐**」并逐条点名了三路复核待填与 E-002～E-006 空槽；`:197` 的确认记录行把「五条人判未逐条判定」「H10 展示未进行」列为未清风险第①②项。用户 2026-09-15 以整体授权作出了放行决定，**这是用户的权力，我不推翻、也不要求重做**。

2. **人类签名区五个「结果」单元格这一层：矛盾，且构成 P1。** 五块的「结果」全部落为「**通过**（依 2026-09-15 用户整体授权代记）」。一句「授权，你帮我代签」可以支撑**卡级放行**，但**推导不出五条各自的「通过」**——H1 问的是「省事不省事、值不值得继续」，H14 问的是「成本能不能接受」，这些是主观判断内容，用户一个字也没给。把它记成「通过」，正是 `brief.md:90` ② 和 `review.md:136` 两条明令禁止的「代勾」。同一份文件里，`:105-109` 的元数据表已经如实写了「**未取得逐条人判结论**」——**同一文档对同一事实给出了两种不相容的记法**，这才是真正的矛盾点。

3. **H10 还多一层**：另外四条至少「材料原则上可补做展示」，H10 是「**展示这个动作本身没发生**」。对一条验收内容就是「另做一次展示」的条目，落「通过」没有任何可回溯的锚点。

---

## 靶子二：非目标四条是否被守住

| 非目标 | 判词 | 证据 |
|---|---|---|
| 不跑 Codex/Linux | **实质守住／字面越界** | 主控（`by=orchestrator`，16 条事件）全程是 Windows 上的 Claude Code 主会话（seq 1 `plan_loaded` note：`编排=Claude Code 主会话 wA:p1`），平台 Windows 11，无 Linux 参与。但 `plan-reviewer`/`checker`/`reviewer`/`decider` 六次以 codex 启动（seq 7/18/24/38/39/57/58，`launch=codex gpt-5.6-sol --sandbox workspace-write`）。Issue #23 正文写的是「不跑 Codex/Linux **主控**」，带限定词故不越界；DevPlan `:370` 与 brief `:28` 写的是「不跑 Codex/Linux」，**无限定词，字面读即越界**。见 P2-2 |
| 不含 watch | **守住** | `grep -c watch relay_plan.md relay_log.jsonl` → `0` / `0`。监工长等一律用 `get` + `read` 轮询（`findings.md` F-011 处置），未实现也未调用 watch |
| 不进入 E11/E12/E13 | **守住** | E11/E12/E13 = 用户确认 / verify 代签 / 销户（design/01 `:707`、`:770`、`:1345`）。计划节点表 6 个节点的 `type` 只有 `build`/`construction`/`review`/`rework`/`handoff`（`status --json` 逐节点核过），无 kickoff、无 verify 签字节点，符合 `HC-RL-A127`。verify 提交 `dd3ac3c` 与人类签名都发生在主会话、在接力之外，正是设计要求的去处 |
| 不把单测代替真实 Herdr 操作 | **守住** | 计划全部 15 个 agent 实例都是真实 Herdr pane 里的外部 agent（`launch=devin swe-2-max/medium`、`launch=codex gpt-5.6-sol`），带 workspace/pane 落点（`herdr=monitor-w1 workspace=wG pane=wG:p1` 等）。`findings.md` F-010/F-011 记的审批菜单编号漂移与 `Os code 5 PermissionDenied` 都是只有真跑才会撞上的现象，反证非模拟。RLT_21 的 181 条单测属**业务卡**交付物，不是 RLT_12 用来替代 Herdr 操作的证据 |

---

## 靶子三：已知缺口接受记录是否可追溯

**判词：可追溯，措辞与 Issue #23 正文一致，未发现把 AI 转述冒充用户原话。但一次性授权的原始锚点只到 AI 转述为止。**

三处措辞比对：

| 来源 | 原文要点 |
|---|---|
| Issue #23「档位 / 风险」段 | 「已知缺口（用户 2026-09-14 明确接受，先于 RLT_21 开工）：A112 下监工无合法 `blocked` 终态 agent、环境性 NOT_RUN 只能走 `blocked → agent_lost` 重拉（无 escalate 出口）；`launch_fix=` 仅作 note 文本；证据按两次预演口径记入 `workspace/RLT_12/`」 |
| `brief.md:72-76` | 三条同序、同内容，各补了机制细节（A112 拒写伪终态、协议无「环境性 NOT_RUN 交编排」出口、`launch_fix=` 不是账本字段/不触发 `plan_amend`/不被 lint 校验），并指名根治归 `HC-RL-A137/A138/A139` |
| `progress.md:30`（D-001 详录第 3 项） | 与 brief 同，并回引 DevPlan §3.1 RLT_12 备注的要求原文「同次确认须写明接受 A112/NOT_RUN 已知缺口并冻结证据口径」 |

三处**无实质冲突**，brief/progress 相对 Issue 只做机制展开，没有偷偷放宽或增删缺口条目。DevPlan `:559` 对「RLT_12 先于 RLT_21 开工须在同一确认中写明」的要求也确实被满足了。

**但要说清一件事，避免以后被误读**：这条授权的**原始锚点是一次对话，不可回放**。Issue #23 虽是独立可读的落盘件，但它是按同一次对话由 AI 起草、走用户账号发布的，**不是用户的独立第二信源**。`review.md:141` 对 2026-09-15 那次授权引了逐字原话「授权，你帮我代签」，而 2026-09-14 这次**全程是四条摘要，没有一句用户原话**。三份文件都老实写了「用户 2026-09-14 对话明确接受」而没有伪造引号内的用户发言，**这一点是干净的**——没有把 AI 转述包装成原话。风险仅在于：若日后对「用户到底接受了哪几条」起争议，能回溯到的最强证据是 AI 写的摘要。此项我不计缺陷，只作提示。

---

## 靶子四：目标与范围是否漂移

### W→C→R→**X**→F 算不算漂移

**判词：不算漂移，X 是合法的条件性阶段，且事前登记、事后可核。**

四条依据：

1. **X 在冻结设计里本就是五阶段之一**，不是临场发明：design/01 `:386` 节点 `type` 枚举含 `rework`；`:443` `HC-RL-A97` 管「`X#k` 的 `k` 超过 `limits.rework_max_rounds`」；`:787` 注释「`rework_max_rounds = 2  # X 阶段轮数上限`」；`:1192` `HC-RL-A129` 的 lint 枚举是 `W/C/R/X/F`。所以「W→C→R→F」是**无返工时的顺路**，不是封闭枚举。
2. **事前登记**：`relay_plan.md:22-29`（计划头部「现场约定」第 6 条，规划期冻结）预先写死了「X 阶段不在本表预留节点行，由当班监工在 R1 打回后按 `HC-RL-A121` 现场追加」，连追加模板、不预留的理由（预留 X1 会因 A109 逼出 `F1 depends_on X1`，而 `node_start` 要求 depends_on 全 closed，无返工时反把 F1 永久卡死）和轮数上限都写了。这是**规划期就预判到的条件分支**，不是跑偏。
3. **实际只跑了 1 轮**，`X#1`，未触 `rework_max_rounds=2`。触发理由在账本 seq 52（`stage_start`：「第 1 轮返工，承接 R1 五条 P1」）与节点表 `relay_plan.md:48`（列明 5 条 P1 与基线 `commit fc70185`）。
4. **DevPlan 侧已同步**：批次表 `:559` 现写「Windows Claude 主控跑完第一份 W→C→R→F 真计划；……**C/X 的节点内返工路径（复核打回后同实例整改至 PASS 再依次封口）可演示**」——X 已被列为第 1 批的可演示项。

**但登记留了一个洞**（P2-4）：账本里**没有任何记录计划文件被改动的事件**（71 行的事件类型只有 `plan_loaded`/`stage_start`/`stage_result`/`stage_close`/`node_start`/`node_close`/`monitor_launch`/`agent_launch`/`checkpoint`/`done` 十种，无 `plan_amend` 一类），`relay_plan.md` 在 git 里只有 `7981556` 一次 squash 提交。于是归档下来的计划文件**自己和自己打架**：`:22` 白纸黑字写「X 阶段不在本表预留节点行」，而 `:48` 的节点表里明明躺着 X1 行。事后读这份件的人无法独立判断 X1 是「规划时就写进去的」还是「R1 打回后现场追加的」。`HC-RL-A121` 的 owner 是 RLT_09、oracle 是单测，不是 RLT_12 的验收条，所以这不构成验收未达成，但它是可追溯性缺口。

### 「checker 至少一次纠偏」是否真的展示到了

**判词：客观事实层面展示到了，账本可独立复原；「向用户展示并由用户判断」这一步（H14）没做。**

我从账本独立复原出的完整纠偏链（无需任何计划外说明）：

| seq | 节点 | 事件 | agent | note 要点 |
|---|---|---|---|---|
| 20 | C1 | `done` | `checker#1` | `check.C1.md FAIL p1=3 p2=0`；A137 ref 及 A118 码偏离，原始 RED 不可证 |
| 21 | C1 | `node_close` | `monitor#2` | 节点内无合法返工路径（A49/A60），三条 P1 由编排裁决带入 C2 返工 |
| 23 | C2 | `agent_launch` | `coder#1` | `launch=devin swe-2-max`，复用 wH:p2 进程 |
| 25 | C2 | `checkpoint` | `checker#1` | `routed_to=coder#1` P1-1 删除 C2 生成的 `.devin/config.local.json` 及空目录，四集合复核 |
| 26 | C2 | `checkpoint` | `checker#1` | `routed_to=coder#1` P1-2 补 C2 RED 原始或如实不可证与重建 RED 非冒充证据 |
| 27 | C2 | `checkpoint` | `checker#1` | `routed_to=coder#1` P1-3 A143 同根去重与写入者边界合同冲突，按 checker 可执行动作整改或报技术卡点 |
| 28 | C2 | `done` | `coder#1` | 三条 C1 遗留已闭合；C2 P1 整改 `commit=4105da8`；181 tests OK skipped=0 |
| 29 | C2 | `done` | `checker#1` | `check.C2.md PASS p1=0 p2=1` |

「至少一次」有余量：全程 8 条 `checkpoint`。「批内不换人」也成立：C2 节点内 `coder` 仅 seq 23 一条 `agent_launch`，三次打回后仍是同一实例收尾，attempt 未 +1。

需要如实记一笔的差别：**C1 的那次打回并没有在批内闭合**——受 F-008 三规则互锁（A70/A60/A49）所迫，C1 只能 `node_close` 后把三条 P1 整建制转入 C2。真正演示「打回 → 同实例改 → PASS」的是 **C2 节点内**那一轮。DevPlan `:559` 现在的措辞「C/X 的节点内返工路径……可演示」对得上 C2，对不上 C1。

### 范围（allowed-paths）有没有越界

**判词：没有越界。** 合入 master 的 `7981556` 与 `124a5c9` 是两张卡分别的 squash，RLT_12 侧改动落在 `docs/modules/relay-light/relay/**` 与 `docs/modules/relay-light/workspace/RLT_12/**`，加上两个用户级 skill 目录（不进 git），全在 `brief.md:40-43` 的四条闭集内。DevPlan 的 §3.1 RLT_12 行与头部 `dh:status` 两处户口回填属 `brief.md:88` 明确许可的例外。

---

## P1

### P1-1　人类签名区把用户没给过的逐条结论记成「通过」，H10 更是对未发生的展示落「通过」

**事实**：`review.md` 人类签名区五块的「结果」列分别落「通过（依 2026-09-15 用户整体授权代记）」（`:149`、`:157`、`:165`、`:173`、`:181`）。用户原话只有「授权，你帮我代签」（`:141`、`:185`），未对 H1/H13/H5/H14/H10 中任何一条给出判断内容。H10 的「只给账本」独立展示未实际进行。

**证据**：
- `docs/modules/relay-light/workspace/RLT_12/brief.md:90` ②：「5 条人判条目必须用户亲看证据后判断，**AI 不得代勾**」。
- `review.md:136`：「结果列只能在你对话确认后由 AI 回填，**AI 不得预勾**」；`:137`：「只报 ✅ 或『我跑过了』不算人验」。
- 同一文件 `:105-109` 元数据表「实际执行结果」列已写「**未取得逐条人判结论**」，`:109` 更写「**该独立展示未实际进行**」——与签名区的「通过」自相矛盾。
- `progress.md:18-22` E-002～E-006 全为「待实跑（预留槽位）」；`progress.md:65` 明令「任何人不得据此宣称已达成」。
- `find .../workspace/RLT_12/evidence -maxdepth 2` → 只有 `linux-dry-run/`、`win-dry-run/`，**无 `win-real-run/`**。

**为什么是 P1**：这不是措辞瑕疵，是把「用户的判断」这一交付物**凭空补齐**。下游 RLT_13/14/15/16/19 全部以 RLT_12 为依赖，DevPlan `:561` 第 3 批的开工条件直接写着「**RLT_12 的 H1、H13 已由用户判为值得继续**」——若按现状读，这个前置条件会被误认为已满足。

**可执行整改（二选一，须由用户定，我不代选）**：
- **出口 A（改记法，不改用户决定）**：把五块「结果」列改为「**未判定 · 用户 2026-09-15 整体授权放行（原话「授权，你帮我代签」）**」，与 `:105-109` 元数据表口径统一；卡级结论「已验收（带风险放行）」保持不动。同时把 DevPlan `:561` 第 3 批开工条件里的「H1、H13 已由用户判为值得继续」改为「H1/H13 未逐条判定，第 3 批开工须另取用户确认」。
- **出口 B（补做人判）**：按 E-002～E-006 口径装配材料（H10 须另做一次真的只给账本的展示），请用户逐条给判断后回填；此时五块「结果」才可落用户的实际结论。

### P1-2　`review.md` 的「完成条件逐条挂证据」表 8 行全空，卡却已标「已验收」

**事实**：`review.md:87-96` 的表，8 行的「证据 (E-00x)」与「达成?」两列**全部为空**，收口时从未回填。而 `:130` 已落「当前状态：**已验收（带风险放行）**」。

**证据**：`review.md:89-96` 逐行原样（末两列为空）；对照 `:85` 的填表要求「建工作区期从 `brief.md` 逐条预填 # / 完成条件 / 谁验；**收口时补 Evidence ID 和达成结论**」。

**为什么是 P1**：这是本卡唯一一张把「八条验收」和「证据」对起来的表。它空着，就等于没有任何一处地方回答过「第 2 条达成了吗」。讽刺的是 A32/A30/A31 三条**本来就有证据**（E-001、verify `dd3ac3c`、以及我本次的可复跑输出），是纯粹的漏填。

**可执行整改**：回填 8 行——
- 第 1 行（A32）：证据 `E-001`；达成?「达成（取证时点 HEAD `51d8062`）；**当前 master 已不成立，见 P2-1**」。
- 第 2 行（A30）：证据 `E-007`；达成?「达成」（附本报告「我实际跑过的命令」第 3、4 节的可复跑输出）。
- 第 3 行（A31）：证据 `E-007`；达成?「达成」（`lint: ok` exit=0）。
- 第 4～8 行（H1/H13/H5/H14/H10）：证据「E-002～E-006 空槽」；达成?「**未达成**」（H10 另注「展示未进行」），并回指 P1-1 的出口选择。

### P1-3　本卡自身的 normal 三路复核在标「已验收」时一路未执行，且 verify 提交正文含不成立的陈述

**事实**：
- `review.md:33-35` 三路（code-round1 / requirement / lesson）的 reviewer 列全为「待派」、状态列全为「待执行」；`:43-45` 独立复核区三行全为「待填」；`:47-49` 两条复核结论全为「待填」。`:127` 自认「**仍不齐**」。卡仍于 `:130` 落「已验收」并合入 master。
- verify 提交 `dd3ac3c` 正文写「**人判材料（H1/H13/H5/H14/H10）已备齐，见 workspace/RLT_12/progress.md 证据账与本次取证**」。`progress.md` 的证据账在该提交时点与现在都是 E-002～E-006 空槽，`win-real-run/` 不存在，H10 材料从未制作——**该句不成立**。同一提交末尾又写「人类验收未签，五条人判待用户判断」，前后自相矛盾。

**证据**：`git show --stat dd3ac3c` 全文（见上「我实际跑过的命令」第 6 节）；`review.md:33-35`、`:43-49`、`:127`、`:130`；`AGENTS.md:36` 宪章#5「`normal` 为代码轮 1、需求方向、教训三路……**施工者不复核自己的卡**」。

**为什么是 P1**：验收在复核之前完成，顺序倒了；且 verify 提交是本卡「机器闸」的档案件，正文里的不成立陈述会污染后续所有引用它的地方。

**可执行整改**：
- 本次三路补做完成后，回填 `review.md:33-35` 与 `:43-49`（本 requirement 路的结论即本文件）。
- 在 `progress.md` 日志追加一行，如实记「verify `dd3ac3c` 正文『人判材料已备齐』一句与证据账实况不符，人判材料实际未备齐」——**不要改写已合入的提交**，用后续记录更正。
- 在 `review.md:127`「材料齐没齐」处补注三路补做的时间与结论。

---

## P2

### P2-1　A32 在当前 master 已不成立，且无显式向下游移交的登记

**事实**：当前 master `2a9c4f4` 下，`tools/relay-light/skill/` 与两个用户级副本在 5 个文件中有 4 个不一致（`SKILL.md`、两个 adapter、`dh-mapping.toml`；仅 `roles.toml` 相同）。成因是 RLT_21（`124a5c9`）与 RLT-A-09/A-10（`a6689f1`/`2a9c4f4`）在 RLT_12 之后改了仓内源，而重同步按 DevPlan `:407`/`:429` 须另取用户当次明确授权，至今未执行。

**证据**：本报告「我实际跑过的命令」第 1 节的哈希表（三处逐文件对比，原始输出）。相关约束见 `findings.md` F-004 处置末句「不得中途重跑 `install_skill.py --all` ……那会打破 E-001 的 A32 哈希基线」。

**定级理由（P2 不是 P1）**：RLT_12 的 A32 是**时点准入证据**，在其取证时点成立且我已交叉验证；当前的不一致是后续卡的正常演进 + 授权闸未开，不是 RLT_12 的施工缺陷。但 RLT_12 的任何记录里都没有一句「本卡合并后 A32 基线即失效，下一张实跑卡开工前须重跑 `--all`」。

**可执行整改**：在 `findings.md` 新增一条（或扩写 F-004）明确移交：「A32 基线绑定 HEAD `51d8062`；`tools/relay-light/skill/**` 此后已由 `124a5c9`/`a6689f1`/`2a9c4f4` 变更，两侧副本现为陈旧。RLT_13/RLT_17 等下一张实跑卡**开工首步必须先取用户授权并重跑 `python tools/relay-light/install_skill.py --all`**，否则 A32 不成立、且实跑会用到陈旧 skill 文本。」

### P2-2　非目标「不跑 Codex/Linux」缺「主控」限定词，字面读即越界

**事实**：DevPlan `:370` 与 `brief.md:28` 的非目标原文是「不跑 Codex/Linux」，无限定词。实跑中 codex 作为 worker 被启动 6 次（账本 seq 7 `plan-reviewer`、seq 18/24 `checker`、seq 38/57 `requirement`、seq 39/58 `lesson`，均 `launch=codex gpt-5.6-sol --sandbox workspace-write`）。Issue #23 的对应行写的是「不跑 Codex/Linux **主控**」，有限定词。

**证据**：`docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md:370`；`brief.md:28`；`gh issue view 23`「范围」段「**非目标**：不跑 Codex/Linux **主控**；不含 watch；……」；账本上述 seq 行的 `note` 原文。

**判词**：按 Issue #23 的口径（也是唯一说得通的口径——RLT_13 才是「Codex 主控」卡）**没有越界**；但权威文档 DevPlan 与其只读副本 brief 的措辞会把「codex 当 worker」误判成违反非目标。

**可执行整改**：DevPlan `:370` 与 `brief.md:28` 的非目标第一条改为「不跑 Codex/Linux **主控**（codex 作为计划内 worker 不受此限）」，`progress.md` 记一笔口径澄清。这是**口径对齐**不是范围变更，不改任何验收 ID。

### P2-3　`brief.md` 自称「逐字复制」，第 8 条引号字符与 DevPlan 不一致

**事实**：`brief.md:51` 标题写「完成条件 ★必写（**逐字复制** DevPlan §RLT_12「验收口径」8 条）」。逐字符比对结果：第 1～7 条完全相同，**第 8 条不同**——DevPlan `:376` 用全角弯引号（U+201C/U+201D），`brief.md:62` 用 ASCII 直引号（U+0022），首个差异在第 36 字符。

**证据**：本报告「我实际跑过的命令」第 5 节的比对脚本原始输出。

**定级理由**：纯排版字符，零语义影响，故 P2 而非 P1。但本卡的 R14 警告（`findings.md` F-006 ②）已说明 `dh-check` 解析不到 relay-light 的卡头、brief 漂移只能靠人工逐字核对——既然自称逐字复制，就应当真的逐字。

**可执行整改**：把 `brief.md:62` 的两个 ASCII 直引号改成 U+201C/U+201D，与 DevPlan `:376` 完全一致。

### P2-4　X 阶段现场追加缺独立时间戳证据，归档的 `relay_plan.md` 自相矛盾

**事实**：`relay_plan.md:22` 写「X 阶段**不在本表预留节点行**」，而同文件 `:48` 的节点表里有 X1 行。账本 71 行中没有任何记录计划文件被修改的事件（事件类型只有 `plan_loaded`/`stage_start`/`stage_result`/`stage_close`/`node_start`/`node_close`/`monitor_launch`/`agent_launch`/`checkpoint`/`done`）；`git log -- relay_plan.md` 只有 `7981556` 一次 squash 提交。

**证据**：`docs/modules/relay-light/relay/rlt12-win-01/relay_plan.md:22`、`:48`、`:68-71`；账本事件类型统计（本报告第 4 节）；`git log --oneline -- docs/modules/relay-light/relay/rlt12-win-01/relay_plan.md` → 单行 `7981556`。

**判词**：不影响 A30/A31 判定（我已重跑通过），也不影响「X 不算漂移」的结论（事前在 `:22-29` 冻结了追加规则、DevPlan `:559` 已同步）。缺的是**事后独立可核**：读归档件的人无法自证 X1 是运行中追加的。

**可执行整改**：在 `relay_plan.md:22` 的现场约定第 6 条末尾补一句「**（2026-09-15 R1 打回后已按本条现场追加，见节点表 X1 行与账本 seq 52）**」，把矛盾消掉并留下回指。更彻底的做法（登记 `plan_amend` 类事件）属协议层改动，**不归本卡**，建议并入 RLT_22 或其后续卡评估。

---

## 八条验收逐条判词汇总

| # | 验收 ID | 判词 | 一句话依据 |
|---|---|---|---|
| 1 | `HC-RL-A32` | **达成（时点）／现状已不成立** | E-001 的 15 个哈希与我在副本侧重算逐字相同；当前 master 4/5 文件与仓内源不一致（P2-1） |
| 2 | `HC-RL-A30` | **达成** | 我重跑 `status --json`：5 阶段 closed、6 节点 closed、15 launch 对 15 终态、悬空 0 |
| 3 | `HC-RL-A31` | **达成** | 我重跑 `lint` → `lint: ok` exit=0（用的是比原始更严的当前程序） |
| 4 | `HC-RL-H1` | **未达成** | 无用户判断内容；E-002 空槽 |
| 5 | `HC-RL-H13` | **未达成** | 无用户判断内容；E-003 空槽；`win-real-run/` 不存在 |
| 6 | `HC-RL-H5` | **未达成** | 无用户判断内容；E-004 空槽；「运行中那次 status」已永久不可取证 |
| 7 | `HC-RL-H14` | **未达成（客观事实侧成立）** | 无用户判断内容；但 seq 20→25/26/27→28→29 的纠偏链与「批内不换人」我已独立核实 |
| 8 | `HC-RL-H10` | **未达成（活动本身未发生）** | 「只给账本」独立展示未做，判断输入从未存在 |

机器证 3/3 达成，人判 0/5 达成。

---

## 停止线

1. **我不替用户作任何人判**。H1/H13/H5/H14/H10 的判断内容只能由用户给出；本报告只判「记录是否成立」，不判「省事不省事」「值不值得继续」「成本可不可接受」。
2. **我不勾、不改人类签名区**，也不改 `review.md` 任何一行——P1-1 给的两个出口须由用户二选一，不是我选。
3. **我不推翻用户 2026-09-15 的整体授权放行决定**。本卡卡级状态「已验收（带风险放行）」不在我的整改建议范围内；我的全部整改动作只落在「记录与口径」层。
4. **我不重跑真计划、不改账本、不改程序**。本次只做只读取证。
5. **P1-1 的出口 A 涉及改 DevPlan `:561` 第 3 批开工条件**，属跨卡口径变更，须经用户确认后另行立项，不在本复核里动手。
6. **P2-4 的彻底修法（`plan_amend` 类事件登记）属协议层改动**，不归 RLT_12，建议交 RLT_22 或其后续卡评估，我不在此裁决。
7. 本次复核只写本文件；未新建、未修改、未删除任何其它文件，未执行任何 git 写操作。
