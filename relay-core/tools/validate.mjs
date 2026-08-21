#!/usr/bin/env node
// validate.mjs — relay v2 契约独立校验器
//
// 「独立」的含义（DHR_28 验收口径第 1 条）：不依赖 Runtime、不依赖任何工作台进程、
// 不读运行现场。给它一份 JSON 和一个 schema id，它只回答「合不合契约」。
//
// 为什么用 ajv 而不是手写：批 2 的教训（findings F-012）——主会话手写的探针
// 漏掉了「$id 绝对 + $ref 相对导致全部编译不了」这个 P1，而 ajv 一加载就报出来。
// 契约要能被「独立校验器」验证，就该用规范的参考实现去验，不是用自己写的近似品。
//
// 为什么显式引 ajv-formats（findings F-024）：JSON Schema 2020-12 把 `format` 放在
// Format *Annotation* 词汇表——默认只作注解、不做断言。不加载 formats，`format: date-time`
// 是空转的。契约里已并列写了 RFC3339 `pattern` 兜住下限，这里再开 format 做更严格校验。
//
// 用法：
//   node tools/validate.mjs <file> --schema <id> [--json]
//   node tools/validate.mjs --selftest            # 跑 fixtures/ 全量
// 退出码：0 = 通过；1 = 被拒（reason code 打到 stdout）；2 = 用法/加载错误

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTRACTS = join(ROOT, 'contracts');

// JSON Pointer 取值（只支持 ajv instancePath 会产出的形态：/a/b/0）。
// 用于判别字段的「同名异版 vs 异名」二分——需要拿载荷里的实际值与 const 期望值比较。
function pointerGet(obj, pointer) {
  if (!pointer) return obj;
  let cur = obj;
  for (const raw of pointer.split('/').slice(1)) {
    if (cur == null) return undefined;
    cur = cur[raw.replace(/~1/g, '/').replace(/~0/g, '~')];
  }
  return cur;
}

// ── ajv 错误 → 本契约的 reason code（contracts/reason-codes.md 是全集权威）──
// 顺序敏感：先判语义最具体的，再退到通用结构类。
function toReason(err, payload) {
  const kw = err.keyword;
  const path = err.instancePath || '';
  const schemaPath = err.schemaPath || '';

  if (kw === 'additionalProperties') return 'E_UNKNOWN_FIELD';
  if (kw === 'required') return 'E_MISSING_FIELD';
  if (kw === 'type') return 'E_BAD_TYPE';

  // H6：必经角色的 executor_profiles 里没有非 dsh-agent 成员
  if ((kw === 'contains' || kw === 'minContains') && /executor_profiles/.test(schemaPath + path)) {
    return 'E_DSH_ONLY_REQUIRED_ROLE';
  }
  // G5：locator 类字段的 pattern 失败。
  // 判据是 **$ref 目标**（schemaPath 指向 relay.common/v1 的 $defs/locator），不是 pattern 的
  // 特征子串（批次检查点 3 小审 P3-5）。首版按 `~%` 字符类 + scheme 前瞻两段特征串判，
  // 当下能命中，但它把「这是不是 locator」这件事挂在了**正则的写法**上：
  //   · 把字符类顺序写成等价的 [\\/%~]，三条 G5 反例会静默退化成 E_BAD_VALUE；
  //   · 更隐蔽的是反过来——新加一条 locator 类字段却用了不含这两段特征串的 pattern，
  //     它的 G5 违规会静默报成 E_BAD_VALUE 而无人察觉（没有任何 fixture 会红）。
  // $ref 目标是稳定的，字符类写法不是。
  if (kw === 'pattern') {
    // ⚠️ ajv 把 pattern 放在 err.params.pattern，**不在 err.schema**——首版取错了字段，
    // 三条 G5 反例全部错报成 E_BAD_VALUE，由反例实测抓出。此处保留只为文档化那次教训。
    if (/(^|\/)\$defs\/locator\/pattern$/.test(schemaPath)) return 'E_ABSOLUTE_LOCATOR';
    return 'E_BAD_VALUE';
  }
  if (kw === 'format') return 'E_BAD_VALUE';
  if (kw === 'enum' || kw === 'const') {
    // 判别字段（rpc 握手叫 protocol_version，其余 6 份协议叫 protocol）。
    // ⚠️ 这里必须二分，不能一律判 E_UNSUPPORTED_VERSION（批次检查点 3 小审 P2-1）：
    //   同名不同版（relay.run/v2 ← relay.run/v3）= 版本不认识 → E_UNSUPPORTED_VERSION，
    //     语义是「连字段含义都不确定，别往下猜」，客户端该去升级；
    //   异名（relay.run-state/v1 ← relay.event/v2）= 根本是另一种协议 → E_BAD_VALUE，
    //     客户端该去改发送目标，不是升级。
    // 首版只对 protocol_version 一个字段映射，于是 7 份协议里 6 份的未来版本落进
    // E_BAD_VALUE 兜底桶；同一份载荷按调用方式不同还会给出两种码。
    if (/(^|\/)protocol(_version)?$/.test(path)) {
      const want = String(err.params?.allowedValue ?? '');
      const got = String(pointerGet(payload, path) ?? '');
      const nameOf = (v) => v.slice(0, v.lastIndexOf('/'));
      return (want && got && nameOf(want) === nameOf(got)) ? 'E_UNSUPPORTED_VERSION' : 'E_BAD_VALUE';
    }
    // RPC method 枚举失败 → 未知方法（只认 method 字段本身，避免 oneOf 噪音串味）
    if (/(^|\/)method$/.test(path)) return 'E_UNKNOWN_METHOD';
    if (kw === 'enum') return 'E_UNKNOWN_ENUM';
    return 'E_BAD_VALUE';
  }
  return 'E_BAD_VALUE';
}

