import { HomePage } from './pages/home.js';
import { SectionsPage, bindSectionsHandlers, initSectionsState } from './pages/sections.js';
import { SearchPage, bindSearchHandlers, initSearchState } from './pages/search.js';
import { LegacyIdeasPage } from './pages/legacyIdeas.js';
import { SectionPage, bindSectionHandlers, initSectionState, SectionTitle } from './pages/section.js';

const routes = {
  '#/': {
    title: 'Hub',
    initState: initSectionsState,
    render: (state) => HomePage(state),
  },
  '#/sections': {
    title: 'Sections',
    initState: initSectionsState,
    render: (state) => SectionsPage(state),
    bind: bindSectionsHandlers,
  },
  '#/search': {
    title: 'Search',
    initState: initSearchState,
    render: (state) => SearchPage(state),
    bind: bindSearchHandlers,
  },
  '#/ideas': {
    // legacy direct link; keep so old bookmarks don't break
    title: 'Vault',
    render: () => LegacyIdeasPage(),
  },
};

export function resolveRoute(hash) {
  if (hash.startsWith('#/s/')) {
    const sectionId = decodeURIComponent(hash.slice('#/s/'.length));
    return {
      title: 'Section',
      titleFromState: SectionTitle,
      initState: (state) => initSectionState(state, { sectionId }),
      render: (state) => SectionPage(state),
      bind: bindSectionHandlers,
    };
  }

  return routes[hash] ?? routes['#/'];
}
