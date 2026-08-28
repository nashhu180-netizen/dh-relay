// contracts.test.mjs — 把三道机器闸接进 `npm test`
//
// 为什么要有这个文件：批 2 收口时发现 `npm test` 在**零测试**时仍退出 0（findings F-020），
// 而 README 的「测试」段读起来像已可用——那是**空绿**，不构成任何证据。
// 本文件让 `npm test` 真的跑起来，并且**断言测试数量下限**，杜绝将来测试被删光又变空绿。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const run = (script, args = []) => {
  try {
    return { code: 0, out: execFileSync(process.execPath, [join(ROOT, 'tools', script), ...args], { cwd: ROOT, encoding: 'utf8' }) };
  } catch (e) {
    return { code: e.status ?? 1, out: (e.stdout || '') + (e.stderr || '') };
  }
};

test('校验器 selftest：golden 全过、negative 逐条命中写死的 reason code', () => {
  const r = run('validate.mjs', ['--selftest', '--json']);
  assert.equal(r.code, 0, `selftest 未通过：\n${r.out}`);
  const j = JSON.parse(r.out);
  assert.equal(j.fail, 0);
  // ⚠️ 相等，不是「至少」（批次检查点 3 小审 P3-2）：negative 的下限首版写 >= 20 而实际 21，
  // 删掉任意一份、或把它改名成 .json.bak，份数掉到 20 仍绿。份数断言的全部意义就是防这个，
  // 松一格等于没有。基准取自盘上实际文件数——manifest 那道闸再保证盘上这批就是过审时那批。
  const dir = join(ROOT, 'fixtures');
  const goldenOnDisk = readdirSync(join(dir, 'golden')).filter(f => f.endsWith('.json')).length;
  const negOnDisk = readdirSync(join(dir, 'negative')).filter(f => f.endsWith('.json') && !f.endsWith('.expect.json')).length;
  assert.equal(j.golden.length, goldenOnDisk, `golden 跑到的份数与盘上文件数不等：${j.golden.length} vs ${goldenOnDisk}——有 fixture 被静默跳过`);
  assert.equal(j.negative.length, negOnDisk, `negative 跑到的份数与盘上文件数不等：${j.negative.length} vs ${negOnDisk}——有 fixture 被静默跳过`);
  assert.ok(goldenOnDisk >= 17 && negOnDisk >= 30, `fixture 总量塌陷：golden=${goldenOnDisk} negative=${negOnDisk}`);
  for (const g of j.golden) assert.ok(g.ok, `golden 应通过：${g.file}`);
  for (const n of j.negative) assert.ok(n.ok, `negative 应被拒、且 reason 与出错位置均相符：${n.file} 期望=${n.expected}@${n.expectedAt} 实得=${n.got}@${n.gotAt}`);
  // 每份反例都必须登记 at，不给「老 fixture 可以不写」的宽容通道（批次检查点 3 小审 P3-1）
  for (const n of j.negative) assert.ok(typeof n.expectedAt === 'string' && n.expectedAt.startsWith('/'), `${n.file} 的 .expect.json 缺 at`);
});

test('fail-closed：未知字段 / 未知版本有反例钉住；能力不匹配只有形态例', () => {
  // ⚠️ 用例名此前写「fail-closed 三条各有一份反例钉住」，而断言只覆盖两个码 + 第三条只查文件存在
  //（E4 需求复核 P2-2）。测试标题是下游最先读到的东西，7/7 绿会让 DHR_29 相信三条都被钉住了；
  // inline 注释是诚实的，但注释不进测试报告。这正是本卡反复在堵的「形态冒充语义」，
  // 只是这次发生在**测试名**这一层。名字已改准，欠账写进断言消息。
  const need = ['E_UNKNOWN_FIELD', 'E_UNSUPPORTED_VERSION'];
  const dir = join(ROOT, 'fixtures', 'negative');
  const reasons = readdirSync(dir).filter(f => f.endsWith('.expect.json'))
    .map(f => JSON.parse(readFileSync(join(dir, f), 'utf8')).reason);
  for (const r of need) assert.ok(reasons.includes(r), `缺少触发 ${r} 的反例`);
  // 能力不匹配是**运行期比对**，契约层只能校验指纹形态——见 capability-mismatch.expect.json 的 why
  assert.ok(readdirSync(dir).includes('capability-mismatch.expect.json'),
    '缺少能力指纹形态反例。⚠️ 欠账：契约层只能校验 capability_hash 的**形态**（^[0-9a-f]{64}$）；'
    + '指纹**比对**属 RPC 运行期语义，本卡未证，移交见 findings F-064');
});

