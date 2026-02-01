function TabIcon(kind) {
  // Inline SVG (no external assets; CSP-safe)
  const common = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

  if (kind === 'home') {
    return `<svg ${common} aria-hidden="true"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>`;
  }

  if (kind === 'spark') {
    return `<svg ${common} aria-hidden="true"><path d="M12 2l1.5 6.2L20 10l-6.5 1.8L12 18l-1.5-6.2L4 10l6.5-1.8L12 2z" /></svg>`;
  }

  // wand
  return `<svg ${common} aria-hidden="true"><path d="M4 20l10-10" /><path d="M14 10l6 6" /><path d="M12 4l2 2" /><path d="M8 6l2 2" /><path d="M16 6l2 2" /></svg>`;
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
          <a href="#/ideas" ${isCurrent('#/ideas')}>${TabIcon('spark')}<span class="label">Idées</span></a>
          <a href="#/meme" ${isCurrent('#/meme')}>${TabIcon('wand')}<span class="label">Meme</span></a>
        </nav>
      </div>
    </div>
  `;
}
