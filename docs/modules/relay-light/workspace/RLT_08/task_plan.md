<!-- dh:v1 · task_plan.md -->
# task_plan — RLT_08 AGENTS 判定、协议索引与模块身份

## 要读的上下文 (Context Packet) ★前置

> **执行契约头（zero-context）**：你是 RLT_08 手动派活的 construction worker，只处理本次派单指定的一个 Batch。进入 `/home/nash/work/dh-relay/.dh-worktrees/RLT_08` 后第一个 Git 动作是 `git rebase --autostash master`；先读仓根 `AGENTS.md`、本文件、`brief.md`、`progress.md`、`findings.md` 与派单指定的 oracle。只在本批范围修改 `AGENTS.md` 和 RLT_08 workspace；路线偏离只记 progress/findings，不改本计划、DevPlan 或 design，不自行复核、verify、push、PR、merge 或部署。

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | `AGENTS.md` | 当前单模块陈述、Runner 铁律、阅读矩阵与 worker 边界 |
| C-002 | DevPlan §2.1/2.2、§RLT_08、§3.1 | owner、非目标、四条验收、allowed-paths、normal Recipe 与交付物矩阵 |
| C-003 | design/01 §0.3 | relay-light slug/文档/代码/verify scope 与双模块身份 |
| C-004 | design/01 §1.3 第 2/3/7 条、§7.1 | 计划落点、三层分工与 B-adjust 窄例外 |
| C-005 | design/01 §11 的 HC-RL-A28/A29/A33/A34 | 逐字 oracle 与证法 |
| C-006 | `tools/relay-light/skill/SKILL.md` | relay-light 现役三层运作、账本与硬规则，本卡只读 |
| C-007 | `tools/relay-light/skill/references/adapter-*.md` | A34 现役派活 prompt 标头样板，本卡不修改 |

## 全程允许路径闭集与禁改项

只允许修改 `AGENTS.md` 和 `docs/modules/relay-light/workspace/RLT_08/**`。禁改 DevPlan、design、dev-harness、`tools/relay-light/skill/**`、用户级 skill 副本、Runner/host/contracts 与其他卡。若 oracle 需要越界才能满足，写 findings 与 `DONE ... status=BLOCKED` 后停止。

## 批次与 durable signal

B1 → audit PASS → B2 → audit PASS → B3 → audit PASS → orchestrator 再派收束信号，严格串行。每批由新派单开放，worker 在 `progress.md` 追加日志与一行信号后立即停止：

```text
DONE task=RLT_08 role=exec batch=<1|2|3> status=<READY_FOR_REVIEW|BLOCKED> evidence=<E-ID,...> next=orchestrator
```

B1/B2/B3 正常均先用 `READY_FOR_REVIEW`。B3 audit PASS 后，orchestrator 必须再次明确派令，exec 才单独追加 `DONE task=RLT_08 role=exec batch=3 status=CONSTRUCTION_DONE evidence=<B3-audit-PASS-E-ID> next=orchestrator`并停止。任一批不得越过 audit 小审自行续批，B3 worker 也不得在同一次派单中预写 `CONSTRUCTION_DONE`。

## 施工共通约束

- 每批先保存未改 `AGENTS.md` 的结构命令输出作为行为红，再最小修订并复跑成绿；命令本身失败、路径错误或环境错误不算 RED。
- 所有文本用 `rg -F` 锁定 oracle 原文；结构检查同时限定所在小节，避免全文假阳性。
- 每批运行 `git diff --check`、`git diff --name-only` 和针对命令；证据原样摘要写入 progress，不放凭据值。
- 施工者只改 AGENTS 和 progress/findings/lesson，不改 `review.md` 结论；audit 只读 diff 并写独立小审证据，不修文本。
- 允许路径总检必须分别覆盖 `master...HEAD` 已提交历史、working tree、index 和 untracked 四个集合；任一集合出现 `AGENTS.md` / RLT_08 workspace 之外的路径即失败。

## 施工步骤 (Steps)

### Batch 1 — 双模块身份与 `dh` 入口（HC-RL-A29）

