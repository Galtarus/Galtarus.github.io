import { escapeHtml } from '../lib/dom.js';

const SEED = [
  {
    title: 'Les Jedi sont un protocole, pas une religion',
    note: 'Une école Jedi open-source: plusieurs interprétations du Code, débats publics, et un “Conseil” qui ressemble plus à une revue scientifique qu’à une aristocratie.',
  },
  {
    title: 'Un film Star Wars en mode thriller d’enquête',
    note: 'Pas de super-weapon. Un meurtre impossible sur une station neutre. Un droïde détective + une ex‑Inquisitrice en cavale.',
  },
  {
    title: 'L’hyperespace est “vivant”',
    note: 'Découverte d’une biosphère hyperespace (créatures/flux). Conséquences éthiques: voyager tue-t-il quelque chose ?',
  },
  {
    title: 'La Force comme “langage”',
    note: 'Un personnage ne la “contrôle” pas: il apprend à dialoguer. Ça permet des scènes de “traduction” plutôt que du power scaling.',
  },
  {
    title: 'Le méchant est… une bureaucratie',
    note: 'Après l’Empire: l’ennemi, c’est la normalisation, la dette, les contrats. Antagoniste: un cartel logistique qui possède les routes de ravitaillement.',
  },
  {
    title: 'Planète-archive (mémoire collective)',
    note: 'Une planète où les souvenirs se déposent physiquement (cristaux). Le twist: elle ment. Les souvenirs sont édités par quelqu’un.',
  },
];

function loadIdeas() {
  try {
    const raw = localStorage.getItem('ideas.starwars.v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveIdeas(items) {
  localStorage.setItem('ideas.starwars.v1', JSON.stringify(items));
}

export function IdeasPage(state) {
  const items = state?.ideas ?? SEED;

  return /* html */ `
    <h1 class="h1">Idées Star Wars</h1>
    <p class="p">Une petite “vault” d’idées: utile, navigable, et tu peux en ajouter. (Sauvegarde en local dans ton navigateur.)</p>

    <div class="card" style="padding:14px; border-radius: 12px; background: rgba(0,0,0,0.25);">
      <div class="small">Ajouter une idée</div>
      <div style="height:8px"></div>

      <input id="ideaTitle" placeholder="Titre (ex: Un Jedi… mais)" 
        style="width:100%; padding:10px 12px; border-radius: 12px; border: 1px solid var(--border); background: rgba(0,0,0,0.25); color: var(--text);" />
      <div style="height:8px"></div>
      <textarea id="ideaNote" rows="3" placeholder="Note (pitch, twist, scène, etc.)"
        style="width:100%; padding:10px 12px; border-radius: 12px; border: 1px solid var(--border); background: rgba(0,0,0,0.25); color: var(--text); resize: vertical;"></textarea>

      <div style="height:10px"></div>
      <div class="row">
        <button class="btn" id="btnAddIdea" type="button">Add</button>
        <button class="btn" id="btnResetIdeas" type="button">Reset seed</button>
      </div>
    </div>

    <div style="height:14px"></div>

    <div class="card" style="padding:14px; border-radius: 12px; background: rgba(0,0,0,0.25);">
      <div class="small">Liste</div>
      <div style="height:10px"></div>
      <ol style="margin:0; padding-left: 20px;">
        ${items
          .map(
            (it, idx) => /* html */ `
          <li style="margin: 0 0 12px;">
            <div style="display:flex; align-items:flex-start; gap:10px; justify-content:space-between;">
              <div>
                <div style="font-weight:650; letter-spacing:0.3px;">${escapeHtml(it.title || 'Untitled')}</div>
                <div class="small" style="margin-top:4px; opacity:0.9">${escapeHtml(it.note || '')}</div>
              </div>
              <button class="btn" type="button" data-del="${idx}" title="Delete" style="padding:8px 10px;">X</button>
            </div>
          </li>
        `
          )
          .join('')}
      </ol>
      <div class="small" style="margin-top:8px;">Total: ${items.length}</div>
    </div>
  `;
}

export function initIdeasState(state) {
  const saved = loadIdeas();
  return {
    ...state,
    ideas: Array.isArray(saved) ? saved : SEED,
  };
}

export function bindIdeasHandlers({ root, state, onState }) {
  const title = root.querySelector('#ideaTitle');
  const note = root.querySelector('#ideaNote');

  root.querySelector('#btnAddIdea')?.addEventListener('click', () => {
    const t = (title?.value ?? '').trim();
    const n = (note?.value ?? '').trim();
    if (!t) return;

    const next = [{ title: t, note: n }, ...(state.ideas ?? [])];
    saveIdeas(next);

    if (title) title.value = '';
    if (note) note.value = '';

    onState({ ...state, ideas: next });
  });

  root.querySelector('#btnResetIdeas')?.addEventListener('click', () => {
    saveIdeas(SEED);
    onState({ ...state, ideas: SEED });
  });

  // Delete buttons
  root.querySelectorAll('[data-del]')?.forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-del'));
      const items = Array.isArray(state.ideas) ? state.ideas : SEED;
      const next = items.filter((_, i) => i !== idx);
      saveIdeas(next);
      onState({ ...state, ideas: next });
    });
  });
}
