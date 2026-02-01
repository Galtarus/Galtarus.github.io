import { el, mount } from '../lib/ui.js';

// Cycle 1: editor is just a placeholder (Cycle 3 will implement add/edit + persistence).
export function viewEdit({ root, navigate, id }) {
  const left = el('section', { class: 'panel' },
    el('h2', {}, 'Editor'),
    el('div', { class: 'panel-body stack' },
      el('p', {}, `Editor route: ${id === 'new' ? 'new entry' : `edit ${id}`}`),
      el('p', { class: 'muted' }, 'Coming in Cycle 3: add/edit form + local persistence.'),
      el('div', { class: 'row wrap' },
        el('button', { class: 'btn', type: 'button', onclick: () => navigate('/') }, 'Back')
      )
    )
  );

  const right = el('aside', { class: 'panel right-panel' },
    el('h2', {}, 'Tips'),
    el('div', { class: 'panel-body' },
      el('p', { class: 'muted' }, 'Use #/edit/new to add, #/edit/<id> to edit.')
    )
  );

  mount(root, left, right);
}
