// fs-probe-register.mjs — DHR_74 诊断探针注入入口（测试侧，非生产代码）。
// 用法：NODE_OPTIONS="--import ./test/helpers/fs-probe-register.mjs" node --test ...
// 零测试文件改动、可一键卸载（不设 NODE_OPTIONS 即无探针）。
import { register } from 'node:module';

register(new URL('./fs-probe-hooks.mjs', import.meta.url));

const { probeState, emit, summarizeAtExit } = await import('./fs-probe-shim.mjs');

emit(`ACTIVE mode=loader-hook pid=${process.pid} node=${process.version}`);

const TIERS = [
  [1000, 'SLOW'],
  [5000, 'STILL-SLOW-5s'],
  [15000, 'STILL-SLOW-15s'],
];
const reported = new Map();
const sampler = setInterval(() => {
  const now = performance.now();
  for (const [id, entry] of probeState.pending) {
    const elapsed = now - entry.start;
    for (const [threshold, tag] of TIERS) {
      if (elapsed >= threshold && (reported.get(id) ?? 0) < threshold) {
        reported.set(id, threshold);
        emit(`${tag} op=${entry.op} elapsed=${Math.round(elapsed)}ms path=${entry.path}`);
      }
    }
  }
}, 500);
sampler.unref();

// 事件循环滞后检测：500ms 的 interval 实际晚点超过 400ms 即报 LOOP-LAG。
// 判据 = event loop 被同步工作（如全量 replay）饿死，与 fs 慢（STILL-SLOW）互斥可区分。
let lastTick = performance.now();
const lagDetector = setInterval(() => {
  const now = performance.now();
  const lag = now - lastTick - 500;
  lastTick = now;
  if (lag > 400) emit(`LOOP-LAG drift=${Math.round(lag)}ms`);
}, 500);
lagDetector.unref();

process.on('exit', () => {
  summarizeAtExit();
});