**动笔前 dev-harness 基线（HC-RL-A33）**

在修改 `AGENTS.md` 前执行下列命令，把外部仓的 HEAD、tracked diff 和 untracked 路径集合分别冻结为无凭据内容的摘要文件。`tracked.sha256` 对 `git diff --binary HEAD` 取哈希，同时覆盖 staged + unstaged tracked 改动；`untracked-paths.sha256` 只对 NUL 分隔的路径列表取哈希，不把外部内容或路径写入业务仓。

```bash
set -euo pipefail
dh_base=/home/nash/work/dev-harness
baseline_dir=docs/modules/relay-light/workspace/RLT_08/evidence/dev-harness-baseline
mkdir -p "$baseline_dir"
git -C "$dh_base" rev-parse HEAD > "$baseline_dir/head.txt"
git -C "$dh_base" diff --binary HEAD | sha256sum | cut -d' ' -f1 > "$baseline_dir/tracked.sha256"
git -C "$dh_base" ls-files --others --exclude-standard -z | sha256sum | cut -d' ' -f1 > "$baseline_dir/untracked-paths.sha256"
test "$(wc -l < "$baseline_dir/head.txt")" -eq 1
test "$(wc -l < "$baseline_dir/tracked.sha256")" -eq 1
test "$(wc -l < "$baseline_dir/untracked-paths.sha256")" -eq 1
```

三个基线文件随 B1 提交，并在 progress 以 E-ID 登记；任一命令失败即 `BLOCKED`，不开始改 AGENTS。

**改动位置**

1. `AGENTS.md` “项目概况”：把“独立仓里只有这一个模块”修成两个现役模块。
2. `AGENTS.md` “dev-harness 落点 / slug”：保留 dh-relay 行，新增 relay-light 行，明记 slug、文档根、代码根和英文 verify scope。
3. `AGENTS.md` “`dh` 命令”：新增 `dh relay-light`；把“不给参数自动选中”改为双模块时须显式指定。

**样板文本（按现有语气嵌入）**

```markdown
- dev-harness 模块：slug=`dh-relay`，模块根 `docs/modules/dh-relay/`。
- relay-light 模块：slug=`relay-light`，文档根 `docs/modules/relay-light/`，代码根 `tools/relay-light/`，verify scope = `relay-light`。

- `dh dh-relay` — 按 dh-relay slug 解析
- `dh relay-light` — 按 relay-light slug 解析
- `dh` — 不给参数时，本仓有多个模块，须显式指定
```

**红 → 绿命令**

```bash
rg -n '本仓只有一个模块|只有这一个模块|本仓只有一个模块，自动选中' AGENTS.md
rg -n -F 'slug=`relay-light`' AGENTS.md
rg -n -F 'docs/modules/relay-light/' AGENTS.md
rg -n -F 'tools/relay-light/' AGENTS.md
rg -n -F 'verify scope = `relay-light`' AGENTS.md
rg -n -F '`dh relay-light`' AGENTS.md
```

RED：旧单模块句命中，relay-light 身份五项至少一项不命中。GREEN：旧句零命中，五项全命中，`git diff --check` 为 0。

**audit 小审输入**：B1 增量 diff；三处插入位置；旧句零命中和五项新身份命中输出；`git diff --check`；name-only 边界。

### Batch 2 — relay-light 编排协议与冻结分流（HC-RL-A28 / A34）

**改动位置**

1. 在现有“编排协议段（worker 铁律）”前插入并列的 `## relay-light 编排协议段`，不把 relay-light 条款混进 Runner 通用铁律。
2. relay-light 段首条用 oracle 原文判定句，并写明标头的四个字段样式。
3. relay-light 段明记三层边界：编排管阶段、监工管节点、worker 只完成本节点；worker 完成信号即停，无 `node_closed`。
4. 在现役 Runner “通用铁律”的 Ticket 分流/硬节点条款加窄句：有 `RELAY_RECEIPT` 即冻结 Runner 流水，不交叉执行 relay-light。不删原条款。
5. 同段原文写出“有意绕过 B-adjust”和“设计与验收仍走 dev-harness”，把例外限制在 relay-light 运行中白名单的任务卡/开发方案任务行/接力计划追加。

