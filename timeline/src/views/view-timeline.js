import { el, mount, formatDate } from '../lib/ui.js?v=9bb71c6';

const ZOOMS = [
  { id: 'far', label: 'Far', pxPerDay: 0.25, tick: 'year' },
  { id: 'year', label: 'Year', pxPerDay: 0.6, tick: 'month' },
  { id: 'month', label: 'Month', pxPerDay: 1.4, tick: 'month' },
  { id: 'near', label: 'Near', pxPerDay: 3.0, tick: 'day' },
];

export function viewTimeline({ root, store, setStore, navigate }) {
  const entriesAll = store.entries
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const initialId = store.selectedId || entriesAll.at(-1)?.id || null;
  if (initialId && store.selectedId !== initialId) setStore({ selectedId: initialId });

  const zoomIndex = clampInt(store.zoomIndex ?? 1, 0, ZOOMS.length - 1);
  if (store.zoomIndex !== zoomIndex) setStore({ zoomIndex });

  const toolbar = el('div', { class: 'axis-toolbar' },
    el('div', { class: 'zoom' },
      el('button', {
        class: 'btn',
        type: 'button',
        onclick: () => setStore({ zoomIndex: clampInt(zoomIndex - 1, 0, ZOOMS.length - 1) }),
        'aria-label': 'Zoom out',
      }, '−'),
      el('div', { class: 'zoom-label', 'aria-label': 'Zoom level' }, ZOOMS[zoomIndex].label),
      el('button', {
        class: 'btn',
        type: 'button',
        onclick: () => setStore({ zoomIndex: clampInt(zoomIndex + 1, 0, ZOOMS.length - 1) }),
        'aria-label': 'Zoom in',
      }, '+')
    ),
    el('div', { class: 'axis-hint' }, 'Drag to pan • Click a node to open')
  );

  const axis = entriesAll.length
    ? axisTimeline({
      entries: entriesAll,
      selectedId: store.selectedId,
      zoom: ZOOMS[zoomIndex],
      onSelect: (id) => {
        setStore({ selectedId: id });
        navigate(`/entry/${id}`);
      },
    })
    : el('div', { class: 'axis-empty' }, 'No entries yet. Add one to start.');

  mount(root, toolbar, axis);

  // After render: center the selected node.
  queueMicrotask(() => {
    const viewport = root.querySelector('[data-axis-viewport="1"]');
    const selectedEl = root.querySelector('[data-axis-selected="1"]');
    if (!viewport || !selectedEl) return;
    const targetLeft = selectedEl.offsetLeft - (viewport.clientWidth / 2) + (selectedEl.clientWidth / 2);
    viewport.scrollTo({ left: Math.max(0, targetLeft), behavior: 'instant' });
  });
}

// (Search/filter UI intentionally removed for the "just the axis" phase.)

function axisTimeline({ entries, selectedId, zoom, onSelect }) {
  const dates = entries
    .map((e) => parseISODate(e.date))
    .filter(Boolean);

  const min = dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : null;
  const max = dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null;

  // Pad a bit so the first/last nodes aren't glued to the edge.
  const minPadded = min ? addDays(min, -20) : null;
  const maxPadded = max ? addDays(max, 20) : null;

  const spanDays = minPadded && maxPadded ? Math.max(1, daysBetween(minPadded, maxPadded)) : 1;
  const trackW = Math.max(900, Math.round(spanDays * zoom.pxPerDay));

  const ticks = minPadded && maxPadded ? buildTicks(minPadded, maxPadded, zoom.tick) : [];

  const viewport = el('div', {
    class: 'axis-viewport',
    'data-axis-viewport': '1',
  });

  const track = el('div', {
    class: 'axis-track',
    style: `width:${trackW}px`,
    role: 'list',
    'aria-label': 'Timeline axis',
  },
    el('div', { class: 'axis-line', 'aria-hidden': 'true' }),
    ...ticks.map((t) => axisTick(t, minPadded, zoom)),
    ...entries.map((entry, idx) => axisNode(entry, idx, { min: minPadded, zoom, selectedId, onSelect }))
  );

  enablePan(viewport);

  viewport.append(track);
  return viewport;
}

