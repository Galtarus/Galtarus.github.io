export function AboutPage() {
  return /* html */ `
    <h1 class="h1">À propos</h1>
    <p class="p">
      Architecture volontairement minimaliste: un mini routeur, des pages sous forme de fonctions qui renvoient du HTML,
      et un layout commun.
    </p>

    <ul class="p">
      <li>Hash routing: <span class="kbd">#/</span>, <span class="kbd">#/about</span>, ...</li>
      <li>Aucune dépendance, aucun build</li>
      <li>Facile à upgrader vers Vite/React/etc si un jour tu veux</li>
    </ul>
  `;
}