test('H6 契约级断言有反例钉住（验收口径第 3 条唯一落点）', () => {
  const dir = join(ROOT, 'fixtures', 'negative');
  const reasons = readdirSync(dir).filter(f => f.endsWith('.expect.json'))
    .map(f => JSON.parse(readFileSync(join(dir, f), 'utf8')).reason);
  assert.ok(reasons.includes('E_DSH_ONLY_REQUIRED_ROLE'), '缺少「必经角色只声明 dsh-agent」反例');
  // D-11：required 改必填后不再 fail-open —— 也要有反例
  assert.ok(readdirSync(dir).includes('h6-required-omitted.expect.json'), '缺少「不标 required」反例');
});

test('DHR_30 冻结的两份新协议各有正例，且六个新 reason code 全在权威全集里', () => {
  // design/08 §1 把 relay.rpc-methods/v1 与 relay.client-read-model/v1 与既有七份一起冻结。
  // README 的不变量是「每份已冻结 schema 至少一份正例」——新增两份如果没有 golden，
  // 冻结的只是文件，不是可复算的形状。rpc-methods 的 params/result 都是 $defs，
  // 它的正例由 relay.rpc/v1 的 request/response golden 承载（见下一条映射表用例）。
  const goldenDir = join(ROOT, 'fixtures', 'golden');
  const readModelGolden = readdirSync(goldenDir)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(readFileSync(join(goldenDir, f), 'utf8')))
    .filter(doc => doc.protocol === 'relay.client-read-model/v1');
  const views = new Set(readModelGolden.map(doc => doc.view));
  for (const view of ['run_list', 'status', 'detail', 'event_stream_snapshot']) {
    assert.ok(views.has(view), `relay.client-read-model/v1 的 ${view} 视图缺正例`);
  }
  const codes = readFileSync(join(ROOT, 'contracts', 'reason-codes.md'), 'utf8');
  for (const code of ['E_CLIENT_NOT_AUTHORIZED', 'E_SERVICE_IDENTITY_MISMATCH', 'E_SERVICE_NOT_READY',
    'E_REQUEST_IN_FLIGHT', 'E_CURSOR_GAP', 'E_LEGACY_READ_ONLY', 'E_ORPHAN_STORE_READ_ONLY']) {
    assert.ok(codes.includes(`\`${code}\``), `reason-codes.md 未登记 ${code}`);
  }
});

