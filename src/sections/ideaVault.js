import { escapeHtml } from '../lib/dom.js';
import { uid } from '../lib/id.js';
import { loadSectionData, saveSectionData } from '../stores/sectionDataStore.js';

const SEED = [
  {
    id: 'seed_jedi_protocol',
    title: 'Les Jedi sont un protocole, pas une religion',
    note: 'Une école Jedi open-source: plusieurs interprétations du Code, débats publics, et un “Conseil” qui ressemble plus à une revue scientifique qu’à une aristocratie.',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: 'seed_detective',
    title: 'Un film Star Wars en mode thriller d’enquête',
    note: 'Pas de super-weapon. Un meurtre impossible sur une station neutre. Un droïde détective + une ex‑Inquisitrice en cavale.',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
  },
];

function normalizeItems(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((it) => it && typeof it === 'object')
    .map((it) => ({
      id: String(it.id || uid('idea')),
      title: String(it.title || ''),
      note: String(it.note || ''),
      createdAt: Number.isFinite(it.createdAt) ? it.createdAt : Date.now(),
    }));
}

export function initIdeaVaultState(state, { section }) {
  const saved = loadSectionData(section.id, section.kind);
  const items = normalizeItems(saved?.items);

  return {
    ...state,
    __section: section,
    __view: {
      ...(state.__view ?? {}),
      [section.id]: {
        query: String(state.__view?.[section.id]?.query ?? ''),
        sort: String(state.__view?.[section.id]?.sort ?? 'newest'),
      },
    },
    __data: {
      ...(state.__data ?? {}),
      [section.id]: {
        items: items.length ? items : SEED,
      },
    },
  };
}

function getView(state, sid) {
  return state.__view?.[sid] ?? { query: '', sort: 'newest' };
}

function getItems(state, sid) {
  return state.__data?.[sid]?.items ?? [];
}

function applySort(items, sort) {
  const arr = [...items];
  if (sort === 'oldest') arr.sort((a, b) => a.createdAt - b.createdAt);
  else if (sort === 'title') arr.sort((a, b) => String(a.title).localeCompare(String(b.title)));
  else arr.sort((a, b) => b.createdAt - a.createdAt);
  return arr;
}

export function IdeaVaultPage(state) {
  const section = state.__section;
  const sid = section.id;
  const view = getView(state, sid);

  const items = getItems(state, sid);
  const q = view.query.trim().toLowerCase();

  const filtered = q
    ? items.filter((it) => {
        const t = String(it.title ?? '').toLowerCase();
        const n = String(it.note ?? '').toLowerCase();
        return t.includes(q) || n.includes(q);
      })
    : items;

  const sorted = applySort(filtered, view.sort);

  const titleId = `ideaTitle_${sid}`;
  const noteId = `ideaNote_${sid}`;
  const searchId = `ideasSearch_${sid}`;
  const sortId = `ideasSort_${sid}`;

  return /* html */ `
    <div class="pageHeader">
      <div>
        <div class="h1">${escapeHtml(section.title || 'Idea Vault')}</div>
        ${section.desc ? `<div class="small">${escapeHtml(section.desc)}</div>` : ''}
      </div>
      <a class="btn" href="#/sections">← Sections</a>
    </div>

    <div class="panel">
      <div class="toolbar">
        <input id="${searchId}" class="field" placeholder="Rechercher…" value="${escapeHtml(view.query)}" />
        <select id="${sortId}" class="field select" aria-label="Sort">
          <option value="newest" ${view.sort === 'newest' ? 'selected' : ''}>Nouveaux</option>
          <option value="oldest" ${view.sort === 'oldest' ? 'selected' : ''}>Anciens</option>
          <option value="title" ${view.sort === 'title' ? 'selected' : ''}>Titre</option>
        </select>
        <span class="badge">${sorted.length}/${items.length}</span>
      </div>

      <div class="divider"></div>
      <input id="${titleId}" class="field" placeholder="Titre" autocomplete="off" />
      <div class="divider"></div>
      <textarea id="${noteId}" class="field textarea" rows="3" placeholder="Note (pitch, twist, scène, etc.)"></textarea>

      <div class="divider"></div>
      <div class="toolbar">
        <button class="btn" data-action="idea:add" type="button">Ajouter</button>
        <button class="btn btnGhost" data-action="idea:seed" type="button">Seed</button>
      </div>
    </div>

    <div class="divider"></div>

    <ul class="list">
      ${sorted
        .map(
          (it) => /* html */ `
        <li class="item">
          <div>
            <div class="itemTitle">${escapeHtml(it.title || 'Untitled')}</div>
            ${it.note ? `<div class="itemNote">${escapeHtml(it.note)}</div>` : ''}
          </div>
          <button class="iconBtn" type="button" data-del="${escapeHtml(it.id)}" title="Delete" aria-label="Delete">✕</button>
        </li>
      `
        )
        .join('')}
    </ul>

    ${sorted.length === 0 ? `<div class="divider"></div><div class="small">Aucun résultat.</div>` : ''}
  `;
}

export function bindIdeaVaultHandlers({ root, state, onState }) {
  const section = state.__section;
  const sid = section.id;

  const title = root.querySelector(`#ideaTitle_${CSS.escape(sid)}`);
  const note = root.querySelector(`#ideaNote_${CSS.escape(sid)}`);
  const search = root.querySelector(`#ideasSearch_${CSS.escape(sid)}`);
  const sort = root.querySelector(`#ideasSort_${CSS.escape(sid)}`);

  const setView = (patch) => {
    const prev = getView(state, sid);
    onState({
      ...state,
      __view: {
        ...(state.__view ?? {}),
        [sid]: { ...prev, ...patch },
      },
    });
  };

  search?.addEventListener('input', (e) => setView({ query: e.target.value }));
  sort?.addEventListener('change', (e) => setView({ sort: e.target.value }));

  const persist = (nextItems) => {
    saveSectionData(sid, section.kind, { items: nextItems });
    onState({
      ...state,
      __data: { ...(state.__data ?? {}), [sid]: { items: nextItems } },
    });
  };

  const add = () => {
    const t = (title?.value ?? '').trim();
    const n = (note?.value ?? '').trim();
    if (!t) return;

    const nextItems = [{ id: uid('idea'), title: t, note: n, createdAt: Date.now() }, ...getItems(state, sid)];
    persist(nextItems);

    if (title) title.value = '';
    if (note) note.value = '';

    // keep keyboard open on mobile by focusing back
    title?.focus({ preventScroll: true });
  };

  root.querySelector('[data-action="idea:add"]')?.addEventListener('click', add);
  title?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') add();
  });

  root.querySelector('[data-action="idea:seed"]')?.addEventListener('click', () => {
    persist(SEED);
  });

  root.querySelectorAll('[data-del]')?.forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-del');
      const nextItems = getItems(state, sid).filter((it) => it.id !== id);
      persist(nextItems);
    });
  });
}
