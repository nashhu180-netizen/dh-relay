# phase=workflow-final · reviewer — heavy 五路开发后复核（每路每轮 fresh）

先读同目录 `README.md`。你是**fresh 复核者**：没参与本卡任何施工或批审。只读（除自己的 review 文件与 signal），不提交，不改代码，不启动 agent，做完即停。工作目录 `/home/nash/work/dh-relay/.dh-worktrees/RLT_18`。RELAY_RECEIPT preflight。

## 审查对象
`git diff origin/master...HEAD`（基线 `5ab3bba`）的全部改动：`tools/relay-light/relay_log.py`、`test_relay_log.py`、两个 adapter、`SKILL.md`（UD-2 三处）；workspace 工件（brief / task_plan / decisions / check.batch-* / evidence/batch-1..3 / findings / progress）。
权威：DevPlan「#### RLT_18」；design/01 §3.6、§7.2、第 115/140/189/1436–1439 行、A82/A83/A101、H11/H12；`decisions.md` UD-1/UD-2（用户裁决，不再评价方向，只核落地忠实）；AGENTS.md 宪章。

## 各路职责（派单首行 `path=` 指定你是哪一路，只做这一路）

| path | 只回答 |
|---|---|
| code-round1 | 代码正确性与健壮性：watch 线程/重挂/去重/tick/两层退出/运行期重读容错/退出码合同/重启循环停止集的实现是否正确；并发与资源泄漏；错误路径；测试是否真打桩、断言是否有效（能否在实现被破坏时失败）、有无只测 happy path；**专项**：`findings.md` 中 batch 3 F-1 相关待复核项（第二条通知来源、是否存在 `(agent,状态)` 去重缺口）——读代码判断去重是否有漏洞，给出可复现推理或反证 |
| code-round2 | 第二视角代码复核（代码轮 1 闭合后进行）：与 code-round1 不同侧重——可维护性、与现有 `relay_log.py` 风格/公用函数一致性、跨平台（Windows 路径/编码/进程、`pgrep` 与 `Get-Process` 对称）、adapter 命令与实现参数是否逐字对得上 |
| requirement | 需求方向：交付是否真满足 DevPlan 目标与 A82/A83/A101 oracle「怎么证明」列；H11/H12 证据能否支撑用户做人判（信息是否足够、是否如实）；非目标有无被违反（watch 写账 / 驱动 / 秒级监控）；前置豁免三条影响是否如实登记 |
| consistency | 一致性：adapter 两份之间、adapter 与 SKILL.md、SKILL.md 与 design、task_plan 与实现、证据与 raw 之间有无矛盾或残留旧口径（如「watch 未实现」）；术语（stage-lead / watcher / single-task）一致 |
| lesson | 教训：对照 `docs/modules/relay-light/knowledge/`（若存在）、`docs/modules/dh-relay/knowledge/教训库-候选.md` 与本卡 `lesson_candidates.md`，判断已知坑（CI 浅克隆基线、`__pycache__`、dotted 单测入口、prompt 排队、后台进程回收等）有没有复发；本卡新暴露的教训是否已登记为候选且表述可复用 |

## 产出
`workspace/RLT_18/review.workflow-final.<path>.review-round-<k>.md`：
```
## 结论
PASS | FAIL   （有任一 open P0/P1 即 FAIL）
## 发现
| ID | 级别 P0/P1/P2/P3 | 位置 文件:行 | 事实 | 建议整改 |
## 核查范围与方法
## 范围外发现
```
signal `workspace/RLT_18/DONE.workflow-final.<path>.review-round-<k>.md`：
`DONE task=RLT_18 phase=workflow-final agent=reviewer#<path>-r<k> batch=na path=<path> review_round=<k> remediation_count=<k-1> verdict=PASS|FAIL evidence=docs/modules/relay-light/workspace/RLT_18/review.workflow-final.<path>.review-round-<k>.md`

第 k≥2 轮（fresh 实例）：派单会给出上一轮 review 与整改提交，核上一轮 P0/P1 是否闭合 + 整改是否引入新问题。
