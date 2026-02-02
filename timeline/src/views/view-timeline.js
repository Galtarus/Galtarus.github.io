import { el, mount, formatDate } from '../lib/ui.js?v=20260202ux6';

const ZOOMS = [
  { id: 'far', label: 'Far', pxPerDay: 0.2, tick: 'year' },
  { id: 'year', label: 'Year', pxPerDay: 0.7, tick: 'month' },
  { id: 'month', label: 'Month', pxPerDay: 2.2, tick: 'month' },
  { id: 'near', label: 'Near', pxPerDay: 7.5, tick: 'day' },
  { id: 'close', label: 'Detail', pxPerDay: 18, tick: 'day' },
];

export function viewTimeline({ root, store, setStore, navigate }) {
  const entriesAll = store.entries
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const initialId = store.selectedId || entriesAll.at(-1)?.id || null;
  if (initialId && store.selectedId !== initialId) setStore({ selectedId: initialId });

  const zoomIndex = clampInt(store.zoomIndex ?? 1, 0, ZOOMS.length - 1);
  if (store.zoomIndex !== zoomIndex) setStore({ zoomIndex });

  const zoom = ZOOMS[zoomIndex];
  // Marketability: when zoomed all the way in, show titles by default (no "mystery dots").
  root.classList.toggle('zoom-detail', zoom.id === 'close');

  function getViewport() {
    return root.querySelector('[data-axis-viewport="1"]');
  }

  function zoomBy(delta) {
    const vp = getViewport();
    const next = clampInt(zoomIndex + delta, 0, ZOOMS.length - 1);
    if (!vp || next === zoomIndex) {
      setStore({ zoomIndex: next });
      return;
    }

    // Anchor on viewport center.
    const cursorX = vp.clientWidth / 2;
    const focusRatio = (vp.scrollLeft + cursorX) / Math.max(1, vp.scrollWidth);

    setStore({ zoomIndex: next, zoomAnchor: { id: String(Date.now()), focusRatio, cursorX } });
  }

  const toolbar = el('div', { class: 'axis-toolbar' },
    el('div', { class: 'zoom' },
      el('button', {
        class: 'btn',
        type: 'button',
        onclick: () => zoomBy(-1),
        'aria-label': 'Zoom out',
      }, '−'),
      el('div', { class: 'zoom-label', 'aria-label': 'Zoom level' }, `Zoom: ${zoom.label}`),
      el('button', {
        class: 'btn',
        type: 'button',
        onclick: () => zoomBy(+1),
        'aria-label': 'Zoom in',
      }, '+')
    ),
    el('div', { class: 'axis-hint' }, 'Drag to pan • Scroll to zoom • Hover for details • Click to open')
  );

  const mobile = isMobile();

  const axis = entriesAll.length
    ? (mobile
      ? verticalTimeline({
          entries: entriesAll,
          selectedId: store.selectedId,
          onSelect: (id) => {
            setStore({ selectedId: id });
            navigate(`/entry/${id}`);
          },
        })
      : axisTimeline({
          entries: entriesAll,
          selectedId: store.selectedId,
          zoom,
          onSelect: (id) => {
            setStore({ selectedId: id });
            navigate(`/entry/${id}`);
          },
        })
    )
    : el('div', { class: 'axis-empty' }, 'No entries yet. Add one to start.');

  mount(root, toolbar, axis);

  // After render: desktop gets wheel zoom + horizontal anchoring. Mobile is vertical scroll.
  queueMicrotask(() => {
    if (isMobile()) return;

    const viewport = root.querySelector('[data-axis-viewport="1"]');
    const selectedEl = root.querySelector('[data-axis-selected="1"]');
    if (!viewport) return;

    attachWheelZoom(viewport, {
      getZoomIndex: () => clampInt(store.zoomIndex ?? 1, 0, ZOOMS.length - 1),
      setZoomIndex: (next, anchor) => {
        setStore({ zoomIndex: next, zoomAnchor: anchor });
      },
    });

    // If we have an anchor, preserve position instead of teleporting to start/selected.
    if (store.zoomAnchor && store.zoomAnchor.id !== viewport.dataset.zoomApplied) {
      viewport.dataset.zoomApplied = store.zoomAnchor.id;
      const { focusRatio, cursorX } = store.zoomAnchor;
      viewport.scrollLeft = Math.max(0, focusRatio * viewport.scrollWidth - cursorX);
      return;
    }

    // Initial center only once.
    if (!store.didCenter && selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest', inline: 'center' });
      setStore({ didCenter: true });
    }
  });
}