// 根部是 oneOf 时（relay.rpc/v1 的四种帧），四个分支会全部失败、错误互相串味。
// 逐分支单独校验，选出"这份载荷最像哪种帧"再报它的错——真实客户端排障时想看到的是
// 「你这帧哪里不对」，不是「四种帧各错在哪」。
//
// **选谁的判据不是"错误总数最少"**（首版这么写，选错了）：
//   root 层的错（instancePath === ''，如缺 id / 缺 handshake）意味着**根本不是这类帧**；
//   深层的错意味着**是这类帧、但内容不对**。
// 实例：`{jsonrpc, method:'runStateChanged', params:<event 载荷>}` 对 request 分支只错 3 条
// （少 id、少 handshake、method 不在枚举），对 notification 分支错更多但**全在深层**——
// 按总数选会选中 request 并报 E_UNKNOWN_METHOD，而它其实是一份 method 合法、载荷串味的推送帧。
// 故先比 **root 层错误数**，再以总数打平。
function bestBranchErrors(ajv, doc, payload) {
  if (!Array.isArray(doc.oneOf) || !doc.$defs) return null;
  let best = null, compiled = 0;
  for (const b of doc.oneOf) {
    const ref = b.$ref;
    if (!ref || !ref.startsWith('#/$defs/')) continue;
    const name = ref.slice('#/$defs/'.length);
    if (!doc.$defs[name]) continue;
    // ⚠️ 必须给子 schema 一个**基于原 $id 的新 $id**：直接丢掉 $id 会让子分支里的
    // 跨文件 $ref（如 notification 分支引 relay.event/v2）解析不到、编译抛错、
    // 该分支被静默跳过 —— 结果就是"最像的那一支"根本没参与比较。
    // 这条正是 F-012 同类问题（$ref 的 base URI 由 $id 确立）的回声，由反例实测抓出。
    // $id 不得含 `#`（JSON Schema 规定 $id 是无 fragment 的 URI），故用查询串做唯一后缀
    // ⚠️ 同一 $id 不能 compile 两次（ajv 会抛 "already exists"）。selftest 一个进程内要跑
    // 几十次校验，若不缓存、只靠 try/catch 吞掉，第一次之后**所有分支都会被静默跳过**，
    // 于是 compiled !== oneOf.length、整个最佳分支选择静默失效。这类"catch 吞掉后静默降级"
    // 正是本卡反复在修的形态，故这里显式走缓存而不是靠异常。
    const branchId = `${doc.$id}?branch=${name}`;
    let v = ajv.getSchema(branchId);
    if (!v) {
      const sub = { $schema: doc.$schema, $id: branchId, $defs: doc.$defs, ...doc.$defs[name] };
      try { v = ajv.compile(sub); } catch { continue; }
    }
    compiled++;
    if (v(payload)) return [];                       // 有分支通过 = 整体通过
    const rootErrs = v.errors.filter(e => (e.instancePath || '') === '').length;
    const score = [rootErrs, v.errors.length];
    if (!best || score[0] < best.score[0] || (score[0] === best.score[0] && score[1] < best.score[1])) {
      best = { errors: v.errors, score };
    }
  }
  // 分支没全编译成功就不敢用它做判断——宁可退回整体错误，也不给出可能误导的 reason
  return compiled === doc.oneOf.length ? (best?.errors ?? null) : null;
}

