<!-- dh:v1 · dev_plan/drafts/DHR-B-32-review-brief.md -->
# DHR-B-32 · B-调整方案审核 review brief（fresh-context / 只读）

> 你是**方案审核者**，不是施工者，也不是主控。只读不改任何文件。审完把结论**打印在终端**，由主控转录归档。
> 先读仓根 `AGENTS.md`（尤其「编排协议段 · worker 铁律」）：不要再拉终端、不要派活、不要起 watcher、不要回头问用户、不要自行加载 dev-harness skill。

## 你要审的东西

草案：`docs/modules/dh-relay/dev_plan/drafts/DHR-B-32-Herdr宿主真实接线缺陷-候选.md`

这是一个 **B-调整**（拆计划调整）候选：拟在 P6 开发方案中新增任务卡 `DHR_68`，并让 `DHR_35` 增加对它的依赖。

## 背景（一句话）

`DHR_35` 是 P6 里第一张真跑产品的卡（真实 Codex + 真实 Claude Code，DSH 关闭的 Windows）。它在 2026-08-31 的实录中撞到三条只有真实宿主才暴露的缺陷，全部位于 `DHR_35` 的禁改路径 `relay-core/runtime/executors/herdr/**`，因此提议新开一卡承接。

## 用户原始需求（对话原文，勿改写）

1. 「继续DHR35 开发」
2. 「如果无法绕过，怎么解决呢？」
3. 「这要做成固定的程序，以后不要用户自己按」
4. 「就是以后开新的项目，也能支持」
5. 用户在选项里明文选定：新开 `DHR_68` 一并修三条缺陷（而非只修其中一条、也非退回重开 `DHR_67`）。

## 可核查指针（请**自行核查**，不要只信本 brief）

> ⚠️ `DHR_35` 的工作区与证据**还没合进 master**，它们在分支 `wt/DHR_35` 上（HEAD `573572d`）。
> 在当前 master 工作树里用 `git show wt/DHR_35:<路径>` 读，例如：
> `git show wt/DHR_35:docs/modules/dh-relay/workspace/DHR_35/progress.md`
> 目录列表用 `git ls-tree -r --name-only wt/DHR_35 -- docs/modules/dh-relay/workspace/DHR_35`。
> 生产代码（`relay-core/**`）与 P6 计划在 master 上直接读即可。

- 缺陷证据：`docs/modules/dh-relay/workspace/DHR_35/evidence/f3508-root-cause/production-defects.json`
- 实录失败事件：`docs/modules/dh-relay/workspace/DHR_35/evidence/windows-codex/**`、`.../windows-claude/**`
- 证据账本：`docs/modules/dh-relay/workspace/DHR_35/progress.md`（E-3516~E-3522）
- 现役实现：`relay-core/runtime/executors/herdr/herdr-cli.mjs`、`herdr-executor.mjs`
- 现役夹具：`relay-core/test/helpers/fake-herdr.mjs`、`relay-core/test/herdr-adapter.test.mjs`
- 上游设计：`docs/modules/dh-relay/design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md` §4；`design/06-多控制面与Headless-SSH运行-设计补充.md` §11
- 现行计划：`docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md`（DHR_67、DHR_35 任务卡与 §3.1 索引表）

**至少独立核查一项仓库事实**（例如：`herdr-cli.mjs` 里 `paneRun` 是否真的以 `json: true` 调用；`fake-herdr.mjs` 的 `paneRun` 返回什么形态；`HERDR_STATUS_MAPPING.blocked` 映射到什么）。核查不了的要明说「无法核验」，不要含糊带过。

## 请特别盯的点

1. **是否真的不触发 A-full**：草案主张三条修法都是"实现对齐既有设计"，不改 design/12 与 design/06 的验收定义与稳定 ID。这个主张成立吗？尤其缺陷 C（启动期 blocked 返回 handle）是否实质改变了 Attempt/Result 语义或 `P6-RI-A4` 的命题。
2. **`DHR_67` 的处置是否诚实**：草案让它保持"已完成"但更正备注。这会不会让 P6 阶段闸误以为真实 Claude 启动已被覆盖？有没有更诚实又不推翻已 verify 提交的写法。
3. **允许路径是否够且不过宽**：`DHR_68` 列的五条路径能不能修完三条缺陷？有没有必须动却没列的（例如 driver、service）？有没有列了却不该动的。
4. **验收口径是否可证**：特别是「超时后先对账再决定是否关 pane」这条，fake CLI 能不能真正证明它；草案要求"一次真实 herdr 慢启动观测"是否可操作。
5. **依赖与批次**：`… → DHR_68 → DHR_35` 是否正确、是否成环、是否让 P6 的"第一个端到端 demo"进一步推迟到不可接受。
6. **藏在技术依赖里的产品取舍**：草案 §4 自陈了两个待用户决定的问题（默认时限取值、DHR_67 处置）。还有没有别的、被主控当技术细节顺手定了、其实该由用户拍板的。

## 输出格式（固定三段，打印在终端即可）

### 一、方案问题
逐条：`问题 → 引用的用户原始需求或你独立核查到的事实 → 影响 → 建议`。按 P0/P1/P2 标级。

### 二、用户理解风险
用户读了这个方案，最可能误解成什么？

### 三、需要用户决定的问题
哪些是产品取舍、主控不该代裁。

若你认为没有新增实质问题，也**必须**列出：你已核查的假设、你尝试过的反例、以及你据以下结论的证据路径。
