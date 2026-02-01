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
  const q = (state?.ideasQuery ?? '').trim().toLowerCase();

  const filtered = q
    ? items.filter((it) => {
        const t = String(it?.title ?? '').toLowerCase();
        const n = String(it?.note ?? '').toLowerCase();
        return t.includes(q) || n.includes(q);
      })
    : items;

  return /* html */ `
    <h1 class="h1">Idées Star Wars</h1>

    <div class="panel">
      <div class="toolbar">
        <input id="ideasSearch" class="field" placeholder="Rechercher…" value="${escapeHtml(state?.ideasQuery ?? '')}" />
      </div>
      <div class="divider"></div>

      <input id="ideaTitle" class="field" placeholder="Titre" />
      <div class="divider"></div>
      <textarea id="ideaNote" class="field textarea" rows="3" placeholder="Note (pitch, twist, scène, etc.)"></textarea>

      <div class="divider"></div>
      <div class="toolbar">
        <button class="btn" id="btnAddIdea" type="button">Ajouter</button>
        <button class="btn" id="btnResetIdeas" type="button">Reset</button>
        <span class="badge">${filtered.length}/${items.length}</span>
      </div>
    </div>

    <div class="divider"></div>

    <ul class="list">
      ${filtered
        .map(
          (it, idx) => /* html */ `
        <li class="item">
          <div>
            <div class="itemTitle">${escapeHtml(it.title || 'Untitled')}</div>
            ${it.note ? `<div class="itemNote">${escapeHtml(it.note)}</div>` : ''}
          </div>
          <button class="iconBtn" type="button" data-del="${idx}" title="Delete" aria-label="Delete">
            ✕
          </button>
        </li>
      `
        )
        .join('')}
    </ul>

    ${filtered.length === 0 ? `<div class="divider"></div><div class="small">Aucun résultat.</div>` : ''}
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
  const search = root.querySelector('#ideasSearch');

  search?.addEventListener('input', (e) => {
    onState({ ...state, ideasQuery: e.target.value });
  });

  const add = () => {
    const t = (title?.value ?? '').trim();
    const n = (note?.value ?? '').trim();
    if (!t) return;

    const next = [{ title: t, note: n }, ...(state.ideas ?? [])];
    saveIdeas(next);

    if (title) title.value = '';
    if (note) note.value = '';

    onState({ ...state, ideas: next });
  };

  root.querySelector('#btnAddIdea')?.addEventListener('click', add);
  title?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') add();
  });

  root.querySelector('#btnResetIdeas')?.addEventListener('click', () => {
    saveIdeas(SEED);
    onState({ ...state, ideas: SEED });
  });

  // Delete buttons (index refers to filtered view; re-map by matching object identity)
  root.querySelectorAll('[data-del]')?.forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-del'));
      const q = (state?.ideasQuery ?? '').trim().toLowerCase();
      const items = Array.isArray(state.ideas) ? state.ideas : SEED;
      const filtered = q
        ? items.filter((it) => {
            const t = String(it?.title ?? '').toLowerCase();
            const n = String(it?.note ?? '').toLowerCase();
            return t.includes(q) || n.includes(q);
          })
        : items;

      const target = filtered[idx];
      const next = items.filter((it) => it !== target);
      saveIdeas(next);
      onState({ ...state, ideas: next });
    });
  });
}
