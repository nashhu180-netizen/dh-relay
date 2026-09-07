#!/usr/bin/env node
// audit-contracts.mjs — contracts/ 静态审计（只读）
//
// 为什么存在：批次检查点 2 小审 D-7 指出，用 `grep -c '"additionalProperties": false'`
// 数命中次数**结构上无法证明"无遗漏对象"**，而且确实漏掉了 4 处开口；同一条证据里的
// 私有类型词表也搜了一批注定搜不到的 token。本脚本用 AST 遍历替代 grep，产出可复跑的事实。
//
// 用法：node tools/audit-contracts.mjs [--json]
// 退出码：0 = 审计通过；1 = 发现未登记的开口或私有类型泄漏；2 = 用法/读取错误

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAjv } from './validate.mjs';

// D-22：不能用 URL.pathname —— 它是百分号编码的，路径含中文或空格时会坏
// （实测 D:/MyFiles/玩蜂/… → D:/MyFiles/%E7%8E%A9%E8%9C%82/…，本项目恰有这样一个工作目录）。
// fileURLToPath 一行解决，且自动给出平台原生分隔符。
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTRACTS = join(ROOT, 'contracts');
const asJson = process.argv.includes('--json');

// ── 已登记的有意开放点（与 contracts/OPEN-POINTS.md 同源，改一处必须改另一处）──
const REGISTERED_OPEN = new Set([
  'relay.result.v2.schema.json::properties.structured',
  'relay.rpc-methods.v1.schema.json::$defs.validate_params.properties.document',
]);

// ── 节点级开着、但被同级 allOf/if-then 的 $ref 收窄的位置 ──
// 本脚本是节点级遍历，看不到条件收窄，故显式登记。与「有意开放点」性质不同：
// 这些位置**实际是闭合的**（$ref 目标自身 additionalProperties:false），只是闭合发生在条件分支里。
// 登记项须在 OPEN-POINTS.md「已收窄」节有对应说明。
const CONDITIONALLY_NARROWED = new Set([
  'relay.rpc.v1.schema.json::$defs.request.properties.params',
  'relay.rpc.v1.schema.json::$defs.notification.properties.params',
  'relay.rpc.v2.schema.json::$defs.request.properties.params',
  'relay.rpc.v2.schema.json::$defs.notification.properties.params',
]);

// ── 私有类型白名单：允许作为不透明枚举字面量出现的厂商 token ──
// 依据：README「硬约束」1 的例外条 + ADR-002 净产出表豁免注 + DevPlan §3.2 验收口径第 3 条
// （H6 断言逐字依赖 `dsh-agent` 存在，不可回避）
const VENDOR_TOKEN_WHITELIST = new Set(['pi-agent', 'dsh-agent', 'herdr-agent']);
// 禁词从 tools/forbidden-types.txt 读，**不硬编码在源码里**——两处各写一份必然漂移。
// ⚠️ 必须带边界，不能用裸子串：`dsh` 会命中 `handshake`（批 2 小审与本脚本首版都踩过这个假阳性）。
// 边界定义为「前后不是 ASCII 字母」，这样 `dsh_ref` / `dsh-agent` / `pi_session_ref` 仍会命中，
// 而真实单词 `handshake` / `api` / `mapping` / `pipeline` 不命中（批次检查点 3 小审 P2-2 实测）。
const FORBIDDEN_FILE = fileURLToPath(new URL('./forbidden-types.txt', import.meta.url));
const FORBIDDEN_TOKENS = readFileSync(FORBIDDEN_FILE, 'utf8')
  .split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
if (FORBIDDEN_TOKENS.length === 0) { console.error('forbidden-types.txt 为空——禁词表必须非空，否则中立性检查形同虚设'); process.exit(2); }
// ── JSON-only 信封 + 跨边界引用（E2 代码复核轮 2 · P2-2）──
// 验收口径第 2 条是**两个合取项**：
//   ①「协议不导入五家私有类型」——由禁词表 + 结构 token 白名单证；
//   ②「**DSH 与 Runtime 不共享活动对象或内存状态**（fixture 与 schema 静态可证）」
//      —— 首版**零证据、零断言**，而 E-034 的结论行却写成了「验收口径第 2 条兑现」。
//      与 E-029 完全同形：证据只覆盖第一个合取项，结论写了整条口径。
// 这一维把②变成可复算的结构事实，而不是一段散文：
//   · 每个 `type` 取值只能是 JSON 原生类型——没有任何字段能承载句柄 / 指针 / 对象引用；
//   · 每个**跨边界引用字段**（名字是 ref / *_ref / locator / path）必须 `$ref` 到共享的
//     `relay.common/v1#/$defs/locator`，即「跨进程只传不透明的相对定位串」。
// 顺带关掉 F-056 那条残留：内联一份 locator 类 pattern 而不走 $ref，此前两版 reason 判据都盖不住，
// 现在这一维直接不让它存在。
const JSON_TYPES = new Set(['string', 'number', 'integer', 'boolean', 'object', 'array', 'null']);
const LOCATOR_FIELD = /(^|_)(ref|locator|path)$/;
const LOCATOR_TARGETS = new Set([
  'https://dh-relay.local/contracts/relay.common/v1#/$defs/locator',
  '#/$defs/locator',
]);
// DHR_78：instruction_ref 是一个闭合的 source_ref 对，而非裸 locator；其 path
// 仍经 source_ref 指向共享 locator，摘要也由同一冻结定义约束。只豁免这一个明确对象，
// 不把任意 *_ref 的内联 shape 放开。
const COMPOSITE_LOCATOR_FIELDS = new Map([
  ['instruction_ref', '#/$defs/source_ref'],
]);