function axisTick(tick, min, zoom) {
  const x = Math.round(daysBetween(min, tick.date) * zoom.pxPerDay);
  return el('div', { class: 'axis-tick', style: `left:${x}px` },
    el('div', { class: 'axis-tick-line', 'aria-hidden': 'true' }),
    el('div', { class: 'axis-tick-label' }, tick.label)
  );
}

function axisNode(entry, idx, { min, zoom, selectedId, onSelect }) {
  const d = parseISODate(entry.date) || min;
  const x = Math.round(daysBetween(min, d) * zoom.pxPerDay);
  const isCurrent = entry.id === selectedId;

  // Alternate up/down to avoid collisions.
  const side = (idx % 2 === 0) ? 'up' : 'down';

  const tags = Array.isArray(entry.tags) ? entry.tags : [];

  return el('article', {
    class: `axis-node ${side} ${isCurrent ? 'is-current' : ''}`,
    role: 'listitem',
    tabindex: '0',
    style: `left:${x}px`,
    'aria-current': isCurrent ? 'true' : 'false',
    'data-axis-selected': isCurrent ? '1' : '0',
    onclick: () => onSelect(entry.id),
    onkeydown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(entry.id);
      }
    },
  },
    el('div', { class: 'axis-dot', 'aria-hidden': 'true' }),
    el('div', { class: 'axis-card' },
      el('div', { class: 'date' }, formatDate(entry.date)),
      el('div', { class: 'title' }, entry.title || '(Untitled)'),
      tags.length ? el('div', { class: 'tags' }, tags.slice(0, 3).map((t) => el('span', { class: 'tag' }, `#${t}`))) : null
    )
  );
}

// Detail UI intentionally moved to /entry/:id.

function parseISODate(s) {
  if (!s) return null;
  const d = new Date(String(s));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function daysBetween(a, b) {
  const ms = 24 * 60 * 60 * 1000;
  const da = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const db = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((db - da) / ms);
}

function addDays(d, n) {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function buildTicks(min, max, kind) {
  const ticks = [];
  const cur = new Date(min);

  if (kind === 'year') {
    cur.setMonth(0, 1);
    while (cur < min) cur.setFullYear(cur.getFullYear() + 1);
    while (cur <= max) {
      ticks.push({ date: new Date(cur), label: String(cur.getFullYear()) });
      cur.setFullYear(cur.getFullYear() + 1);
    }
    return ticks;
  }

  if (kind === 'month') {
    cur.setDate(1);
    while (cur < min) cur.setMonth(cur.getMonth() + 1);
    while (cur <= max) {
      const y = cur.getFullYear();
      const m = cur.toLocaleString(undefined, { month: 'short' });
      ticks.push({ date: new Date(cur), label: `${m} ${y}` });
      cur.setMonth(cur.getMonth() + 1);
    }
    return ticks;
  }

  // day (sparse)
  while (cur < min) cur.setDate(cur.getDate() + 1);
  while (cur <= max) {
    const day = cur.getDate();
    if (day === 1 || day === 15) {
      const m = cur.toLocaleString(undefined, { month: 'short' });
      ticks.push({ date: new Date(cur), label: `${day} ${m}` });
    }
    cur.setDate(cur.getDate() + 1);
  }
  return ticks;
}

function clampInt(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function enablePan(viewport) {
  let down = false;
  let startX = 0;
  let startLeft = 0;

  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    down = true;
    startX = e.clientX;
    startLeft = viewport.scrollLeft;
    viewport.setPointerCapture(e.pointerId);
    viewport.classList.add('is-panning');
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    viewport.scrollLeft = startLeft - dx;
  });

  const end = () => {
    down = false;
    viewport.classList.remove('is-panning');
  };

  viewport.addEventListener('pointerup', end);
  viewport.addEventListener('pointercancel', end);
  viewport.addEventListener('pointerleave', end);
}
