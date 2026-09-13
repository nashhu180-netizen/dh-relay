<!-- dh:v1 -->
# progress — RLT_01

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-12 | W builder | 读取 AGENTS、DevPlan RLT_01 卡、design/01 §8.1/§11-A124 与 RLT_05 七件套格式；创建 RLT_01 标准档七件套，冻结单批施工顺序与 normal 三路复核骨架 | master 基线 `77bde7006b3ef56b9e2b04a8717e462e221241fe`；Issue #12；worktree `.dh-worktrees/RLT_01`（`wt/RLT_01`）；本工作区七文件 | `W_READY`；等 D-start/派 construction，不改 DevPlan「未开始」 |
| 2026-09-12 | rlt01-build-devin · Batch 1 construction | 用户「那就先做01」派单。建三件骨架（`SKILL.md`、两 adapter references/，仅占位不含业务内容）与 `install_skill.py`（仅 `--all`、五件闭集 fail closed、单向覆盖 + sha256 校验、每目标单份 manifest.json）；`test_install_skill.py` 7 例：CLI 拒参、五件闭集清点、双侧安装、manifest 六字段、陈旧副本覆盖、A124（改坏一侧+第 8 次复制注入 OSError→非零+源未变→重跑收敛）、源缺件 fail closed。未改 TOML/relay_log/test_relay_log/DevPlan/design/AGENTS/其他卡 | E-001～E-005；红=新建模块 ModuleNotFoundError（新文件卡固有，无旧行为可红）；绿 `python3 -m unittest tools/relay-light/test_install_skill.py -v` → `OK (7)`；全量 `python3 -m unittest tools/relay-light/test_relay_log.py tools/relay-light/test_install_skill.py` → `Ran 115 tests ... OK`（156.7s）；`git diff --check` exit 0 | `DONE task=RLT_01 batch=1 status=CONSTRUCTION_DONE evidence=E-001,E-002,E-003,E-004,E-005 next=main-controller` |
| 2026-09-13 | 主控收口 | PR #13 squash 合入 master（`25bdbcb`）；normal 三路复核全 APPROVE 已闭合；worktree/分支已删 | merge=`25bdbcb`；CI 三硬门绿（relay-core 为暂停期 continue-on-error 观测项） | 卡闭合，Issue #12 已关 |

## 施工批次状态（预填，不代表已执行）

| Batch | 功能单元 | 红 | 绿 | 小审 | 状态 |
|---|---|---|---|---|---|
| 1 | 三件骨架 + install_skill.py + test_install_skill.py（A124） | E-001（新模块 import 红） | E-002（focused 7 OK）· E-003（全量 115 OK）· E-004（diff-check exit 0）· E-005（A124 流程断言） | 待派 | CONSTRUCTION_DONE |

## 证据账本

| E-ID | 证据 |
|---|---|
| E-001 | 红锚点：`python3 -m unittest tools/relay-light/test_install_skill.py -v` → `ModuleNotFoundError: No module named 'install_skill'`（新模块卡无旧行为，import 级红如实登记，不作行为红） |
| E-002 | focused 绿：`python3 -m unittest tools/relay-light/test_install_skill.py -v` → `Ran 7 tests in 0.226s OK` |
| E-003 | 全量回归绿：`python3 -m unittest tools/relay-light/test_relay_log.py tools/relay-light/test_install_skill.py` → `Ran 115 tests in 156.748s OK` |
| E-004 | 边界：`git diff --check` exit 0；`git status --short` 仅 `install_skill.py`、`test_install_skill.py`、`skill/SKILL.md`、`skill/references/`、RLT_01 workspace |
| E-005 | A124 流程：`test_mid_copy_failure_is_nonzero_and_rerun_converges`——改坏 codex 侧 `SKILL.md` 后注入第 8 次 `_copy_file` OSError（第二目标第三件），`main(["--all"])` 返回 1、源五件 sha256 不变；无注入重跑返回 0、两侧五件与源逐字节一致、两 manifest 可解析 |
