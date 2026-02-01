export function Layout({ title = 'GALTARUS • MEME BOX' } = {}) {
  return /* html */ `
    <div class="container">
      <div class="card">
        <header class="header">
          <div class="brand">
            <div class="logo" aria-hidden="true"></div>
            <div>
              <div style="font-weight: 650; letter-spacing: 0.4px; text-transform: uppercase;">${title}</div>
              <div class="small">un petit bouton. un petit texte. une grande menace.</div>
            </div>
          </div>
        </header>
        <main class="main" id="view" aria-live="polite"></main>
        <footer class="footer">
          <span>GitHub Pages • gratuit • push = redeploy</span>
          <span style="float:right">cache? <span class="kbd">Ctrl</span>+<span class="kbd">F5</span></span>
        </footer>
      </div>
    </div>
  `;
}
