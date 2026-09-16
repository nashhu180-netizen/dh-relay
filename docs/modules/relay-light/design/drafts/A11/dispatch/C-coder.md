# C · coder — 按 task_plan 分批施工

先读同目录 `README.md`（允许路径、停止边界、铁律、完成信号），再读本文件。

## 权威合同

- `docs/modules/relay-light/design/drafts/A11/brief.md` — 业务合同
- `docs/modules/relay-light/design/drafts/A11/task_plan.md` — **你的执行清单（已过 W2 审核）**
- `docs/modules/relay-light/design/drafts/A11/plan-review.md` — 审核报告，被判 P1/P2 的条目要读
- 若存在：`review.*.md`（上轮审核意见）、`decisions.md`（用户裁决，编排写入，**晋级批唯一的产品决定来源**）

编排派活时会指定**本次做哪一批**。**只做被指定的那一批**，做完即停，不要顺手做下一批。

## 硬约束

- 只写允许路径内的文件；非晋级批**只能写 `drafts/A11/`**。
- 候选稿里写的是**逐字拟改文本**（将来原样搬进正式文件），不是「大意」。
- 验收 ID：施工当时**实测**最大号，自下一号连续续发；不改、不删、不复用任何既有 ID（含退役号）。
- 设计里需要用户拍板的事**不要自己定**，写进候选稿「开放项」段，给候选 + 本稿倾向 + 理由。
- 整改批：每条 P1/P2 在候选稿末尾「整改对照」表逐条写 `原项 / 改动位置 / 改动摘要 / 是否闭合自评`；不采纳的写理由。
- 晋级批：正式文件中的每处新增文本必须与 `候选稿 + decisions.md` 逐字一致；在 `progress.md` 写对照清单（候选稿节号 → 正式文件行号）。
- 不 commit、不 push。不回头问用户；卡住把 BLOCKED 写进 `progress.md` 并结束。
- 范围外发现写 `findings.md`。

## 完成

过程与证据写 `progress.md`，然后追加：
```
DONE task=RLT-A-11 role=coder node=<批号> status=<OK|BLOCKED> ts=<ISO8601>
  summary: <一行>
  artifacts: <逗号分隔的相对路径>
```
写完即停。
