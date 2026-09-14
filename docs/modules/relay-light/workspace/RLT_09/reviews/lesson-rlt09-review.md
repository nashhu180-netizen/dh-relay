<!-- dh:v1 -->
# lesson 复核 — RLT_09

- **复核者**：`rlt09-review2`（自报：Devin 会话，模型 swe-2-max）；路径：**lesson**（heavy 五路之一，与 code-round2 / consistency 同批并发）；只读复核，未改任何被审代码。
- **候选**：`wt/RLT_09` @ `2f5ea51`；基线 master `b6b7d66`。
- **输入清单**：`dispatch/README.md`、`dispatch/review.md`、`review.md`、`brief.md`、`task_plan.md`、`progress.md`、`findings.md`、`decision.1.md`、`review.plan.md`（W/W3/W4 四轮）、`check.C1..C5.md`、本卡 `lesson_candidates.md`（L-B2-01/L-B3-01/L-B4-01/L-B5-01）、`docs/modules/dh-relay/knowledge/教训库-候选.md`（候选-1~87 全文）、RLT_10 `lesson_candidates.md`（LC-1/LC-2/LC-3）与 `findings.md`（F-002）、RLT_03/05/07/08 `lesson_candidates.md`、code-round1 复核报告。

## 一、RLT_10 点名条目逐条核对

| 条目 | 内容 | 本卡核对 | 结论 |
|---|---|---|---|
| RLT_10 LC-1 | `Get-Command` 多 PATH 命中返回数组，`&` 字符串化失败 | 本卡零 PowerShell 改动（`tools/tests/**` 无 diff），场景不适用 | N/A |
| RLT_10 LC-2 | oracle 钉的行为点宿主文件落在 allowed-paths 闭集之外 | **同族复现但被正确处理**：本卡 F-001 是同一家族的「冻结合同要求写白名单闭集外路径」形态——§4.5.2 要求 planner-amend 写方案文件，A122 要求 actual ⊆ 三类白名单，方案文件不在其中。差异在于 RLT_10 是 oracle↔allowed-paths（裁决=扩 allowed-paths），本卡是 oracle 条款↔oracle 条款（裁决=①B 保闭集 + done.note 承载 + A-adjust 同步）。按 LC-2 建议动作核对：冲突在**施工前**由 W plan-review（P1-01）逮住而非施工中撞墙；worker 未自行选边或偷滤路径；走 findings 登记 → decide CONSULT → 用户点选 → RLT-A-07 最小 A-adjust → 重写 B4 → 复审 PASS 后才施工。LC-2 的「先停、先裁、后施工」内核逐字遵守；派出逮住它的是 fresh plan-review 而非派活前机械互查，说明该机械互查仍未落成显式步骤（教训的预防侧未完全生效、兜底侧有效） | 遵守（预防侧近失记录） |
| RLT_10 LC-3 / 候选-34 | 证据手抄必在独立复算时露馅 | 未见重犯：五批 E-ID 账本均含命令+exit+原始摘要，小审全部独立复跑。唯一近失：check.C2 逮到 E-B2-05「name-only 仅两份 Python」简写歧义（该 commit 实含三份 workspace 工件），audit 当场留注闭合——转录精度问题被复核流程捕获，未进结论 | 遵守（近失被逮，见 P3-3） |
| RLT_10 F-002 | `__pycache__` 二进制副产品曾入树（70d68b8） | **未重犯且教训已被机制化**：dispatch/README.md 把「跑回归后删 `__pycache__`、禁 `git add -A`」写成派活协议条款，五批证据行（E-B1-05..E-B5-06）逐批记录 `rm -rf` + `git status` 洁净；本分支 `git ls-files` 零 pycache 命中；复核者复跑后同法清理。恰是候选-13「把现场教训转成可勾选检查项」建议动作的正例 | 遵守（机制化正面实例） |

## 二、教训库候选区相关条目核对（相关者逐条，无关者略）

