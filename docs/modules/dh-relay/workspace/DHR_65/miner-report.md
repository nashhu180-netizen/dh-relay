<!-- dh:v1 -->
# DHR_65 · Fresh lesson miner report

> miner：fresh lesson-miner worker；日期：2026-08-30

## 结论

产出 3 条真正新的、可复用且与候选区不重复的候选：候选-56～候选-58。未再从代码轮/需求轮的复核事实中额外抽取重复项。

`review-lessons-reverify.md` 的“新候选 N/A”表示本轮没有超出 DHR65 已收敛的 L-6501～L-6503；这三条尚未进入全局候选库，故本 miner 将其按去重规则落为候选-56～58。

## 去重核对

| DHR65 候选 | 全局邻近条目 | 保留理由 |
|---|---|---|
| 候选-56（L-6501） | 候选-6、候选-45 | 不是泛化“变异要真红”，而是专门证明 runtime consumer 没有绕开 formal validator 的严格选项/分支。 |
| 候选-57（L-6502） | 候选-11、候选-12 | 不是一般清单覆盖或结论粒度，而是 live 产物不可读时 synthetic fixture 的 ID、字段形状与关系图必须结构等价。 |
| 候选-58（L-6503） | 候选-35、候选-39、候选-51 | 将新测试文件的 runner 拾取与异步负例终态/平台耗时预算作为一个有效单测登记的联合门槛；不是重复任一单项。 |

## 输入与写入边界

- 已核对 `review.md`、`findings.md`、`progress.md`、全部 fresh/reverify review reports，以及全局候选库的触发场景。
- 仅写入全局候选库追加候选-56～58，以及本报告；未写正册，未触碰代码、计划、复核报告或其他工件。
- 产出数：3。

LESSON-MINER-DONE
