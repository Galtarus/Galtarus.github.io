export function HomePage() {
  return /* html */ `
    <h1 class="h1">Hello 👋</h1>
    <p class="p">
      Ceci est un starter SPA (une seule page) très simple. Dis-moi ce que tu veux construire et je te génère des écrans,
      composants, styles, ou une petite logique.
    </p>

    <div class="row">
      <a class="btn" href="#/lab">Ouvrir le Lab</a>
      <a class="btn" href="#/about">Voir “À propos”</a>
    </div>

    <div style="margin-top:16px" class="small">
      Déploiement: c’est du pur statique, donc GitHub Pages / Netlify / Vercel marchent très bien.
    </div>
  `;
}
