import { HomePage } from './pages/home.js';
import { IdeasPage, bindIdeasHandlers, initIdeasState } from './pages/ideas.js';
import { MemePage, bindMemeHandlers } from './pages/meme.js';

const routes = {
  '#/': {
    title: 'Accueil',
    render: () => HomePage(),
  },
  '#/ideas': {
    title: 'Idées',
    render: (state) => IdeasPage(state),
    bind: bindIdeasHandlers,
    initState: initIdeasState,
  },
  '#/meme': {
    title: 'Meme',
    render: (state) => MemePage(state),
    bind: bindMemeHandlers,
  },
};

export function resolveRoute(hash) {
  return routes[hash] ?? routes['#/'];
}
