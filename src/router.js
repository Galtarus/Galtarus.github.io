import { HomePage, bindHomeHandlers } from './pages/home.js';
import { SectionsPage, bindSectionsHandlers, initSectionsState } from './pages/sections.js';
import { SearchPage, bindSearchHandlers, initSearchState } from './pages/search.js';
import { LegacyIdeasPage } from './pages/legacyIdeas.js';
import { SettingsPage, bindSettingsHandlers, initSettingsState } from './pages/settings.js';
import { SectionPage, bindSectionHandlers, initSectionState, SectionTitle } from './pages/section.js';

const routes = {
  '#/': {
    title: 'Home',
    initState: initSectionsState,
    render: (state) => HomePage(state),
    bind: bindHomeHandlers,
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
  '#/settings': {
    title: 'Settings',
    initState: initSettingsState,
    render: (state) => SettingsPage(state),
    bind: bindSettingsHandlers,
  },
};

export function routeKey(hash) {
  return String(hash || '#/').split('?')[0];
}

export function resolveRoute(hash) {
  const key = routeKey(hash);

  if (key.startsWith('#/s/')) {
    const sectionId = decodeURIComponent(key.slice('#/s/'.length));
    return {
      title: 'Section',
      titleFromState: SectionTitle,
      initState: (state) => initSectionState(state, { sectionId }),
      render: (state) => SectionPage(state),
      bind: bindSectionHandlers,
      __key: key,
    };
  }

  return { ...(routes[key] ?? routes['#/']), __key: key };
}