test('design/08 §1 的 CLI↔RPC method↔Read Model 映射表逐行经冻结契约校验', async () => {
  // 映射表此前只是文档里的一张表：改坏任何一行（换 view、换 result 形状）都不会红。
  // 这里把七行逐行造成真帧，用同一份冻结 schema 校验 params 与 result 两端。
  const { loadAjv, validateOne } = await import(new URL('../tools/validate.mjs', import.meta.url));
  const { ajv, byId } = loadAjv();
  const handshake = {
    protocol_version: 'relay.rpc/v1', runtime_version: '0.0.0',
    capability_hash: 'a'.repeat(64), client_id: 'cli-1', request_id: 'req-1',
  };
  const statusView = {
    run_id: 'RUN-1', source: 'runtime-v2', read_only: false,
    host: 'alive', host_detail: null, ledger: null, events: 3,
  };
  const receipt = JSON.parse(readFileSync(join(ROOT, 'fixtures', 'golden', 'launch-receipt.v2.json'), 'utf8'));
  const rows = [
    ['list', 'listRuns', { include_legacy: false },
      { protocol: 'relay.client-read-model/v1', view: 'run_list', items: [] }],
    ['status', 'inspectRun', { run_id: 'RUN-1', view: 'status' },
      { protocol: 'relay.client-read-model/v1', view: 'status', source: 'runtime-v2', read_only: false, status: statusView, detail: null }],
    ['inspect', 'inspectRun', { run_id: 'RUN-1', view: 'detail' },
      { protocol: 'relay.client-read-model/v1', view: 'detail', source: 'runtime-v2', read_only: false, status: null,
        detail: JSON.parse(readFileSync(join(ROOT, 'fixtures', 'golden', 'run-state.v1.json'), 'utf8')) }],
    ['events --follow', 'subscribe', { run_id: 'RUN-1', after_seq: null },
      { protocol: 'relay.client-read-model/v1', view: 'event_stream_snapshot', run_id: 'RUN-1', snapshot: statusView, snapshot_seq: 2, next_seq: 3 }],
    ['start', 'start', { run: JSON.parse(readFileSync(join(ROOT, 'fixtures', 'golden', 'run.v2.json'), 'utf8')) },
      { receipt }],
    ['stop', 'control', { run_id: 'RUN-1', action: 'stop' }, { receipt }],
    ['resume', 'control', { run_id: 'RUN-1', action: 'resume' }, { receipt }],
  ];
  for (const [cli, method, params, result] of rows) {
    const request = validateOne(ajv, byId, 'relay.rpc/v1', { jsonrpc: '2.0', id: 1, method, handshake, params });
    assert.ok(request.ok, `${cli} → ${method} 的 params 不合冻结契约：${request.reason}@${request.at}`);
    const response = validateOne(ajv, byId, 'relay.rpc/v1', { jsonrpc: '2.0', id: 1, result });
    assert.ok(response.ok, `${cli} → ${method} 的 result 不合冻结契约：${response.reason}@${response.at}`);
  }
  // 反向：control 的 result 不得是 Read Model，listRuns 的 result 不得是 Receipt——
  // 结果并集是封闭的，但「哪一支属于哪个 method」只有映射表说了算，故逐行正校验。
  const strayed = validateOne(ajv, byId, 'relay.client-read-model/v1', { receipt });
  assert.equal(strayed.ok, false, 'Receipt 不该能冒充 Read Model');
});

test('fixture 基线对证：逐份 canonical sha256 与 manifest.json 相符，份数相等', () => {
  // 批次检查点 3 小审 P1-1：没有这道闸，`--selftest` 的 pass 数只能证明「当下盘上这批自洽」，
  // 证明不了「这批还是过审时那批」。DHR_29/30 拿这套 fixture 当契约回归基线，
  // 任何一份被悄悄改软都必须在这里红。
  const r = run('fixture-manifest.mjs');
  assert.equal(r.code, 0, `manifest 对证失败：\n${r.out}`);
});

test('JCS 规范化实现符合 CANONICALIZATION.md 口径', async () => {
  // CANONICALIZATION.md 定的口径此前只是散文，无人能复算（五个内容指纹字段因此形同虚设）。
  // manifest 逼出了实现，这里把口径的几条硬规定钉成回归。
  const { jcs, digest } = await import(new URL('../tools/canonical.mjs', import.meta.url));
  assert.equal(jcs({ b: 1, a: 2 }), '{"a":2,"b":1}', '对象键须按 UTF-16 码元序排序');
  assert.equal(jcs({ 'ä': 1, a: 2, A: 3 }), '{"A":3,"a":2,"ä":1}', '排序须是码元序，不是 locale 序');
  assert.equal(jcs([1, 2.5, -0, 1e21]), '[1,2.5,0,1e+21]', '数字须按 ECMAScript Number::toString');
  assert.equal(jcs('héllo'), '"héllo"', '非 ASCII 直出 UTF-8，不转 \\uXXXX');
  assert.throws(() => jcs(NaN), /JCS/, 'NaN 无 JSON 表示，须显式拒绝而不是静默变 null');
  assert.throws(() => jcs({ a: undefined }), /JCS/, 'undefined 须显式拒绝——静默丢键会让两个语义不同的对象算出同一指纹');
  assert.equal(digest({ x: 1, y: [1, 2] }), digest({ y: [1, 2], x: 1 }), '键序不得影响 digest');
  assert.notEqual(digest({ x: 1 }), digest({ x: 2 }), '语义改动必须改变 digest');
});

