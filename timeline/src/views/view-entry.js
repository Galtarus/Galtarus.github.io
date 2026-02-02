import { el, mount, formatDate } from '../lib/ui.js?v=20260202ux6';
import { ytEmbed } from './yt.js?v=20260202ux6';

export function viewEntry({ root, store, navigate, id }) {
  const entries = store.entries
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const idx = entries.findIndex((e) => e.id === id);
  const entry = idx >= 0 ? entries[idx] : null;
  const prev = idx > 0 ? entries[idx - 1] : null;
  const next = idx >= 0 && idx < entries.length - 1 ? entries[idx + 1] : null;

  const left = el('section', { class: 'panel' },
    el('h2', {}, 'Entry'),
    el('div', { class: 'timeline' },
      el('div', { class: 'row wrap' },
        el('button', { class: 'btn', type: 'button', onclick: () => navigate('/') }, '← Timeline'),
        entry ? el('button', { class: 'btn', type: 'button', onclick: () => navigate(`/edit/${id}`) }, 'Edit') : null
      ),
      el('div', { class: 'hr' }),
      entry ? entryDetail(entry) : el('div', { class: 'panel-body' }, el('p', { class: 'muted' }, 'Entry not found.')),
      entry
        ? el('div', { class: 'panel-body' },
            el('div', { class: 'row wrap' },
              prev ? el('button', { class: 'btn', type: 'button', onclick: () => navigate(`/entry/${prev.id}`) }, '← Previous') : null,
              next ? el('button', { class: 'btn', type: 'button', onclick: () => navigate(`/entry/${next.id}`) }, 'Next →') : null
            )
          )
        : null
    )
  );

  const right = el('aside', { class: 'panel right-panel' },
    el('h2', {}, 'Actions'),
    el('div', { class: 'panel-body stack' },
      el('button', { class: 'btn primary', type: 'button', onclick: () => navigate('/edit/new') }, 'Add entry'),
      el('button', { class: 'btn', type: 'button', onclick: () => navigate('/') }, 'Back to timeline'),
      el('p', { class: 'muted' }, 'Tip: YouTube embeds load only after clicking “Load video”.')
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
    entry.imageUrl ? entryImage(entry.imageUrl, entry.title) : null,
    entry.youtubeId ? ytEmbed(entry.youtubeId) : null
  );
}

function entryImage(url, title) {
  return el('figure', { class: 'embed-shell' },
    el('img', {
      src: url,
      alt: title ? `Image for: ${title}` : 'Entry image',
      loading: 'lazy',
      style: 'width: 100%; height: auto; border-radius: 12px; display: block',
      referrerpolicy: 'no-referrer',
    })
  );
}
