import { el, mount, clear, formatDate } from '../lib/ui.js?v=20260203ux20';

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

  function getLastCursorX(vp) {
    if (!vp) return null;
    const n = Number(vp.dataset.lastCursorX);
    if (!Number.isFinite(n)) return null;
    // clamp to viewport bounds
    return Math.max(0, Math.min(vp.clientWidth, n));
  }

  function anchorFromSelected(vp) {
    if (!vp) return null;
    const selectedEl = root.querySelector('[data-axis-selected="1"]');
    if (!selectedEl) return null;

    const vpRect = vp.getBoundingClientRect();
    const elRect = selectedEl.getBoundingClientRect();
    const center = (elRect.left + elRect.right) / 2;
    const cursorX = center - vpRect.left;
    if (!Number.isFinite(cursorX)) return null;

    const clampedX = Math.max(0, Math.min(vp.clientWidth, cursorX));
    const focusRatio = (vp.scrollLeft + clampedX) / Math.max(1, vp.scrollWidth);
    return { cursorX: clampedX, focusRatio };
  }

  function zoomBy(delta) {
    const vp = getViewport();
    const next = clampInt(zoomIndex + delta, 0, ZOOMS.length - 1);
    if (!vp || next === zoomIndex) {
      setStore({ zoomIndex: next });
      return;
    }

    // UX: zoom buttons should preserve context.
    // - If the pointer is over the axis, zoom around the pointer.
    // - Otherwise, zoom around the selected item (keeps it "pinned" in view).
    // - Fallback: center of the viewport.
    const lastCursorX = getLastCursorX(vp);
    const useCursor = vp.matches(':hover') && lastCursorX != null;

    let cursorX = useCursor ? lastCursorX : null;
    let focusRatio = null;

    if (cursorX == null) {
      const selected = anchorFromSelected(vp);
      if (selected) {
        cursorX = selected.cursorX;
        focusRatio = selected.focusRatio;
      }
    }

    if (cursorX == null) cursorX = vp.clientWidth / 2;
    if (focusRatio == null) focusRatio = (vp.scrollLeft + cursorX) / Math.max(1, vp.scrollWidth);

    setStore({ zoomIndex: next, zoomAnchor: { id: String(Date.now()), focusRatio, cursorX } });
  }

  const headerCenter = document.querySelector('[data-header-center="1"]');
  if (headerCenter) {
    clear(headerCenter);
    // Keep the interface in ONE place to improve clarity + reclaim vertical space.
    mount(headerCenter,
      el('div', { class: 'zoom header-zoom' },
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
      )
    );
  }

  const mobile = isMobile();

  const markAxisInteracted = () => {
    if (!store.didInteractAxis) setStore({ didInteractAxis: true });
  };

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
          showHint: !store.didInteractAxis,
          onInteract: markAxisInteracted,
          onSelect: (id) => {
            setStore({ selectedId: id });
            navigate(`/entry/${id}`);
          },
        })
    )
    : el('div', { class: 'axis-empty' }, 'No entries yet. Add one to start.');

  mount(root, axis);

  // After render: desktop gets wheel zoom + horizontal anchoring. Mobile is vertical scroll.
  queueMicrotask(() => {
    if (isMobile()) return;

    const viewport = root.querySelector('[data-axis-viewport="1"]');
    const selectedEl = root.querySelector('[data-axis-selected="1"]');
    if (!viewport) return;

    // Track last pointer X so +/- zoom buttons can zoom around the cursor.
    if (viewport.dataset.cursorTrack !== '1') {
      viewport.dataset.cursorTrack = '1';
      viewport.addEventListener('pointermove', (e) => {
        const rect = viewport.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (Number.isFinite(x)) viewport.dataset.lastCursorX = String(x);
      });
      viewport.addEventListener('pointerleave', () => {
        delete viewport.dataset.lastCursorX;
      });
    }

    attachWheelZoom(viewport, {
      getZoomIndex: () => clampInt(store.zoomIndex ?? 1, 0, ZOOMS.length - 1),
      setZoomIndex: (next, anchor) => {
        setStore({ zoomIndex: next, zoomAnchor: anchor });
      },
      onInteract: markAxisInteracted,
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

function axisTimeline({ entries, selectedId, zoom, onSelect, showHint = true, onInteract }) {
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

  const placed = computeAxisLayout(entries, { min: minPadded, zoom, padL });

  const track = el('div', {
    class: 'axis-track',
    style: `width:${trackW}px`,
    role: 'list',
    'aria-label': 'Timeline axis',
  },
    el('div', { class: 'axis-line', 'aria-hidden': 'true' }),
    ...ticks.map((t) => axisTick(t)),
    ...placed.map((p, idx) => axisNode(p.entry, idx, { x: p.x, side: p.side, lane: p.lane, selectedId, onSelect }))
  );

  enablePan(viewport, { onInteract });

  const hint = showHint
    ? el('div', { class: 'axis-onboard', 'aria-hidden': 'true' },
        'Drag to pan · ',
        el('kbd', {}, 'Wheel'), ' to zoom · ',
        el('kbd', {}, 'Shift'), '+', el('kbd', {}, 'Wheel'), ' to pan'
      )
    : null;

  viewport.append(track);
  if (hint) viewport.append(hint);
  return viewport;
}

function axisTick(tick) {
  return el('div', { class: 'axis-tick', style: `left:${tick.x}px` },
    el('div', { class: 'axis-tick-line', 'aria-hidden': 'true' }),
    el('div', { class: 'axis-tick-label' }, tick.label)
  );
}

function computeAxisLayout(entries, { min, zoom, padL }) {
  // Goal: keep nodes readable when dates are dense.
  // We treat each node as an interval on the X axis and place it into the first lane
  // (per side) that doesn't overlap the previous interval in that lane.
  // This keeps hover labels + detail zoom from visually colliding.

  const sorted = entries
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  // lastRight[side][lane] = last occupied x2 in that lane.
  const lastRight = { up: [], down: [] };

  const gapPx = zoom.pxPerDay < 1 ? 120 : zoom.pxPerDay < 3 ? 96 : zoom.pxPerDay < 8 ? 78 : 66;

  function estimateNodeWidthPx(entry) {
    // Match CSS constraints: .axis-label max-width 260px, card 280px.
    // We estimate width mainly to avoid overlaps when labels are visible.
    const title = String(entry.title || '');
    const sub = String(entry.summary || '').trim();
    const hasMedia = !!entry.imageUrl || !!entry.youtubeId;

    const base = 190;
    const titleExtra = Math.min(90, Math.max(0, (title.length - 18) * 3));
    const subExtra = sub ? 40 : 0;
    const mediaExtra = hasMedia ? 60 : 0;

    // Wider at high zoom (labels are always-on at zoom-detail).
    const zoomExtra = zoom.id === 'close' ? 40 : 0;

    return clampInt(base + titleExtra + subExtra + mediaExtra + zoomExtra, 180, 320);
  }

  return sorted.map((entry, i) => {
    const d = parseISODate(entry.date) || min;
    const x = padL + Math.round(daysBetween(min, d) * zoom.pxPerDay);

    const w = estimateNodeWidthPx(entry);
    const x1 = x - w / 2;
    const x2 = x + w / 2;

    // Prefer alternating sides for rhythm, but switch if that side would collide.
    const preferredSide = (i % 2 === 0) ? 'up' : 'down';
    const otherSide = preferredSide === 'up' ? 'down' : 'up';

    function placeOn(side) {
      const lanes = lastRight[side];
      let lane = 0;
      for (; lane < lanes.length; lane++) {
        if (x1 >= lanes[lane] + gapPx) break;
      }
      lanes[lane] = x2;
      return { side, lane };
    }

    // Try preferred side first, fall back to the other side if it would collide in lane 0.
    const prefLane0Right = lastRight[preferredSide][0];
    const prefLane0Ok = prefLane0Right == null || x1 >= prefLane0Right + gapPx;

    const placed = prefLane0Ok ? placeOn(preferredSide) : placeOn(otherSide);

    return { entry, x, side: placed.side, lane: placed.lane };
  });
}

function axisNode(entry, idx, { x, side, lane = 0, selectedId, onSelect }) {
  const isCurrent = entry.id === selectedId;

  const title = entry.title || '(Untitled)';

  const subtitle = subtitleFromEntry(entry);
  const chip = mediaChip(entry);

  const labelPreview = mediaPreview(entry, { size: 'small' });

  // UX: make media “readable at a glance” on the axis.
  // If an entry has an image/YouTube, turn its dot into a tiny thumbnail.
  const dotThumb = mediaThumbUrl(entry, { size: 'dot' });
  const dotStyle = dotThumb ? `--dot-img:url(\"${cssUrl(dotThumb)}\")` : '';

  return el('article', {
    class: `axis-node ${side} ${isCurrent ? 'is-current' : ''}`,
    role: 'listitem',
    tabindex: '0',
    style: `left:${x}px; --lane:${lane}`,
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
    el('div', { class: `axis-dot${dotThumb ? ' has-media' : ''}`, style: dotStyle, 'aria-hidden': 'true' }),
    el('div', { class: 'axis-label' },
      el('div', { class: 'axis-label-top' },
        el('div', { class: 'axis-label-date' }, formatDate(entry.date)),
        chip
      ),
      el('div', { class: 'axis-label-title' }, title),
      subtitle ? el('div', { class: 'axis-label-sub' }, subtitle) : null,
      labelPreview
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

function cssUrl(s) {
  // Safe for use inside style="--x:url(\"...\")".
  return String(s || '').replace(/\\/g, '\\\\').replace(/\"/g, '%22');
}

function mediaThumbUrl(entry, { size } = {}) {
  if (entry?.imageUrl) return String(entry.imageUrl);
  if (entry?.youtubeId) {
    const id = encodeURIComponent(entry.youtubeId);
    const file = size === 'dot' ? 'mqdefault.jpg' : 'hqdefault.jpg';
    return `https://i.ytimg.com/vi/${id}/${file}`;
  }
  return null;
}

function mediaPreview(entry, { size } = {}) {
  const hasImg = !!entry.imageUrl;
  const hasYt = !!entry.youtubeId;

  const sizeClass = size ? ` ${size}` : '';

  if (hasImg) {
    return el('img', {
      class: `media-thumb${sizeClass}`,
      src: entry.imageUrl,
      alt: entry.title ? `Image: ${entry.title}` : 'Entry image',
      loading: 'lazy',
      referrerpolicy: 'no-referrer',
    });
  }

  if (hasYt) {
    const thumb = `https://i.ytimg.com/vi/${encodeURIComponent(entry.youtubeId)}/hqdefault.jpg`;
    return el('img', {
      class: `media-thumb yt${sizeClass}`,
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

function enablePan(viewport, { onInteract } = {}) {
  let down = false;
  let moved = false;
  let startX = 0;
  let startLeft = 0;

  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (onInteract) onInteract();
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

function attachWheelZoom(viewport, { getZoomIndex, setZoomIndex, onInteract } = {}) {
  viewport.addEventListener('wheel', (e) => {
    if (onInteract) onInteract();
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
