<!-- dh:v1 · lesson_candidates.md — 候选经验，不自动升格规范。 -->
# lesson_candidates — DHR_26

1. **仓外生产落点也需要可审查交接物**：用 transport mirror + fail-closed materializer，比偷偷改变 DevPlan 落点更诚实。
2. **JSON 字典不能默认用 `{}` 承载外部 ID**：`__proto__` 等合法字符串会污染原型；应使用 null-prototype map + own-key 查询，并写回归测试。
3. **静态生命周期证据不等于进程清理证据**：无 event/timer 只能降低风险，安装/禁用/卸载仍须目标机转录。
4. **Host/Client 应独立实现 fixture 读取，再对 canonical snapshot**：避免“两个客户端共用同一错误代码”制造伪一致。
5. **「测试全绿」不等于「断言在咬」**：本卡两次栽在这上面——第一次是测试只跑自造 fixture、接上真数据整棵插件树灭掉；第二次是新写的契约断言里 `\b` 被写成字面退格字符 0x08，正则匹配不到任何东西、违规文件照样全绿。**结论：钉边界的断言必须配变异对照**（故意写一份违规输入，看它是否见红），并把变异做成可复跑的 harness（本卡的 `contract-mutation-check.mjs` / `transcript-mutation-check.mjs`），而不是人工跑一次就算数。
6. **校验器不能拿被校验对象当期望来源**：`verify-transcript.mjs` 前两版都从转录自己声明的字段推出待核清单，于是「把 details 全删掉」也能判 IDENTICAL。**期望必须由调用方独立给出、并从磁盘重建**；重建时还不能复用被测代码的加载器，否则 oracle 与 bug 同步。
7. **把正确性押在安装拓扑上迟早会咬**：「不打包 Cordis、靠 profile 的 module fallback 农场解析」只在包被物理拷贝进 profile 树时成立，目录（`link:`）安装必然失败。**根因修法是让运行时零外部依赖**，不是在文档里禁掉一种装法。
8. **「禁用后不存在」≠「卸载后被清理」**：`disabled: true` 启动时 `apply()` 根本没执行，那份 `present:false` 只证明从未注册。要证清理，得让服务真的注册起来再卸（真 Cordis 里 `plugin` → `dispose`），或者把探针放在被卸载对象**之外**（包内探针会随卸载一起消失，只能验禁用态）。
9. **文档纠错要 append，不要偷改**：批次证据 README 与 progress 的旧结论被后续轮次推翻时，正确做法是在原处加 superseded 提示 + 在 append-only 时间线追一条纠错，而不是把旧句改掉装作没发生——后者会让「当时为什么这么判」永久丢失。
