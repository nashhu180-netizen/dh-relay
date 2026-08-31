<!-- dh:v1 -->
# execution_strategy — DHR_68

## 操作模型

先用**真实 herdr** 把本卡触及的每个动词的输出形态逐条量出来（验收项 D，也是本卡存在的原因），据此校正 fake 的返回形态；再写红测钉住 A/B/C 三条语义；最后在 adapter 与 driver 的启动段做最小接线。三条缺陷共用同一段代码（`launchHerdrAgent` 的 `!start.ok` 分支 + driver 的 launch 段），所以按"先对账、后 blocked、再 driver 事件"的固定顺序改，避免相互掩盖。

## 收尾铁律

- **超时对账只读不写**：命中就沿用既有 handle 路径，未命中才关本卡刚创建的那个 pane。**永不重发启动调用**——重试会在真实宿主上拉起第二个 Agent 进程。
- **不代产品做信任决定**：启动期 `blocked` 的唯一正确产物是一条给人看的 Attention，不是自动按键、不是自动信任、不是自动重试。
- Herdr 的 `done`、pane 文本、exit code、`agent_not_ready` 都不是 Result 来源；driver 的 Result 判定一行不动。
- 真实观测拿不到就 fail-closed 停下回报，**不得以 fake 覆盖冒充真实形态**。
- 所有改动限制在 DevPlan DHR_68 的逐条允许路径；`workflow-driver.mjs` 只碰启动期 blocked 的事件路径。
