import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';

const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');

function inside(root, target) {
  const path = relative(root, target);
  return path === '' || (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path));
}

/** Load the immutable, repository-local task instruction before an Attempt exists. */
export async function loadStartupInstruction({ repoRoot, instructionRef, receiptId = null } = {}) {
  if (!instructionRef || typeof instructionRef.path !== 'string' || typeof instructionRef.sha256 !== 'string') {
    return { ok: false, reason: 'E_STARTUP_INSTRUCTION_INVALID' };
  }
  if (isAbsolute(instructionRef.path)) return { ok: false, reason: 'E_STARTUP_INSTRUCTION_INVALID' };
  try {
    const root = await realpath(repoRoot);
    const file = await realpath(resolve(root, instructionRef.path));
    if (!inside(root, file)) return { ok: false, reason: 'E_STARTUP_INSTRUCTION_INVALID' };
    const content = await readFile(file, 'utf8');
    if (sha256(content) !== instructionRef.sha256) return { ok: false, reason: 'E_STARTUP_INSTRUCTION_INVALID' };
    const text = [
      `任务仓根：${root}`,
      `任务指针：${instructionRef.path} (sha256:${instructionRef.sha256})`,
      receiptId === null ? null : '任务完成后，仅提交 Receipt-bound 结果：',
      receiptId === null ? null : `relay submit-result --receipt-id ${receiptId} --outcome succeeded`,
      receiptId === null ? null : `或：relay submit-result --receipt-id ${receiptId} --outcome failed --reason E_EXECUTOR_REPORTED_FAILURE`,
      receiptId === null ? null : '重复收到本指令时，从持久事实续做；不要通过 pane 输出、日志、退出码或其它通道代替该提交。',
    ].filter(Boolean).join('\n');
    return { ok: true, text, prompt_digest: sha256(text), instruction_ref: { ...instructionRef } };
  } catch {
    return { ok: false, reason: 'E_STARTUP_INSTRUCTION_INVALID' };
  }
}
