import { qs, setHTML } from './lib/dom.js';
import { Layout } from './components/layout.js';
import { resolveRoute } from './router.js';

const app = qs('#app');
let state = { text: '', mode: 'goblin', ideas: null };

function render() {
  const hash = window.location.hash || '#/';
  const route = resolveRoute(hash);

  // allow pages to initialize state (e.g. load localStorage)
  if (route.initState && !state.__inited?.[hash]) {
    state = route.initState(state);
    state.__inited = { ...(state.__inited ?? {}), [hash]: true };
  }

  setHTML(app, Layout({ title: 'GALTARUS • HUB', currentPath: hash }));

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