| 候选 | 相关性 | 结论与证据 |
|---|---|---|
| 候选-54（派工前 fresh 预审是最高 ROI 闸） | 高 | **遵守（正面实例）**：W 四轮 plan-review 施工前逮出 P1-01（oracle 互斥）、P1-02（快照算法污染对象库/无法按原始 bytes 恢复）、P1-03（oracle 字面不可执行），无一进入施工 |
| 候选-25（返工根因翻新→换路线） | 高 | **遵守（计划层形态）**：P1-02 的临时 Git index/tree 方案被 W3 复审判死根因（写 object database、clean/EOL filter 使 blob≠bytes）后，W4 直接换路线为仓外原始工作树快照，未沿 plumbing 加码 |
| 候选-13（写下教训≠生效，须转成检查项） | 高 | **遵守**：__pycache__ 教训转成 dispatch 条款 + 每批证据行；变异性教训转成 review.md「有效单测候选」五锚点表 |
| 候选-6/45/46（断言要咬、变异点唯一负责、护栏分对错） | 高 | **遵守**：review.md 冻结五变异锚点，code-round1 逐点确认各有真实断言兜底（如「仅护 stdout→cp1252 lint stderr 腿破」）；B3 RED 用断言变异而非伪称实现前失败 |
| 候选-30（词法防护挡不住 symlink，须双边 realpath/拒 symlink 祖先） | 高 | **遵守**：`_check_amend_allowlist` 对 proposed 逐祖先查 tracked+untracked 观察集（symlink 祖先即拒）；恢复走 `_require_plain_parents` 拒 symlink 父链 + `O_NOFOLLOW`/`os.symlink` 重建；穿越/绝对/目录反例逐项 exit 2 |
| 候选-72（脱敏做在打印步，不事后扫） | 高 | **遵守**：守门错误只回显 `exc.strerror` 不 echo 敏感路径；`test_sensitive_untracked_stays_out_of_object_database_and_durable_evidence` 断言 canary 正文/文件名/哈希不进 objects 与进程输出 |
| 候选-1（每个 reason 码有断言 + 静态守卫兜底） | 中 | **遵守**：A119/A120/A122/A123 新码各有专属断言；既有 `test_static_forbidden_primitive_and_pane_guards` 在 B4 逮住 tempfile/mkstemp/os.replace 三连（全量曾三红），改写为 O_EXCL 合规原语后复绿——守卫本身生效 |
| 候选-62/81（先量基线、证据归属分支拓扑） | 中 | **遵守**：B2 的「拒绝」证据在正式基线 `b6b7d66` 语义上取（git show 还原后跑），拒绝→通过前后链完整；复核者独立探针复现 |
| 候选-39（新测试须证被默认 runner 拾取） | 中 | **遵守**：单文件 unittest 套件，证据链记录用例数 143→145→146→159→162 逐批递增 |
| 候选-49/65/68（终态/变异证据以最终提交为基线） | 中 | **遵守**：E-ID 均绑定批次 commit；两路已完成的正式复核各自在复核候选 SHA 上重取证据 |
| 候选-74（skip 记账：条数+去向进结论） | 中 | **遵守**：全量结论一律写 `OK (skipped=2)` 并点名去向「既有 F-002 标记用例」，从不笼统称全绿 |
| 候选-41（阻断下游口径的事实升 findings 并点名 ID） | 中 | **遵守**：F-001 升 findings 并点名 HC-RL-A122/§4.5.2 冲突两端 |
| 候选-50（测试外部配置一律注入） | 中 | **遵守**：编码用例 env 白名单剔除 PYTHONUTF8/PYTHONIOENCODING 后显式注入；guard 用例全合成仓 + 显式 `--config-dir` |
| 候选-61 / RLT_03 L-003（负例钉稳定码不钉措辞） | 中 | **遵守**：新负例断言 `^lint: {rule} ` 编号前缀 + exit 码，不绑 detail 文案 |
| 候选-12 / RLT_05 L-013（结论不超证据、不伪造红） | 中 | **遵守**：B3 把「行为已绿」如实标注，用断言变异取 RED 并在证据中说明实现零改动；本卡另登记为 L-B3-01 |
| 候选-31/51/48/17（全量绿条件、挂死、环境假红） | 低 | 遵守/未触发：全量证据均带耗时与 skipped 计数；无挂死与环境假红事件 |
| 候选-36（机器证跑真产物真环境） | 低 | 遵守：验收对象全为仓内文件，测试即以真实文件/子进程为输入，无副本冒充 |
| RLT_08 LC-4/LC-5（同一 worker 多份合同互漂、首轮审≠穷尽） | 中 | **轻复发但被逮**：W3 复审发现 `findings.md` F-001 仍写「待裁决 BLOCKED」而 `task_plan.md` 已标 CLOSED——正是合同对合同漂移形态；整改轮全量复看机制（LC-5）生效，W4 闭合 |
| RLT_05 L-003（计划与设计不一致时 worker 不选边） | 中 | **遵守并扩展**：本卡把「不选边」从 plan↔design 漂移到 oracle 条款互斥场景——不可保守实现的矛盾只能改 oracle，走 A-adjust（见 P2-1(b)） |
| RLT_07 L-002（oracle 负例需越界时 skip 钉住） | 低 | 未触发：本卡无「满足 oracle 须越界」的施工期残余 |
| RLT_08 LC-6（信号 evidence= 引用须已在账本） | 低 | **遵守**：本卡全部 DONE 信号的 E-ID/commit 均在证据账本先行存在，小审未报悬空引用 |
| 候选-87（机器强制只读先探沙盒） | 低 | 本卡复核在宿主机直接执行、未声称沙盒只读；不适用 |

