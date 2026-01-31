import { HomePage } from './pages/home.js';
import { AboutPage } from './pages/about.js';
import { LabPage, bindLabHandlers } from './pages/lab.js';

const routes = {
  '#/': {
    title: 'Accueil',
    render: () => HomePage(),
  },
  '#/about': {
    title: 'À propos',
    render: () => AboutPage(),
  },
  '#/lab': {
    title: 'Lab',
    render: (state) => LabPage(state),
    bind: bindLabHandlers,
  },
};

export function resolveRoute(hash) {
  return routes[hash] ?? routes['#/'];
}
