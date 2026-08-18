<!-- dh:v1 · lesson_candidates.md — 候选经验，不自动升格规范。 -->
# lesson_candidates — DHR_49

1. **公开 wire 比私有 build helper 更稳定**：Pilot 只需生成 module-loader factory 时，无依赖 builder 比复制 monorepo tsdown 配置更容易跨机复现。
2. **跨 OS 可复现先规范化换行**：源码被 Git 转成 CRLF 时，未规范化会造成 bundle hash 假漂移。
3. **第二客户端必须零共享业务推导**：Host 只供原始 JSON，Client 独立实现 group 读取和变异测试，才真正证明架构约束不是自证。
4. **代码完成不能补签 UI 人闸**：无法在目标 DSH 渲染时，应交完整复跑路径并保持 missing，而不是用 VM smoke/DOM 契约替代体验证据。
5. **Pilot transport 要显式降格**：本地只读 same-origin route 是验证工具，不应因“能用”滑成正式 Relay RPC。
