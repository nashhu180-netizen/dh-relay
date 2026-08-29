<!-- dh:v1 -->
# execution_strategy — DHR_62

## 操作模型

Codex 在独立 worktree 逐批施工；每批以 dh failure 数下降为硬反馈。

## 子 agent 授权

用户指定施工 Codex、复核 Opus。Opus 只读审查最终 diff，不改代码或工件。

## 收尾铁律

不绕过 hook；不把 warning 扩进范围；没有源证据的历史结论不得补绿。
