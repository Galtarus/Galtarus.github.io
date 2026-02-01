function TabIcon(kind) {
  // Inline SVG (no external assets; CSP-safe)
  const common = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

  if (kind === 'home') {
    return `<svg ${common} aria-hidden="true"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>`;
  }

  if (kind === 'spark') {
    return `<svg ${common} aria-hidden="true"><path d="M12 2l1.5 6.2L20 10l-6.5 1.8L12 18l-1.5-6.2L4 10l6.5-1.8L12 2z" /></svg>`;
  }

  if (kind === 'search') {
    return `<svg ${common} aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>`;
  }

  if (kind === 'grid') {
    return `<svg ${common} aria-hidden="true"><path d="M4 4h7v7H4z" /><path d="M13 4h7v7h-7z" /><path d="M4 13h7v7H4z" /><path d="M13 13h7v7h-7z" /></svg>`;
  }

  // default
  return `<svg ${common} aria-hidden="true"><path d="M12 20h.01" /></svg>`;
}

export function Layout({ title = 'GALTARUS', currentPath = '#/' } = {}) {
  const isCurrent = (p) => (p === currentPath ? 'aria-current="page"' : '');

  return /* html */ `
    <div class="container">
      <div class="shell">
        <header class="topbar">
          <div class="brand">
            <div class="logo" aria-hidden="true"></div>
            <div class="title">${title}</div>
          </div>
        </header>

        <main class="main" id="view" aria-live="polite"></main>

        <nav class="tabs" aria-label="Navigation">
          <a href="#/" ${isCurrent('#/')}>${TabIcon('home')}<span class="label">Hub</span></a>
          <a href="#/sections" ${isCurrent('#/sections')}>${TabIcon('grid')}<span class="label">Sections</span></a>
          <a href="#/search" ${isCurrent('#/search')}>${TabIcon('search')}<span class="label">Search</span></a>
        </nav>
      </div>
    </div>
  `;
}
