export function Layout({ title = 'SPA Starter', currentPath = '#/' } = {}) {
  const isCurrent = (p) => (p === currentPath ? 'aria-current="page"' : '');

  return /* html */ `
    <div class="container">
      <div class="card">
        <header class="header">
          <div class="brand">
            <div class="logo" aria-hidden="true"></div>
            <div>
              <div style="font-weight: 650; letter-spacing: 0.2px;">${title}</div>
              <div class="small">Starter minimal pour itérations rapides</div>
            </div>
          </div>
          <nav class="nav" aria-label="Navigation principale">
            <a href="#/" ${isCurrent('#/')}>Accueil</a>
            <a href="#/about" ${isCurrent('#/about')}>À propos</a>
            <a href="#/lab" ${isCurrent('#/lab')}>Lab</a>
          </nav>
        </header>
        <main class="main" id="view" aria-live="polite"></main>
        <footer class="footer">
          <span>SPA statique • hash routing • zéro dépendance</span>
          <span style="float:right">Astuce: <span class="kbd">Ctrl</span>+<span class="kbd">R</span></span>
        </footer>
      </div>
    </div>
  `;
}
