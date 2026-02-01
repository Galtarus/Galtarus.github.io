import { escapeHtml } from '../lib/dom.js';

// A tiny “product” layer: manage multiple sections/tools.
// Everything is localStorage-backed and offline (CSP blocks network).

const KEY = 'galtarus.sections.v1';

const DEFAULT_SECTIONS = [
  {
    id: 'starwars',
    kind: 'ideaVault',
    title: 'Star Wars — Pitch Vault',
    desc: 'Idées de films, twists, scènes, thèmes.',
  },
];

function uid() {
  return Math.random().toString(36).slice(2, 9) + '-' + Date.now().toString(36);
}

export function loadSections() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSections(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function initSectionsState(state) {
  const saved = loadSections();
  return {
    ...state,
    sections: Array.isArray(saved) && saved.length ? saved : DEFAULT_SECTIONS,
  };
}

export function SectionsPage(state) {
  const sections = Array.isArray(state?.sections) ? state.sections : DEFAULT_SECTIONS;

  return /* html */ `
    <h1 class="h1">Sections</h1>

    <div class="panel">
      <div class="toolbar">
        <input id="secTitle" class="field" placeholder="Nom de section… (ex: Idées SF, Business, Checklist)" />
        <button class="btn" id="secAddIdeaVault" type="button">+ Idea vault</button>
      </div>
      <div class="divider"></div>
      <div class="small">Tu peux ajouter des sections. Ensuite on enrichit chaque type (tri, tags, export, templates…)</div>
    </div>

    <div class="divider"></div>

    <ul class="list">
      ${sections
        .map(
          (s) => /* html */ `
        <li class="item">
          <div>
            <div class="itemTitle">${escapeHtml(s.title || 'Untitled')}</div>
            ${s.desc ? `<div class="itemNote">${escapeHtml(s.desc)}</div>` : ''}
          </div>
          <div class="toolbar" style="justify-content:flex-end">
            <a class="btn" href="#/s/${encodeURIComponent(s.id)}" style="min-height: var(--tap);">Open</a>
            <button class="iconBtn" type="button" data-del-sec="${escapeHtml(s.id)}" title="Delete" aria-label="Delete">✕</button>
          </div>
        </li>
      `
        )
        .join('')}
    </ul>
  `;
}

export function bindSectionsHandlers({ root, state, onState }) {
  const title = root.querySelector('#secTitle');

  root.querySelector('#secAddIdeaVault')?.addEventListener('click', () => {
    const t = (title?.value ?? '').trim();
    if (!t) return;

    const next = [
      { id: uid(), kind: 'ideaVault', title: t, desc: '' },
      ...(state.sections ?? []),
    ];

    saveSections(next);
    if (title) title.value = '';
    onState({ ...state, sections: next });
  });

  root.querySelectorAll('[data-del-sec]')?.forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-del-sec');
      const next = (state.sections ?? []).filter((s) => s.id !== id);
      saveSections(next);
      onState({ ...state, sections: next });
    });
  });
}
