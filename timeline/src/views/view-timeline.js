import { el, mount, clear, formatDate } from '../lib/ui.js?v=20260203ux26';

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

    const at = Number(vp.dataset.lastCursorAt || 0);
    // Ignore stale cursor positions (ex: user moved away to click header controls).
    if (!Number.isFinite(at) || Date.now() - at > 2500) return null;

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

    // UX: even when clicking header +/- (cursor not over the axis),
    // preserve the last “point of attention” if it was recent.
    let cursorX = lastCursorX != null ? lastCursorX : null;
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

  function scrollMobileToSelected({ behavior = 'smooth', block = 'center' } = {}) {
    const vp = root.querySelector('.vt-viewport');
    if (!vp) return;
    const cur = root.querySelector('[data-vt-current="1"]');
    if (!cur) return;
    cur.scrollIntoView({ behavior, block, inline: 'nearest' });
  }

  // Mobile: add a “Latest” floating button so users can recover context after scrolling.
  if (mobile && entriesAll.length) {
    const fab = el('button', {
      class: 'vt-fab',
      type: 'button',
      onclick: () => scrollMobileToSelected({ behavior: 'smooth' }),
      'aria-label': 'Jump to the latest entry',
    }, 'Latest');
    mount(root, fab);
  }

  // After render: desktop gets wheel zoom + horizontal anchoring. Mobile is vertical scroll.
  queueMicrotask(() => {
    if (isMobile()) {
      const vp = root.querySelector('.vt-viewport');
      const fab = root.querySelector('.vt-fab');
      if (!vp) return;

      // Auto-center once (first impression: show the newest entry, not the top of the list).
      if (!store.didCenterMobile) {
        scrollMobileToSelected({ behavior: 'auto' });
        setStore({ didCenterMobile: true });
      }

      // Reveal the “Latest” button once the user scrolls away (so it doesn't distract on load).
      if (vp.dataset.vtFab !== '1') {
        vp.dataset.vtFab = '1';
        const update = () => {
          if (!fab) return;
          const show = vp.scrollTop > 180;
          fab.classList.toggle('show', show);
        };
        vp.addEventListener('scroll', update, { passive: true });
        update();
      }
      return;
    }

    const viewport = root.querySelector('[data-axis-viewport="1"]');
    const selectedEl = root.querySelector('[data-axis-selected="1"]');
    if (!viewport) return;

    // Track last pointer X so +/- zoom buttons can zoom around the cursor.
    if (viewport.dataset.cursorTrack !== '1') {
      viewport.dataset.cursorTrack = '1';
      viewport.addEventListener('pointermove', (e) => {
        const rect = viewport.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (Number.isFinite(x)) {
          viewport.dataset.lastCursorX = String(x);
          viewport.dataset.lastCursorAt = String(Date.now());
        }
      });
      viewport.addEventListener('pointerleave', () => {
        delete viewport.dataset.lastCursorX;
        delete viewport.dataset.lastCursorAt;
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
  const sorted = entries
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  // UX: on mobile, scanning is mostly “by month”, but long timelines need an extra
  // level of structure. Add sticky YEAR + MONTH separators so the feed stays legible.
  let lastMonthKey = '';
  let lastYear = '';
  const children = [];

  for (const e of sorted) {
    const d = parseISODate(e.date);
    const year = d ? String(d.getFullYear()) : '';
    const monthKey = d ? `${year}-${String(d.getMonth() + 1).padStart(2, '0')}` : '';

    if (year && year !== lastYear) {
      lastYear = year;
      children.push(el('div', { class: 'vt-year', role: 'separator', 'aria-label': `Year ${year}` }, year));
      // Reset month key when year changes (forces a month header too).
      lastMonthKey = '';
    }

    if (monthKey && monthKey !== lastMonthKey) {
      lastMonthKey = monthKey;
      // Month chip can be shorter now (year is shown above).
      const label = d.toLocaleString(undefined, { month: 'long' });
      const aria = d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
      children.push(el('div', { class: 'vt-month', role: 'separator', 'aria-label': aria }, label));
    }

    children.push(verticalItem(e, e.id === selectedId, onSelect));
  }

  return el('div', { class: 'vt-viewport' },
    el('div', { class: 'vt-track', role: 'list', 'aria-label': 'Timeline (vertical)' }, ...children)
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
    dataset: isCurrent ? { vtCurrent: '1' } : null,
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
    ...placed.map((p, idx) => axisNode(p, idx, { selectedId, onSelect }))
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
  //
  // NEW: when multiple entries share the same date, collapse them into a single “stack” node.
  // This keeps the axis scannable and avoids vertical lane explosions.

  const sorted = entries
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  /** @type {Array<{kind:'single'|'stack', dateKey:string, entries:any[]}>} */
  const groups = [];

  for (const e of sorted) {
    const key = String(e.date || '');
    const last = groups.at(-1);

    // Only stack when date is a real YYYY-MM-DD-like string and we're not in maximum detail zoom.
    const canStack = zoom.id !== 'close' && key && /\d{4}-\d{2}-\d{2}/.test(key);

    if (canStack && last && last.dateKey === key) {
      last.kind = 'stack';
      last.entries.push(e);
    } else {
      groups.push({ kind: 'single', dateKey: key, entries: [e] });
    }
  }

  // lastRight[side][lane] = last occupied x2 in that lane.
  const lastRight = { up: [], down: [] };

  const gapPx = zoom.pxPerDay < 1 ? 120 : zoom.pxPerDay < 3 ? 96 : zoom.pxPerDay < 8 ? 78 : 66;

  function estimateNodeWidthPx(group) {
    // Match CSS constraints: .axis-label max-width 260px, card 280px.
    // We estimate width mainly to avoid overlaps when labels are visible.
    const primary = group.entries[0];
    const title = String(primary.title || '');
    const sub = String(primary.summary || '').trim();
    const hasMedia = !!primary.imageUrl || !!primary.youtubeId;

    const base = 190;
    const titleExtra = Math.min(90, Math.max(0, (title.length - 18) * 3));
    const subExtra = sub ? 40 : 0;
    const mediaExtra = hasMedia ? 60 : 0;

    // Stacks need a bit more room (badge + “+N more” context).
    const stackExtra = group.kind === 'stack' ? 46 : 0;

    // Wider at high zoom (labels are always-on at zoom-detail).
    const zoomExtra = zoom.id === 'close' ? 40 : 0;

    return clampInt(base + titleExtra + subExtra + mediaExtra + stackExtra + zoomExtra, 190, 340);
  }

  return groups.map((g, i) => {
    const primary = g.entries[0];
    const d = parseISODate(primary.date) || min;
    const x = padL + Math.round(daysBetween(min, d) * zoom.pxPerDay);

    const w = estimateNodeWidthPx(g);
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

    return {
      kind: g.kind,
      entries: g.entries,
      x,
      side: placed.side,
      lane: placed.lane,
    };
  });
}

function axisNode(placed, idx, { selectedId, onSelect }) {
  const { kind, entries, x, side, lane = 0 } = placed;

  const isCurrent = entries.some((e) => e.id === selectedId);
  const currentEntry = isCurrent ? entries.find((e) => e.id === selectedId) : null;
  const primary = currentEntry || entries[0];

  const title = primary.title || '(Untitled)';

  const subtitle = subtitleFromEntry(primary);
  const chip = mediaChip(primary);

  const labelPreview = mediaPreview(primary, { size: 'small' });

  // UX: make media “readable at a glance” on the axis.
  // If an entry has an image/YouTube, turn its dot into a tiny thumbnail.
  const dotThumb = mediaThumbUrl(primary, { size: 'dot' });
  const dotStyle = dotThumb ? `--dot-img:url(\"${cssUrl(dotThumb)}\")` : '';

  const isStack = kind === 'stack' && entries.length > 1;
  const stackCount = entries.length;

  return el('article', {
    class: `axis-node ${side} ${isStack ? 'stack' : ''} ${isCurrent ? 'is-current' : ''}`,
    role: 'listitem',
    tabindex: '0',
    style: `left:${x}px; --lane:${lane}`,
    'aria-current': isCurrent ? 'true' : 'false',
    'data-axis-selected': isCurrent ? '1' : '0',
    onclick: (e) => {
      const viewport = e.currentTarget?.closest?.('[data-axis-viewport="1"]');
      if (viewport?.dataset?.dragging === '1') return;

      if (!isStack) {
        onSelect(primary.id);
        return;
      }

      openAxisStackMenu({ anchorEl: e.currentTarget, entries, onPick: (id) => onSelect(id) });
    },
    onkeydown: (e) => {
      if (e.key === 'Escape') {
        closeAxisStackMenu();
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isStack) {
          onSelect(primary.id);
          return;
        }
        openAxisStackMenu({ anchorEl: e.currentTarget, entries, onPick: (id) => onSelect(id) });
      }
    },
  },
    el('div', { class: 'axis-stem', 'aria-hidden': 'true' }),
    el('div', { class: `axis-dot${dotThumb ? ' has-media' : ''}`, style: dotStyle, 'aria-hidden': 'true' }),
    isStack ? el('div', { class: 'axis-stack-badge', 'aria-hidden': 'true' }, String(stackCount)) : null,
    el('div', { class: 'axis-label' },
      el('div', { class: 'axis-label-top' },
        el('div', { class: 'axis-label-date' }, formatDate(primary.date)),
        chip
      ),
      el('div', { class: 'axis-label-title' }, title),
      subtitle ? el('div', { class: 'axis-label-sub' }, subtitle) : null,
      isStack ? el('div', { class: 'axis-label-sub' }, `+${stackCount - 1} more on this day`) : null,
      labelPreview
    ),
    isCurrent
      ? el('div', { class: 'axis-card' },
          el('div', { class: 'date' }, formatDate(primary.date)),
          el('div', { class: 'title' }, title),
          subtitle ? el('div', { class: 'sub' }, subtitle) : null,
          isStack ? el('div', { class: 'footer-note' }, `Stack: ${stackCount} entries on ${formatDate(primary.date)} (click the badge to pick)`) : null,
          mediaPreview(primary)
        )
      : null
  );
}

// Axis stacks: lightweight chooser menu (prevents same-day entries from becoming unreadable).
let __axisStackMenu = null;
let __axisStackMenuCleanup = null;

function closeAxisStackMenu() {
  if (__axisStackMenuCleanup) __axisStackMenuCleanup();
  __axisStackMenuCleanup = null;

  if (__axisStackMenu && __axisStackMenu.parentNode) {
    __axisStackMenu.parentNode.removeChild(__axisStackMenu);
  }
  __axisStackMenu = null;
}

function openAxisStackMenu({ anchorEl, entries, onPick }) {
  closeAxisStackMenu();

  const menu = el('div', { class: 'axis-stack-menu', role: 'dialog', 'aria-label': 'Pick an entry' },
    el('div', { class: 'axis-stack-menu-title' }, 'Multiple entries'),
    el('div', { class: 'axis-stack-menu-sub' }, `${entries.length} items on ${formatDate(entries[0]?.date)}`),
    el('div', { class: 'axis-stack-menu-list', role: 'list' },
      ...entries.map((e) => {
        const t = e.title || '(Untitled)';
        return el('button', {
          class: 'axis-stack-menu-item',
          type: 'button',
          role: 'listitem',
          onclick: () => {
            closeAxisStackMenu();
            onPick(e.id);
          },
        }, t);
      })
    )
  );

  __axisStackMenu = menu;
  document.body.appendChild(menu);

  const r = anchorEl.getBoundingClientRect();
  const x = Math.min(window.innerWidth - 12, Math.max(12, r.left + r.width / 2));
  const y = Math.min(window.innerHeight - 12, Math.max(12, r.top + r.height / 2));

  // Position near the node.
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  const onDocDown = (ev) => {
    if (!menu.contains(ev.target)) closeAxisStackMenu();
  };
  const onKey = (ev) => {
    if (ev.key === 'Escape') closeAxisStackMenu();
  };

  document.addEventListener('pointerdown', onDocDown);
  document.addEventListener('keydown', onKey);

  __axisStackMenuCleanup = () => {
    document.removeEventListener('pointerdown', onDocDown);
    document.removeEventListener('keydown', onKey);
  };

  // Focus the first item for keyboard flow.
  queueMicrotask(() => {
    menu.querySelector('button')?.focus?.();
  });
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
