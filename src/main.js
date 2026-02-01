import { qs, setHTML } from './lib/dom.js';
import { Layout } from './components/layout.js';
import { resolveRoute } from './router.js';

const app = qs('#app');
let state = {
  // idea vault
  ideas: null,
  ideasQuery: '',
  // sections
  sections: null,
};

function render() {
  // Preserve focus (mobile keyboard should NOT close on each keystroke)
  const active = document.activeElement;
  const activeId = active && active.id ? active.id : null;
  const selStart = typeof active?.selectionStart === 'number' ? active.selectionStart : null;
  const selEnd = typeof active?.selectionEnd === 'number' ? active.selectionEnd : null;

  const hash = window.location.hash || '#/';
  const route = resolveRoute(hash);

  // allow pages to initialize state (e.g. load localStorage)
  if (route.initState && !state.__inited?.[hash]) {
    state = route.initState(state);
    state.__inited = { ...(state.__inited ?? {}), [hash]: true };
  }

  setHTML(app, Layout({ title: 'GALTARUS', currentPath: hash }));

  const view = qs('#view');
  setHTML(view, route.render(state));

  if (route.bind) {
    route.bind({ root: app, state, onState: setState });
  }

  document.title = `GALTARUS • ${route.title}`;

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
}

function setState(next) {
  state = next;
  render();
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);
