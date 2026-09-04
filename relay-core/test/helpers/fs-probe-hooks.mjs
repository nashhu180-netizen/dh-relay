// fs-probe-hooks.mjs — DHR_74 诊断探针 loader hook（测试侧）。
// 把所有 ESM 对 'node:fs/promises' 的解析重定向到包装 shim；shim 自身的导入
// （parentURL = shim 文件）放行走真实内建模块，避免递归。CJS require 不经过
// ESM resolve hook，属已知覆盖缺口（relay-core 生产/测试均为 ESM，不受影响）。
const SHIM_URL = new URL('./fs-probe-shim.mjs', import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'node:fs/promises' && context.parentURL !== SHIM_URL) {
    return { url: SHIM_URL, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
