import { escapeHtml } from '../lib/dom.js';

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function goblinize(s) {
  const tokens = ['goblin', 'hiss', 'skrrt', '(??)', '[REDACTED]', 'zzz', '👁'];
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    out += i % 2 === 0 ? ch.toUpperCase() : ch.toLowerCase();
  }
  return `${out}  // ${pick(tokens)}`;
}

function alienize(s) {
  return s
    .replaceAll('a', '4').replaceAll('A', '4')
    .replaceAll('e', '3').replaceAll('E', '3')
    .replaceAll('i', '1').replaceAll('I', '1')
    .replaceAll('o', '0').replaceAll('O', '0')
    .replaceAll('u', 'ü').replaceAll('U', 'Ü')
    .split('')
    .join('·');
}

function glitch(s) {
  const stamps = ['00:00:13', '01:33:07', '13:37:00', '??:??:??'];
  const warnings = ['SIGNAL LOST', 'SIGNAL ACQUIRED', 'DO NOT LOOK AWAY', 'I AM WATCHING YOU'];
  return `[${pick(stamps)}] ${pick(warnings)} :: ${s}`;
}

export function MemePage(state) {
  const input = state?.text ?? '';
  const mode = state?.mode ?? 'goblin';

  const transformed =
    mode === 'alien' ? alienize(input) :
    mode === 'glitch' ? glitch(input) :
    goblinize(input);

  return /* html */ `
    <h1 class="h1">Meme Box</h1>

    <div class="card" style="padding:14px; border-radius: 12px; background: rgba(0,0,0,0.25);">
      <input id="memeInput" value="${escapeHtml(input)}" placeholder="ex: le café me juge" 
        style="width:100%; padding:10px 12px; border-radius: 12px; border: 1px solid var(--border); background: rgba(0,0,0,0.25); color: var(--text);" />

      <div style="height:10px"></div>
      <div class="row">
        <button class="btn" id="modeGoblin" type="button">Goblinize</button>
        <button class="btn" id="modeAlien" type="button">Alienize</button>
        <button class="btn" id="modeGlitch" type="button">Glitch</button>
        <button class="btn" id="btnRandom" type="button">Random</button>
        <button class="btn" id="btnCopy" type="button">Copy</button>
      </div>

      <div style="height:12px"></div>
      <div class="small">Sortie</div>
      <div id="memeOut" style="margin-top:6px; padding:10px 12px; border-radius: 12px; border: 1px solid var(--border); background: rgba(255,255,255,0.04); white-space: pre-wrap;">
        ${escapeHtml(input ? transformed : '...')}
      </div>
    </div>
  `;
}

export function bindMemeHandlers({ root, state, onState }) {
  const input = root.querySelector('#memeInput');
  const out = root.querySelector('#memeOut');
  const btnCopy = root.querySelector('#btnCopy');

  if (input) {
    input.addEventListener('input', (e) => {
      onState({ ...state, text: e.target.value });
    });
  }

  const setMode = (mode) => onState({ ...state, mode });
  root.querySelector('#modeGoblin')?.addEventListener('click', () => setMode('goblin'));
  root.querySelector('#modeAlien')?.addEventListener('click', () => setMode('alien'));
  root.querySelector('#modeGlitch')?.addEventListener('click', () => setMode('glitch'));

  root.querySelector('#btnRandom')?.addEventListener('click', () => {
    const prompts = [
      'je suis un toaster conscient',
      'bonjour internet (menace)',
      'je vois tes onglets',
      'cette phrase est possédée',
      'galtarus.exe a faim',
    ];
    onState({ ...state, text: pick(prompts) });
  });

  btnCopy?.addEventListener('click', async () => {
    const txt = out?.innerText ?? '';
    try {
      await navigator.clipboard.writeText(txt);
      btnCopy.textContent = 'Copied.';
      setTimeout(() => (btnCopy.textContent = 'Copy'), 900);
    } catch {
      btnCopy.textContent = 'Copy failed';
      setTimeout(() => (btnCopy.textContent = 'Copy'), 900);
    }
  });
}
