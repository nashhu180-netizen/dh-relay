<!-- dh:v1 -->
# execution strategy — RLT_27

用户已确认 ThinkPad。本次只有 Linux Codex 主控目标；全部执行/复核使用不同 fresh Codex 实例，遵循专用 roles.toml，不覆盖全局默认模型。Herdr 使用独立具名 session rlt27-linux-codex-01，不能控制其他 session。

每阶段独立监工；只由监工写 agent/node/stage_result，编排只写计划/阶段控制。无 watch，等待必须有接收者。仅请求必要权限，权限被拒记录 blocked；不全局关闭安全机制。禁止同 worker 自审，不以主会话手写账本替代原生闭环。
