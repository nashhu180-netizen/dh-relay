# RLT_01 需求方向复核报告 — 仓内 skill 单源与安装器

**结论**：APPROVE（无 P0–P2；3 条 P3 事实登记，均不阻塞）

**复核范围**：`wt/RLT_01` 相对 master 基线 `77bde7006b3ef56b9e2b04a8717e462e221241fe` 的全部新增内容。提交史：`d4043a6`（workspace 七件套，Issue #12）+ `8959f5f`（三件骨架 + `install_skill.py` + `test_install_skill.py`）。

**验证方法说明**：本复核为只读，未执行 `git diff`/`git status`；diff 边界改用 worktree↔master 全量文件树比对 + 两树同名文件内容核对（`roles.toml`、`dh-mapping.toml`、`ci.yml`、DevPlan 任务表逐字节一致；`test_relay_log.py` 两侧均 108 个 `def test_`）替代。

---

## 必审问题逐条结论

### 1. 交付物与卡目标逐字对齐 —— 通过

| 卡要求（DevPlan §3.2 RLT_01 / design §8.1） | 事实 |
|---|---|
| 五文件唯一源 | `tools/relay-light/skill/` 下五件齐备：`SKILL.md`、`references/adapter-claude-code.md`、`references/adapter-codex.md`（本卡新增骨架）+ `roles.toml`、`dh-mapping.toml`（RLT_05 已有，本卡未改，与 master 逐字节一致）。`install_skill.py` `SKILL_FILES` 闭集与 design §8.1 五件清单逐字一致 |
| 生产命令只提供 `--all` | argparse 仅 `--all`（`store_true`+`required`），无子命令、无目标参数；`home`/`source_dir` 仅为 `main()` 的 keyword-only 测试注入缝，不经 CLI 暴露 |
| 从 home 派生两个固定目标 | `TARGETS = (".claude/skills/relay-light", ".codex/skills/relay-light")`，生产路径 `Path.home()` |
| 全量覆盖五件 | `install_all` 先清点源缺件 fail-closed；`_sync_target` 逐件 `shutil.copyfile` 覆盖并 `mkdir -p` |
| 校验哈希 | 复制后逐件 sha256 目标=源，不等即 `InstallError` → `main` 返回 1 |
| 每目标单份可覆盖 manifest | 该目标五件全部校验通过后才写 `<target>/manifest.json`，`write_text` 直接覆盖；无 manifest ID、无历史 |
| manifest 字段 | 顶层键恰为 design §8.1 枚举的五组：`source_head`、`source_dirty`、`files`（五件相对路径→sha256）、`installed_to`、`installed_at`；测试断言键集合闭集 |
| 单向覆盖/失败非零/不承诺原子回滚 | 源只读，目标只写；`(InstallError, OSError)` → return 1；无事务/回滚/恢复代码，docstring 如实声明 |

### 2. 非目标全部守住 —— 通过

- **骨架无 RLT_07 业务内容**：三件骨架仅 front-matter/标题 + 「由 RLT_07 交付」占位，符合 task_plan「最小占位」冻结。
- **无软链**：`tools/relay-light/` 全目录 grep `symlink|link_to|os\.link` 零命中。
- **无历史 manifest/事务/原子/回滚/中断恢复**：代码中不存在对应机制；失败后两侧可暂不同步，靠整套重跑收敛，与设计 §8.1 首版口径一致。
- **不改 dev-harness**：dev-harness 为外部仓，diff 内无相关路径。
- **测试全程临时 home**：全部 `main(...)` 调用均传 `home=self.home`（`tempfile.TemporaryDirectory` 派生）；`install_all` 无一次不带 home 的调用；无任何路径落到真实 `~/.claude`/`~/.codex`。生产默认 `Path.home()` 写真实目录是安装器本职，不属于本卡测试行为。
- **allowed-paths 边界**：新增文件全部命中卡内四条允许路径；`relay_log.py`、`test_relay_log.py`、两 TOML、AGENTS、DevPlan、design、其他卡工作区均未动（DevPlan RLT_01 行仍「未开始」，状态列归主控，正确）。

