<!-- dh:v1 · task_plan.md -->
# task_plan — RLT_01 仓内 skill 单源与安装器

## 要读的上下文 (Context Packet) ★前置

> **执行契约头（zero-context）**：你是 RLT_01 手动派活的 construction worker。进入主控给定的精确 RLT_01 worktree 后，第一个 Git 动作是 `git rebase --autostash master`，并核对基线包含 RLT_05 完成提交（squash `a7ce13c` + verify `7d06678`）。先读本文件、`brief.md`、`progress.md`、`findings.md`、DevPlan RLT_01 卡和下列 Context。本卡单批交付；路线偏离只记 `progress.md`，不回写本文件。不改 DevPlan 状态，不自行复核、验证、验收、merge 或 deploy；commit/push 仅在主控明确的 GitHub 派单范围内。

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | `AGENTS.md` | 手动 worker、durable signal、密钥与 worktree 纪律 |
| C-002 | `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` §RLT_01、§4、§8.3 | DevPlan 权威决定 owner、边界、依赖、allowed-paths、normal 与跨卡守恒 |
| C-003 | `docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md` §8.1 | 仓内单源拍板、五件清单、`--all` 语义、manifest 字段 |
| C-004 | 同上 §6.2.1 | 配置目录五情形；安装器与 adapter 的分工边界（安装器只管同步） |
| C-005 | 同上 §11 `HC-RL-A124`（及 A32/A125 上下文） | 唯一 oracle 原文与证法 |
| C-006 | `tools/relay-light/skill/roles.toml`、`dh-mapping.toml` | 已存在两件；只读，不覆盖不回退 |
| C-007 | `tools/relay-light/test_relay_log.py` | 测试基座风格参考（unittest、临时目录隔离） |
| C-008 | `docs/modules/relay-light/workspace/RLT_05/` 七件套 | worker 边界与报告格式 |

## 全程允许路径闭集与禁改项

允许修改/创建且仅允许以下路径：

1. `tools/relay-light/skill/**`（仅新增 `SKILL.md`、`references/adapter-claude-code.md`、`references/adapter-codex.md` 三件骨架；两 TOML **只读不改**）
2. `tools/relay-light/install_skill.py`
3. `tools/relay-light/test_install_skill.py`
4. `docs/modules/relay-light/workspace/RLT_01/**`

禁止修改 `relay_log.py`、`test_relay_log.py`、两 TOML、DevPlan、design、as-built、AGENTS 与其他卡工作区；禁止写 skill 业务内容；禁止软链、历史 manifest、事务/原子/回滚/中断恢复；禁止写真实用户目录（测试一律临时 home）。若正式 oracle 只能越界满足，写 findings 与结构化 `DONE status=BLOCKED` 后立即停止。

## 基线、依赖与跨卡守恒

- 任务 worktree 基点为完整 SHA `77bde7006b3ef56b9e2b04a8717e462e221241fe`（master=origin/master，含 RLT_05 完成提交）。
- 正式依赖：无（DevPlan 依赖列 `—`）；§8.3 定 RLT_01 独立并行。
- 跨卡守恒：本卡先建三件骨架使五件齐备；RLT_07 后开时 rebase 含本卡的 master，向骨架填业务内容，不覆盖、不回退本卡安装器与测试；RLT_12 首步用本安装器做首次真实安装（A32）。
- 单批交付；批内固定「行为断言红 → 最小实现 → 批内绿 → diff 边界 → progress 结构化 DONE → 立即停止」。

## 手动派活 durable signal

worker 在 `progress.md` 日志表追加一行，并在证据账本追加对应 E-ID；日志「下一步」字段使用以下固定结构，随后立即停止，不等待 `node_closed`：

```text
DONE task=RLT_01 batch=1 status=<READY_FOR_REVIEW|BLOCKED|CONSTRUCTION_DONE> evidence=<E-ID,...> next=main-controller
```

正常完成用 `CONSTRUCTION_DONE`；阻塞用 `BLOCKED` 并写 reason/finding。小审者只回填 `review.md` 对应行与独立报告，不修代码。

