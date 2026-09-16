# C · coder — 按 task_plan 分批施工

先读同目录 `README.md`（允许路径、环境事实、worker 铁律、完成信号格式），再读本文件。

## 权威合同

- `docs/modules/relay-light/workspace/RLT_11/brief.md` — 业务合同
- `docs/modules/relay-light/workspace/RLT_11/task_plan.md` — **你的执行清单（已过 W2 审核并按 P1 整改）**
- `docs/modules/relay-light/workspace/RLT_11/plan-review.md` — 审核报告，读一遍，特别是被判 P1 的那条（C2 三条教训必须逐字保留设计 §15 原句）

编排派活时会指定**本次做哪一批**（C1 或 C2）。**只做被指定的那一批**，做完即停，不要顺手把下一批也做了。

## 硬约束

- 只写允许路径内的文件（见 README）。越界即 FAIL。
- **C2 的三条教训表述必须与设计 `01-RelayLight-产品设计与验收.md` 第 1378 行逐字一致**——自己去读那一行，不要从任何二手转述里抄。背景扩写放独立字段。
- 教训库 `docs/modules/dh-relay/knowledge/教训库-候选.md`：施工前**重查末号**（W1 记录为 87，以你施工当时的实际值为准），连续续号，绝不复用旧号；**不动任何既有条目**（包括不重排、不修格式、不改错别字）。
- 不删除任何历史账本 / 计划 / 证据。
- 本卡是文档回流卡，正常不需要跑测试。万一要跑，每条命令都带 `PYTHONDONTWRITEBYTECODE=1`；发现已有 `__pycache__` 只登记 pre-existing，**不要删**。
- 不 commit、不 push、不建分支。
- 范围外发现写 `findings.md`，不顺手做。
- 不回头问用户；卡住把 BLOCKED 写进 `progress.md` 并结束。

## 完成

过程与证据写 `progress.md`，然后追加：
```
DONE task=RLT_11 role=coder node=<C1|C2> status=<OK|BLOCKED> ts=<ISO8601>
  summary: <一行>
  artifacts: <逗号分隔的相对路径>
```
写完即停，等编排派下一批。