function isMobile() {
  return window.matchMedia && window.matchMedia('(max-width: 879px)').matches;
}

// (Search/filter UI intentionally removed for the "just the axis" phase.)

function verticalTimeline({ entries, selectedId, onSelect }) {
  const items = entries
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .map((e) => verticalItem(e, e.id === selectedId, onSelect));

  return el('div', { class: 'vt-viewport' },
    el('div', { class: 'vt-track', role: 'list', 'aria-label': 'Timeline (vertical)' }, ...items)
  );
}

function verticalItem(entry, isCurrent, onSelect) {
  const title = entry.title || '(Untitled)';
  const subtitle = subtitleFromEntry(entry);
  const chip = mediaChip(entry);
  const preview = mediaPreview(entry);

  return el('article', {
    class: `vt-item ${isCurrent ? 'is-current' : ''}`,
    role: 'listitem',
    tabindex: '0',
    onclick: () => onSelect(entry.id),
    onkeydown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(entry.id);
      }
    },
  },
    el('div', { class: 'vt-dot', 'aria-hidden': 'true' }),
    el('div', { class: 'vt-card' },
      el('div', { class: 'vt-top' },
        el('div', { class: 'vt-date' }, formatDate(entry.date)),
        chip
      ),
      el('div', { class: 'vt-title' }, title),
      subtitle ? el('div', { class: 'vt-sub' }, subtitle) : null,
      preview
    )
  );
}

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

  // Padding keeps the first/last cards from being clipped at the viewport edges.
  const padL = 260;
  const padR = 260;
  const axisW = Math.round(spanDays * zoom.pxPerDay);
  const trackW = Math.max(900, padL + axisW + padR);

  const ticksRaw = minPadded && maxPadded ? buildTicks(minPadded, maxPadded, zoom.tick) : [];
  const minGap = zoom.pxPerDay < 1 ? 110 : zoom.pxPerDay < 3 ? 80 : 60;
  let lastX = -Infinity;
  const ticks = ticksRaw
    .map((t) => ({ ...t, x: padL + Math.round(daysBetween(minPadded, t.date) * zoom.pxPerDay) }))
    .filter((t) => {
      if (t.x - lastX < minGap) return false;
      lastX = t.x;
      return true;
    });

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
    ...ticks.map((t) => axisTick(t)),
    ...entries.map((entry, idx) => axisNode(entry, idx, { min: minPadded, zoom, selectedId, onSelect, padL }))
  );

  enablePan(viewport);

  viewport.append(track);
  return viewport;
}

function axisTick(tick) {
  return el('div', { class: 'axis-tick', style: `left:${tick.x}px` },
    el('div', { class: 'axis-tick-line', 'aria-hidden': 'true' }),
    el('div', { class: 'axis-tick-label' }, tick.label)
  );
}

function axisNode(entry, idx, { min, zoom, selectedId, onSelect, padL = 0 }) {
  const d = parseISODate(entry.date) || min;
  const x = padL + Math.round(daysBetween(min, d) * zoom.pxPerDay);
  const isCurrent = entry.id === selectedId;

  // Alternate up/down to reduce label collisions.
  const side = (idx % 2 === 0) ? 'up' : 'down';

  const title = entry.title || '(Untitled)';

  const subtitle = subtitleFromEntry(entry);
  const chip = mediaChip(entry);

  return el('article', {
    class: `axis-node ${side} ${isCurrent ? 'is-current' : ''}`,
    role: 'listitem',
    tabindex: '0',
    style: `left:${x}px`,
    'aria-current': isCurrent ? 'true' : 'false',
    'data-axis-selected': isCurrent ? '1' : '0',
    onclick: (e) => {
      const viewport = e.currentTarget?.closest?.('[data-axis-viewport="1"]');
      if (viewport?.dataset?.dragging === '1') return;
      onSelect(entry.id);
    },
    onkeydown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(entry.id);
      }
    },
  },
    el('div', { class: 'axis-stem', 'aria-hidden': 'true' }),
    el('div', { class: 'axis-dot', 'aria-hidden': 'true' }),
    el('div', { class: 'axis-label' },
      el('div', { class: 'axis-label-top' },
        el('div', { class: 'axis-label-date' }, formatDate(entry.date)),
        chip
      ),
      el('div', { class: 'axis-label-title' }, title),
      subtitle ? el('div', { class: 'axis-label-sub' }, subtitle) : null
    ),
    isCurrent
      ? el('div', { class: 'axis-card' },
          el('div', { class: 'date' }, formatDate(entry.date)),
          el('div', { class: 'title' }, title),
          subtitle ? el('div', { class: 'sub' }, subtitle) : null,
          mediaPreview(entry)
        )
      : null
  );
}