### 3. 无 RLT_07/RLT_12/RLT_17 验收项抢跑 —— 通过

- `review.md` owner 闭集仅 A124 一条，task_plan 显式禁抢 A32/A125。
- A124 测试逐字实现 oracle：临时 home 改坏 `.codex` 侧 `SKILL.md` → 第 8 次 `_copy_file`（第二目标第三件 = `references/adapter-codex.md`）注入 `OSError` → 断言 `main` 返回非 0 且源五件 sha256 快照不变 → 无注入重跑返回 0 → 两侧五件与源逐字节一致、两 manifest 可解析。
- 无真实安装证据（A32 归 RLT_12）、无双机四目录证据（A125 归 RLT_17）、无 skill 业务内容（归 RLT_07 二十条）。

### 4. progress.md / findings.md 如实 —— 通过

- **红锚点**：E-001 明确登记为「`ModuleNotFoundError` import 级红，不作行为红」——对新模块卡属实、未伪装成行为红；有效单测变异表留待代码轮 1 填写，登记诚实。
- **115 绿**：E-003 `Ran 115 tests OK` 与实测计数一致（master/worktree 两侧 `test_relay_log.py` 均 108 例 + 新增 7 例 = 115）。
- **A124 断言**：E-005 描述与测试实现逐项吻合。
- **DONE 信号**：`DONE task=RLT_01 batch=1 status=CONSTRUCTION_DONE evidence=E-001..E-005 next=main-controller`，格式与 task_plan 冻结模板一致。
- **F-001 如实**：「跨卡守恒已写进双方 task_plan」经双向核实为真；且 RLT_07 `findings.md` F-001 已记录 2026-09-12 用户裁决「RLT_01 先开、RLT_07 合入后 rebase 填业务内容」，与本卡 brief/task_plan 表述一致。

### 5. 与 RLT_07 边界表述一致 —— 通过（附 1 条 P3 观察）

- RLT_01 侧：「本卡先建骨架，RLT_07 rebase 后填业务内容，互不覆盖」。
- RLT_07 侧：findings F-001 记录用户裁决 RLT_01 先开；task_plan 禁改安装器（RLT_01 路径）。
- 两侧实质一致、无冲突；RLT_07 task_plan 的「RLT_01 后开时…」措辞是被其自身 F-001 裁决取代的旧假设（见 F-02）。

---

## Findings

| ID | 级别 | 位置 | 事实与理由 |
|---|---|---|---|
| F-01 | P3 | `workspace/RLT_01/task_plan.md` | 文本写「manifest 字段固定**六类**」，随后仅枚举五键（`source_head`、`source_dirty`、`files`、`installed_to`、`installed_at`）；design §8.1 原文与实现/测试断言均为五字段组，合同本身满足，属计划文档计数瑕疵，不影响交付物正确性。 |
| F-02 | P3 | RLT_07 侧 `task_plan.md`（对侧工件，非本卡 diff） | RLT_07 task_plan 仍按「RLT_01 后开」旧假设措辞，Batch 1/3 写「Create `SKILL.md`/两 adapter」——本卡合入后这三件将以骨架形态已存在，「Create」实为「填骨架内容」。已被 RLT_07 findings F-001 的 2026-09-12 用户裁决消解；属 RLT_07 rebase 时的计划对齐事项，本卡侧表述与该裁决一致，无冲突。 |
| F-03 | P3 | 仓根 `.gitignore`（存量，非本卡改动） | `.gitignore` 无 `__pycache__/`/`*.pyc` 覆盖；本卡施工期间 worktree 一度出现 `tools/relay-light/__pycache__/*.pyc`（测试运行正常副产物），当前磁盘已不存在，未进入 HEAD 检出态，不构成本卡 diff 污染；最终 `git diff master...HEAD --name-only` 终判仅 allowed-paths（主控已执行确认）。 |
