// capability-baseline.mjs — capability_manifest 的参考基线与对证
//
// 为什么有这份文件（E4 需求复核 P1-1 + E2 代码复核 P3-3）：
//   `CANONICALIZATION.md` §三末句与 §四「留给下游」表第 1 行**逐字**把
//   「对 §三 的样例清单跑出可复算的固定 digest 作为回归基线」写成**批 3 的交付项**。
//   产物里零命中——这是本卡「写进冻结契约的交付承诺静默没做」的第四次（F-047 是第一次）。
//
// 它防的是两件事：
//   ① **互操作对不上**：capability_hash 是验收口径第 1 条点名的字段，
//      CANONICALIZATION.md §一 自己写了失效后果——两个实现各按自己的方式算，握手**永远**
//      E_CAPABILITY_MISMATCH。现在这份契约有口径散文、有 JCS 实现，唯独没有那个**让两边能对上的参考值**。
//      DHR_29 与 DHR_30 各自实现握手时，谁都无法验证自己算对了。
//   ② **真正被冻结的东西没有基线**：`fixtures/manifest.json` 钉的是 55 份 fixture，
//      `contracts/` 一份都没钉。改任一 schema 的任意一个字——包括 CANONICALIZATION 明写
//      「改一个错别字都是能力变更、都会断握手」的那种改动——四道闸全绿、manifest 全绿，
//      没有任何机制指出「能力指纹变了」。F-047 的立论原话对 12 份 schema 逐字同样成立，
//      而 schema 才是本卡真正冻结的工件。
//
// 口径全部来自 contracts/CANONICALIZATION.md §三，本文件不另立规则：
//   · protocols = 7 份**已冻结**协议 + 1 份共享定义模块（`relay.common/v1`）的 {id, digest}；
//     v0 形状**不计入**（未冻结，计入会让指纹随未定形状漂移）。共享模块**必须计入**——
//     实际约束面的大半在它里面，漏掉它 = F-033 缺口 A 下沉一层（E2 轮 2 · P2-1 实证）
//   · digest = sha256(JCS(该 schema 文件全文))，**含 description/$comment/title，不剥离**
//   · methods / notifications / executor_kinds = 本 Runtime 实际实现的子集
//   · 四个数组均按 UTF-16 码元升序排序；protocols 按 id 排序
//   · capability_hash = sha256(JCS(capability_manifest))
//
// 基线取「只托管 process 的最小 P5 参考实现」——CANONICALIZATION.md §三的样例形状本身。
// 别的 Runtime（带 Pi Adapter 的、带 DSH Native 的）算出的是**另一个**指纹，那是设计意图
// （executor_kinds 维度存在的全部理由，见 §三 D-26 缺口 B）。
//
// 用法：
//   node tools/capability-baseline.mjs            # 对证（默认），不符 exit 1
//   node tools/capability-baseline.mjs --write    # 重新生成
//   node tools/capability-baseline.mjs --print    # 只打印算出来的清单，不落盘
//
// 依赖面：只有 node 标准库 + 同目录 canonical.mjs。零 Runtime、零工作台、零业务代码。

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, jcs } from './canonical.mjs';

const CONTRACTS = fileURLToPath(new URL('../contracts/', import.meta.url));
// ⚠️ 基线**不放 contracts/**：那里的命名约定闸（D-29）要求 *.schema.json / *.shape.json，
// 放进去要么触发违规、要么得给闸开例外——而「给闸开例外」正是本卡一路在避免的形态。
// 它也确实不是契约，是契约语料的**派生基线**，所以落在代码根顶层。
const BASELINE = fileURLToPath(new URL('../capability-baseline.json', import.meta.url));

// 参考实现的能力面：托管 process 与 herdr-agent。改这里等于声明「参考实现的能力变了」，
// 指纹必然随之变化——这正是 executor_kinds 这个维度存在的意义。
const REFERENCE_EXECUTOR_KINDS = ['herdr-agent', 'process'];

