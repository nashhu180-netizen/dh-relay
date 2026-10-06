# task — Issue #146 single-task 小决策交 decider / 总表无依赖卡并行开卡

## 完成条件

1. SKILL single-task「编排职责与执行边界」新增「小决策交 decider，问用户攒齐一次」（白名单、仍问用户闭集、findings 登记+知会、攒齐一次问、AW_07 反例）；「生命周期与计数」互引；版本行 `v1.4.0`。
2. SKILL「卡级总表维护与交棒核对」新增「并行开卡」（无依赖判定、非收口触发、维护权单一、待决项按卡汇总、不绕过授权与接棒条件），「自动接续」互引，不重复「逐张全部拉起」。
3. 两侧 adapter「总表关联与交棒」「编排边界与验证派单」、总表模板第 3/7 条、`AGENTS.md` relay-light 段同步；口径一致。
4. light 独立复核 PASS；PR 必需 CI 通过后合入 master；本机两份安装副本与源一致。

## 本卡开工授权

- 用户原话：2026-10-06 agent-playground aw07-orch 会话「嗯，这几个都可以加」「relay-lite 有 decider 一些非方向性的问题让他来决策」，对落点建议回复「开两个space改」。本任务为 relay-light 一侧；轻档纯协议文档，主会话施工 + 子代理独立复核。
- Issue：https://github.com/nashhu180-netizen/dh-relay/issues/146
- 远端交付：origin=nashhu180-netizen/dh-relay；分支 wt/issue-146-decider-parallel-cards；目标 master。
- 范围：上述五个文件 + 本工作区。不改 dev-harness、不改 `docs/relay/agent-playground/**` 总表实例、不改 `relay_log.py`、不降复核档。
- 总表：无（dh-relay 自身协议改动）。

## 进度与验收

- 2026-10-06：五处改动完成；test_install_skill 19 OK；`git diff --check` 通过。完成条件 1–3 通过。
- 2026-10-06：light 独立复核（Opus 子代理，非施工者）首轮三路 FAIL（2 个 P1、3 个 P2），返工后复审三路 PASS；残留 P2/P3 已在合入前修完，详见 review.md。完成条件 4 的 CI、合入 SHA 与副本哈希证据追加至 Issue #146。
