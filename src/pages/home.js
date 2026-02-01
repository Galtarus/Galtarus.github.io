export function HomePage() {
  return /* html */ `
    <h1 class="h1">Hub</h1>

    <p class="p">Galtarus est un hub offline: tes sections (Idea Vault, Checklists, Notes) vivent en localStorage. Le CSP bloque le réseau.</p>

    <div class="panel">
      <div class="toolbar">
        <a class="btn" href="#/sections">Sections</a>
        <a class="btn btnGhost" href="#/search">Search</a>
        <a class="btn btnGhost" href="#/s/starwars">Démo: Star Wars</a>
      </div>
      <div class="divider"></div>
      <div class="small">Astuce: Export/Import (JSON) est dans la page Sections.</div>
    </div>
  `;
}
