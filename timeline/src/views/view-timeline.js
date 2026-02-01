import { el, mount, formatDate } from '../lib/ui.js';

export function viewTimeline({ root, store, setStore, navigate }) {
  const left = el('section', { class: 'panel' },
    el('h2', {}, 'Timeline'),
    el('div', { class: 'timeline' },
      el('div', { class: 'timeline-list', role: 'list' },
        store.entries
          .slice()
          .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
          .map((entry) => timelineCard(entry, store.selectedId, (id) => {
            setStore({ selectedId: id });
            navigate(`/entry/${id}`);
          }))
      )
    )
  );

  const right = el('aside', { class: 'panel right-panel' },
    el('h2', {}, 'Welcome'),
    el('div', { class: 'panel-body stack' },
      el('div', { class: 'detail' },
        el('h3', {}, 'Timeline (MVP)'),
        el('p', { class: 'muted' }, 'Cycle 1: skeleton + router + demo data.'),
        el('div', { class: 'hr' }),
        el('div', { class: 'row wrap' },
          el('button', { class: 'btn primary', type: 'button', onclick: () => navigate('/edit/new') }, 'Add an entry'),
          el('button', { class: 'btn', type: 'button', onclick: () => navigate('/about') }, 'About')
        )
      ),
      el('div', { class: 'footer-note' }, 'Tip: open an entry to see details (and optional YouTube embed).')
    )
  );

  mount(root, left, right);
}

function timelineCard(entry, selectedId, onOpen) {
  const isCurrent = entry.id === selectedId;
  const tags = Array.isArray(entry.tags) ? entry.tags : [];

  const node = el('article', {
    class: 'timeline-item',
    role: 'listitem',
    tabindex: '0',
    'aria-current': isCurrent ? 'true' : 'false',
    onclick: () => onOpen(entry.id),
    onkeydown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpen(entry.id);
      }
    },
  },
    el('div', { class: 'date' }, formatDate(entry.date)),
    el('h3', { class: 'title' }, entry.title || '(Untitled)'),
    el('div', { class: 'tags' }, tags.slice(0, 4).map((t) => el('span', { class: 'tag' }, `#${t}`)))
  );

  return node;
}
