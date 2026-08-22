// PID 探活：跨平台最小实现。
//   true      进程存在（含属于其他用户 → EPERM 视为存在）
//   false     进程不存在（ESRCH）
// 残余风险（登记 as-built）：PID 复用会让死宿主被误判活——TTL 过期是兜底，
// 最坏情况是「假 alive 直到租约到期」，独占性不受影响。

export function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  if (pid === process.pid) return true;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === 'ESRCH') return false;
    if (error.code === 'EPERM') return true;
    throw error;
  }
}
