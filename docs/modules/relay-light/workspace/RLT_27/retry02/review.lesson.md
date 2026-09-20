# R1 lesson review — RLT_27 retry02

## Verdict

**PASS**

本次运行的已知 findings 与唯一 lesson candidate 已被正确捕获。候选教训可由 retry02 的独立 C1 checker、Linux 运行说明和冻结 Codex adapter 交叉核查，并且把结论限制在 Herdr 终端状态与 relay-light durable 完成判据之间，没有外推为 R/F 闭环、restricted sandbox、normal/heavy recipe 或通用端到端能力已验证。

运行身份：`retry02`；`intervention=1`；`attempt01=preserved`。

## Findings

- P1: none.
- P2: none.

## Evidence

- `lesson_candidates.md` 只提出一条候选：`idle/done/blocked` 不能单独充当节点完成证据，前台 wait 返回后仍需核对角色产物、唯一完成信号与 monitor 账本闭合；对已处于 `working` 的 agent，不把 `prompt --wait` 当成本次 turn 的归属保证。
- `check.C1.md` 的独立核对确认当前 Herdr help 明示 `agent start` 只代表交互就绪、`agent prompt --wait` 不跟踪 turn；同一报告还确认终端状态只作现场佐证，不替代 coder 产物或完成信号。
- `linux-codex-usage.md` 分别在启动、等待和完成判据中记录上述限制，并明确 C1 还需要指定产物、唯一信号、独立 checker PASS 与 monitor 的账本闭合；它也明确列出 R/F、restricted sandbox、失败恢复、normal/heavy 等未验证范围。
- 冻结 `config/references/adapter-codex.md` 要求 wait 返回后先读产出，合格后才写账本 `done`，并警告 `prompt --wait` 不跟踪 turn；冻结 `config/SKILL.md` 同时规定 `status` 不判断产出是否合格。候选教训与这两项协议一致。
- `findings.md` 中关于历史 bwrap、文档滞后以及 normal/heavy 的条目保留为已知边界，没有被本次候选包装成新实测结论；候选只吸收了 C1 已有直接证据的终端状态/turn 归属问题，因此不过度外推。
- retry02 的 `relay_plan.md` marker 为 `recipe=light`，`dh-mapping.toml` 的 light 路径为 lesson + consistency；本报告仅完成 lesson 路，不代表 consistency、R1 汇总或 F1 完成。

## Conclusion

该候选具备明确触发条件、失败模式和可执行检查项，可核查且适合保留为 lesson candidate。无需整改；本 PASS 只关闭 R1 lesson reviewer 自身判断，不代替 monitor 账本事件、另一复核路或后续阶段。