// 一份载荷可能触发多条错误；按 reason 的"语义具体度"排序，取最具体的一条对外报告。
const REASON_RANK = [
  'E_UNSUPPORTED_VERSION', 'E_DSH_ONLY_REQUIRED_ROLE', 'E_ABSOLUTE_LOCATOR', 'E_UNKNOWN_METHOD',
  'E_UNKNOWN_FIELD', 'E_MISSING_FIELD', 'E_UNKNOWN_ENUM', 'E_BAD_TYPE', 'E_BAD_VALUE',
];
// 返回 { reason, at }。`at` = **定下这个 reason 的那条错**的 instancePath——不是随便某条错。
// 为什么要它（批次检查点 3 小审 P3-1）：.expect.json 此前只钉 reason code，而 E_BAD_VALUE 是
// toReason 的兜底桶、21 份反例里占 9 份，判别力最低。只钉码的话，「换个地方错、码碰巧一样」
// 照样绿——比如某条 allOf 分支被改坏，只要该 fixture 里另有任何一处也落 E_BAD_VALUE，测试不红。
// 钉上位置，fixture 才真的钉住了它想测的那一处。
function pickReason(errors, payload) {
  // 判别字段优先：若 `protocol` / `protocol_version` 常量本身不对，说明载荷根本不是这份
  // 协议（或不是这个版本），其余错（未知字段、缺必填…）全是下游噪音。不这样排的话会报
  // E_UNKNOWN_FIELD，对使用者是误导——「我发的明明是合法 event，怎么说我字段未知」。
  // ⚠️ 这里**不能硬编码返回值**（批次检查点 3 小审 P2-1）：判别字段有两种归宿
  // （异名→E_BAD_VALUE、同名异版→E_UNSUPPORTED_VERSION），硬编码等于只兑现其中一种。
  // 交给 toReason 判，本函数只负责「优先级」这一件事。
  const disc = errors.find(e => e.keyword === 'const' && /(^|\/)protocol(_version)?$/.test(e.instancePath || ''));
  if (disc) return { reason: toReason(disc, payload), at: locOf(disc) };
  const rs = errors.map(e => toReason(e, payload));
  for (const r of REASON_RANK) {
    const i = rs.indexOf(r);
    if (i !== -1) return { reason: r, at: locOf(errors[i]) };
  }
  return { reason: rs[0] || 'E_BAD_VALUE', at: errors[0] ? locOf(errors[0]) : '' };
}

