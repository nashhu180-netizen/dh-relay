<!-- dh:v1 -->
# RLT_31 独立需求复核

复核人：独立需求 reviewer（未参与实施）；范围：候选 `space_watch.py`、行为测试、安装器、`SKILL.md` 与两份 adapter/派单模板，及 RLT_31 工作区/DevPlan。未进行 Herdr 实时控制、网络写入或代码修改。

## 结论：CHANGES_REQUIRED

### HIGH — 通知对象在同一 workspace 时会无限自触发，违反「无变化静默」

- 证据：`tools/relay-light/space_watch.py:142-159` 用通知前的 `current` 写入 `previous`；而 `Herdr.notify()` 在 `:73-83` 成功投递必须使通知对象的 `state_change_seq` 推进。协议又明确通知对象若在本 space 仍是被监控成员（`tools/relay-light/skill/SKILL.md:406-408`，两份 adapter 同文）。
- 复现推理：同 workspace 的 builder 变更时，第二轮把 builder 变化通知给 orchestrator，并把通知前 orchestrator 状态记为 baseline；下一轮只因这次通知推进了 orchestrator 的 seq 即再通知；新通知继续推进其 seq，之后每 120 秒重复。真实业务状态未再变化却持续通知，违反 SW2「无变化静默」。现有 `test_only_self_excluded_even_notify_inside_workspace` 只断言首次聚合变化，未执行后续静默轮，因而未覆盖此路径。
- 修正方向：明确并实现对成功通知造成的 notify 目标状态推进的去回声策略，并增加「notify 在监控 workspace 内、一次外部变化后下一轮静默」的行为测试。不得为此将通知对象从动态发现集合排除，因其仍须观测独立的真实变化。

## 已核对的通过项（不构成全卡验收）

- SW1 的按 `workspace_id` 每轮 list、仅排除自身、外部 notify 不纳入快照，在 `space_watch.py:111-140` 有实现；状态、seq、新增、离开和失败不推进 baseline 的分界与测试相符。
- SW3 的 `prompt --wait --until working --timeout 5000`、seq 确认、失败保留 baseline，实现在 `:73-83`、`:155-158`；脚本不发 Enter。
- SW4 文档和两侧派单模板均指定固定 `--workspace --notify --self`、120 秒和仅启动/巡检；安装器把脚本复制并校验哈希。隔离运行 `cd tools/relay-light && python3 -m unittest test_space_watch.py test_install_skill.py`：38 tests, OK。
- SW5 的 `HERDR_ENV=1` / `RELAY_RECEIPT` preflight 和无文件写入测试存在；本会话无 `HERDR_ENV`，未触发 Herdr，SW6 仍未覆盖，不能视为 PASS。