// ── 结构位置 token 清单（白名单层的登记表）──
// 生成/更新：node tools/audit-contracts.mjs --write-tokens
const TOKENS_FILE = fileURLToPath(new URL('./structural-tokens.txt', import.meta.url));
const REGISTERED_TOKENS = new Set(existsSync(TOKENS_FILE)
  ? readFileSync(TOKENS_FILE, 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  : []);

const VENDOR_PATTERN = new RegExp(`(^|[^A-Za-z])(${FORBIDDEN_TOKENS.join('|')})([^A-Za-z]|$)`, 'i');

// 「改一处须改另一处」不能只写在注释里（批次检查点 3 小审 P2-3）。
// 白名单的每一项本来就该是被禁词命中、再由白名单放行的；若某项已不再被命中，说明
// 禁词表被删改过，该项已成死代码，而**中立性检查对那整家厂商已经静默失效**。
// 同一文件里 REGISTERED_OPEN / CONDITIONALLY_NARROWED 都做了陈旧登记检测，唯独这里没有，
// 这个不对称就是漏做的痕迹。这里补上，口径一致：不命中即报错并退出。
const staleVendorEntries = [...VENDOR_TOKEN_WHITELIST].filter(t => !VENDOR_PATTERN.test(t));
if (staleVendorEntries.length > 0) {
  console.error('VENDOR_TOKEN_WHITELIST 有条目不再被禁词表命中，说明 forbidden-types.txt 被删改：'
    + staleVendorEntries.join(', ')
    + ' —— 白名单成死代码 + 该厂商的中立性检查已静默失效。请修 tools/forbidden-types.txt。');
  process.exit(2);
}

// 散文键：只承载说明，不参与结构，扫描时剥掉
const PROSE_KEYS = new Set(['description', '$comment', 'title', '$id', '$schema', '$ref', 'default']);

// D-29：不能只挑符合命名约定的文件——一份叫 relay.foo.v1.json 的契约会**完全隐身**
// （开口不查、厂商 token 不查、$ref 不解析），等于让审计覆盖面由一条没人强制的命名约定定义。
// 现在枚举全部 *.json，不符约定的**报错**而不是默默跳过。
function listJsonFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...listJsonFiles(p));
    else if (/\.json$/.test(e.name)) out.push(p);
  }
  return out.sort();
}
const NAMING_OK = /\.(schema|shape)\.json$/;

// 一个节点算不算「对象 schema」：显式 type:object，或带 properties
function isObjectSchema(n) {
  return n && typeof n === 'object' && !Array.isArray(n) &&
    (n.type === 'object' || (Array.isArray(n.type) && n.type.includes('object')) || 'properties' in n);
}

