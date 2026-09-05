// 临时文件状态桩：测试通过 `node <this> <state.json> ...herdrArgs` 注入 herdrBin。
import { readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const [statePath, ...args] = process.argv.slice(2);
const state = JSON.parse(readFileSync(statePath, 'utf8'));
state.calls ??= [];
state.calls.push(args);
writeFileSync(statePath, JSON.stringify(state), 'utf8');
if (state.descendant_pid_path) {
  const descendant = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
    stdio: 'ignore', windowsHide: true,
  });
  writeFileSync(state.descendant_pid_path, String(descendant.pid), 'utf8');
}
if (state.delay_ms) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, state.delay_ms);
if (state.signal) process.kill(process.pid, state.signal);
if (state.exit_code) {
  process.stderr.write(state.stderr ?? 'not found');
  process.exit(state.exit_code);
}
const key = args.slice(0, 2).join(' ');
const result = state.responses?.[key] ?? {};
if (!state.empty_stdout) process.stdout.write(`${JSON.stringify({ id: 'fake', result, type: 'fake' })}\n`);
