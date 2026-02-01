export function Layout({ title = 'GALTARUS • HUB', currentPath = '#/' } = {}) {
  const isCurrent = (p) => (p === currentPath ? 'aria-current="page"' : '');

  return /* html */ `
    <div class="container">
      <div class="card">
        <header class="header">
          <div class="brand">
            <div class="logo" aria-hidden="true"></div>
            <div>
              <div style="font-weight: 650; letter-spacing: 0.4px; text-transform: uppercase;">${title}</div>
              <div class="small">onglets utiles + fun. push = redeploy.</div>
            </div>
          </div>
          <nav class="nav" aria-label="Navigation">
            <a href="#/" ${isCurrent('#/')}>Accueil</a>
            <a href="#/ideas" ${isCurrent('#/ideas')}>Idées</a>
            <a href="#/meme" ${isCurrent('#/meme')}>Meme</a>
          </nav>
        </header>
        <main class="main" id="view" aria-live="polite"></main>
        <footer class="footer">
          <span>GitHub Pages • gratuit</span>
          <span style="float:right">cache? <span class="kbd">Ctrl</span>+<span class="kbd">F5</span></span>
        </footer>
      </div>
    </div>
  `;
}
