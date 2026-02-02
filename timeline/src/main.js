import { createRouter } from './router.js?v=9bcd25d';
import { loadState, saveState } from './lib/storage.js?v=9bcd25d';
import { demoEntries } from './lib/demo-data.js?v=9bcd25d';
import { renderShell } from './views/shell.js?v=9bcd25d';

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

function setStore(patch) {
  Object.assign(store, patch);
  saveState(APP_KEY, store);
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
