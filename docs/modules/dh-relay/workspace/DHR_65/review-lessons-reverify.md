<!-- dh:v1 -->
# DHR_65 · 教训 fresh reverify

> 复核形态：独立 fresh、只读；核对 `c52feda..2c32180`、初审 `review-lessons-fresh.md`、DHR_63 L-6302 与 DHR_65 `lesson_candidates.md`。未改生产代码、测试、plan、progress、`review.md` 或其他报告；未读取用户级 registry、配置正文或凭据。

## 结论

**PASS（教训复核项）**。P0=0，P1=0，P2=0，P3=0；无新的候选教训（N/A）。这不是整卡 verify，也不解除 DHR_35。

## 逐项证据

- **L-6501 / DHR_63 L-6302**：`lesson_candidates.md:8` 已明确写出与 L-6302 重合，并把本卡新增内容收窄为 consumer mutation 的落证。该差异准确：L-6302 是“validator 拒绝不等于 loader 拒绝”的一般路径教训，L-6501 补的是实现级 mutation 证明；不再把两条伪装成独立根因。
- **L-6502 / 候选-11、候选-12**：`lesson_candidates.md:9` 是 synthetic fixture 的具体落地约束（完整 ID、可观测结构、fallback 图），与候选-11 的“同类目标清单逐项巡检”和候选-12 的“子集证据不得写全称”同族但不重复。最终测试 `dhr65-registry-loader.test.mjs:45-57` 枚举五个 Profile，保留 Codex main 空 fallback 与 Codex ninth→main 图；`:80-95` 对五个条目分别遍历 alias/config 负例，故 L-6502 不再过度声称覆盖面。
- **L-6503 / 候选-35、候选-39、候选-51**：`lesson_candidates.md:10` 将本卡两个具体护栏合并记录：显式 test list 的拾取证明，以及异步 pre-side-effect 检查的完成屏障/可清理 timeout。它没有声称替代既有一般条目；当前实现分别可核对为 `package.json:12` 已列 `test/dhr65-registry-loader.test.mjs`，以及测试 `:138-151` 等待 `driver.done`、8 秒 timeout 在 settle 时清除，并直接检查 Agent/pane/Attempt/Receipt/Result 为零。与候选-35/39/51 是应用关系而非重复候选。

## 收口边界核对

- `progress.md:32-34` 的 E-6513/E-6515 记录与最终测试形态一致：五 Profile、loader 全条目负例、alias/config 各一条 driver 负例、最终 mutation；未把 superseded 的 E-6503/E-6505 当最终证据。
- `progress.md:33` 的 E-6514 对 `npm test` 的陈述准确：专项文件已列入默认清单，但本次未获得完整 summary/exit，且可见既有 DHR_33 失败，因此没有把全量套件写成绿色。
- `c52feda..2c32180` 的生产/测试改动限于既有 loader、DHR65 专属测试与经 B-26 授权的 `package.json` 清单；其余为工作区/计划留痕。`E-6508`、`E-6516` 记录密钥卫生与 diff/audit 通过；本次未见新增用户 registry、配置正文或凭据披露。

## 新候选

N/A：本轮没有超出 L-6501~L-6503 及既有候选-11/12/35/39/51 的新、非重复教训。

LESSONS-REVERIFY-DONE
