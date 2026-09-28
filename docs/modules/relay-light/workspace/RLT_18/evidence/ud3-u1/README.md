# ud3-u1 evidence — RLT_18 UD-3 U1 施工

- 2026-09-24 coder#ud3（phase=workflow-final，round=1）：U1 **停在 RED**——`test_relay_log.py` 新/改断言已提交（`2c1dc47`，RED only），对当前 adapter/SKILL 跑出 12 个 subTest 失败，输出存 `red.txt`；adapter/SKILL.md 未动，GREEN 以 RLT-A-14 用户整版确认为前置，等 orchestrator 另发「GREEN 开工」。
- 2026-09-24 coder#ud3（round=1 续）：RLT-A-14 已获用户整版确认（UD-7，design 晋级由另一 coder 完成）→ **GREEN 落地**：两 adapter 新增「拉起 watcher 的 prompt 片段」+「watch 死亡处置」按 watcher 巡检/watch-down/编排不承担存活对账重写（含 F-014 报信目标随派活方重拉条），SKILL.md 两处（watcher 行分模式表述、放弃项改 watcher 巡检兜底）；`relay_log.py` 零改动。证据：`green.txt`（§5.5 完成判据全绿）、`regression-python.txt`（293 tests OK）、`regression-pwsh.txt`（RELAY ALL PASS SKIPPED:1）、`path-audit.txt`（基点 `5ab3bba` 全绿）。