## 施工共通约束

- Python ≥3.11、仅标准库；安装器不接受任意目标——生产路径只由 `--all` 从当前用户 home 派生两个固定目标，测试经注入 home 隔离。
- 五件闭集冻结：`SKILL.md`、`references/adapter-claude-code.md`、`references/adapter-codex.md`、`roles.toml`、`dh-mapping.toml`；源缺任一件即 fail closed 非零退出，不同步半成品集。
- 单向覆盖：只写目标侧，源目录字节不动；每目标复制五件后校验目标哈希=源哈希，全部通过才写该目标 manifest；任一目标失败即非零退出，不修另一边的半成品。
- manifest 为可解析 JSON 单文件，字段固定六类：`source_head`、`source_dirty`、`files`（五件相对路径→sha256）、`installed_to`、`installed_at`；写目标目录内，下次成功覆盖。
- `source_head`/`source_dirty` 取仓内源所在 git 仓（`git -C` 查询），取不到时记 `null` 不阻断安装；`source_dirty` 以 skill 目录的 porcelain 为准。
- 骨架三件只写最小占位（front-matter/标题 + 「内容由 RLT_07 交付」），不含任何业务规则文字。

## 施工步骤 (Steps)

### Batch 1 — 三件骨架 + install_skill.py + test_install_skill.py（A124）

| 项 | 冻结内容 |
|---|---|
| Modify/Create/Test | Create `skill/SKILL.md`、`skill/references/adapter-claude-code.md`、`skill/references/adapter-codex.md`（骨架）、`install_skill.py`、`test_install_skill.py`；Record RLT_01 workspace。 |
| 目标接口/结构 | 建议但不锁名：`SKILL_FILES` 五件闭集、`_targets_for_home(home)`、`install_all(source_dir, home)`、`main(argv)`；CLI 仅 `--all`，无参/他参 exit 2。 |
| A124 合同 | 临时 home 放两侧已存副本并人为改坏其一；注入一次五件复制中途失败（如 monkeypatch 某件 copy 抛错）；断言非零且仓内源未变；重跑 `--all` 断言两侧五件与源逐字节一致、两 manifest 可解析且字段齐。 |
| 先红断言 | `install_skill.py` 不存在→import/CLI 红；骨架三件缺失→五件闭集清点红；无 `--all` flag→exit 2；mid-failure 注入语义未实现时相关断言红。 |
| 实现约束 | 复制用 `shutil.copyfile`/`copy2` 逐件覆盖并 `makedirs`；sha256 校验逐件比对；manifest `json.dumps` 写 `<target>/manifest.json`；不删目标侧额外文件。 |
| 命令与预期 | focused 红后绿：`python3 -m unittest tools/relay-light/test_install_skill.py -v`；全量回归 `python3 -m unittest tools/relay-light/test_relay_log.py tools/relay-light/test_install_skill.py` exit 0；`git diff --check` exit 0。 |
| 边界 diff | 仅五件新文件 + workspace；不含 TOML/relay_log/dev-harness 改动。 |
| 小审输入/靶子 | diff、红绿 E-ID、mid-failure 注入方式、manifest 样例、五件清点、`--all` 帮助与拒参。 |
| 退出条件 | A124 有证、全量绿、无 P0/P1；progress 追加 `DONE task=RLT_01 batch=1 status=CONSTRUCTION_DONE ...` 后立即停止。不得自行进入 review/verify。 |

## 最终施工交接清单（不等于复核或验收）

1. `progress.md` 有有效红或 late-added 判别器、绿、全量回归、diff 边界、小审结论与 E-ID。
2. `review.md` 保持 1 条 owner（A124）闭集；不得抢入 A32/A125 或 RLT_07 业务内容。
3. `git status --short` 与 `git diff --name-only` 仅 allowed-paths；不使用 `git add -A`/`.`。
4. 结构化 DONE 后立即停止；normal 三路复核由主控另派，施工者不得自审。
