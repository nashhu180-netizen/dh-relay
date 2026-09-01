<!-- dh:v1 · review-brief — DHR_70 一致性复核派单（第 4 路 · 横向）。主控写，复核者只读。 -->
# review-brief · DHR_70 · 一致性复核（横向）

## 你是谁 / 不是谁

你是**复核 worker**，不是主控。只读、不改任何文件（codex `--sandbox read-only`）。
不要派活、不要回头问用户。先读仓根 `AGENTS.md`「编排协议段 → 复核 worker」。

## 这一路和别的路不一样，先读懂再动手

代码轮 1 / 轮 2 / 需求这三路都是**纵向**的：问"这次改动对不对"，作用域是本次 diff。
**你是横向的**：问"本次产出的东西，和仓里已有的同类实现是否自洽"。

跨路径不一致是多次任务累积长出来的——每次改动单看都自洽，所以任何以本任务为作用域的复核都**必然看不见它**。有过实证：某模块一个字段在四条路径上有三种定义，两轮代码复核 + 需求复核 open=0，全没碰到。

**做法**：对本次改动引入或修改的每样"同类物"，grep 出仓里的同类实现，把定义**并排列出来比**。不扫全仓，只扫"本次碰到的东西在别处有没有兄弟"。

**输出硬要求**：必须列出**比对清单**（扫了哪些维度、每个维度找到几处同类）。结论是"全部一致"也要列——只写"看过没问题"= 空过，不算做过。发现的不一致**必须逐条裁决**是「有意的差异」还是「遗漏」，理由写清楚。

## 你要审什么

cwd = worktree，HEAD = `b6a3b47`，基线 diff = `git diff 35ff2db..b6a3b47`。
生产改动只有 `relay-core/runtime/service.mjs` 一处（`submitExecutorResult` 首轮 drivers 循环 + 新增 `evictClosedActor`）。

`review.md` 的 `dh:consistency-review:v1` 块已经冻结了**五个比对对象**，你必须逐个给出「定义是否一致 + 裁决」：

| # | 比对对象 | 要并排比的同类路径 |
|---|---|---|
| 1 | 提交路由「当前持 lease 的 actor」 | `submitExecutorResult` 首轮 drivers 循环 vs 其 durable 重建循环 vs `commitReceipt` / `stopDriver` 各自的 actor 取用方式 |
| 2 | `actor-closed` / `lease-lost` 的拒绝语义 | `host.mjs` 的 `refuseIfClosed`、Store 的 `writeGuard`、service 的 `withReason` 映射 |
| 3 | gate 注册与本届 driver 生命周期 | `registerSubmissionGate` 的全部调用点（bootstrap / commitReceipt 后 / 重建路径） |
| 4 | 「恰一条 Result」与幂等 | `relay-core/test/dhr64-result-bridge.test.mjs` 既有 Result bridge 断言 vs 本卡 A2 重投断言 |
| 5 | 允许路径 vs 实际 diff | DevPlan `dh:allowed-paths:v1 task=DHR_70` vs `git diff --name-only 35ff2db..b6a3b47` |

**这五个是下限，不是上限。** 按本卡改动性质，还建议自行取用这几个横向维度（找到同类就列，没找到也说明扫过）：
- **同类资源的边界**：`drivers` / `actors` 两个 map 在仓里其它地方的删除时机与判据（`=== driver` 这种"删前先确认还是同一个"的守卫，别处有没有？写法一致吗？）
- **同类错误的处理**：仓里其它地方判别 `E_LEASE_HELD` 用的是什么手段——精确字符串比对（本卡用的 `String(error?.message ?? error) !== 'E_LEASE_HELD:actor-closed'`）、前缀匹配、还是结构化 reason/detail 字段？如果别处用结构化字段而本卡用字符串字面量，这就是一处典型的横向不一致。
- **异步生命周期的收口**：`await xxx.done` 这种"等 settle 再摘"的写法，仓里别处有没有？顺序假设一致吗？
- **命名与文件组织**：`evictClosedActor` 这个命名，和仓里同类清理函数的命名习惯一致吗？

## 硬边界

- 只读。跑不了测试就如实申报「仅静态审」。
- 只写事实与级别，不替主控做验收裁决。
- 裁定为「有意差异」的，说明理由该补进哪份设计文档或代码注释（避免下一个人当 bug"修"回去）——但**你不改文件**，只写建议。
- 密钥/凭据值永不出现在结论里。

## 产出格式

完整结论输出到 stdout（主控会落盘为 `review-consistency-codex.md`）：

```
## 形态自述

## 比对清单（扫了哪些维度、每个维度找到几处同类）
| 维度 | grep/搜索方式 | 找到几处同类 |

## 五个冻结比对对象（逐个）
### 1. 提交路由「当前持 lease 的 actor」
- 并排定义：
- 定义是否一致：
- 裁决（一致 / 有意差异 / 遗漏）：
- 依据：
（2~5 同）

## 自选维度的比对结果

## 不一致逐条裁决汇总
| 编号 | 不一致点 | 有意差异 or 遗漏 | 理由 | 建议落到哪 |
```
