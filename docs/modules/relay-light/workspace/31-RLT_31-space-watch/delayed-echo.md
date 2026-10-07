# ECHO-01 · 同space通知完成回声（开放缺口）

2026-10-07 主会话补测：使用 test_space_watch.FakeHerdr，将 orch 放入w68，建立基线；toy-builder 变done触发第一条通知。随后每轮仅让 orch 完成前一条通知（working→done、seq+1），共3轮。观察结果：总计4条通知；没有新的worker业务变化。

复现命令（仓根；无需Herdr环境或实时操作）：

```bash
python3 - <<'CODE'
import sys
sys.path.insert(0, 'tools/relay-light')
from test_space_watch import FakeHerdr
from space_watch import SpaceWatch
h = FakeHerdr()
h.rows[2]['workspace_id'] = 'w68'
w = SpaceWatch('w68', 'orch', None, h, {'HERDR_ENV':'1', 'HERDR_PANE_ID':'pane-watcher2'})
w.poll()
h.rows[1]['agent_status'] = 'done'
w.poll()
for _ in range(3):
    h.rows[2].update(agent_status='done', state_change_seq=h.rows[2]['state_change_seq']+1)
    w.poll()
assert len(h.sent) == 1, f'delayed completion echo: {len(h.sent)} notifications'
CODE
```

业务assert预期RED：AssertionError delayed completion echo: 4 notifications。已有after-state修正仅消除瞬时回声，不消除通知处理完成的后续状态；旧PASS只覆盖它们各自的定向用例，不可据此将整卡判PASS。

这是通知因果边界，不改现有真实演练、不补跑、不伪造seq。用户方向待定：要求编排在监控space外并同space报BLOCKED；或保留同space支持但等待能可靠区分因果的回执。不以额外排除编排绕过全成员范围。确认前不改依赖该决定的脚本/协议。

实际执行：上述assert exit=1，AssertionError: delayed completion echo: 4 notifications；2026-10-07 Codex /root。原脚本未改，RED保留。

## 用户范围修订后的整改证据（2026-10-07）

用户明确主编排不属于被监控对象；此前方向建议和after-state方案已被该明确裁决替代。每轮get通知对象的实际pane，仅排自身与主编排，其余本space成员全部动态监控。完整通知生命周期测试PASS，一次worker变化仍只有一条通知。

定向业务mutation：临时删去主编排pane排除条件，生命周期测试业务断言RED（exit=1，AssertionError：预期空diff却观察orch状态变化）；随后恢复精确原始字节，sha256=f7ae3eed7b2b7651a32a87903e54c3f6bb030eb234748fd02b0ac881f77c5ad8，同一断言GREEN（exit=0）。原始4条通知RED完整保留；此证据是本地fixture，不替代SW6真实Herdr。
