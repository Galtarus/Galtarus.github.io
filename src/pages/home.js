export function HomePage() {
  return /* html */ `
    <h1 class="h1">Hub</h1>

    <div class="row">
      <a class="btn" href="#/ideas">Idées Star Wars</a>
      <a class="btn" href="#/meme">Meme Box</a>
    </div>

    <div style="margin-top:12px" class="small">Tout est local + statique. Pas d’appels réseau.</div>
  `;
}
