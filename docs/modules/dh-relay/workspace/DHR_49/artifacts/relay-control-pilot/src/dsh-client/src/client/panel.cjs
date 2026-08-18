const React = require('react')
const { useCallback, useEffect, useMemo, useRef, useState } = React

const palette = {
  panel: { position: 'fixed', left: 16, bottom: 72, width: 'min(920px, calc(100vw - 32px))', maxHeight: 'calc(100vh - 96px)', overflow: 'auto', zIndex: 2147483000, background: '#111827', color: '#f9fafb', border: '1px solid #374151', borderRadius: 12, boxShadow: '0 24px 60px rgba(0,0,0,.45)', padding: 16, fontFamily: 'ui-sans-serif, system-ui, sans-serif' },
  button: { border: '1px solid #4b5563', borderRadius: 8, background: '#1f2937', color: '#f9fafb', cursor: 'pointer', padding: '7px 10px', fontSize: 13 },
  ghost: { border: '1px solid #4b5563', borderRadius: 7, background: 'transparent', color: '#d1d5db', cursor: 'pointer', padding: '5px 8px', fontSize: 12 },
  card: { display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) auto auto', gap: 10, alignItems: 'center', width: '100%', textAlign: 'left', border: '1px solid #374151', borderRadius: 8, background: '#1f2937', color: '#f9fafb', cursor: 'pointer', padding: 10, marginBottom: 8 },
  meta: { color: '#9ca3af', fontSize: 12 },
  badge: { borderRadius: 999, background: '#374151', color: '#e5e7eb', padding: '2px 7px', fontSize: 11 },
}

function text(value, fallback = '—') {
  return value === undefined || value === null || value === '' ? fallback : String(value)
}

function useSnapshot(endpoint, enabled) {
  const [state, setState] = useState({ phase: 'idle', snapshot: null, error: null })
  const generation = useRef(0)
  const load = useCallback(() => {
    const current = ++generation.current
    const controller = new AbortController()
    setState(previous => ({ phase: 'loading', snapshot: previous.snapshot, error: null }))
    fetch(endpoint, { cache: 'no-store', headers: { accept: 'application/json' }, signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const snapshot = validateSnapshot(await response.json())
        if (generation.current === current) setState({ phase: 'ready', snapshot, error: null })
      })
      .catch(error => {
        if (error && error.name === 'AbortError') return
        if (generation.current === current) setState({ phase: 'error', snapshot: null, error: String(error) })
      })
    return () => controller.abort()
  }, [endpoint])
  useEffect(() => enabled ? load() : undefined, [enabled, load])
  return { ...state, reload: load }
}

function RunList({ snapshot, onSelect }) {
  const sections = useMemo(() => groupRuns(snapshot.list), [snapshot])
  if (sections.length === 0) return React.createElement('p', { style: palette.meta }, 'No Relay runs in this fixture.')
  return React.createElement('div', { 'data-view': 'list' }, sections.map(section => React.createElement(
    'section',
    { key: section.group, 'data-relay-group': section.group, style: { marginBottom: 18 } },
    React.createElement('h3', { style: { margin: '0 0 8px', fontSize: 14 } }, section.group),
    section.runs.map(run => React.createElement(
      'button',
      { key: run.run_id, type: 'button', onClick: () => onSelect(run.run_id), style: palette.card, 'data-run-id': run.run_id },
      React.createElement('span', null,
        React.createElement('strong', { style: { display: 'block', marginBottom: 3 } }, text(run.workflow_name)),
        React.createElement('span', { style: palette.meta }, `${text(run.current_node_id)} · ${text(run.current_node_title)}`),
      ),
      React.createElement('span', { style: palette.badge }, text(run.run_status)),
      React.createElement('span', { style: { ...palette.meta, textAlign: 'right' } }, `${run.progress.done}/${run.progress.total} · ⚠ ${text(run.attention_count, '0')}`),
    )),
  )))
}

