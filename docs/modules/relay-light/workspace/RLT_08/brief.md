<!-- dh:v1 · brief.md -->
<!-- dh:workspace-contract:v2 -->
# brief — RLT_08 AGENTS 判定、协议索引与模块身份

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| RLT_08 | P1-RelayLight-开发方案 | [DevPlan §RLT_08](../../dev_plan/P1-RelayLight-开发方案.md#rlt_08--agents-判定协议索引与模块身份) |

- **GitHub Issue**：[dh-relay #14](https://github.com/nashhu180-netizen/dh-relay/issues/14)
- **施工现场**：`/home/nash/work/dh-relay/.dh-worktrees/RLT_08`（`wt/RLT_08`，基线 master `851433c`）

## 目标 (Outcome)

在仓根 `AGENTS.md` 以最小修订接入 relay-light：把仓库身份从单模块改为 `dh-relay` + `relay-light` 双模块，补齐 slug/文档/代码/verify scope 与 `dh relay-light` 入口；新增 relay-light worker 标头判定和“完成即停”协议；给现役 Runner 铁律加上“有 `RELAY_RECEIPT` 即冻结 Runner 流水”边界；在阅读矩阵中增加仓内 relay-light skill 索引，并原文登记运行中改计划“有意绕过 B-adjust”的窄例外。

## Zero-context 自查

施工 worker 先读仓根 `AGENTS.md`，再读本文件、`task_plan.md` / `progress.md` / `findings.md`、DevPlan RLT_08 卡和 design/01 的 §0.3、§1.3 第 2/3/7 条、§7.1、§11 四条 oracle，并对照 `tools/relay-light/skill/SKILL.md` 与两份 `references/adapter-*.md`。DevPlan 决定 owner、边界、allowed-paths 与 task_type；design §11 是验收原文；adapter 首行是 A34 的现役派活样板。三者冲突时只写 `findings.md` 并发 `BLOCKED`，worker 不选边。

## 完成条件 ★必写

以下四条逐字承接 design/01 §11，每条均须有可重放机器证：

### HC-RL-A33

> 仓内 `AGENTS.md` 阅读矩阵含指向 relay-light skill 的索引行；dev-harness 未被改动

```bash
matrix="$({ awk '/^## 任务类型阅读矩阵/{inside=1; next} /^## / && inside{exit} inside{print}' AGENTS.md; })"
index_count="$(printf '%s\n' "$matrix" | rg -F -c 'tools/relay-light/skill/SKILL.md' || true)"
test "$index_count" -eq 1
printf '%s\n' "$matrix" | rg -n -F 'tools/relay-light/skill/SKILL.md'
baseline_dir=docs/modules/relay-light/workspace/RLT_08/evidence/dev-harness-baseline
test -s "$baseline_dir/head.txt"
test -s "$baseline_dir/tracked.sha256"
test -s "$baseline_dir/untracked-paths.sha256"
dh_base=/home/nash/work/dev-harness
current_dir="$(mktemp -d)"
trap 'rm -rf "$current_dir"' EXIT
git -C "$dh_base" rev-parse HEAD > "$current_dir/head.txt"
git -C "$dh_base" diff --binary HEAD | sha256sum | cut -d' ' -f1 > "$current_dir/tracked.sha256"
git -C "$dh_base" ls-files --others --exclude-standard -z | sha256sum | cut -d' ' -f1 > "$current_dir/untracked-paths.sha256"
cmp "$baseline_dir/head.txt" "$current_dir/head.txt"
cmp "$baseline_dir/tracked.sha256" "$current_dir/tracked.sha256"
cmp "$baseline_dir/untracked-paths.sha256" "$current_dir/untracked-paths.sha256"
```

判据：索引在“任务类型阅读矩阵”小节边界内恰命中 1 行；B1 动笔前的 dev-harness HEAD / tracked diff / untracked 路径三项摘要文件均存在，B3 按 `task_plan.md` 重算并逐项 `cmp` 一致。

### HC-RL-A28

> AGENTS.md 新增 relay-light 编排协议段，且现有 Runner 铁律已标「冻结流水」

```bash
rg -n -F '## relay-light 编排协议段' AGENTS.md
rg -n -F '有 RELAY_RECEIPT 即冻结 Runner 流水' AGENTS.md
rg -n -F '有意绕过 B-adjust' AGENTS.md
rg -n -F '设计与验收仍走 dev-harness' AGENTS.md
```

判据：四条全命中，且 `git diff -- AGENTS.md` 显示现役 Runner 铁律只增冻结边界、未重写或弱化。

### HC-RL-A34

> 流水判定：监工 prompt 模板首行含 `[relay-light] worker · node … · agent …#… · workspace …` 标头；AGENTS 段含「见此标头即完成即停不等 node_closed，有 RELAY_RECEIPT 即冻结 Runner 流水」判定句

```bash
expected='[relay-light] worker · node=<n> · agent=<角色>#<实例> · workspace=<任务工作区>'
adapter_count=0
for f in tools/relay-light/skill/references/adapter-*.md; do
  actual="$(sed -n '/^```text$/,/^```$/p' "$f" | sed -n '2p')"
  test "$actual" = "$expected"
  adapter_count=$((adapter_count + 1))
done
test "$adapter_count" -eq 2
rg -n -F '见此标头即完成即停不等 node_closed，有 RELAY_RECEIPT 即冻结 Runner 流水' AGENTS.md
```

判据：恰有两份 adapter，其派活 prompt 首行均与 `[relay-light] worker · node=<n> · agent=<角色>#<实例> · workspace=<任务工作区>` 整行字节一致，AGENTS 原文命中判定句。

### HC-RL-A29

> 模块身份落地：slug、`docs/modules/relay-light/`、`tools/relay-light/`、verify scope 英文 `relay-light`；AGENTS 的「本仓只有一个模块」与 `dh` 自动选模块描述已同步改

```bash
rg -n -F 'slug=`relay-light`' AGENTS.md
rg -n -F 'docs/modules/relay-light/' AGENTS.md
rg -n -F 'tools/relay-light/' AGENTS.md
rg -n -F 'verify scope = `relay-light`' AGENTS.md
! rg -n '本仓只有一个模块|本仓只有一个模块，自动选中' AGENTS.md
dh relay-light 2>&1 | tee /tmp/rlt08-dh-relay-light.txt
rg -n -F '=== dh-check: relay-light ===' /tmp/rlt08-dh-relay-light.txt
```

判据：四项身份全命中，旧单模块描述零命中，`dh relay-light` 输出模块标头。`dh-check` 存量体检失败单独记录，不与“能解析”混为一个结论。

## 边界 (Boundaries)

- In scope 闭集：`AGENTS.md` 与 `docs/modules/relay-light/workspace/RLT_08/**`。
- Out of scope：不改 DevPlan、design、dev-harness、`tools/relay-light/skill/**`、Runner/host/contracts、其他卡工作区；不就地编辑用户级 skill 副本。
- 不重写、删除或弱化现役 Runner 铁律；只加 relay-light 识别后的冻结分流。
- B-adjust 例外仅限 relay-light 运行中白名单改计划；设计方案和验收清单仍由 dev-harness/用户闸控。
- task_type=`normal`；施工完成不等于三路复核、verify、验收、push、PR、merge 或发布。
- 手动派活下每批 worker 写结构化 DONE 即停，不等 `node_closed`，不自行续批。

## 触及子系统

- `repo-governance`：AGENTS 模块身份、worker 流水判定、B-adjust 窄例外、skill 阅读索引。
- dev-harness 只做外部无改动核对，不是本卡写入面。
