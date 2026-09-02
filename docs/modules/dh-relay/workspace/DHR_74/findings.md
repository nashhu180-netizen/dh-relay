<!-- findings.md — DHR_74 问题清单。边做边记。F-7108 / F-7109 的权威登记在 DHR_71 findings，本卡只引用不复制。 -->
# findings — DHR_74

## 引用（不在本卡重复登记）

| ID | 权威登记处 | 与本卡的关系 |
|---|---|---|
| F-7108 | `workspace/DHR_71/findings.md`（open → DHR-BL-17） | 停顿形态一：止于 `attempt_started`、fake 全 0；本卡钉落点 |
| F-7109 | `workspace/DHR_71/findings.md`（open → DHR-BL-17 专卡） | 停顿形态二：止于首次 `host_observation_changed(alive)`、fake 非零；本卡主攻 |
| F-7103 | `workspace/DHR_71/findings.md`（resolved·测试侧） | 652s 挂死 = rm 撞在途写；本卡核查 stop() 是否真等队列排空（同族新形态候选） |

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|
| — | — | （步骤 3 起填） | — | — | — |
