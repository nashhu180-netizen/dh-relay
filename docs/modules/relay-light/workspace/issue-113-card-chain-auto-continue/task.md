# task — Issue #113 卡级总表自动接续，完整模式冻结

## 完成条件

1. SKILL「卡级总表维护与交棒核对」新增「自动接续」；「模式选择」多卡行改为总表 + 逐卡 single-task，完整模式标冻结；版本行 `v1.3.0`。完整模式合同正文与 `relay_log.py` 及测试不改。
2. 总表模板加「自动接续」列并同步第 3、7 条；`AGENTS.md` relay-light 段与两侧 adapter「总表关联与交棒」同步；五处口径一致。
3. light 独立复核 PASS（一致性 + 权限边界）；PR 必需 CI 通过后合入 master；本机两份安装副本与源一致。

## 本卡开工授权

- 用户原话：2026-09-30「可以，按你的方法」（回应主会话方案：不新增常驻编排 agent，由收口卡 orchestrator 在移交前拉起下一卡；授权按卡写在总表；完整模式先冻结不删，试点 2～3 次交棒后再退役）。轻档纯协议文档，主会话施工 + 子代理独立复核。
- Issue：https://github.com/nashhu180-netizen/dh-relay/issues/113
- 远端交付：origin=nashhu180-netizen/dh-relay；分支 wt/issue-113-card-chain-auto-continue；目标 master。
- 范围：上述五个文件 + 本工作区；不写脚本、不加账本、不动 `relay_log.py`；在途卡（WFP_05、OBD_44）按原合同继续，本次不改在途总表。
- 总表：无（dh-relay 自身协议改动）。

## 背景

完整模式最近实跑 p21-normal 自 2026-09-21 停在 C3 `blocked`；单卡接力 OBD_43 / WFP_04 顺利收口。#104 已规定收口卡把维护权移交给「下一张已开工卡的 orchestrator」，缺口只在下一卡尚未开工时靠用户手动开 space。宪章「没有常驻 AI 主控」，故不加跨卡编排 agent，改为收口卡一次性拉起下一卡 orchestrator，授权来源固定为总表「自动接续」栏。

## 进度与验收

- 2026-09-30：五处改动完成；test_install_skill 19 OK；`git diff --check` 通过。完成条件 1、2 通过。
- 2026-09-30：light 独立复核（Opus 子代理，非施工者）首轮三路 FAIL（4 P1：gate 冲突、adapter 交互口、授权栏可被维护会话写、扇出/非维护卡未定），返工后复审三路 PASS，残留 P2-A（维护会话代执行时机）与 P3-B/C/D/E 已在合入前一并修掉；详见 review.md。完成条件 3 的 CI、合入 SHA 与副本哈希证据追加至 Issue #113。
