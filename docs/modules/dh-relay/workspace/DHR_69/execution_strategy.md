<!-- dh:v1 -->
# execution_strategy — DHR_69

## 操作模型

solo：本会话主控自干，过程可见、不分批。修法落在**观测层**——`observeHerdrAgent` 仅在 `agent get=idle` 时多读一次 `pane get`，派生 `blocked` 后启动 / 轮询 / recovery 三时点共用同一结论。E-1 先取证（普通 shell pane，不启动产品 Agent），再按形态编 fake，再写红测，再最小实现。

## 收尾铁律

- 交叉核对**只在 idle 时发起**；pane 的非 `blocked` 取值不得覆盖 agent 观测。
- 不代产品做信任决定：假就绪的唯一正确产物是给人看的 Attention，不是自动按键、不是自动信任、不是改信 `agent get` 放行。
- `instructionPending` 只保证**单个 driver 届内**恰补发一次；跨进程重启的重复发送是明示接受的已知限制，须在一致性复核文字里登记。
- 两信号持续打架只升级为可见暂停，不自动判节点失败、不改 Result 语义。
- 所有改动限制在 DevPlan DHR_69 的逐条允许路径；`package.json` 只追加一个测试文件名。
- E-1 拿不到真实形态就 fail-closed 停下，不得用 DHR_68 的对照表冒充本卡 probe。
