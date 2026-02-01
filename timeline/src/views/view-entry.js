import { el, mount, formatDate } from '../lib/ui.js';
import { ytEmbed } from './yt.js';

export function viewEntry({ root, store, navigate, id }) {
  const entry = store.entries.find((e) => e.id === id);

  const left = el('section', { class: 'panel' },
    el('h2', {}, 'Timeline'),
    el('div', { class: 'timeline' },
      el('div', { class: 'row wrap' },
        el('button', { class: 'btn', type: 'button', onclick: () => navigate('/') }, '← Back'),
        el('button', { class: 'btn primary', type: 'button', onclick: () => navigate(`/edit/${id}`) }, 'Edit')
      ),
      el('div', { class: 'hr' }),
      entry
        ? entryDetail(entry)
        : el('div', { class: 'panel-body' }, el('p', { class: 'muted' }, 'Entry not found.'))
    )
  );

  const right = el('aside', { class: 'panel right-panel' },
    el('h2', {}, 'Notes'),
    el('div', { class: 'panel-body stack' },
      el('p', { class: 'muted' }, 'Cycle 2+ will refine browse UI and details.'),
      el('p', { class: 'muted' }, 'YouTube embeds use youtube-nocookie and load on click.')
    )
  );

  mount(root, left, right);
}

function entryDetail(entry) {
  const tags = Array.isArray(entry.tags) ? entry.tags : [];

  return el('div', { class: 'panel-body detail' },
    el('div', { class: 'kv' },
      el('span', { class: 'pill' }, formatDate(entry.date)),
      ...tags.map((t) => el('span', { class: 'pill' }, `#${t}`))
    ),
    el('h3', {}, entry.title || '(Untitled)'),
    entry.summary ? el('p', {}, entry.summary) : el('p', { class: 'muted' }, 'No summary.'),
    entry.youtubeId ? ytEmbed(entry.youtubeId) : null
  );
}
