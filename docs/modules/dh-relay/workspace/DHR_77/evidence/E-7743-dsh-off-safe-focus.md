<!-- dh:v1 -->
# E-7743 · DSH-off 安全 focus 等价终端渲染

## 受控 Herdr 对照面

```text
surface: controlled-herdr-api
agent_kind: codex
observed_state: idle
host_ref: herdr-terminal/sha256-5de0e6f053d7f2943116ff4c948377b7e5fd35784499a43247ca833a3d03c3bc
source_value_persisted: false
```

对照标签由当前右侧 Herdr agent 的 API 返回值在内存中按冻结算法现场计算；源值未输出、未落盘。下方使用候选提交的生产 `renderFocus` 生成等价终端渲染，只注入上面的脱敏标签。

## DSH-off focus 安全投影

```text
--- current ---
node_id: node-a
at: 2026-09-06T00:00:00.000Z
observation_status: alive
host_ref: herdr-terminal/sha256-5de0e6f053d7f2943116ff4c948377b7e5fd35784499a43247ca833a3d03c3bc
host_ref_label: 当前观测
executor_ref: dhr77b46
attach: herdr agent attach dhr77b46

--- history ---
node_id: node-a
at: 2026-09-06T00:00:00.000Z
observation_status: observation_lost
host_ref: herdr-terminal/sha256-5de0e6f053d7f2943116ff4c948377b7e5fd35784499a43247ca833a3d03c3bc
host_ref_label: 历史观测
executor_ref: dhr77b46
attach: herdr agent attach dhr77b46

--- none ---
node_id: node-a
at: 2026-09-06T00:00:00.000Z
observation_status: observation_lost
host_ref: -
host_ref_label: 尚无可信 terminal 标签
executor_ref: dhr77b46
attach: herdr agent attach dhr77b46

--- legacy ---
node_id: node-a
at: 2026-09-06T00:00:00.000Z
observation_status: alive
host_ref: -
host_ref_label: legacy 未提供
executor_ref: dhr77b46
attach: herdr agent attach dhr77b46
```

机器断言：两面对照的非空 `host_ref` 逐字相同；current/history/none/legacy 四态分流成立；默认安全投影禁项未输出。此证据只供 HC-HR-H1 人判，不是 DHR_35 Receipt→Result 真实闭环证据。