test('G2 聚合条款①~⑥逐档红绿矩阵（allOf 自身的回归护栏）', async () => {
  // 为什么要这条（E2 代码复核轮 2 · P2-1）：F-048 把七档聚合条款从 description 升成 allOf，
  // 这一步是对的（cp3 轮2 与 E2 各自穷举确认与条款等价）。但 **allOf 自身没有被任何东西钉住**——
  // E2 实测：删掉 6 条聚合分支里的**任意一条**，npm test / selftest / audit / manifest 四道闸**全绿**。
  // 对照组：group 映射那 6 条各有一份 negative fixture 钉住，删掉会红。
  // 于是「有人在 P7 演进 run-state 时改坏一条聚合分支」这条回归路径重新是空绿，
  // run_status=succeeded 配一个 failed 节点会原样复发——而那时不会再有「批 3 的校验器第一次能测它」这种红利。
  // 这是本卡第四次「修法本身下沉一层」（F-043→F-049、D-19→D-25、D-20→D-27 是前三次）。
  //
  // 本用例同时钉住 **allOf** 与 **条款正文**的对应关系：矩阵是照 description 里的①~⑦档写的，
  // 谁改条款正文而不改 allOf（或反过来），这里就会红。
  // ⚠️ **进程内判定，不 spawn**：原版每例 spawn 一个 node，14 例在负载下要 37 秒，
  // 而且 execFileSync 抛出的任何异常都会被当成「校验器拒绝」——「应 PASS」的用例会**假红**。
  // 「用退出码冒充语义」与本卡一路在堵的空绿是同一形态，只是方向反过来。
  const { loadAjv, validateOne } = await import(new URL('../tools/validate.mjs', import.meta.url));
  const { ajv, byId } = loadAjv();
  const gold = JSON.parse(readFileSync(join(ROOT, 'fixtures', 'golden', 'run-state.v1.json'), 'utf8'));
  const GROUP = { failed: 'failed', running: 'running', pending: 'running', waiting_human: 'needs_you', unknown: 'needs_you', succeeded: 'done' };
  const mk = (runStatus, statuses) => {
    const o = JSON.parse(JSON.stringify(gold));
    o.run_status = runStatus;
    o.group = GROUP[runStatus];
    o.node_states = statuses.map((st, i) => ({ ...JSON.parse(JSON.stringify(gold.node_states[0])), node_id: 'n' + i, status: st }));
    return o;
  };
  // [期望, run_status, 节点态] —— 前 7 例覆盖①~⑥各自的成立面，后 7 例覆盖各自的违反面
  const CASES = [
    [true,  'failed',        ['failed', 'succeeded']],          // ①
    [true,  'failed',        ['orphaned', 'running']],          // ① orphaned 归 failed 侧（D-19）
    [true,  'running',       ['running', 'pending']],           // ②
    [true,  'waiting_human', ['waiting_human', 'succeeded']],   // ③
    [true,  'unknown',       ['unknown', 'succeeded']],         // ④
    [true,  'pending',       ['pending', 'succeeded']],         // ⑤
    [true,  'succeeded',     ['succeeded', 'succeeded']],       // ⑥
    [false, 'running',       ['failed', 'running']],            // 违反①：有 failed 却不判 failed
    [false, 'running',       ['succeeded', 'pending']],         // 违反②：无 running 却判 running
    [false, 'waiting_human', ['running', 'waiting_human']],     // 违反③：有更高档 running
    [false, 'unknown',       ['waiting_human', 'unknown']],     // 违反④
    [false, 'pending',       ['unknown', 'pending']],           // 违反⑤
    [false, 'failed',        ['succeeded', 'pending']],         // 违反①反向：无 failed/orphaned 却判 failed
    [false, 'succeeded',     ['succeeded', 'pending']],         // 违反⑥：非全 succeeded（F-048 的原始失败场景）
  ];
  const bad = [];
  for (const [want, rs, sts] of CASES) {
    const r = validateOne(ajv, byId, 'relay.run-state/v1', mk(rs, sts));
    if (typeof r?.ok !== 'boolean') { bad.push(`${rs} + [${sts}] 校验器没给出布尔结论：${JSON.stringify(r)}`); continue; }
    if (r.ok !== want) bad.push(`${rs} + [${sts}] 期望${want ? 'PASS' : 'REJECT'} 实得${r.ok ? 'PASS' : 'REJECT ' + r.reason + '@' + r.at}`);
  }
  assert.deepEqual(bad, [], `聚合条款红绿矩阵不符：\n  ${bad.join('\n  ')}`);
});

