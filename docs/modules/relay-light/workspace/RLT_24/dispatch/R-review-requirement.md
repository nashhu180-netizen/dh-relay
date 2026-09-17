# R2 · reviewer — 需求方向（标准档必做，代码轮 1 闭合后与教训路并发）

先读同目录 `README.md`。你是**复核**，只读不改、不提交，做完即停。**不采信施工者自述，自己回原始来源核。** 工作目录 `/home/nash/work/dh-relay/.dh-worktrees/RLT_24`。

## 判据（逐条 PASS/FAIL，FAIL 给 P1/P2 与整改动作）
1. **问题是否真被解决**：对照 DevPlan「#### RLT_24」问题陈述与 `workspace/RLT_11/findings.md` F-004——「关闭没有独立事件位也没有 outcome，关失败在账本里无处可写、连怎么发现失败都没定义」——交付后监工/编排是否确实能按 §12 第 1367–1368 行写出并定位一条失败关闭？
2. **A157 取证可信**：`workspace/RLT_24/evidence/` 与 progress 是否对阶段空间、编排空间**各**有一例；实跑/打桩是否明确标注；账本失败行是否合法（自己对 fixture 跑 `lint`）；按 `seq` / `object_id` 的检索是否是真实命令输出（自己复跑）；处置记录是否写明人工处置或「待人工处理」，没有冒称已处置；没有关闭任何真实在用的 herdr 资源。
3. **A158 兼容证据**：自己复跑 rlt12-win-01 字节哈希与 master 一致、新实现 lint 0、与旧实现 `status --json` 稳定字段比对（旧实现用 `git show master:tools/relay-light/relay_log.py` 取到临时目录）。
4. **非目标守住**：未改设计正文/DevPlan/skill/herdr、未追溯补记历史账本、未扩展资源类型、未新增 `status --json` 字段（对比 master 与本分支 `status --json` 键集合）。
5. **验收 ID 映射**：A2 / A155～A158 每条在 progress 证据账本或 review.md 有可核验的证据指针，没有把「设计已冻结」当成「已实现」。

## 产出
`workspace/RLT_24/review.requirement.md`（结构同 `R-review-code1.md` 的产出格式，含「复跑记录」节），并在 `review.md` 登记 requirement 行。信号：
```
DONE task=RLT_24 role=reviewer-requirement node=R2 status=<APPROVE|REVISE> ts=<ISO8601>
  summary: <一行，含 P1/P2 计数>
  artifacts: review.requirement.md, review.md
```