function DetailTable({ detail }) {
  const rows = Array.isArray(detail.nodes) ? detail.nodes : []
  const attentions = Array.isArray(detail.attentions) ? detail.attentions : []
  return React.createElement('div', { 'data-view': 'detail', 'data-run-id': detail.run_id },
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 8, marginBottom: 14 } },
      ['run_status', 'started_at', 'trigger', 'trigger_by', 'attempt', 'elapsed_seconds'].map(key => React.createElement('div', { key, style: { background: '#1f2937', borderRadius: 8, padding: 8 } },
        React.createElement('div', { style: palette.meta }, key), React.createElement('div', null, text(detail[key])),
      )),
    ),
    React.createElement('h3', { style: { fontSize: 14, marginBottom: 8 } }, `Nodes (${rows.length})`),
    React.createElement('div', { style: { overflowX: 'auto', marginBottom: 14 } },
      React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: 12 } },
        React.createElement('thead', null, React.createElement('tr', null, ['node', 'title', 'status', 'depends_on'].map(label => React.createElement('th', { key: label, style: { textAlign: 'left', borderBottom: '1px solid #4b5563', padding: 7 } }, label)))),
        React.createElement('tbody', null, rows.map((node, index) => React.createElement('tr', { key: node.node_id || index },
          React.createElement('td', { style: { padding: 7, borderBottom: '1px solid #273244' } }, text(node.node_id)),
          React.createElement('td', { style: { padding: 7, borderBottom: '1px solid #273244' } }, text(node.title)),
          React.createElement('td', { style: { padding: 7, borderBottom: '1px solid #273244' } }, text(node.status)),
          React.createElement('td', { style: { padding: 7, borderBottom: '1px solid #273244' } }, Array.isArray(node.depends_on) ? node.depends_on.join(', ') || '—' : text(node.depends_on)),
        ))),
      ),
    ),
    React.createElement('h3', { style: { fontSize: 14, marginBottom: 8 } }, `Attention (${attentions.length})`),
    attentions.length === 0
      ? React.createElement('p', { style: palette.meta }, 'No attention items.')
      : React.createElement('ul', { style: { margin: 0, paddingLeft: 20 } }, attentions.map((item, index) => React.createElement('li', { key: item.attention_id || index, style: { marginBottom: 6 } }, `${text(item.severity)} · ${text(item.summary || item.title)}`))),
  )
}

function RelayPilotPanel({ wide, endpoint }) {
  const [open, setOpen] = useState(false)
  const [selectedRunId, setSelectedRunId] = useState(null)
  const { phase, snapshot, error, reload } = useSnapshot(endpoint, open)
  const detail = snapshot && selectedRunId ? selectDetail(snapshot, selectedRunId) : null
  useEffect(() => { if (snapshot && selectedRunId && detail === null) setSelectedRunId(null) }, [snapshot, selectedRunId, detail])
  return React.createElement(React.Fragment, null,
    React.createElement('button', { type: 'button', style: palette.button, onClick: () => setOpen(value => !value), 'aria-expanded': open, 'aria-label': 'Relay Pilot', 'data-relay-pilot-trigger': true }, wide ? 'Relay Pilot' : 'R'),
    open && React.createElement('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Relay Pilot', style: palette.panel, 'data-relay-pilot-panel': true },
      React.createElement('header', { style: { display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', marginBottom: 14 } },
        React.createElement('div', null,
          React.createElement('h2', { style: { margin: 0, fontSize: 17 } }, detail ? text(detail.workflow_name) : 'Relay Pilot'),
          React.createElement('div', { style: palette.meta }, snapshot ? `${snapshot.schema_version} · ${snapshot.fixture_hash.slice(0, 12)}` : 'Read-only fixture projection'),
        ),
        React.createElement('div', { style: { display: 'flex', gap: 6 } },
          detail && React.createElement('button', { type: 'button', style: palette.ghost, onClick: () => setSelectedRunId(null) }, 'Back'),
          React.createElement('button', { type: 'button', style: palette.ghost, onClick: reload }, 'Refresh'),
          React.createElement('button', { type: 'button', style: palette.ghost, onClick: () => setOpen(false), 'aria-label': 'Close' }, 'Close'),
        ),
      ),
      phase === 'loading' && !snapshot && React.createElement('p', { style: palette.meta }, 'Loading…'),
      phase === 'error' && React.createElement('p', { role: 'alert', style: { color: '#fca5a5' } }, error),
      snapshot && (detail
        ? React.createElement(DetailTable, { detail })
        : React.createElement(RunList, { snapshot, onSelect: setSelectedRunId })),
    ),
  )
}

const inject = ['slots']
function apply(ctx) {
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'relay-pilot',
    inject: () => ({ endpoint: '/relay-pilot/snapshot' }),
  }, RelayPilotPanel))
}

module.exports = { inject, apply, default: apply, RelayPilotPanel }
