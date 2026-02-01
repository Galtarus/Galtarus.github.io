import { qs, setHTML } from './lib/dom.js';
import { Layout } from './components/layout.js';
import { resolveRoute } from './router.js';

const app = qs('#app');
let state = { text: '', mode: 'goblin' };

function render() {
  const hash = window.location.hash || '#/';
  const route = resolveRoute(hash);

  setHTML(app, Layout({ title: 'GALTARUS • MEME BOX', currentPath: hash }));

  const view = qs('#view');
  setHTML(view, route.render(state));

  if (route.bind) {
    route.bind({ root: app, state, onState: setState });
  }

  document.title = `GALTARUS • ${route.title}`;
}

function setState(next) {
  state = next;
  render();
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);