// 错误位置的规范写法：required 类错误的 instancePath 指向**父对象**，缺的键在 params.missingProperty，
// 只报父路径会让「缺 a」与「缺 b」不可区分——把缺失键接到路径尾部，两者才钉得住。
// additionalProperties 同理（多出来的键在 params.additionalProperty）。
function locOf(err) {
  const base = err.instancePath || '';
  if (err.keyword === 'required' && err.params?.missingProperty) return `${base}/${err.params.missingProperty}`;
  if (err.keyword === 'additionalProperties' && err.params?.additionalProperty) return `${base}/${err.params.additionalProperty}`;
  return base;
}

export function loadAjv() {
  const ajv = new Ajv2020({ allErrors: true, strict: false, allowUnionTypes: true });
  addFormats(ajv); // F-024：不加载就等于 format 空转
  const byId = new Map();
  const walkDir = d => readdirSync(d, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walkDir(join(d, e.name)) : (/\.(schema|shape)\.json$/.test(e.name) ? [join(d, e.name)] : []));
  for (const f of walkDir(CONTRACTS).sort()) {
    const doc = JSON.parse(readFileSync(f, 'utf8'));
    ajv.addSchema(doc);
    if (doc.$id) byId.set(doc.$id, doc);
    // 同时接受短标识（relay.run/v2）
    const short = doc.$id?.replace('https://dh-relay.local/contracts/', '').replace('v0-shapes/', '');
    if (short) byId.set(short, doc);
  }
  return { ajv, byId };
}

export function validateOne(ajv, byId, schemaId, payload) {
  const doc = byId.get(schemaId);
  if (!doc) return { ok: false, reason: 'E_UNSUPPORTED_VERSION', detail: `未知 schema id: ${schemaId}` };
  const v = ajv.getSchema(doc.$id);
  if (!v) return { ok: false, reason: 'E_UNSUPPORTED_VERSION', detail: `schema 未编译: ${schemaId}` };
  if (v(payload)) return { ok: true, reason: null };
  // oneOf 根：改用最佳分支的错误，避免四个分支的错误互相串味
  const errs = bestBranchErrors(ajv, doc, payload) ?? v.errors;
  if (errs.length === 0) return { ok: true, reason: null };
  const { reason, at } = pickReason(errs, payload);
  return { ok: false, reason, at, detail: ajv.errorsText(errs, { separator: ' | ' }) };
}

