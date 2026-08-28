# DHR_30 Runtime 服务与 CLI 合同 · 交叉审核记录

<a id="review-a13"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-13 artifact=design/07-DHR30-Runtime服务.md kind=review -->

## A-13 · fresh-context 审核与裁决（2026-08-23）

**触发**：DHR_52 的 RPC server 只提供注入 seam，DHR_51 的 detached host 明确不开 RPC；因此
正式 CLI 缺少 Runtime 装配、发现和控制承接人（DHR_30 finding F-001）。

**独立审核**：六位未参与草拟的 fresh-context reviewer 先后审核 Runtime service、actor、操作
账本、端点/凭据、RPC/Read Model 与恢复边界。前五轮提出并收敛 descriptor fencing、唯一写者、
JCS、status 路由、operation ledger、订阅 barrier 与 credential 生命周期问题；第六轮结论
`approved`：两份正式输入已明确 schema/fixture/transport 的施工项目，未将 workflow、Process 或
executor 提前移入 DHR_30。完整逐轮事实、P0–P3、用户理解风险和裁决见
`workspace/DHR_30/review.md` 的 A-full 定向复审一至六。

**主会话裁决**：采纳所有 P1/P2 的合同收紧；其中「正式 schema、reason-code、fixture、baseline
与 server error path 同批修改」是 DHR_30 的施工内容，不要求在设计定稿前预改代码。采用一个
`runtime-operations.json`，废止 `runtime-requests.json`；按 RFC 8785 JCS 计算请求摘要；status
走 `inspectRun(view:"status")`；legacy v1 所有 control 拒绝。

<a id="understanding-a13"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-13 artifact=design/07-DHR30-Runtime服务.md kind=understanding -->

## 用户理解、问答与确认

**讲解**：CLI 不只是新增命令；它必须可靠连接一个项目级后台服务。后台服务保存任务与操作记录，
CLI/DSH/Pi 只经 RPC 访问；重复点击/断线重试回到同一任务；历史任务只读。项目文件保存运行
事实，用户私有文件保存本机访问凭据；服务、任务、操作记录与跨仓索引各有不同真相边界。

**一次一问的理解确认及用户回答**：

1. 后台控制是否由 DHR_30 承接、但不包含 DHR_31 的执行流程？用户答「按你的建议把」。
2. 连接当前服务、重复操作只生效一次的建议是否采纳？用户答「按你的建议把」。
3. service 内嵌任务守护、启动先记项目运行记录、当前 OS 用户私有凭据、legacy 全部 control
   拒绝是否采纳？用户答「按建议做」。

**结论**：用户已确认正式设计：DHR_30 可以实施仓库级 Runtime service、正式 CLI/RPC 合同与
条件 Bridge；DHR_31 的 basic-agent-task workflow/executor 仍未授权开工。

<a id="review-a14"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-14 artifact=design/08-DHR30-RPC与ReadModel合同.md kind=review -->

## A-14 · RPC/Read Model 合同定向审核（2026-08-23）

独立第六轮审核核对 method schema、JCS、operation ledger、Receipt/event/reason、subscribe barrier、
endpoint 及 legacy 投影，结论 `approved`。该合同把 A-13 已确认的服务边界落实为字段级施工输入，
未改变用户需求或引入 DHR_31 workflow/executor。

<a id="understanding-a14"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-14 artifact=design/08-DHR30-RPC与ReadModel合同.md kind=understanding -->

用户对 A-13 的「按建议做」同时确认了本合同承载的操作去重、当前服务验证、私有本机访问和
legacy 只读语义；本次仅把已确认选择展开为 RPC 字段和恢复规则，无需新增用户选择。
