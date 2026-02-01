import { el, mount, formatDate } from '../lib/ui.js';
import { ytEmbed } from './yt.js';

export function viewTimeline({ root, store, setStore, navigate }) {
  const entriesAll = store.entries
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const filters = store.filters || { q: '', tag: '' };
  if (!store.filters) setStore({ filters });

  const tagOptions = collectTags(entriesAll);

  const filtered = entriesAll.filter((e) => matchesFilters(e, filters));

  const initialId = store.selectedId || filtered.at(-1)?.id || entriesAll.at(-1)?.id || null;
  if (initialId && store.selectedId !== initialId) setStore({ selectedId: initialId });

  const left = el('section', { class: 'panel' },
    el('h2', {}, 'Timeline'),
    el('div', { class: 'panel-body stack' },
      el('label', { class: 'sr-only', for: 'q' }, 'Search'),
      el('div', { class: 'row wrap' },
        el('input', {
          id: 'q',
          class: 'input',
          style: 'flex: 1; min-width: 220px',
          type: 'search',
          placeholder: 'Search title, summary, tags…',
          value: filters.q || '',
          oninput: (e) => setStore({ filters: { ...filters, q: e.target.value } }),
          'aria-label': 'Search entries',
        }),
        el('select', {
          class: 'input',
          style: 'min-width: 160px',
          value: filters.tag || '',
          onchange: (e) => setStore({ filters: { ...filters, tag: e.target.value } }),
          'aria-label': 'Filter by tag',
        },
          el('option', { value: '' }, 'All tags'),
          ...tagOptions.map((t) => el('option', { value: t }, `#${t}`))
        ),
        el('button', {
          class: 'btn',
          type: 'button',
          onclick: () => setStore({ filters: { q: '', tag: '' } }),
        }, 'Clear')
      ),
      el('div', { class: 'footer-note' }, `${filtered.length}/${entriesAll.length} entries`) 
    ),
    el('div', { class: 'timeline' },
      el('div', { class: 'timeline-list', role: 'list', 'aria-label': 'Timeline entries' },
        filtered.map((entry) =>
          timelineCard(entry, store.selectedId, (id) => {
            setStore({ selectedId: id });
            // Desktop shows right-panel preview; mobile goes straight to detail.
            if (!isDesktop()) navigate(`/entry/${id}`);
          })
        )
      )
    )
  );

  const selected = entriesAll.find((e) => e.id === store.selectedId) || null;

  const right = el('aside', { class: 'panel right-panel' },
    el('h2', {}, 'Details'),
    el('div', { class: 'panel-body stack' },
      selected ? previewDetail(selected, navigate) : emptyState(navigate)
    )
  );

  mount(root, left, right);
}

function isDesktop() {
  return window.matchMedia && window.matchMedia('(min-width: 880px)').matches;
}

function matchesFilters(entry, filters) {
  const q = (filters.q || '').trim().toLowerCase();
  const tag = (filters.tag || '').trim().toLowerCase();

  if (tag) {
    const tags = Array.isArray(entry.tags) ? entry.tags : [];
    if (!tags.some((t) => String(t).toLowerCase() === tag)) return false;
  }

  if (!q) return true;

  const hay = [
    entry.title,
    entry.summary,
    entry.date,
    ...(Array.isArray(entry.tags) ? entry.tags : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return hay.includes(q);
}

function collectTags(entries) {
  const set = new Set();
  for (const e of entries) {
    for (const t of Array.isArray(e.tags) ? e.tags : []) {
      const clean = String(t).trim().replace(/^#/, '');
      if (clean) set.add(clean);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function timelineCard(entry, selectedId, onSelect) {
  const isCurrent = entry.id === selectedId;
  const tags = Array.isArray(entry.tags) ? entry.tags : [];

  return el(
    'article',
    {
      class: 'timeline-item',
      role: 'listitem',
      tabindex: '0',
      'aria-current': isCurrent ? 'true' : 'false',
      onclick: () => onSelect(entry.id),
      onkeydown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(entry.id);
        }
      },
    },
    el('div', { class: 'date' }, formatDate(entry.date)),
    el('h3', { class: 'title' }, entry.title || '(Untitled)'),
    el(
      'div',
      { class: 'tags' },
      tags.slice(0, 4).map((t) => el('span', { class: 'tag' }, `#${t}`))
    )
  );
}

function previewDetail(entry, navigate) {
  const tags = Array.isArray(entry.tags) ? entry.tags : [];

  return el('div', { class: 'detail' },
    el('div', { class: 'kv' },
      el('span', { class: 'pill' }, formatDate(entry.date)),
      ...tags.map((t) => el('span', { class: 'pill' }, `#${t}`))
    ),
    el('h3', {}, entry.title || '(Untitled)'),
    entry.summary ? el('p', {}, entry.summary) : el('p', { class: 'muted' }, 'No summary.'),
    entry.imageUrl ? el('div', { class: 'footer-note' }, 'Has image') : null,
    el('div', { class: 'row wrap' },
      el('button', { class: 'btn primary', type: 'button', onclick: () => navigate(`/entry/${entry.id}`) }, 'Open'),
      el('button', { class: 'btn', type: 'button', onclick: () => navigate(`/edit/${entry.id}`) }, 'Edit')
    ),
    entry.youtubeId ? ytEmbed(entry.youtubeId) : null,
    el('div', { class: 'footer-note' }, 'Desktop: click cards to preview here. Mobile: tap to open.')
  );
}

function emptyState(navigate) {
  return el('div', { class: 'detail' },
    el('h3', {}, 'No entries yet'),
    el('p', { class: 'muted' }, 'Add your first entry to start building a timeline.'),
    el('button', { class: 'btn primary', type: 'button', onclick: () => navigate('/edit/new') }, 'Add entry')
  );
}
