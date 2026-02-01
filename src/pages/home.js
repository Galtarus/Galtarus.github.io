export function HomePage() {
  return /* html */ `
    <h1 class="h1">Accueil</h1>
    <p class="p">Mini hub: des onglets avec des idées utiles + des trucs marrants.</p>

    <div class="row">
      <a class="btn" href="#/ideas">Idées Star Wars</a>
      <a class="btn" href="#/meme">Meme Box</a>
    </div>

    <div style="height:14px"></div>

    <div class="card" style="padding:14px; border-radius: 12px; background: rgba(0,0,0,0.25);">
      <div class="small">Comment on bosse</div>
      <div style="height:8px"></div>
      <div class="p" style="margin:0">
        Tu me dis: <span class="kbd">"ajoute un onglet: X"</span> ou <span class="kbd">"mets 10 idées"</span>.
        Je modifie + je push → redéploiement automatique.
      </div>
    </div>
  `;
}
