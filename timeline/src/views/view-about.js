import { el } from '../lib/ui.js';

export function viewAbout({ root }) {
  root.appendChild(
    el('section', { class: 'panel', style: 'grid-column: 1 / -1' },
      el('h2', {}, 'About'),
      el('div', { class: 'panel-body stack' },
        el('p', {}, 'Timeline is a self-contained static SPA living under /timeline/. It uses hash routing, vanilla JS modules, and local persistence (localStorage for MVP).'),
        el('p', { class: 'muted' }, 'Privacy note: YouTube embeds load only after an explicit click and use youtube-nocookie.com.'),
        el('p', { class: 'muted' }, 'No build tools; everything is served as static files by GitHub Pages.')
      )
    )
  );
}
