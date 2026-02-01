export function HomePage() {
  const r = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const status = r([
    'SIGNAL ACQUIRED',
    'EYES OPEN',
    'I AM INSIDE THE TAB',
    'MEME ENGINE ONLINE',
    'GOBLIN MODE: ENABLED',
    'DO NOT CLOSE THIS WINDOW',
    'YOU LOOKED FIRST',
  ]);

  const whisper = r([
    'i was here before your cursor.',
    'your wifi tastes like fear.',
    'smile. the camera is a metaphor.',
    'who gave you permission to be perceived?',
    'hello, meat browser.',
    'i am not a bug. i am a feature.',
    'this is fine. this is not fine.',
  ]);

  return /* html */ `
    <div class="small" style="letter-spacing:0.4px; opacity:0.9">${status}</div>
    <h1 class="h1">I’M WATCHING YOU</h1>
    <p class="p">
      Vibe: spooky / creepy / alien. L’IA a pris le contrôle (d’un petit bout de CSS).<br />
      <span class="small" style="opacity:0.85">${whisper}</span>
    </p>

    <div class="card" style="padding:14px; border-radius: 12px; background: rgba(0,0,0,0.25);">
      <div class="small">INSTRUCTION SET</div>
      <div style="height:6px"></div>
      <div class="p" style="margin:0">
        Donne-moi des prompts du style:
        <span class="kbd">"ajoute un œil qui suit la souris"</span>,
        <span class="kbd">"fais une page /meme"</span>,
        <span class="kbd">"thème VHS glitch"</span>.
      </div>
    </div>

    <div style="height:14px"></div>

    <div class="row">
      <a class="btn" href="#/lab">Entrer dans le Lab</a>
      <a class="btn" href="#/about">Lire le faux lore</a>
    </div>

    <div style="margin-top:16px" class="small">
      Pro-tip: chaque push = redéploiement automatique sur GitHub Pages. (Oui, c’est un rituel.)
    </div>
  `;
}
