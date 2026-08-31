<!-- dh:v1 · dev_plan/drafts/DHR-B-33-verify-brief.md -->
# DHR-B-33 定向复审（验证性）brief

## 你是谁

你是**第三名** fresh 只读复审实例，代号 `b33ver1`。前两名（`b33rev1` / `b33rev2`）已出过一轮结论，主控已全部采纳并改稿。**你不参与重开那一轮**——你只干两件事：

1. **核落地**：`W-01`~`W-09` 九条裁决是不是**真的**落进了 v2 草案，还是只在文字上"表示采纳"。
2. **核新伤**：这轮整改**本身**有没有引入新问题、新的过头表述、新的不可证承诺。

## 只读硬约束

`--sandbox read-only`。**不得**写/改/删任何文件，不得 `git add/commit`，不得跑测试，不得启动 codex / claude 产品实例。主控会比对派出前后的 `git rev-parse HEAD` 与 `git status --porcelain`。

## 读什么

| 文件 | 读什么 |
|---|---|
| `docs/modules/dh-relay/dev_plan/drafts/DHR-B-33-Claude假就绪blocked盲区-候选.md` | **v2 草案，主要对象** |
| `docs/modules/dh-relay/design/evidence/33-DHR69-Claude假就绪blocked盲区-B调整交叉审核记录.md` | §1.2 裁决总表 = 九条裁决的权威口径 |
| `relay-core/runtime/workflow-driver.mjs` | 启动段、recovery 段（`:274`）、轮询循环（`:333` 补发判据、`:351` done\|\|idle 分支）、`:33-34` 的既有超时常量 |
| `relay-core/runtime/executors/herdr/herdr-executor.mjs` | `launchHerdrAgent`、`observeHerdrAgent` |
| `relay-core/runtime/executors/herdr/herdr-cli.mjs` | `paneGet`（核 `W-05` 的判断对不对） |
| `docs/modules/dh-relay/design/13-目录信任自动放行-产品设计与验收.md` | §0、§4.1 的 `A27-M7/M10/M11`、§6、§7 |

## 特别核这五件事

1. **`W-01` 的整改是否真的堵住了那个洞**。新写的"持续不一致超 `T` 就升级 Attention、指令继续扣住"——**这仍然是个永久等待**，只是变得可见了。这够不够？还是说存在一条更好的收敛路（比如超 `T` 后改信 `agent get`、或主动重读、或直接把节点判失败）？**如果你认为"可见的永久等待"仍不可接受，明说。**
2. **`T` = 60_000 ms 的选法**。草案说它与现役 `observationLostMs` / `doneTimeoutMs` 同形态。去 `workflow-driver.mjs:33-34` 核这句是否属实；并判断这个值会不会与既有的 `observationLostMs` 计时**互相干扰或重复报 Attention**。
3. **新错误码**。草案要求一个"专表宿主两个状态源持续打架"的新 `reason`，且不复用既有两个。这会不会**碰到"不改 contracts / Store 语义"这条非目标**？现役 `reason` 是不是一个闭集？去核。
4. **机器证 A~F 六条**：逐条判"这条证据真能证明这条命题吗"；有没有哪条其实是人判混进来了；`W-03` 收窄后的机器证 C 措辞是否仍有歧义。
5. **允许路径**：删掉 `herdr-cli.mjs` 之后，机器证 A~F 要求的实现**还做得出来吗**？（尤其 E-1 的 shape probe 落在哪个文件里？草案有没有给它落点？）

## 结论格式

固定三段：**一、落地核查（逐条 W-01~W-09 判「已落地 / 部分落地 / 未落地」+ 依据）**；**二、整改引入的新问题**（写「问题 → 依据（文件:行）→ 影响 → 建议」+ P0/P1/P2）；**三、需要用户决定的问题**。

**没有新问题时也必须列出你核过的假设与找过的反例。** 不接受一句"通过"。结论直接打在终端，不要写文件。