test('capability 基线：10 份（9 顶层协议 + 1 共享定义模块）的 digest 与 capability_hash 与基线相符', () => {
  // DHR_30 把 relay.rpc-methods/v1 与 relay.client-read-model/v1 一并纳入指纹，故从 8 份变 10 份。
  // E4 需求复核 P1-1 + E2 代码复核 P3-3。CANONICALIZATION.md §三末句与 §四表第 1 行**逐字**
  // 把「跑出可复算的固定 digest 作为回归基线」写成批 3 交付项，首版没做——
  // 这是本卡「写进冻结契约的交付承诺静默没做」的第四次（F-047 是第一次）。
  // 它同时是 12 份契约的 digest 基线：manifest 钉的是 55 份 fixture，contracts/ 一份都没钉，
  // 而 schema 才是本卡真正冻结的工件。红测已验：只在某份 schema 的 description 末尾加一个空格 → exit 1。
  const r = run('capability-baseline.mjs');
  assert.equal(r.code, 0, `capability 基线对证失败：\n${r.out}`);
});

test('JCS：digestExcluding 不会被 __proto__ 键静默吃掉（原型污染回归）', async () => {
  // E5 教训复核 F-062，重蹈 DHR_26 已登记教训「JSON 字典不能默认用 {} 承载外部/未知键」。
  // 首版 `const copy = {}` 让 `copy["__proto__"] = X` 走了 Object.prototype 的 setter，
  // 该键从 Object.keys(copy) 里**消失** ⇒ 两份只在 __proto__ 上不同的载荷算出**相同摘要**。
  // 而本函数是 request_digest / payload_digest(×2) / plan_digest / state_signature 五分之四的实现，
  // 其中 request.params 与 result.structured 正是 OPEN-POINTS 登记的开放点 ⇒ 真实流量可达。
  // 四轮复核（cp1/cp2/cp3）全都没抓到，靠 E5 扫教训库扫出来。
  const { digest, digestExcluding } = await import(new URL('../tools/canonical.mjs', import.meta.url));
  const evil = JSON.parse('{"a":1,"__proto__":{"x":9}}');
  const evil2 = JSON.parse('{"a":1,"__proto__":{"x":8}}');
  const plain = JSON.parse('{"a":1}');
  assert.deepEqual(Object.keys(evil), ['a', '__proto__'], 'JSON.parse 应产出 __proto__ 自有属性——前提不成立则本用例失去意义');
  assert.notEqual(digestExcluding(evil, []), digestExcluding(plain, []), '__proto__ 键被静默丢弃：两份不同载荷算出同一摘要');
  assert.notEqual(digestExcluding(evil, []), digestExcluding(evil2, []), '__proto__ 的内容变化必须改变摘要');
  assert.equal(digestExcluding(evil, []), digest(evil), '排除空集时应与 digest() 等价');
  assert.equal(digestExcluding({ a: 1, b: 2 }, ['b']), digest({ a: 1 }), '排除功能本身不得被修坏');
  const proto = JSON.parse('{"constructor":1,"toString":2,"a":3}');
  assert.equal(digestExcluding(proto, []), digest(proto), 'constructor/toString 等原型同名键也必须保住');
});

test('契约静态审计 11 维度全绿', () => {
  const r = run('audit-contracts.mjs');
  assert.equal(r.code, 0, `审计未通过：\n${r.out}`);
  for (const line of ['未登记的开口: 0', '结构位置的非白名单厂商 token: 0',
    '条件收窄自验失败: 0', '命名约定违规: 0', 'meta-schema 关键字类型错: 0',
    '白名单↔OPEN-POINTS.md 不同步: 0']) {
    assert.ok(r.out.includes(line), `审计输出缺少「${line}」：\n${r.out}`);
  }
  assert.ok(/\$ref 实解析: \d+ 条，失败 0/.test(r.out), '$ref 实解析未全绿');
});

test('中立性：结构位置零私有类型泄漏（design/05 §6.2）', () => {
  const r = run('audit-contracts.mjs', ['--json']);
  const j = JSON.parse(r.out);
  assert.equal(j.vendorHits.length, 0, `私有类型泄漏：${JSON.stringify(j.vendorHits)}`);
});
