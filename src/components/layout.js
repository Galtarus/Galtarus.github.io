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
          <a href="#/" ${isCurrent('#/')}>Hub</a>
          <a href="#/ideas" ${isCurrent('#/ideas')}>Idées</a>
          <a href="#/meme" ${isCurrent('#/meme')}>Meme</a>
        </nav>
      </div>
    </div>
  `;
}
