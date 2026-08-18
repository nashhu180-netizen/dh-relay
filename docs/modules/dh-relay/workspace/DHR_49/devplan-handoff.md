# DHR_49 — P4 DevPlan 本地同步建议

用户原话写的是「DHR40」，但 P4 现役任务表中 Client 半程是 **DHR_49**；DHR_40 属 P7 且受 P6 Gate 阻塞。本分支按 P4 目标实现 DHR_49，没有越权启动 P7。

## 任务索引行

```markdown
| DHR_49 | 找到树外 Client Bundle 可复现构建配方并做出列表屏 + 详情屏面板 | 标准 | 进行中 | DHR_26 | [workspace/DHR_49/](../workspace/DHR_49/) | | 代码开发完成；Windows/ThinkPad 实跑、列表中途人闸、两轮复核与收口由用户本地继续；不贴三态标签 |
```

## 状态块建议

- 现状：DHR_26/DHR_49 代码开发完成；Host 11/11、Client 10/10；DHR_49 本机 clean rebuild SHA `59dbd95c...`。
- 进行到：P4 ▸ DHR_49 进行中 ▸ 等本地 materialize、Windows DSH 两屏与 ThinkPad 换机证据。
- 下一步：按 `workspace/DHR_49/review.md` 首次打开列表屏并执行中途人闸；再补详情/刷新/重启/生命周期与换机证据。
- 阻塞：当前执行环境无用户 Windows DSH_HOME、浏览器与 ThinkPad SSH；不能代验 UI 或跨机。

本文件只提供机械同步建议；本分支不整文件覆盖 P4 权威 DevPlan。