// D-28：不能用扁平路径字符串反推结构——一个**名为** `then`/`if`/`else` 的属性
// （`properties.then` 之类）会被正则误判成守卫、静默跳过不计开口。改为递归时下传布尔标记：
// 只有真正**作为关键字**进入 if/then/else 子树时才置位。
function walk(node, path, ctx, inGuard = false) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((v, i) => walk(v, `${path}[${i}]`, ctx, inGuard));
    return;
  }
  if (isObjectSchema(node)) {
    const ap = node.additionalProperties;
    const closed = ap === false;
    const openExplicit = ap === true;
    const openDefault = ap === undefined;
    if (closed) ctx.closed.push(path);
    else if (!inGuard) {
      ctx.open.push({ path, form: openExplicit ? 'true' : 'absent(default-open)' });
    } else {
      ctx.ifThenSkipped.push(path);
    }
  }
  // 结构位置的厂商 token：字段名 / enum 值 / const 值
  for (const [k, v] of Object.entries(node)) {
    if (PROSE_KEYS.has(k)) continue;
    // ── 白名单层（E5 教训复核：本卡重蹈 DHR_49 L-07）──
    // 验收口径第 2 条「不导入 DSH/Cordis/Pi/Herdr/DevHarness 私有类型」是**全称命题**，
    // 而黑名单只能证明「没有我想到的那几种」。本卡已为此吃过两次亏：F-050 漏了 pi（五家缺一家），
    // F-058 承认删掉 cordis/devharness/psmux/subagent 不报错。DHR_49 L-07 的原话是：
    // 「凡是『零 X』『只用 Y』这类全称结论，断言必须是白名单」——那条教训 2026-08-20 22:19
    // 就已进仓（比本卡批 1 早 12 分钟），本卡未查阅即架构成黑名单，是可避免的重蹈。
    // 契约语料是**冻结的闭集**，所以白名单在这里可行：把全部结构位置 token 登记成清单，
    // 任何未登记的新 token 一律报错——新增必须是有意的，且必然出现在 diff 里给人看见。
    // 黑名单保留为第二层（对已知厂商词给更明确的报错），两层同时在。
    if (k === 'properties' || k === '$defs') {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        for (const name of Object.keys(v)) ctx.structuralTokens.add(name);
      }
    }
    if (k === 'enum' && Array.isArray(v)) {
      for (const item of v) if (typeof item === 'string') ctx.structuralTokens.add(item);
    }
    if (k === 'const' && typeof v === 'string') ctx.structuralTokens.add(v);
    if (k === 'type') {
      for (const t of (Array.isArray(v) ? v : [v])) {
        if (typeof t !== 'string' || !JSON_TYPES.has(t)) ctx.envelopeErrors.push({ where: `${path}.type`, why: `type 取值 ${JSON.stringify(t)} 不是 JSON 原生类型——协议信封必须是纯 JSON，不得承载句柄/指针/对象引用` });
      }
    }
    if (k === 'properties' && v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [name, sub] of Object.entries(v)) {
        if (!LOCATOR_FIELD.test(name) || !sub || typeof sub !== 'object') continue;
        const targets = [sub.$ref, sub.items?.$ref, ...(Array.isArray(sub.oneOf) ? sub.oneOf.map(x => x?.$ref) : [])].filter(Boolean);
        // 数组型（source_refs: {type:array, items:{$ref: source_ref}}）由其元素定义自己承担，这里放过
        const isArrayOfObjects = sub.type === 'array' && sub.items?.$ref && !LOCATOR_TARGETS.has(sub.items.$ref);
        if (isArrayOfObjects) continue;
        const compositeTarget = COMPOSITE_LOCATOR_FIELDS.get(name);
        if (!targets.some(t => LOCATOR_TARGETS.has(t)) && !(compositeTarget && targets.includes(compositeTarget))) {
          ctx.envelopeErrors.push({ where: `${path}.properties.${name}`, why: `跨边界引用字段未 $ref 到共享 locator（实际引用 ${JSON.stringify(targets)}）——内联一份自己的 pattern 会让 G5 的 reason 判据与中立性断言同时落空` });
        }
      }
    }
    if (VENDOR_PATTERN.test(k) && !VENDOR_TOKEN_WHITELIST.has(k)) {
      ctx.vendorHits.push({ where: `${path}.<key>`, token: k });
    }
    if (k === 'enum' && Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === 'string' && VENDOR_PATTERN.test(item) && !VENDOR_TOKEN_WHITELIST.has(item)) {
          ctx.vendorHits.push({ where: `${path}.enum`, token: item });
        }
      }
    }
    if (k === 'const' && typeof v === 'string' && VENDOR_PATTERN.test(v) && !VENDOR_TOKEN_WHITELIST.has(v)) {
      ctx.vendorHits.push({ where: `${path}.const`, token: v });
    }
    // 关键字位置的 if/then/else 才置守卫位；`properties.then` 这种属性名不算（D-28）
    const isGuardKeyword = (k === 'if' || k === 'then' || k === 'else');
    walk(v, path ? `${path}.${k}` : k, ctx, inGuard || isGuardKeyword);
  }
}

