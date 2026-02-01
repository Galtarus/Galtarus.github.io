import { el, mount, clear } from '../lib/ui.js';
import { viewTimeline } from './view-timeline.js';
import { viewEntry } from './view-entry.js';
import { viewEdit } from './view-edit.js';
import { viewAbout } from './view-about.js';

export function renderShell({ root, store, setStore, route, navigate }) {
  clear(root);

  const header = el('header', { class: 'header' },
    el('div', { class: 'header-inner' },
      el('div', { class: 'brand' },
        el('h1', {}, 'Timeline'),
        el('span', { class: 'badge', title: 'Static SPA' }, 'no-build')
      ),
      el('div', { class: 'spacer' }),
      el('div', { class: 'header-actions' },
        el('button', { class: 'btn primary hide-mobile', type: 'button', onclick: () => navigate('/edit/new') }, 'Add entry'),
        el('button', { class: 'btn hide-mobile', type: 'button', onclick: () => navigate('/about') }, 'About')
      )
    )
  );

  const main = el('main', { class: 'main' });

  const bottomNav = el('nav', { class: 'bottom-nav', 'aria-label': 'Bottom navigation' },
    el('div', { class: 'bottom-nav-inner' },
      navLink('Timeline', '#/', route.name === 'timeline'),
      navLink('Add', '#/edit/new', route.name === 'edit' && route.params.id === 'new'),
      navLink('About', '#/about', route.name === 'about')
    )
  );

  mount(root, header, main, bottomNav);

  if (route.name === 'timeline') {
    viewTimeline({ root: main, store, setStore, navigate });
  } else if (route.name === 'entry') {
    viewEntry({ root: main, store, setStore, navigate, id: route.params.id });
  } else if (route.name === 'edit') {
    viewEdit({ root: main, store, setStore, navigate, id: route.params.id });
  } else if (route.name === 'about') {
    viewAbout({ root: main });
  } else {
    viewTimeline({ root: main, store, setStore, navigate });
  }
}

function navLink(label, href, current) {
  return el('a', { href, 'aria-current': current ? 'page' : null }, label);
}