// Detail UI intentionally moved to /entry/:id.

function subtitleFromEntry(entry) {
  const s = String(entry.summary || '').trim();
  if (!s) return '';
  return s.length > 84 ? `${s.slice(0, 84).trim()}…` : s;
}

function mediaChip(entry) {
  const hasImg = !!entry.imageUrl;
  const hasYt = !!entry.youtubeId;
  if (!hasImg && !hasYt) return null;
  const label = hasYt ? 'YT' : 'IMG';
  return el('span', { class: `media-chip ${hasYt ? 'yt' : 'img'}`, title: hasYt ? 'Has YouTube' : 'Has image', 'aria-label': hasYt ? 'Has YouTube' : 'Has image' }, label);
}

function mediaPreview(entry) {
  const hasImg = !!entry.imageUrl;
  const hasYt = !!entry.youtubeId;

  if (hasImg) {
    return el('img', {
      class: 'media-thumb',
      src: entry.imageUrl,
      alt: entry.title ? `Image: ${entry.title}` : 'Entry image',
      loading: 'lazy',
      referrerpolicy: 'no-referrer',
    });
  }

  if (hasYt) {
    const thumb = `https://i.ytimg.com/vi/${encodeURIComponent(entry.youtubeId)}/hqdefault.jpg`;
    return el('img', {
      class: 'media-thumb yt',
      src: thumb,
      alt: entry.title ? `YouTube thumbnail: ${entry.title}` : 'YouTube thumbnail',
      loading: 'lazy',
      referrerpolicy: 'no-referrer',
    });
  }

  return null;
}

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
  let moved = false;
  let startX = 0;
  let startLeft = 0;

  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    down = true;
    moved = false;
    startX = e.clientX;
    startLeft = viewport.scrollLeft;
    viewport.setPointerCapture(e.pointerId);
    viewport.classList.add('is-panning');
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 3) moved = true;
    viewport.scrollLeft = startLeft - dx;
  });

  const end = () => {
    down = false;
    viewport.classList.remove('is-panning');
    if (moved) {
      viewport.dataset.dragging = '1';
      setTimeout(() => {
        if (viewport.dataset.dragging === '1') delete viewport.dataset.dragging;
      }, 160);
    }
  };

  viewport.addEventListener('pointerup', end);
  viewport.addEventListener('pointercancel', end);
  viewport.addEventListener('pointerleave', end);
}

function attachWheelZoom(viewport, { getZoomIndex, setZoomIndex }) {
  viewport.addEventListener('wheel', (e) => {
    // Default: wheel zooms. Hold Shift to wheel-pan horizontally.
    if (e.shiftKey) {
      viewport.scrollLeft += (e.deltaX || 0) + e.deltaY;
      return;
    }

    e.preventDefault();

    const cur = getZoomIndex();
    const dir = Math.sign(e.deltaY);
    const next = clampInt(cur + (dir > 0 ? -1 : 1), 0, ZOOMS.length - 1);
    if (next === cur) return;

    const rect = viewport.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const focusRatio = (viewport.scrollLeft + cursorX) / Math.max(1, viewport.scrollWidth);

    setZoomIndex(next, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, focusRatio, cursorX });
  }, { passive: false });
}