// D-31：审计器证明的是「关于 schema 的事」，但从不证明它们**是合法 schema**。
// `"required": "node_id"`（字符串而非数组）、`"minItems": "1"` 这类畸形关键字，
// JSON 解析得过、AST 遍历得过、审计器 exit 0，而多数校验器会**静默忽略**它们
// ——约束看着在、实际不在（与 D-18 的 format 空转同一类）。
// 这里做最小 meta-schema 自检（不引依赖）：只查最容易写错且后果是"静默失效"的那几个关键字的类型。
const KEYWORD_TYPES = {
  required: 'array', enum: 'array', allOf: 'array', anyOf: 'array', oneOf: 'array',
  properties: 'object', $defs: 'object', items: 'object', contains: 'object',
  minItems: 'number', maxItems: 'number', minLength: 'number', maxLength: 'number',
  minimum: 'number', maximum: 'number', minContains: 'number', maxContains: 'number',
  additionalProperties: 'boolean-or-object', pattern: 'string', format: 'string', type: 'string-or-array',
};
// `properties` / `$defs` / `patternProperties` 下面一层的键是**名字**不是关键字。
// 不区分会踩 D-28 同款坑：本 schema 里就有一个**名为** `required` 的属性
// （H6 的必经开关），首版 metaCheck 直接把它误报成"required 关键字类型错"。
const NAME_MAPS = new Set(['properties', '$defs', 'definitions', 'patternProperties', 'dependentSchemas']);
function metaCheck(node, file, path, errors, keysAreNames = false) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((v, i) => metaCheck(v, file, `${path}[${i}]`, errors, false)); return; }
  for (const [k, v] of Object.entries(node)) {
    const want = keysAreNames ? undefined : KEYWORD_TYPES[k];
    if (want) {
      const t = Array.isArray(v) ? 'array' : typeof v;
      const ok =
        want === 'boolean-or-object' ? (t === 'boolean' || t === 'object') :
        want === 'string-or-array' ? (t === 'string' || t === 'array') :
        t === want;
      if (!ok) errors.push({ file, path: path ? `${path}.${k}` : k, why: `关键字 ${k} 类型应为 ${want}，实为 ${t} —— 多数校验器会静默忽略它，约束看着在实际不在` });
    }
    metaCheck(v, file, path ? `${path}.${k}` : k, errors, !keysAreNames && NAME_MAPS.has(k));
  }
}

// 递归收集 $ref 及其出现位置
function collectRefs(node, file, baseId, sink, path = '') {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((v, i) => collectRefs(v, file, baseId, sink, `${path}[${i}]`)); return; }
  for (const [k, v] of Object.entries(node)) {
    if (k === '$ref' && typeof v === 'string') {
      (sink[v] ||= []).push({ file, path });
    } else collectRefs(v, file, baseId, sink, path ? `${path}.${k}` : k);
  }
}

