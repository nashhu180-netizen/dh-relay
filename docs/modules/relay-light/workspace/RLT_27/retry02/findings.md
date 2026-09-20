# findings — RLT_27

- 已知：normal/heavy 配置与宪章不一致，RLT_25/A12 冻结；本次 light=lesson+consistency 双方一致，结果不可外推 normal/heavy。
- 已知：RLT_26 文档同步未复核，不使用其补丁；当前源 SKILL 的 lint --json/计数/stage_result 旧说明以已实现程序与当前冻结设计核实，不能隐瞒文档滞后。
- 已知：历史 Linux bwrap 失败不证明本次仍失败；权限故障先记实际失败，不无条件 bypass，不伪造 HERDR_ENV。
- C1 实测 Herdr 0.9.0 的 `agent start` 仅判交互就绪，`agent prompt --wait` / `agent wait` 仅判检测状态；尤其目标已在 `working` 时，`prompt --wait` 不保证匹配本次提交的 turn，durable 完成仍须核对指定产物与唯一信号。