## 三、本卡 lesson_candidates.md 登记完备性

已登记四条（L-B2-01 断言随首触发规则漂移 / L-B3-01 断言变异红 / L-B4-01 先查静态守卫禁表 / L-B5-01 bytes 捕获 + env 白名单），均有现场证据、形态合规。

**发现两处「有证据且可复用」的现场未登记：**

### P2-1（该登记未登记）

- **(a) 业务仓白名单守门的快照取法**（`review.plan.md` P1-02 及 W3 复审、W4 闭合）：初版方案用临时 `GIT_INDEX_FILE` + `git add -A`/`write-tree` 取 before/after tree 差。两个独立缺陷均有冻结级证据：①`git add`/`write-tree`/`hash-object` 会把业务仓**含未跟踪敏感文件的**内容写进真实 `.git/objects`，与凭据红线冲突，且普通 status/diff 观测不到；②tree blob 经 clean/EOL filter，不等于工作树原始 bytes，不能支撑「按原值恢复」。可复用规则候选：「给任意业务仓做改动集守门/取证时，禁止经会写业务仓 object database 的 Git plumbing 造快照；用仓外受限目录保存工作树原始状态元组 `(kind, sha256, mode, symlink_target)`，并以 object database 递归指纹 + `count-objects -v` 双证零污染」。此教训对任何「仓内 diff 白名单」类工具通用，不登记则下个实现者大概率再次先想到 `git add`/`write-tree`。
- **(b) oracle 条款互斥/字面不可执行的正式闭合路径**（F-001 + P1-03 双实例 → `decision.1` → `evidence/08`）：「两条冻结条款不能同时成立」或「oracle 字面无法执行（撞另一冻结规则）」时，不可在代码层「保守实现」（矛盾没有保守解）、不可扩 fixture 冒充逐字满足；闭合路径 = findings 登记 → decide 出带授权代价的选项表 → 用户点选 → 最小 A-adjust（验收 ID 不增/不删/不改号）→ 同步下游引用 → 重审。本条是 RLT_10 LC-2 与 RLT_05 L-003 的增量形态（那两条覆盖 oracle↔allowed-paths 与 plan↔design 范围漂移，本条覆盖 oracle↔oracle 互斥），本卡两份实例均按此走通且留完整工件链。

### P3-1（登记格式）

四条已登记候选的「证据 / 去重」列只填证据、未填与库内候选的判重结论（如 L-B3-01 与候选-12/RLT_05 L-013、L-B2-01 与候选-61/候选-1 家族的邻接关系未标注），与表头「记录证据与去重结论」的约定差半步。

### P3-2（重犯/近失佐证记录，供 miner 点名）

- RLT_08 LC-4/LC-5 家族在 W3 轻复发（findings F-001 陈旧状态 vs task_plan CLOSED 的合同对合同漂移），被复审逮住、W4 闭合——流程兜底有效，可作 LC-4/LC-5 佐证而非新条目。
- 候选-34 近失：check.C2 逮到 E-B2-05 证据行简写歧义并当场留注，未流入结论。
- 候选-54 正面实例 +1：四轮 W plan-review 三条 P1 全部施工前拦截。

## 四、结论

**APPROVE_WITH_NITS** —— 库内相关条目与 RLT_10 三条候选无一重犯，__pycache__/LC-2/F-002 类红线教训均被机制化遵守；RLT_08 LC-4 家族有一次轻复发但被既有复审机制逮住闭合。P2-1 两条可复用现场未进 `lesson_candidates.md`（均可由 coder/编排在收口前补登记，不动代码），P3 三条为格式与佐证记录。本结论只写事实与级别，不代替验收、verify、人验或远端动作。
