import { HomePage } from './pages/home.js';
import { SectionsPage, bindSectionsHandlers, initSectionsState } from './pages/sections.js';
import { IdeasPage, bindIdeasHandlers, initIdeasState } from './pages/ideas.js';

const routes = {
  '#/': {
    title: 'Hub',
    render: () => HomePage(),
  },
  '#/sections': {
    title: 'Sections',
    initState: initSectionsState,
    render: (state) => SectionsPage(state),
    bind: bindSectionsHandlers,
  },
  '#/ideas': {
    // legacy direct link; still supported
    title: 'Idées',
    render: (state) => IdeasPage(state),
    bind: bindIdeasHandlers,
    initState: initIdeasState,
  },
};

export function resolveRoute(hash) {
  if (hash.startsWith('#/s/')) {
    return {
      title: 'Section',
      initState: initIdeasState,
      render: (state) => IdeasPage(state),
      bind: bindIdeasHandlers,
    };
  }

  return routes[hash] ?? routes['#/'];
}
