// run_id 规范化（design/02 B7 · 用户拍板 D23）：
//   R<nnn>-<主题slug>-<yyyyMMdd>
//   R<nnn> = 仓级全局递增序号（唯一性的唯一来源，发号在仓级锁内做，见 startrun.mjs）
//   slug   = ASCII 小写字母/数字/短横线、≤30、首尾非短横线（进文件夹名/事件主键，禁中文——本仓有中文路径踩坑先例）
//   date   = 创建日期（本地时间，只为人读；唯一性不依赖它）
// 纪律：规范化失败即拒绝，绝不静默截断或转写（DevPlan DHR_51 验收 4b）。

export const THEME_SLUG_MAX = 30;

// 长度 1..30；首尾字符必须是字母/数字（首尾非短横线）。
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$/;

// R<nnn>(≥3 位)-<slug>-<yyyyMMdd>
export const RUN_ID_PATTERN = /^R\d{3,}-[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?-\d{8}$/;

function reject(why, slug) {
  // 报错里带原输入片段，证明「没有静默改写」——调用方看到的就是它给的那个串。
  const shown = typeof slug === 'string' ? JSON.stringify(slug.slice(0, 48)) : String(slug);
  throw new Error(`E_RUN_ID_INVALID:${why}:${shown}`);
}

export function normalizeThemeSlug(slug) {
  if (typeof slug !== 'string' || slug.length === 0) reject('slug-required', slug);
  if (/[A-Z]/.test(slug)) reject('slug-uppercase', slug);
  if (/[^a-z0-9-]/.test(slug)) reject('slug-charset', slug);
  if (slug.length > THEME_SLUG_MAX) reject('slug-too-long', slug);
  if (!SLUG_PATTERN.test(slug)) reject('slug-edge-hyphen', slug);
  return slug;
}

export function isValidRunId(runId) {
  return typeof runId === 'string' && RUN_ID_PATTERN.test(runId);
}

export function assertValidRunId(runId) {
  if (!isValidRunId(runId)) reject('run-id-shape', runId);
  return runId;
}

// 本地时间 yyyyMMdd（D23：日期只为人读，取创建时刻的本地日历日）。
export function localDateStamp(epochMs = Date.now()) {
  const date = new Date(epochMs);
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export function formatRunId({ seq, slug, date }) {
  if (!Number.isInteger(seq) || seq < 1) reject('seq', seq);
  const cleanSlug = normalizeThemeSlug(slug);
  if (typeof date !== 'string' || !/^\d{8}$/.test(date)) reject('date', date);
  return `R${String(seq).padStart(3, '0')}-${cleanSlug}-${date}`;
}
