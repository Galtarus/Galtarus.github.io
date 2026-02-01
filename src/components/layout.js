export function Layout({ title = 'GALTARUS', currentPath = '#/' } = {}) {
  const isCurrent = (p) => (p === currentPath ? 'aria-current="page"' : '');

  return /* html */ `
    <div class="container">
      <div class="card">
        <header class="header">
          <div class="brand">
            <div class="logo" aria-hidden="true"></div>
            <div style="font-weight: 750; letter-spacing: 0.6px; text-transform: uppercase;">${title}</div>
          </div>
          <nav class="nav" aria-label="Navigation">
            <a href="#/" ${isCurrent('#/')}>Hub</a>
            <a href="#/ideas" ${isCurrent('#/ideas')}>Idées</a>
            <a href="#/meme" ${isCurrent('#/meme')}>Meme</a>
          </nav>
        </header>
        <main class="main" id="view" aria-live="polite"></main>
      </div>
    </div>
  `;
}
