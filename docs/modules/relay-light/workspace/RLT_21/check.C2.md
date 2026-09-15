<!-- dh:v1 -->
# C2 checker 复审 — RLT_21

## 结论

PASS

- P1：0
- P2：1
- 复审增量：commit `4105da8`（parent=`0e0f24a`）。
- 范围：仅重核上轮 C2 三条 P1；不替代 normal Recipe 的 R1 复核。

## 上轮三条 P1 闭环

### 1. `.devin/` 越界 — CLOSED

- `Test-Path .devin` 当前为 `False`；四集合不再出现 `.devin/config.local.json`。
- `4105da8` 只修改本工作区 `findings.md`、`lesson_candidates.md`，均在 allowed-paths 内；未修改 `.gitignore`。
- working tree tracked 仅本工作区 `progress.md`，index 为空，untracked 全部位于本工作区；当前四集合无越界。

### 2. C2 RED 证据 — CLOSED

- `findings.md` F-008a 已登记 A141 原始 RED：1 test、10 failures、exit=1；A142 原始 RED：5 tests、3 failures、exit=1，并列明三条实际漏闸。
- A143 明确登记“原始 RED 不可证”，且把 parent 基线 + C2 测试的 `Ran 5 tests ... FAILED (failures=14)`、exit=1 标为“重建 RED（非冒充原始）”。事实、不可证边界和重建证据已分开。
- GREEN：返工方报告全量 `Ran 181 tests`、`OK`、`skipped=0`、exit=0；本 checker 上轮已对相同代码树 `0e0f24a` 独立得到 `Ran 181 tests in 519.074s`、`OK`、exit=0。`4105da8` 仅改 findings/lesson，不触碰代码、测试或 skill，故该 GREEN 证据保持适用。

### 3. A143 复算 — P1 CLOSED，转 P2 口径分歧

- F-009 已撤销未冻结的“同根去重/残留折级”，按 SKILL.md 冻结四类逐条计级：P1-01、P1-02 → P2；P1-03、P1-03R、P1-04 → P1，结果为 `3 P1 + 2 P2`。
- 该结果与 oracle 期望 `1 P1 + 4 P2` 不可兼得，F-009 已如实登记为待编排/用户裁决的合同口径卡点，没有继续凑数，也没有擅改 oracle。
- 依本轮派单明确裁决：“若属口径分歧非施工缺陷，按 P2 记录并放行”，因此不再阻断 C2。

## P2（不阻断）

### P2-1 — A143 的期望计数与冻结逐条计级规则冲突

当前实现的 light 分级模板本身成立，结构测试也已通过；分歧仅在历史五条 finding 的归并/计数口径。后续应由编排/用户选择：修订 oracle 期望为逐条结果，或显式冻结可执行的归并规则。该裁决不属于本次施工缺陷，按本轮授权不阻断 PASS。

## 复审证据

- `git diff --check 0e0f24a 4105da8`：exit=0。
- 当前 working tree 与 index 的 `git diff --check`：均 exit=0。
- `4105da8` 的两条改动路径均在本工作区；`.devin/` 已不存在；四集合无 allowed-paths 外项。
- A141/A142 实现与测试未被返工提交改动；上轮已核两 adapter 三段、模式门、cancelled 归属、两 skip 去除与 `skipped=0`。

## 停止线

本结论仅放行 C2 小审；不代表 R1、verify、验收、CI、合并或发布通过。