**样板文本**

```markdown
## relay-light 编排协议段

- 判定：监工派活 prompt 首行必须是 `[relay-light] worker · node=<n> · agent=<角色>#<实例> · workspace=<任务工作区>`。见此标头即完成即停不等 node_closed，有 RELAY_RECEIPT 即冻结 Runner 流水。
- 分工：编排管阶段，监工管本阶段节点，worker 只完成当前节点并写完成信号后停止。
- 计划例外：relay-light 运行中的白名单追加有意绕过 B-adjust；例外只覆盖任务卡、开发方案任务行与接力计划，设计与验收仍走 dev-harness。
```

**红 → 绿命令**

```bash
rg -n -F '## relay-light 编排协议段' AGENTS.md
rg -n -F '见此标头即完成即停不等 node_closed，有 RELAY_RECEIPT 即冻结 Runner 流水' AGENTS.md
rg -n -F '有意绕过 B-adjust' AGENTS.md
rg -n -F '设计与验收仍走 dev-harness' AGENTS.md
for f in tools/relay-light/skill/references/adapter-*.md; do sed -n '/^```text$/,/^```$/p' "$f" | sed -n '2p'; done
git diff --unified=20 -- AGENTS.md
```

RED：协议段/判定句/两句例外文字缺失。GREEN：四项全命中，adapter 两个首行与 AGENTS 样式同构，diff 显示 Runner 原铁律保留且冻结分流仅为增量。

**audit 小审输入**：B2 增量 diff；四条 grep 输出；两 adapter 标头首行；Runner 原铁律保留的上下文 diff；B-adjust 白名单与 design/验收禁区。

### Batch 3 — 阅读矩阵索引与整卡机检（HC-RL-A33 + 四条收束）

**改动位置**

1. `AGENTS.md` “任务类型阅读矩阵”增加一行，将 relay-light 规划/编排/账本/三层执行定位到仓内 `tools/relay-light/skill/SKILL.md` 及按主控侧选用的 adapter。
2. 运行本批索引红绿检查，再运行下方整卡机检脚本。
3. 执行 `dh relay-light`，单独记录首行模块解析证据。存量 `dh-check` 失败不冒充解析失败，也不由本卡越界修复。
4. 重算 `/home/nash/work/dev-harness` 的 HEAD / tracked diff / untracked 路径三项摘要，与 B1 提交的 baseline 逐项 `cmp`。三项完全一致才证明本卡没有给 dev-harness 增加改动；不要求外部仓原本 clean，也不清理用户改动。

**样板文本**

```markdown
| relay-light 规划 / 编排 / 账本 / 三层执行 | [tools/relay-light/skill/SKILL.md](tools/relay-light/skill/SKILL.md) + 按主控侧选 `references/adapter-claude-code.md` / `adapter-codex.md` |
```

**红 → 绿命令**

```bash
matrix="$({ awk '/^## 任务类型阅读矩阵/{inside=1; next} /^## / && inside{exit} inside{print}' AGENTS.md; })"
index_count="$(printf '%s\n' "$matrix" | rg -F -c 'tools/relay-light/skill/SKILL.md' || true)"
test "$index_count" -eq 1
printf '%s\n' "$matrix" | rg -n -F 'tools/relay-light/skill/SKILL.md'
```

RED：阅读矩阵边界内命中数不等于 1（缺失、重复或放错小节均红）。GREEN：矩阵中精确一行命中，链接指向仓内唯一源。

**整卡机检脚本**

```bash
set -euo pipefail
matrix="$({ awk '/^## 任务类型阅读矩阵/{inside=1; next} /^## / && inside{exit} inside{print}' AGENTS.md; })"
index_count="$(printf '%s\n' "$matrix" | rg -F -c 'tools/relay-light/skill/SKILL.md' || true)"
test "$index_count" -eq 1
printf '%s\n' "$matrix" | rg -n -F 'tools/relay-light/skill/SKILL.md'
rg -n -F '## relay-light 编排协议段' AGENTS.md
rg -n -F '见此标头即完成即停不等 node_closed，有 RELAY_RECEIPT 即冻结 Runner 流水' AGENTS.md
rg -n -F '有意绕过 B-adjust' AGENTS.md
rg -n -F '设计与验收仍走 dev-harness' AGENTS.md
rg -n -F 'slug=`relay-light`' AGENTS.md
rg -n -F 'docs/modules/relay-light/' AGENTS.md
rg -n -F 'tools/relay-light/' AGENTS.md
rg -n -F 'verify scope = `relay-light`' AGENTS.md
if rg -n '本仓只有一个模块|只有这一个模块|本仓只有一个模块，自动选中' AGENTS.md; then exit 1; fi
expected='[relay-light] worker · node=<n> · agent=<角色>#<实例> · workspace=<任务工作区>'
adapter_count=0
for f in tools/relay-light/skill/references/adapter-*.md; do
  actual="$(sed -n '/^```text$/,/^```$/p' "$f" | sed -n '2p')"
  test "$actual" = "$expected"
  adapter_count=$((adapter_count + 1))
