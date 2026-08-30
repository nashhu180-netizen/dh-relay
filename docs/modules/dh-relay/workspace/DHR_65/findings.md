<!-- dh:v1 -->
# DHR_65 · Findings

## 问题

| ID | 级别 | 状态 | 描述 | 处置 |
|---|---|---|---|---|
| F-6501 | P2 | open（承接） | DHR_63 已复现完整 registry 坏 alias 被 formal validator 拒绝、却被 runtime loader 接受；DHR_65 必须在 loader 层闭合，不能以 validator 负例替代。 | 先以脱敏完整结构等价副本写红测；只改本卡允许的 loader/test。 |
| F-6502 | P2 | open（承接） | DHR_63 golden fixture 与 live fallback 值级分歧，不能直接充当本卡所需完整正式 registry 结构等价副本。 | 测试自行构造不含配置正文或凭据、且与当前 fallback 语义一致的结构等价副本。 |
