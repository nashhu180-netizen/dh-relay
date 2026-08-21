// canonical.mjs — RFC 8785 (JCS) 规范化 + sha256
//
// 口径权威是 contracts/CANONICALIZATION.md，本文件是它的**可执行实现**。
// 在此之前该文档只是散文：五个"内容指纹"字段的算法写在纸上、无人能复算，
// 于是「Runtime、CLI、任何客户端都只认这一份契约来源」这句话在摘要这一维是空的。
// 批次检查点 3 小审 P1-1 逼出 fixtures/manifest.json，manifest 是本实现的第一个消费者。
//
// ⚠️ 本文件**不得**引入任何 Runtime / 工作台 / 业务代码依赖（验收口径第 5 条：
// 校验器与工具链只依赖 schema + Node 标准库 + ajv 系）。这里连 ajv 都不需要。

import { createHash } from 'node:crypto';

// JCS 的键排序依据是 **UTF-16 码元序**。JS 的 Array#sort 默认比较符正是按 UTF-16
// 码元逐位比较，故 keys.sort() 恰好就是规范要求的顺序——不要换成 localeCompare
// （受 locale 影响）也不要换成按字节序（UTF-8 字节序与 UTF-16 码元序在
// U+E000..U+FFFF 与代理对区间会分歧）。
function jcsSerialize(value) {
  if (value === null) return 'null';

  const t = typeof value;

  if (t === 'boolean') return value ? 'true' : 'false';

  if (t === 'number') {
    // JCS 的数字格式 = ECMAScript Number::toString，JSON.stringify 用的就是它。
    // NaN / Infinity 在 JSON 里无表示，JCS 也不定义——显式拒绝，不静默变 null。
    if (!Number.isFinite(value)) throw new TypeError(`JCS 不接受非有限数字: ${value}`);
    return JSON.stringify(value);
  }

  if (t === 'string') {
    // JSON.stringify 的转义已是 JCS 要求的最短形式：只转义 " \ 与 U+0000..U+001F
    // （其中 \b \t \n \f \r 用短形式），非 ASCII 直出 UTF-8 而不是 \uXXXX。
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return '[' + value.map(jcsSerialize).join(',') + ']';
  }

  if (t === 'object') {
    const keys = Object.keys(value).sort();
    const parts = [];
    for (const k of keys) {
      const v = value[k];
      // JSON 里 undefined 无表示。JSON.stringify 会静默丢键，那样两个语义不同的
      // 对象可能算出同一指纹——这里显式拒绝。
      if (v === undefined) throw new TypeError(`JCS 不接受 undefined 值: 键 ${k}`);
      parts.push(JSON.stringify(k) + ':' + jcsSerialize(v));
    }
    return '{' + parts.join(',') + '}';
  }

  throw new TypeError(`JCS 不接受该类型: ${t}`);
}

/** RFC 8785 规范化序列化，返回字符串（调用方按 UTF-8 编码）。 */
export function jcs(value) {
  return jcsSerialize(value);
}

/** digest = lowercase_hex(sha256(utf8(JCS(value))))，见 CANONICALIZATION.md §一。 */
export function digest(value) {
  return createHash('sha256').update(Buffer.from(jcs(value), 'utf8')).digest('hex');
}

/**
 * 按 CANONICALIZATION.md §二的「排除」列剔除不参与计算的键，再取摘要。
 * 排除是**顶层键**语义（表里所有排除项都是顶层键或一层内的 handshake.request_id，
 * 后者由调用方自行剔除后传入）。
 *
 * ⚠️ **copy 必须是 null 原型对象**（E5 教训复核抓出，findings F-062，重蹈 DHR_26 已登记教训）。
 * 首版写的是 `const copy = {}`，于是 `copy['__proto__'] = X` 触发的是 `Object.prototype.__proto__`
 * 的 **setter**（改 copy 的原型），而不是建一个同名自有属性——该键从此在 `Object.keys(copy)` 里
 * **消失**。后果不是理论的：`JSON.parse('{"__proto__":{…}}')` 产出的正是自有可枚举属性，
 * 于是两份只在 `__proto__` 上不同的载荷会算出**相同摘要**，直接击穿这五个指纹字段存在的理由。
 * 而本函数是 `request_digest` / `payload_digest`(×2) / `plan_digest` / `state_signature`
 * 五分之四的实现，其中 `request.params` 与 `result.structured` 恰是 OPEN-POINTS 登记的
 * `additionalProperties: true` 开放点 ⇒ 真实协议流量里**可达**，不需要构造刁钻输入。
 * `digest()` 本身不受影响（它只**读** `value[k]`，自有属性优先于原型链），只有拷贝这一步会中招。
 */
export function digestExcluding(value, excludeKeys = []) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('digestExcluding 只接受对象');
  }
  const copy = Object.create(null);
  for (const k of Object.keys(value)) {
    if (!excludeKeys.includes(k)) copy[k] = value[k];
  }
  return digest(copy);
}
