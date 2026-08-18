# DHR_26 — P4 DevPlan 本地同步建议

本分支没有整文件替换 500+ 行的权威 P4 计划，避免 GitHub connector 因内容截断造成旁路损坏。同步到本地时只做以下机械更新，并在 `progress.md` 留一笔。

## 任务索引行

```markdown
| DHR_26 | 树外装载 DSH Host Plugin、升级到 rc.7 并完成树外插件现场侦察 | 标准 | 进行中 | DHR_25 | [workspace/DHR_26/](../workspace/DHR_26/) | | 代码开发完成；Windows rc.7 接线、版本证据、两轮复核与收口由用户本地继续；不贴三态标签 |
```

## 状态块建议

- 现状：DHR_26 代码开发完成，Host 11/11；目标机 rc.7/生命周期/复核未做。
- 进行到：P4 ▸ DHR_26 进行中 ▸ 等用户本地 materialize 与目标机证据。
- 下一步：用户本地按 `workspace/DHR_26/review.md` 复跑；证据齐全后再发起两轮复核。
- 阻塞：当前执行环境无用户 Windows DSH_HOME 与 B-10 预采文件，不能代验。
