import { el, mount, formatDate } from '../lib/ui.js';
import { ytEmbed } from './yt.js';

export function viewTimeline({ root, store, setStore, navigate }) {
  const entries = store.entries
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const initialId = store.selectedId || entries.at(-1)?.id || null;
  if (initialId && store.selectedId !== initialId) setStore({ selectedId: initialId });

  const left = el('section', { class: 'panel' },
    el('h2', {}, 'Timeline'),
    el('div', { class: 'timeline' },
      el('div', { class: 'timeline-list', role: 'list', 'aria-label': 'Timeline entries' },
        entries.map((entry) =>
          timelineCard(entry, store.selectedId, (id) => {
            setStore({ selectedId: id });
            // Desktop shows right-panel preview; mobile goes straight to detail.
            if (!isDesktop()) navigate(`/entry/${id}`);
          })
        )
      )
    )
  );

  const selected = entries.find((e) => e.id === store.selectedId) || null;

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
