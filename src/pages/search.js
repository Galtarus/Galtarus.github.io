import { escapeHtml } from '../lib/dom.js';
import { loadSections } from '../stores/sectionsStore.js';
import { loadSectionData } from '../stores/sectionDataStore.js';

export function initSearchState(state) {
  return {
    ...state,
    sections: Array.isArray(state.sections) ? state.sections : loadSections(),
    searchQuery: String(state.searchQuery ?? ''),
  };
}

function snippet(text, q) {
  const idx = text.toLowerCase().indexOf(q);
  if (idx < 0) return '';
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + q.length + 60);
  const s = text.slice(start, end).replace(/\s+/g, ' ').trim();
  return (start > 0 ? '…' : '') + s + (end < text.length ? '…' : '');
}

export function SearchPage(state) {
  const sections = Array.isArray(state.sections) ? state.sections : loadSections();
  const q0 = String(state.searchQuery ?? '').trim();
  const q = q0.toLowerCase();

  const results = [];

  if (q) {
    for (const s of sections) {
      const title = String(s.title ?? '');
      const desc = String(s.desc ?? '');
      const baseMatch = title.toLowerCase().includes(q) || desc.toLowerCase().includes(q);

      const data = loadSectionData(s.id, s.kind);
      let foundInData = false;
      let note = '';

      if (data && s.kind === 'ideaVault' && Array.isArray(data.items)) {
        for (const it of data.items) {
          const t = String(it?.title ?? '');
          const n = String(it?.note ?? '');
          if (t.toLowerCase().includes(q) || n.toLowerCase().includes(q)) {
            foundInData = true;
            note = t || snippet(n, q);
            break;
          }
        }
      }

      if (data && s.kind === 'checklist' && Array.isArray(data.items)) {
        const hit = data.items.find((it) => String(it?.text ?? '').toLowerCase().includes(q));
        if (hit) {
          foundInData = true;
          note = String(hit.text ?? '');
        }
      }

      if (data && s.kind === 'notes' && typeof data.text === 'string') {
        if (data.text.toLowerCase().includes(q)) {
          foundInData = true;
          note = snippet(data.text, q);
        }
      }

      if (baseMatch || foundInData) {
        results.push({ section: s, note });
      }
    }
  }

  return /* html */ `
    <h1 class="h1">Search</h1>

    <div class="panel">
      <div class="toolbar">
        <input id="globalSearch" class="field" placeholder="Rechercher partout…" value="${escapeHtml(q0)}" />
        <span class="badge">${q ? results.length : '—'}</span>
      </div>
      <div class="divider"></div>
      <div class="small">Recherche offline dans les titres/desc, Idea Vault, Checklists et Notes.</div>
    </div>

    <div class="divider"></div>

    <ul class="list">
      ${results
        .map(
          (r) => /* html */ `
        <li class="item">
          <div>
            <div class="itemTitle">${escapeHtml(r.section.title || 'Untitled')}</div>
            ${r.note ? `<div class="itemNote">${escapeHtml(r.note)}</div>` : ''}
          </div>
          <a class="btn" href="#/s/${encodeURIComponent(r.section.id)}">Open</a>
        </li>
      `
        )
        .join('')}
    </ul>

    ${q && results.length === 0 ? `<div class="small">Aucun résultat.</div>` : ''}
  `;
}

export function bindSearchHandlers({ root, state, onState }) {
  const input = root.querySelector('#globalSearch');
  input?.addEventListener('input', (e) => {
    onState({ ...state, searchQuery: e.target.value });
  });
}
