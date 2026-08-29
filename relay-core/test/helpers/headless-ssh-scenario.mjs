// Linux 真实 SSH 证据延后（B-22①）；本剧本只冻结「断连不等于观测中断」的桩语义，绝不冒充 smoke。
export const HEADLESS_SSH_SCENARIO = Object.freeze({
  platform: 'linux',
  transport: 'ssh-disconnected',
  observation: 'continues-from-herdr-host',
  note: 'Linux 真实 SSH 证据延后（B-22①），桩不冒充',
});
