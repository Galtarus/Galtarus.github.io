import { createRouter } from './router.js?v=e44923a';
import { loadState, saveState } from './lib/storage.js?v=e44923a';
import { demoEntries } from './lib/demo-data.js?v=e44923a';
import { renderShell } from './views/shell.js?v=e44923a';

const APP_KEY = 'timeline.app.v1';

function bootstrapStore() {
  const state = loadState(APP_KEY);
  if (state?.entries?.length) return state;
  const initial = {
    version: 1,
    entries: demoEntries(),
    selectedId: null,
  };
  saveState(APP_KEY, initial);
  return initial;
}

const store = bootstrapStore();

let renderScheduled = false;
function requestRender() {
  if (renderScheduled) return;
  renderScheduled = true;
  queueMicrotask(() => {
    renderScheduled = false;
    render();
  });
}

function setStore(patch) {
  Object.assign(store, patch);
  saveState(APP_KEY, store);
  requestRender();
}

const router = createRouter();

function getRouteModel() {
  const { name, params } = router.match();
  return { name, params };
}

function render() {
  const route = getRouteModel();
  const root = document.getElementById('app');
  renderShell({ root, store, setStore, route, navigate: router.navigate });
}

router.onChange(() => render());
render();
