<!-- dh:v1 · progress.md — 事实时间线。🟢 只追加已发生事实。 -->
# progress — DHR_49

> **流程标记：失序补录。** GitHub connector 施工顺序先落 transport mirror 代码、后补八件套；用户已明确授权代码开发，但文件落户顺序违反 AGENTS 入口闸，故在此留痕，不伪装正常流程。

## 当前状态

- DevHarness 状态：**进行中**。
- 代码开发：列表屏、详情屏、Node bridge、构建与测试均完成。
- 真实 DSH / ThinkPad / 人判 / 复核 / 收口：未执行。

## 时间线（2026-08-18）

1. 最终分支父提交锁定为 DHR_26 `155dd831`，按其 `findings.md` 继承 rc.7 Client 发现合同：`dsh.client` + `exports['./client']` + profile `ctx.baseUrl` + module-loader factory。
2. 查 DSH rc.7 platform module table，确认 React/JSX runtime/slots/primitives 属共享 browser modules；最终实现仅运行时 require React，进一步缩小依赖面。
3. TDD 完成独立 Client model：源 group/顺序保留、group 变更会移动、只变 status 分组签名不变、未知 group 原样、特殊 run_id own-key。
4. 放弃依赖 monorepo `tsdown.client.ts`，改为无依赖 Node builder；统一 CRLF/LF 后包进 rc.7 `window.__ModuleLoader__.load` wire。
5. 清净删除 `lib/` 连续构建两次，SHA256 都为 `59dbd95c583b3ee57c74c69b9eca497147c81687fe3b299bb123a22eb99ff5ae`。
6. 完成 Node read-only route：GET/HEAD snapshot，POST=405，no-store，effect disposal；完成 sidebar footer trigger、列表、详情、Refresh/Back/Close。
7. 自动化 10/10 PASS；Host + Client 组合 21/21 PASS；pack dry-run 在 prepare 后包含 11 个文件、零 bundled dependency。

## 列表中途闸的受限偏离

DevPlan 要求列表屏首次真实渲染后暂停，再决定详情屏。当前环境无法启动用户 Windows DSH；同时用户本轮明文要求两张卡一直做到「代码开发完成」，所以详情代码已实现。**这只解释实现授权，不等于列表体验已验收**：本地首次打开列表时仍必须暂停、亲跑、逐条分类 (i)/(ii)/(iii)，并把结论回填 `review.md`。若用户判定停止，已写详情代码可随 Client package 一并禁用/移除，不得反向包装为中途闸已通过。

## 未执行事实

- Windows rc.7 Client scan/页面加载与真实截图。
- 浏览器刷新、DSH 重启后的重建。
- ThinkPad Node 18 换机重建。
- Client install/disable/enable/remove 后 route/UI 清理。
- 两轮换人复核、P0/P1 收敛、`dh dh-relay`、verify。
