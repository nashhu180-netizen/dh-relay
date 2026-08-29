// reachability.mjs — Workflow 定义期的图语义校验。

export function assessRunReachability(runDoc) {
  const nodes = Array.isArray(runDoc?.nodes) ? runDoc.nodes : [];
  const byId = new Map(nodes.map((node, index) => [node.node_id, { node, index }]));

  for (let index = 0; index < nodes.length; index += 1) {
    const dependencies = Array.isArray(nodes[index]?.depends_on) ? nodes[index].depends_on : [];
    if (dependencies.some(nodeId => !byId.has(nodeId))) {
      return { valid: false, reason: 'E_BAD_VALUE', at: `/nodes/${index}/depends_on` };
    }
  }

  const state = new Map();
  const visit = (entry) => {
    state.set(entry.node.node_id, 'visiting');
    const dependencies = Array.isArray(entry.node.depends_on) ? entry.node.depends_on : [];
    for (const nodeId of dependencies) {
      const dependency = byId.get(nodeId);
      if (state.get(nodeId) === 'visiting') {
        return { valid: false, reason: 'E_BAD_VALUE', at: `/nodes/${entry.index}/depends_on` };
      }
      if (state.get(nodeId) !== 'visited') {
        const invalid = visit(dependency);
        if (invalid) return invalid;
      }
    }
    state.set(entry.node.node_id, 'visited');
    return null;
  };

  for (const entry of byId.values()) {
    if (!state.has(entry.node.node_id)) {
      const invalid = visit(entry);
      if (invalid) return invalid;
    }
  }

  const requiredClosure = new Set();
  const pending = nodes.filter(node => node?.required === true).map(node => node.node_id);
  while (pending.length > 0) {
    const nodeId = pending.pop();
    if (requiredClosure.has(nodeId)) continue;
    requiredClosure.add(nodeId);
    const dependencies = byId.get(nodeId)?.node.depends_on;
    if (Array.isArray(dependencies)) pending.push(...dependencies);
  }

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    const profiles = node?.executor_profiles;
    if (requiredClosure.has(node.node_id)
      && Array.isArray(profiles)
      && profiles.length > 0
      && profiles.every(profile => profile?.kind === 'dsh-agent')) {
      return {
        valid: false,
        reason: 'E_DSH_ONLY_REQUIRED_ROLE',
        at: `/nodes/${index}/executor_profiles`,
      };
    }
  }

  return { valid: true, reason: null };
}