function frozenSchemas() {
  // **顶层 9 份已冻结协议 + 1 份共享定义模块**。DHR_30 增补 formal read model 与 method contract，
  // 它们与原有协议一样参与 capability_hash。
  //
  // ⚠️ 首版只枚举 contracts/ 顶层的 7 份，把 `_shared/relay.common.v1.schema.json` 漏在外面。
  // 后果是 **F-033 缺口 A 下沉一层**（本卡此类第五次）：F-033 用 {id,digest} 把 7 份协议的
  // **内容**纳进指纹，理由是「`relay.run/v2` 只是个名字，两个 Runtime 对着不同修订版的同名协议
  // 编译，指纹会完全相同」——但**内容所依赖的共享模块没纳进来**，而实际约束面的大半在那里：
  // locator / timestamp / sha256 / run_id / node_id / attempt_id / executor_kind /
  // executor_profile / reason_code / trigger / observation_status 全在 `_shared` 里。
  //
  // E2 实测：把 `locator.pattern` 改成 `^.*$`（G5 全域绝对路径禁令**彻底失效**）之后，
  // `capability_hash` **逐字未变**（5c5685d0748b9f58…），基线与审计双双 exit 0。
  // 两个 Runtime 于是能带着完全不同的 locator 约束握手成功，然后互相拒对方的每一份载荷。
  //
  // **为什么排除 v0 形状是对的、排除 `_shared` 不是**：v0 形状未冻结，计入会让指纹随未定形状
  // 漂移；而 `_shared` 是**冻结的、且承重的**——同一条理由反过来要求把它计入。
  const files = [];
  for (const e of readdirSync(CONTRACTS, { withFileTypes: true })) {
    if (e.isFile() && e.name.endsWith('.schema.json')) files.push(e.name);
  }
  files.sort();
  if (files.length !== 9) {
    throw new Error(`contracts/ 顶层应有 9 份已冻结协议，实为 ${files.length} 份：${files.join(', ')}`
      + ' —— 协议集变了就是能力变了，先确认这是有意的，再跑 --write');
  }
  // 共享定义模块单独列：它不在顶层、不参与「7 份」计数，但**必须计入指纹**
  const sharedDir = join(CONTRACTS, '_shared');
  const shared = readdirSync(sharedDir, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.schema.json')).map(e => e.name).sort();
  if (shared.length !== 1) {
    throw new Error(`contracts/_shared/ 应有 1 份共享定义模块，实为 ${shared.length} 份：${shared.join(', ')}`
      + ' —— 共享定义是全部协议的承重面，增删就是能力变更');
  }

  const all = [...files.map(f => [CONTRACTS, f]), ...shared.map(f => [sharedDir, f])];
  return all.map(([dir, f]) => {
    const doc = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    if (!doc.$id) throw new Error(`${f} 缺 $id`);
    const id = doc.$id.replace('https://dh-relay.local/contracts/', '');
    return { id, digest: digest(doc) };
  }).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function build() {
  const rpc = JSON.parse(readFileSync(join(CONTRACTS, 'relay.rpc.v1.schema.json'), 'utf8'));
  const methods = [...(rpc.$defs?.method?.enum ?? [])].sort();
  const notifications = [...(rpc.$defs?.notification?.properties?.method?.enum ?? [])].sort();
  if (methods.length === 0 || notifications.length === 0) {
    throw new Error('从 relay.rpc/v1 取不到 method / notification 枚举——schema 结构变了，先确认再 --write');
  }
  const capability_manifest = {
    protocols: frozenSchemas(),
    methods,
    notifications,
    executor_kinds: [...REFERENCE_EXECUTOR_KINDS].sort(),
  };
  return {
    $comment:
      '参考基线：只托管 process 的最小 P5 参考实现的 capability_manifest 与其 capability_hash。'
      + ' 口径见 contracts/CANONICALIZATION.md §三（E4 需求复核 P1-1 / E2 代码复核 P3-3 逼出）。'
      + ' **它同时是 12 份契约的 digest 基线**：改任一 schema 的任意一个字（含 description，本卡有意不剥离）'
      + '都会让这里的 digest 与 capability_hash 变化，`npm test` 立刻红——'
      + '这正是「改一个错别字也是能力变更、也会断握手」那条规定的机器表达。'
      + ' 改契约后跑 `node tools/capability-baseline.mjs --write` 重新生成，'
      + '并在 commit 里能看见 capability_hash 变了。',
    capability_manifest,
    capability_hash: digest(capability_manifest),
  };
}

const argv = process.argv.slice(2);

if (argv.includes('--print')) {
  const b = build();
  console.log(jcs(b.capability_manifest));
  console.log(`\ncapability_hash = ${b.capability_hash}`);
  process.exit(0);
}

if (argv.includes('--write')) {
  const b = build();
  writeFileSync(BASELINE, JSON.stringify(b, null, 2) + '\n');
  console.log(`已写 capability-baseline.json：${b.capability_manifest.protocols.length} 份（9 顶层协议 + 1 共享定义模块）`
    + ` / ${b.capability_manifest.methods.length} methods / ${b.capability_manifest.notifications.length} notifications`
    + ` / executor_kinds=[${b.capability_manifest.executor_kinds.join(',')}]`);
  console.log(`capability_hash = ${b.capability_hash}`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.error('capability-baseline.json 不存在——capability_hash 没有参考基线，跑 --write 生成');
  process.exit(1);
}

const want = build();
const got = JSON.parse(readFileSync(BASELINE, 'utf8'));
const errors = [];

if (got.capability_hash !== want.capability_hash) {
  errors.push(`capability_hash 不符：基线=${got.capability_hash} 实算=${want.capability_hash}`);
}
const gotP = new Map((got.capability_manifest?.protocols ?? []).map(p => [p.id, p.digest]));
const wantP = new Map(want.capability_manifest.protocols.map(p => [p.id, p.digest]));
for (const [id, d] of wantP) {
  if (!gotP.has(id)) errors.push(`协议 ${id} 在基线里没有登记——协议集变了`);
  else if (gotP.get(id) !== d) errors.push(`协议 ${id} 的 digest 变了（基线=${gotP.get(id).slice(0, 12)}… 实算=${d.slice(0, 12)}…）——该 schema 被改过，这是一次能力变更`);
}
for (const id of gotP.keys()) if (!wantP.has(id)) errors.push(`基线里有 ${id}，contracts/ 里没有——协议被删除或改名`);
for (const k of ['methods', 'notifications', 'executor_kinds']) {
  const a = JSON.stringify(got.capability_manifest?.[k] ?? []);
  const b = JSON.stringify(want.capability_manifest[k]);
  if (a !== b) errors.push(`${k} 变了：基线=${a} 实算=${b}`);
}

if (errors.length === 0) {
  console.log(`capability 基线对证通过：${want.capability_manifest.protocols.length} 份（9 顶层协议 + 1 共享定义模块）digest 相符，capability_hash = ${got.capability_hash.slice(0, 16)}…`);
  process.exit(0);
}
console.error('capability 基线对证失败：');
for (const e of errors) console.error(`  ! ${e}`);
console.error('  改契约是有意的话，跑 `node tools/capability-baseline.mjs --write` 重新生成基线。');
process.exit(1);