// ── selftest：跑 fixtures/golden 与 fixtures/negative 全量 ──
function selftest(asJson) {
  const { ajv, byId } = loadAjv();
  const FX = join(ROOT, 'fixtures');
  const results = { golden: [], negative: [], pass: 0, fail: 0 };

  // golden：文件名前缀即 schema 短 id（run.v2 → relay.run/v2）
  const idOf = name => 'relay.' + basename(name).replace(/\.json$/, '').replace(/^([a-z-]+)\.(v\d)(\..*)?$/, '$1/$2');
  for (const f of readdirSync(join(FX, 'golden')).sort()) {
    const payload = JSON.parse(readFileSync(join(FX, 'golden', f), 'utf8'));
    const id = payload.protocol || (payload.jsonrpc ? 'relay.rpc/v1' : idOf(f));
    const r = validateOne(ajv, byId, id, payload);
    const ok = r.ok === true;
    results.golden.push({ file: f, schema: id, ok, reason: r.reason, detail: ok ? undefined : r.detail });
    ok ? results.pass++ : results.fail++;
  }
  for (const f of readdirSync(join(FX, 'negative')).sort()) {
    if (!f.endsWith('.json') || f.endsWith('.expect.json')) continue;
    const payload = JSON.parse(readFileSync(join(FX, 'negative', f), 'utf8'));
    const expPath = join(FX, 'negative', f.replace(/\.json$/, '.expect.json'));
    if (!existsSync(expPath)) { results.negative.push({ file: f, ok: false, why: '缺 .expect.json' }); results.fail++; continue; }
    const exp = JSON.parse(readFileSync(expPath, 'utf8'));
    const r = validateOne(ajv, byId, exp.schema, payload);
    // 既钉 reason code，也钉**出错位置**（批次检查点 3 小审 P3-1）。
    // `at` 缺失即视为不合格——不给「老 fixture 可以不写」的宽容通道，否则新增的钉子会越漏越多。
    const atOk = typeof exp.at === 'string' && exp.at.length > 0 && r.at === exp.at;
    const ok = r.ok === false && r.reason === exp.reason && atOk;
    results.negative.push({
      file: f, schema: exp.schema,
      expected: exp.reason, got: r.ok ? '(ACCEPTED!)' : r.reason,
      expectedAt: exp.at ?? '(未登记)', gotAt: r.at ?? '', ok,
    });
    ok ? results.pass++ : results.fail++;
  }

  if (asJson) console.log(JSON.stringify(results, null, 2));
  else {
    console.log(`golden ${results.golden.length} 份：`);
    for (const g of results.golden) console.log(`  ${g.ok ? 'PASS' : 'FAIL'}  ${g.file} [${g.schema}]${g.ok ? '' : ' — ' + g.detail}`);
    console.log(`negative ${results.negative.length} 份（须被拒，且 reason 与出错位置 at 均与 .expect.json 逐字相符）：`);
    for (const n of results.negative) console.log(`  ${n.ok ? 'PASS' : 'FAIL'}  ${n.file} 期望=${n.expected}@${n.expectedAt} 实得=${n.got}@${n.gotAt}`);
    console.log(`\n合计 pass=${results.pass} fail=${results.fail}`);
  }
  return results.fail === 0 ? 0 : 1;
}

function main() {
  const argv = process.argv.slice(2);
  const asJson = argv.includes('--json');
  if (argv.includes('--selftest')) process.exit(selftest(asJson));

  const file = argv.find(a => !a.startsWith('--'));
  const si = argv.indexOf('--schema');
  if (!file || si < 0 || !argv[si + 1]) {
    console.error('用法: node tools/validate.mjs <file> --schema <id> [--json]\n      node tools/validate.mjs --selftest');
    process.exit(2);
  }
  let payload;
  try { payload = JSON.parse(readFileSync(file, 'utf8')); }
  catch (e) { console.error(`读取/解析失败: ${e.message}`); process.exit(2); }

  const { ajv, byId } = loadAjv();
  const r = validateOne(ajv, byId, argv[si + 1], payload);
  if (asJson) console.log(JSON.stringify(r, null, 2));
  else console.log(r.ok ? 'PASS' : `REJECT ${r.reason}\n  ${r.detail}`);
  process.exit(r.ok ? 0 : 1);
}

// 既是 CLI 也是模块：被 `node tools/validate.mjs …` 直接执行时跑 CLI；
// 被 `import` 时只导出 loadAjv / validateOne，不产生任何副作用。
// 为什么要这样（E 段收敛期实测）：`test/contracts.test.mjs` 的聚合条款矩阵原本靠
// **每例 spawn 一个 node 进程**判定，14 例在系统负载下要 37 秒，而且 `execFileSync`
// 抛出的任何异常（ENOMEM / EAGAIN 之类）都会被当成「校验器拒绝了」——于是「应 PASS」
// 的用例在资源紧张时**假红**。这与本卡一路在堵的「用退出码冒充语义」是同一形态，
// 只是方向反过来。改成进程内调用后：一次编译、零 spawn、判定只看返回值。
// ⚠️ `process.argv[1]` 在 `node -e` / `--input-type=module -e` / REPL / stdin 管道下是 undefined，
// 不加前置判空的话 `pathToFileURL(undefined)` 会**抛错**——即模块半边在这些入口下整个不可用
//（是 import 直接炸，不是「不跑 main」）。E2 代码复核轮 2 · P3-4 实测。
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