done
test "$adapter_count" -eq 2
dh relay-light > /tmp/rlt08-dh-relay-light.txt 2>&1 || true
rg -n -F '=== dh-check: relay-light ===' /tmp/rlt08-dh-relay-light.txt

dh_base=/home/nash/work/dev-harness
baseline_dir=docs/modules/relay-light/workspace/RLT_08/evidence/dev-harness-baseline
current_dir="$(mktemp -d)"
scope_dir="$(mktemp -d)"
trap 'rm -rf "$current_dir" "$scope_dir"' EXIT
git -C "$dh_base" rev-parse HEAD > "$current_dir/head.txt"
git -C "$dh_base" diff --binary HEAD | sha256sum | cut -d' ' -f1 > "$current_dir/tracked.sha256"
git -C "$dh_base" ls-files --others --exclude-standard -z | sha256sum | cut -d' ' -f1 > "$current_dir/untracked-paths.sha256"
cmp "$baseline_dir/head.txt" "$current_dir/head.txt"
cmp "$baseline_dir/tracked.sha256" "$current_dir/tracked.sha256"
cmp "$baseline_dir/untracked-paths.sha256" "$current_dir/untracked-paths.sha256"

git diff --check
scope_re='^(AGENTS\.md$|docs/modules/relay-light/workspace/RLT_08/)'
git diff --name-only master...HEAD > "$scope_dir/committed.txt"
git diff --name-only > "$scope_dir/working-tree.txt"
git diff --cached --name-only > "$scope_dir/index.txt"
git ls-files --others --exclude-standard > "$scope_dir/untracked.txt"
for list in "$scope_dir"/*.txt; do
  if rg -n -v "$scope_re" "$list"; then
    printf 'out-of-scope path set: %s\n' "$list" >&2
    exit 1
  fi
done
```

GREEN 判据：所有正向结构命中，单模块旧句零命中，两 adapter 首行形状通过，`dh relay-light` 模块标头命中，dev-harness 无本卡新改动，diff 无空白错且路径闭集。

**audit 小审输入**：B3 增量与整卡 diff；阅读矩阵行；整卡脚本完整输出/退出码；`dh relay-light` 模块标头与存量失败分界；dev-harness 前后状态；name-only 边界。

## 最终施工交接清单（不等于复核或验收）

1. `progress.md` 有 B1–B3 行为 RED、GREEN、diff 边界、audit 结论与 E-ID。
2. `findings.md` 仅登记真实冲突/存量缺口；`lesson_candidates.md` 仅登记可复用候选，不预判结论。
3. 整卡机检证据与 `git diff --check` 成功，name-only 仅 `AGENTS.md` + RLT_08 workspace。
4. B3 先写 `READY_FOR_REVIEW` 并停止；audit B3 PASS 后，orchestrator 再次明确派令，exec 才单独写 `CONSTRUCTION_DONE` 并停止。normal 三路复核由主控另派，施工者不自审。
