<!-- dh:v1 -->
# execution_strategy — RLT_26

- 标准档 / normal；本轮为手动委托施工，无 relay run/ledger。
- 施工：独立 Devin CLI 会话，模型 swe-2-max，headless print；不依赖 Fable hook 展示确认模型，后续只白名单提取导出元数据。
- normal 三路冻结：code-round1 / requirement / lesson，施工者不得兼任；独立复核由协调者在施工信号之后安排，当前 worker 不派发。
- 既有 design/mapping normal 两路冲突由 RLT_25 前置 A-adjust 处理；本卡按仓根宪章和用户三路裁决执行，不偷改映射。
- 一个文档一致性验收单元，不分多施工批；先失败断言，再同步正文，再局部/全量验证。
- 并行边界：其他任务树 WIP 不动；RLT_25 不与本卡同时写 skill。日志/会话原始导出在仓外私有运行目录，仅白名单事实进入工作区。
- 施工完成写独立 construction.DONE.md 并停；实现验收、独立复核、PR/CI、人验与发布分别记账。
