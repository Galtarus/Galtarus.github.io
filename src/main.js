import { qs, setHTML } from './lib/dom.js';
import { Layout } from './components/layout.js';
import { resolveRoute, routeKey } from './router.js';

const app = qs('#app');
let state = {
  // sections
  sections: null,
};

let lastRouteKey = null;
const scrollByRoute = {};

function render() {
  // Preserve focus (mobile keyboard should NOT close on each keystroke)
  const active = document.activeElement;
  const activeId = active && active.id ? active.id : null;
  const selStart = typeof active?.selectionStart === 'number' ? active.selectionStart : null;
  const selEnd = typeof active?.selectionEnd === 'number' ? active.selectionEnd : null;

  const hash = window.location.hash || '#/';
  const key = routeKey(hash);
  const route = resolveRoute(hash);

  // Store scroll per route, restore only when re-rendering same route
  if (lastRouteKey) {
    scrollByRoute[lastRouteKey] = window.scrollY;
  }

  // allow pages to initialize state (e.g. load localStorage)
  if (route.initState && !state.__inited?.[key]) {
    state = route.initState(state);
    state.__inited = { ...(state.__inited ?? {}), [key]: true };
  }

  setHTML(app, Layout({ title: 'GALTARUS', currentPath: key }));

  const view = qs('#view');
  setHTML(view, route.render(state));

  if (route.bind) {
    route.bind({ root: app, state, onState: setState });
  }

  const t = route.titleFromState ? route.titleFromState(state) : route.title;
  document.title = `GALTARUS - ${String(t).replace(/<[^>]+>/g, '')}`;

  // Restore focus
  if (activeId) {
    const nextEl = document.getElementById(activeId);
    if (nextEl && typeof nextEl.focus === 'function') {
      nextEl.focus({ preventScroll: true });
      if (selStart !== null && selEnd !== null && typeof nextEl.setSelectionRange === 'function') {
        try {
          nextEl.setSelectionRange(selStart, selEnd);
        } catch {
          // ignore
        }
      }
    }
  }

  // Restore scroll
  const nextScroll = key === lastRouteKey ? scrollByRoute[key] : 0;
  window.scrollTo({ top: Number.isFinite(nextScroll) ? nextScroll : 0, left: 0, behavior: 'auto' });

  lastRouteKey = key;
}

function setState(next) {
  state = next;
  render();
}

// Global UI affordances (event delegation so re-renders don't break handlers)
document.addEventListener('click', (e) => {
  const el = e.target?.closest?.('[data-skip]');
  if (!el) return;

  e.preventDefault();
  const view = qs('#view');
  if (view && typeof view.focus === 'function') {
    view.focus({ preventScroll: true });
  }
});

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);