// ── D-20：CONDITIONALLY_NARROWED 不能是"信任硬编码字符串"的后门 ──
// 它登记的是一个**可验证的事实断言**（这里实际闭合，只是闭合发生在条件分支里），必须自验。
// 断言两条：①同级存在 allOf，每个分支都有 then.properties.<字段>.$ref；
//          ②各分支 if 的判别值并集**覆盖判别字段 enum 的全部取值**——这正是堵 D-17 的那一刀。
// 按 $id + JSON Pointer 解析一个 $ref，返回目标节点（解析不到返回 undefined）
function resolveRef(ref, ownerFile, idRegistry, docs) {
  const [base, pointer] = ref.split('#');
  const target = base === '' ? docs.get(ownerFile) : idRegistry.get(base)?.doc;
  if (!target) return undefined;
  if (!pointer) return target;
  let cur = target;
  for (const seg of pointer.replace(/^\//, '').split('/').map(s => s.replace(/~1/g, '/').replace(/~0/g, '~'))) {
    if (cur && typeof cur === 'object' && seg in cur) cur = cur[seg];
    else return undefined;
  }
  return cur;
}

function verifyConditionalNarrowing(doc, file, entryPath, errors, idRegistry, docs) {
  const segs = entryPath.split('.');
  const field = segs[segs.length - 1];                 // 如 params
  const ownerPath = segs.slice(0, -2);                 // 去掉 .properties.<field>
  let owner = doc;
  for (const s of ownerPath) { owner = owner?.[s]; }
  if (!owner) { errors.push({ file, entryPath, why: '定位不到承载该字段的对象' }); return; }
  const branches = owner.allOf;
  if (!Array.isArray(branches) || branches.length === 0) {
    errors.push({ file, entryPath, why: '同级没有 allOf——白名单声称的"条件收窄"不存在' }); return;
  }
  let discriminator = null; const covered = new Set();
  for (const b of branches) {
    const ifProps = b?.if?.properties;
    const thenRef = b?.then?.properties?.[field]?.$ref;
    if (!ifProps || !thenRef) {
      errors.push({ file, entryPath, why: '某分支缺 if.properties 或 then.properties.<字段>.$ref' }); return;
    }
    // D-27：只检查「有个 $ref」等于什么都没证明——白名单声称的事实是「这里实际闭合」，
    // 必须解析该 $ref 并断言目标真的 additionalProperties === false。
    // （小审把本函数逐字转写后复现：把两个分支都指向一个 additionalProperties:true 的目标，
    //   旧版自验照样"通过"。与 D-20 是同一个毛病，只是下沉了一层。）
    const resolved = resolveRef(thenRef, file, idRegistry, docs);
    if (resolved === undefined) {
      errors.push({ file, entryPath, why: `分支 $ref 解析不到目标：${thenRef}` }); return;
    }
    if (resolved.additionalProperties !== false) {
      errors.push({ file, entryPath, why: `分支 $ref 的目标不是闭合的（${thenRef} 的 additionalProperties = ${JSON.stringify(resolved.additionalProperties)}）——白名单声称"实际闭合"不成立` }); return;
    }
    const keys = Object.keys(ifProps);
    if (keys.length !== 1) { errors.push({ file, entryPath, why: 'if 的判别键不唯一' }); return; }
    if (discriminator && discriminator !== keys[0]) { errors.push({ file, entryPath, why: '各分支判别键不一致' }); return; }
    discriminator = keys[0];
    const c = ifProps[keys[0]]?.const;
    if (c === undefined) { errors.push({ file, entryPath, why: 'if 判别未用 const' }); return; }
    covered.add(c);
  }
  let enumVals = owner.properties?.[discriminator]?.enum;
  if (!Array.isArray(enumVals) && owner.properties?.[discriminator]?.$ref) {
    enumVals = resolveRef(owner.properties[discriminator].$ref, file, idRegistry, docs)?.enum;
  }
  if (!Array.isArray(enumVals)) { errors.push({ file, entryPath, why: `判别字段 ${discriminator} 没有 enum，无法证明分支穷尽` }); return; }
  const missing = enumVals.filter(v => !covered.has(v));
  if (missing.length) {
    errors.push({ file, entryPath, why: `判别 enum 有 ${missing.length} 个取值没有对应分支：${missing.join(', ')} —— 这些取值下 ${field} 会静默全开（D-17 的失效模式）` });
  }
}

function main() {
  if (!existsSync(CONTRACTS)) { console.error(`contracts/ 不存在: ${CONTRACTS}`); process.exit(2); }
  const allJson = listJsonFiles(CONTRACTS);
  const report = { files: 0, closed: 0, open: [], ifThenSkipped: 0, vendorHits: [], structuralTokens: new Set(), unregisteredTokens: [], staleTokens: [], envelopeErrors: [], refs: {}, refErrors: [], narrowErrors: [], namingErrors: [], metaErrors: [], metaSchemaErrors: [], metaDivergence: [], identityPatternErrors: [], docSyncErrors: [] };
  const idRegistry = new Map();
  const docs = new Map();

  // D-29：不符命名约定的 *.json 直接报错，不默默跳过
  const files = [];
  for (const f of allJson) {
    const name = relative(CONTRACTS, f).replace(/\\/g, '/');
    if (NAMING_OK.test(f)) files.push(f);
    else report.namingErrors.push({ file: name, why: '不符 *.schema.json / *.shape.json 命名约定——若为契约则会完全逃过审计，若非契约则不应放在 contracts/ 下' });
  }
  report.files = files.length;

  for (const f of files) {
    const name = relative(CONTRACTS, f).replace(/\\/g, '/');
    const doc = JSON.parse(readFileSync(f, 'utf8'));
    metaCheck(doc, name, '', report.metaErrors);
    const ctx = { closed: [], open: [], ifThenSkipped: [], vendorHits: [], structuralTokens: report.structuralTokens, envelopeErrors: [] };
    walk(doc, '', ctx);
    report.closed += ctx.closed.length;
    report.ifThenSkipped += ctx.ifThenSkipped.length;
    for (const o of ctx.open) report.open.push({ file: name, ...o });
    for (const h of ctx.vendorHits) report.vendorHits.push({ file: name, ...h });
    for (const h of ctx.envelopeErrors) report.envelopeErrors.push({ file: name, ...h });
    docs.set(name, doc);
    if (doc.$id) {
      if (idRegistry.has(doc.$id)) report.refErrors.push({ file: name, ref: doc.$id, why: `$id 重复（已被 ${idRegistry.get(doc.$id).name} 占用）` });
      else idRegistry.set(doc.$id, { name, doc });
    }
    collectRefs(doc, name, doc.$id, report.refs);
  }

  // ── K-3（DHR_29 批次 1）：身份 token 的 pattern 只允许存在于 _shared 唯一的 $defs/identifier ──
  // 结构判据（不是计数、不是字符串扫描）：任何 *_id 键的子节点（properties 与 $defs 两处都要扫）
// 不得自带 `pattern` 关键字，一律 `$ref` 到 identifier。把判据挂在正则写法上正是 F-056 记过的事故形态。
  const CANONICAL_IDENTIFIER = '_shared/relay.common.v1.schema.json#$defs.identifier';
  const scanIdentityPatterns = (doc, name) => {
    const recurse = (node, path) => {
      if (!node || typeof node !== 'object' || Array.isArray(node)) return;
      for (const section of ['properties', '$defs']) {
        const bucket = node[section];
        if (!bucket || typeof bucket !== 'object' || Array.isArray(bucket)) continue;
        for (const [key, child] of Object.entries(bucket)) {
          const childPath = path ? `${path}.${section}.${key}` : `${section}.${key}`;
          if (/_id$/.test(key) && child && typeof child === 'object' && !Array.isArray(child)
            && Object.prototype.hasOwnProperty.call(child, 'pattern')
            && `${name}#${childPath.replace(/\.\w+(\.\d+)?$/, '')}` !== CANONICAL_IDENTIFIER
            && !(name === '_shared/relay.common.v1.schema.json' && path === '$defs' && key === 'identifier')) {
            report.identityPatternErrors.push({ file: name, at: `${section}.${key}`, why: `身份键 ${key} 内联 pattern——K-3 要求一律 $ref 到 _shared/relay.common.v1 的 $defs/identifier（唯一规范定义）` });
          }
          recurse(child, childPath);
        }
      }
    };
    recurse(doc, '');
  };
  for (const f of files) scanIdentityPatterns(docs.get(relative(CONTRACTS, f).replace(/\\/g, '/')), relative(CONTRACTS, f).replace(/\\/g, '/'));

  // ── F-042（DHR_29 批次 1 承接）：meta-schema 规则合一 ──
  // 手写 KEYWORD_TYPES/metaCheck 与 ajv 自带的 validateSchema 曾是两套可能各自演化的规则。
  // 现在 ajv 是权威裁判：每份契约过一遍 ajv.validateSchema；再做对账 tripwire——
  // 两边结论不一致即审计失败，强制人工收敛，而不是静默漂移。
  {
    const { ajv } = loadAjv();
    for (const [name, doc] of docs) {
      const ajvOk = ajv.validateSchema(doc);
      if (!ajvOk) {
        for (const e of ajv.errors ?? []) report.metaSchemaErrors.push({ file: name, path: e.instancePath || '(root)', why: `ajv.validateSchema 拒绝：${e.message}` });
      } else if (report.metaErrors.some((m) => m.file === name)) {
        report.metaDivergence.push({ file: name, why: '手写 metaCheck 报错但 ajv.validateSchema 判合法——两套 meta 规则已分叉，按 F-042 必须先收敛再过闸' });
      }
    }
  }

  // ── D-21：真正解析每一个 $ref ──
  // 原版只做 `report.refs[t]++` 计数、打印"目标种类: N"，**从头到尾没有 resolve 过任何一个 $ref**。
  // 后果：本批唯一的 P1（$id 绝对 + $ref 相对 → 全部编译不了）如果再犯一次，审计器照样 exit 0。
  // 现在逐条拆 base + JSON Pointer：base 必须命中 $id 注册表，Pointer 必须真能下钻到节点，任一失败即 exit 1。
  for (const [ref, sites] of Object.entries(report.refs)) {
    const [base, pointer] = ref.split('#');
    for (const site of sites) {
      let target;
      if (base === '') {
        target = docs.get(site.file);
        if (!target) { report.refErrors.push({ file: site.file, ref, why: '本文件未载入' }); continue; }
      } else {
        const hit = idRegistry.get(base);
        if (!hit) { report.refErrors.push({ file: site.file, ref, why: `base 未命中任何已注册 $id（${base}）` }); continue; }
        target = hit.doc;
      }
      if (pointer && pointer !== '') {
        const segs = pointer.replace(/^\//, '').split('/').map(s => s.replace(/~1/g, '/').replace(/~0/g, '~'));
        let cur = target, ok = true;
        for (const seg of segs) {
          if (cur && typeof cur === 'object' && seg in cur) cur = cur[seg];
          else { ok = false; break; }
        }
        if (!ok) report.refErrors.push({ file: site.file, ref, why: `JSON Pointer 下钻失败（${pointer}）` });
      }
    }
  }

  // 分类：已登记开口 / 条件收窄 / 未登记（=缺陷）
  const keyOf = o => `${o.file.split('/').pop()}::${o.path}`;
  const narrowed = report.open.filter(o => CONDITIONALLY_NARROWED.has(keyOf(o)));
  const unregistered = report.open.filter(o =>
    !REGISTERED_OPEN.has(keyOf(o)) && !CONDITIONALLY_NARROWED.has(keyOf(o)));
  report.open = report.open.filter(o => !CONDITIONALLY_NARROWED.has(keyOf(o)));

  // D-20：每一条 CONDITIONALLY_NARROWED 登记都必须当场自验，不许只信白名单
  for (const o of narrowed) verifyConditionalNarrowing(docs.get(o.file), o.file, o.path, report.narrowErrors, idRegistry, docs);
  // 白名单里登记了、但扫描根本没扫到该位置 = 陈旧登记，同样报错（防止白名单越攒越脏）
  for (const key of CONDITIONALLY_NARROWED) {
    if (!narrowed.some(o => keyOf(o) === key)) report.narrowErrors.push({ file: key.split('::')[0], entryPath: key.split('::')[1], why: '白名单有此登记，但扫描未在该位置发现开口——陈旧登记，应删除' });
  }
  // D-30a：REGISTERED_OPEN 也要陈旧检测（原先只有 CONDITIONALLY_NARROWED 有）
  const openKeys = new Set(report.open.map(keyOf));
  for (const key of REGISTERED_OPEN) {
    if (!openKeys.has(key)) report.docSyncErrors.push({ what: key, why: 'REGISTERED_OPEN 有此登记，但扫描未在该位置发现开口——陈旧登记，应删除' });
  }
  // D-30b：代码里的白名单与 OPEN-POINTS.md 互校。
  // 原注释写的是「改一处必须改另一处」——靠人记住的约束应该由脚本执行。
  const OP = join(CONTRACTS, 'OPEN-POINTS.md');
  if (!existsSync(OP)) report.docSyncErrors.push({ what: 'OPEN-POINTS.md', why: '不存在——有意开放点必须有文档登记' });
  else {
    // Q3-c：不能用全文子串匹配——那只证明"两个字符串在文中出现过"，
    // 文档若改写成「已收窄：`properties.structured` 不再开放」，子串检查照样通过，
    // 于是一个**已在跑的检查**给出了比它实际证明的更强的印象。收紧到"同一表格行内同时出现"。
    const mdRows = readFileSync(OP, 'utf8').split('\n').filter(l => l.trimStart().startsWith('|'));
    for (const key of REGISTERED_OPEN) {
      const [file, path] = key.split('::');
      if (!mdRows.some(row => row.includes(file) && row.includes(path))) {
        report.docSyncErrors.push({ what: key, why: 'OPEN-POINTS.md 的清单表格里没有同时登记该文件与该路径的行——代码白名单与文档不同步' });
      }
    }
  }

  // ── 白名单比对（E5 教训复核，重蹈 DHR_49 L-07）──
  // 未登记 token = 有人往冻结契约里加了新字段名/枚举值/常量而没登记。全称命题「零私有类型」
  // 只有靠这条才成立：黑名单证明不了「没有我没想到的那几种」。
  // 陈旧登记 = 清单里有、语料里没有，说明契约删了东西而清单没跟——同 REGISTERED_OPEN 的口径。
  const tokens = [...report.structuralTokens].sort();
  if (process.argv.includes('--write-tokens')) {
    const header = [
      '# structural-tokens.txt — 结构位置 token 登记清单（白名单）',
      '#',
      '# 为什么是白名单（E5 教训复核抓出本卡重蹈 DHR_49 L-07）：',
      '#   验收口径第 2 条「不导入 DSH/Cordis/Pi/Herdr/DevHarness 私有类型」是**全称命题**。',
      '#   黑名单（forbidden-types.txt）只能证明「没有我想到的那几种」——本卡为此吃过两次亏：',
      '#   F-050 漏了 pi（五家缺一家，pi_session_ref 长驱直入且 npm test 全绿），',
      '#   F-058 承认删掉 cordis/devharness/psmux/subagent 不会被拦。',
      '#   DHR_49 L-07 原话：「凡是『零 X』『只用 Y』这类全称结论，断言必须是白名单」。',
      '#',
      '# 契约语料是冻结的闭集，所以白名单在这里可行：本文件登记全部结构位置 token',
      '#（properties / $defs 的键 + enum 项 + const 值），任何未登记的新 token 一律 exit 1。',
      '# 新增字段必须**有意登记**，且必然出现在 diff 里给人看见——这才是「零私有类型」的证明方式。',
      '#',
      '# 黑名单 forbidden-types.txt 保留为第二层：对已知厂商词给更明确的报错信息。两层同时在。',
      '#',
      '# 更新：node tools/audit-contracts.mjs --write-tokens',
      '',
    ].join('\n');
    writeFileSync(TOKENS_FILE, header + tokens.join('\n') + '\n');
    console.log(`已写 tools/structural-tokens.txt：${tokens.length} 个 token`);
    process.exit(0);
  }
  if (REGISTERED_TOKENS.size === 0) {
    report.unregisteredTokens.push({ token: '(清单缺失)', why: 'tools/structural-tokens.txt 不存在或为空——白名单层形同虚设，跑 --write-tokens 生成' });
  } else {
    for (const t of tokens) if (!REGISTERED_TOKENS.has(t)) report.unregisteredTokens.push({ token: t, why: '结构位置出现未登记 token——新增字段/枚举值必须先登记进 structural-tokens.txt' });
    for (const t of REGISTERED_TOKENS) if (!report.structuralTokens.has(t)) report.staleTokens.push({ token: t, why: '清单有登记但语料里已不存在——陈旧登记，应删除' });
  }

  if (asJson) { console.log(JSON.stringify({ ...report, structuralTokens: [...report.structuralTokens].sort(), narrowed, unregistered }, null, 2)); }
  else {
    console.log(`扫描 ${report.files} 份 schema/shape`);
    console.log(`闭合对象（additionalProperties:false）: ${report.closed}`);
    console.log(`if/then 内不计的节点: ${report.ifThenSkipped}`);
    console.log(`被 allOf/if-then 条件收窄（实际闭合）: ${narrowed.length}`);
    for (const o of narrowed) console.log(`  ~ ${o.file} :: ${o.path}`);
    console.log(`有意开放点: ${report.open.length}`);
    for (const o of report.open) console.log(`  - ${o.file} :: ${o.path} [${o.form}]`);
    console.log(`未登记的开口: ${unregistered.length}`);
    for (const o of unregistered) console.log(`  ! ${o.file} :: ${o.path}`);
    console.log(`结构位置的非白名单厂商 token: ${report.vendorHits.length}`);
    for (const h of report.vendorHits) console.log(`  ! ${h.file} :: ${h.where} = ${h.token}`);
    const totalRefs = Object.values(report.refs).reduce((a, s) => a + s.length, 0);
    console.log(`$ref 实解析: ${totalRefs} 条，失败 ${report.refErrors.length}（$id 注册表 ${idRegistry.size} 项）`);
    for (const e of report.refErrors) console.log(`  ! ${e.file} :: ${e.ref} — ${e.why}`);
    console.log(`条件收窄自验失败: ${report.narrowErrors.length}`);
    for (const e of report.narrowErrors) console.log(`  ! ${e.file} :: ${e.entryPath} — ${e.why}`);
    console.log(`命名约定违规: ${report.namingErrors.length}`);
    for (const e of report.namingErrors) console.log(`  ! ${e.file} — ${e.why}`);
    console.log(`meta-schema 关键字类型错: ${report.metaErrors.length}`);
    for (const e of report.metaErrors) console.log(`  ! ${e.file} :: ${e.path} — ${e.why}`);
    console.log(`ajv.validateSchema 拒绝: ${report.metaSchemaErrors.length}`);
    for (const e of report.metaSchemaErrors) console.log(`  ! ${e.file} :: ${e.path} — ${e.why}`);
    console.log(`meta 规则分叉（手写 vs ajv）: ${report.metaDivergence.length}`);
    for (const e of report.metaDivergence) console.log(`  ! ${e.file} — ${e.why}`);
    console.log(`K-3 身份键内联 pattern: ${report.identityPatternErrors.length}`);
    for (const e of report.identityPatternErrors) console.log(`  ! ${e.file} :: ${e.at} — ${e.why}`);
    console.log(`JSON-only 信封 + 跨边界引用违规: ${report.envelopeErrors.length}`);
    for (const e of report.envelopeErrors) console.log(`  ! ${e.file} :: ${e.where} — ${e.why}`);
    console.log(`结构位置 token: 扫到 ${report.structuralTokens.size} 个，未登记 ${report.unregisteredTokens.length}，陈旧登记 ${report.staleTokens.length}`);
    for (const e of report.unregisteredTokens) console.log(`  ! ${e.token} — ${e.why}`);
    for (const e of report.staleTokens) console.log(`  ! ${e.token} — ${e.why}`);
    console.log(`白名单↔OPEN-POINTS.md 不同步: ${report.docSyncErrors.length}`);
    for (const e of report.docSyncErrors) console.log(`  ! ${e.what} — ${e.why}`);
  }

  const bad = unregistered.length + report.vendorHits.length + report.refErrors.length
    + report.narrowErrors.length + report.namingErrors.length + report.metaErrors.length + report.metaSchemaErrors.length
    + report.metaDivergence.length + report.identityPatternErrors.length + report.docSyncErrors.length
    + report.unregisteredTokens.length + report.staleTokens.length + report.envelopeErrors.length;
  process.exit(bad === 0 ? 0 : 1);
}

main();
