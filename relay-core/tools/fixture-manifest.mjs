// fixture-manifest.mjs — fixtures/manifest.json 的生成与对证
//
// 为什么有这份文件（批次检查点 3 小审 P1-1）：
//   task_plan 步12 明文要求「目录内放 manifest.json 列全部 fixture 与其 canonical sha256
//   （承接 P4 §2.1 的 manifest 对证做法）」。首版没做，且 visual_map 的计划行被改写成
//   不含 manifest 后标 100/present——三处（计划 / 产物 / 复核题面）同时消失。
//
// 它防的不是记账问题，是**基线漂移**：
//   没有 manifest，`--selftest` 的 pass=31 只能证明「当下盘上这 31 份自洽」，
//   证明不了「这 31 份还是过审时那 31 份」。DHR_29/30 拿这套 fixture 当契约回归基线时，
//   任何一份被悄悄改软（比如把 g5 反例的 ref 从绝对路径改成相对路径、再把 expect 改成
//   别的码），npm test 照样全绿、审计照样 exit 0，没有任何机制能发现。
//
// 口径：canonical sha256 = lowercase_hex(sha256(utf8(JCS(载荷))))，见 contracts/CANONICALIZATION.md。
//   用 JCS 而不是文件字节 sha256，是为了让「换行尾 / 重排缩进」这类无语义改动不误报，
//   而**任何语义改动都必报**——正是基线对证想要的判别力。
//
// 用法：
//   node tools/fixture-manifest.mjs            # 对证（默认），不符 exit 1
//   node tools/fixture-manifest.mjs --write    # 重新生成
//
// 依赖面：只有 node 标准库 + 同目录 canonical.mjs。零 Runtime、零工作台、零业务代码。

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest } from './canonical.mjs';

const FIX_DIR = fileURLToPath(new URL('../fixtures/', import.meta.url));
const MANIFEST = join(FIX_DIR, 'manifest.json');
const MANIFEST_BASENAME = 'manifest.json';

function listFixtureFiles() {
  const out = [];
  for (const group of ['golden', 'negative']) {
    const dir = join(FIX_DIR, group);
    if (!existsSync(dir)) throw new Error(`fixtures/${group}/ 不存在`);
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (!e.isFile()) throw new Error(`fixtures/${group}/${e.name} 不是普通文件——manifest 不处理子目录，别静默跳过`);
      // ⚠️ 不按后缀过滤后静默跳过（本卡反复在堵的"静默降级"形态）：
      // 目录里出现任何非 .json 文件都是异常，报错而不是当没这回事。
      if (!e.name.endsWith('.json')) throw new Error(`fixtures/${group}/${e.name} 不是 .json——fixture 目录不该有别的东西`);
      out.push(relative(FIX_DIR, join(dir, e.name)).split(sep).join('/'));
    }
  }
  return out.sort();
}

function entriesFor(paths) {
  return paths.map((p) => {
    const raw = readFileSync(join(FIX_DIR, p), 'utf8');
    let parsed;
    try { parsed = JSON.parse(raw); } catch (e) { throw new Error(`fixtures/${p} 不是合法 JSON: ${e.message}`); }
    return { path: p, digest: digest(parsed) };
  });
}

function build() {
  const paths = listFixtureFiles();
  const files = entriesFor(paths);
  const counts = {
    golden: paths.filter((p) => p.startsWith('golden/')).length,
    negative_payload: paths.filter((p) => p.startsWith('negative/') && !p.endsWith('.expect.json')).length,
    negative_expect: paths.filter((p) => p.endsWith('.expect.json')).length,
    total: paths.length,
  };
  return {
    $comment:
      '本文件是 fixture 基线对证清单（批次检查点 3 小审 P1-1，承接 P4 §2.1 的 manifest 对证做法）。'
      + ' digest = lowercase_hex(sha256(utf8(JCS(载荷))))，口径见 contracts/CANONICALIZATION.md。'
      + ' 改任何 fixture 后必须跑 `node tools/fixture-manifest.mjs --write` 重新生成，并在 commit 里能看见 digest 变了——'
      + ' 这正是它的用途：让 fixture 的语义改动不可能悄悄发生。',
    canonicalization: 'RFC 8785 (JCS) + sha256, lowercase hex — contracts/CANONICALIZATION.md',
    counts,
    files,
  };
}

function check() {
  if (!existsSync(MANIFEST)) {
    return { ok: false, errors: ['fixtures/manifest.json 不存在——基线对证清单缺失，跑 --write 生成'] };
  }
  const errors = [];
  const want = build();
  let got;
  try { got = JSON.parse(readFileSync(MANIFEST, 'utf8')); } catch (e) {
    return { ok: false, errors: [`manifest.json 不是合法 JSON: ${e.message}`] };
  }

  const gotFiles = new Map((got.files ?? []).map((f) => [f.path, f.digest]));
  const wantFiles = new Map(want.files.map((f) => [f.path, f.digest]));

  // 相等，不是「至少」：盘上多一份、少一份都要报（cp3 的原话——份数必须与目录实际文件数相等）
  for (const [p, d] of wantFiles) {
    if (!gotFiles.has(p)) errors.push(`盘上有 fixtures/${p}，manifest 里没有——新增 fixture 未登记`);
    else if (gotFiles.get(p) !== d) errors.push(`fixtures/${p} 的 digest 与 manifest 不符（manifest=${gotFiles.get(p)?.slice(0, 12)}… 实算=${d.slice(0, 12)}…）——fixture 被改过且未重新生成 manifest`);
  }
  for (const p of gotFiles.keys()) {
    if (!wantFiles.has(p)) errors.push(`manifest 里有 ${p}，盘上没有——fixture 被删除或改名`);
  }

  for (const k of Object.keys(want.counts)) {
    if (got.counts?.[k] !== want.counts[k]) errors.push(`counts.${k}: manifest=${got.counts?.[k]} 实际=${want.counts[k]}`);
  }

  // 每份 negative 载荷必须恰有一份同名 .expect.json，反之亦然（孤儿 expect 会让
  // 「三条各有一份反例钉住」那类只读 expect 的测试空绿）
  const payloads = new Set([...wantFiles.keys()].filter((p) => p.startsWith('negative/') && !p.endsWith('.expect.json')));
  const expects = new Set([...wantFiles.keys()].filter((p) => p.endsWith('.expect.json')));
  for (const p of payloads) if (!expects.has(p.replace(/\.json$/, '.expect.json'))) errors.push(`${p} 缺同名 .expect.json`);
  for (const e of expects) if (!payloads.has(e.replace(/\.expect\.json$/, '.json'))) errors.push(`${e} 是孤儿——没有对应的反例载荷`);

  return { ok: errors.length === 0, errors, counts: want.counts };
}

const argv = process.argv.slice(2);
if (argv.includes('--write')) {
  const m = build();
  writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + '\n');
  console.log(`已写 fixtures/${MANIFEST_BASENAME}：${m.counts.total} 份（golden ${m.counts.golden} / negative 载荷 ${m.counts.negative_payload} / expect ${m.counts.negative_expect}）`);
} else {
  const r = check();
  if (r.ok) {
    console.log(`manifest 对证通过：${r.counts.total} 份逐份 digest 相符（golden ${r.counts.golden} / negative 载荷 ${r.counts.negative_payload} / expect ${r.counts.negative_expect}）`);
    process.exit(0);
  }
  console.error('manifest 对证失败：');
  for (const e of r.errors) console.error(`  ! ${e}`);
  process.exit(1);
}
