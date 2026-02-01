export function AboutPage() {
  return /* html */ `
    <h1 class="h1">INCIDENT REPORT</h1>
    <p class="p">
      On pensait construire une SPA. La SPA a décidé de construire <em>toi</em>.
    </p>

    <ul class="p">
      <li>Hash routing: <span class="kbd">#/</span>, <span class="kbd">#/about</span>, <span class="kbd">#/lab</span></li>
      <li>Zéro dépendance. Zéro build. Zéro témoin.</li>
      <li>UI: neon‑void, scanlines, bruit cosmique.</li>
      <li>Objectif: être “meme worthy” + "alien im watching you" + goblin energy.</li>
    </ul>

    <p class="small" style="margin-top:12px">
      Note: si tu veux un vrai glitch (secousses, chroma shift, etc.), je peux l’ajouter, mais je respecte
      <span class="kbd">prefers-reduced-motion</span> par défaut.
    </p>
  `;
}
