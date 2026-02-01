import { escapeHtml } from '../lib/dom.js';
import { loadSections, SECTION_KINDS } from '../stores/sectionsStore.js';
import { loadSectionData } from '../stores/sectionDataStore.js';
import { iconSvg, kindIconSvg } from '../components/icons.js';

export function initSearchState(state) {
  return {
    ...state,
    sections: Array.isArray(state.sections) ? state.sections : loadSections(),
    searchQuery: String(state.searchQuery ?? ''),
  };
}

function kindLabel(kind) {
  if (kind === SECTION_KINDS.IDEA_VAULT) return 'Ideas';
  if (kind === SECTION_KINDS.CHECKLIST) return 'Checklist';
  if (kind === SECTION_KINDS.NOTES) return 'Notes';
  return String(kind || 'Section');
}

function toTerms(q0) {
  return String(q0 ?? '')
    .trim()
    .toLowerCase()
    .split(/\s+/g)
    .filter(Boolean);
}

function includesAllTerms(text, terms) {
  const t = String(text ?? '').toLowerCase();
  return terms.every((w) => t.includes(w));
}

function snippet(text, terms) {
  const t = String(text ?? '');
  const lower = t.toLowerCase();
  const idxs = terms.map((w) => lower.indexOf(w)).filter((x) => x >= 0);
  if (!idxs.length) return '';
  const idx = Math.min(...idxs);
  const start = Math.max(0, idx - 40);
  const end = Math.min(t.length, idx + Math.max(...terms.map((w) => w.length)) + 60);
  const s = t.slice(start, end).replace(/\s+/g, ' ').trim();
  return (start > 0 ? '…' : '') + s + (end < t.length ? '…' : '');
}

export function SearchPage(state) {
  const sections = Array.isArray(state.sections) ? state.sections : loadSections();
  const q0 = String(state.searchQuery ?? '');
  const terms = toTerms(q0);

  const results = [];

  if (terms.length) {
    for (const s of sections) {
      const title = String(s.title ?? '');
      const desc = String(s.desc ?? '');
      const baseMatch = includesAllTerms(`${title}\n${desc}`, terms);

      const data = loadSectionData(s.id, s.kind);
      let foundInData = false;
      let note = '';

      if (data && s.kind === 'ideaVault' && Array.isArray(data.items)) {
        for (const it of data.items) {
          const t = String(it?.title ?? '');
          const n = String(it?.note ?? '');
          if (includesAllTerms(`${t}\n${n}`, terms)) {
            foundInData = true;
            note = t || snippet(n, terms);
            break;
          }
        }
      }

      if (data && s.kind === 'checklist' && Array.isArray(data.items)) {
        const hit = data.items.find((it) => includesAllTerms(String(it?.text ?? ''), terms));
        if (hit) {
          foundInData = true;
          note = String(hit.text ?? '');
        }
      }

      if (data && s.kind === 'notes' && typeof data.text === 'string') {
        if (includesAllTerms(data.text, terms)) {
          foundInData = true;
          note = snippet(data.text, terms);
        }
      }

      if (baseMatch || foundInData) {
        results.push({ section: s, note, where: baseMatch ? 'meta' : 'content' });
      }
    }
  }

  const showResults = terms.length > 0;

  return /* html */ `
    <div class="pageHeader">
      <div>
        <h1 class="h1" style="margin:0 0 6px">Search</h1>
        <div class="small">Offline search across titles, descriptions, and section content.</div>
      </div>
      <a class="btn btnGhost" href="#/settings">${iconSvg('settings')} Settings</a>
    </div>

    <div class="panel">
      <div class="toolbar">
        <div class="fieldWrap">
          <span class="fieldIcon">${iconSvg('search')}</span>
          <input id="globalSearch" class="field" placeholder="Search everywhere…" value="${escapeHtml(q0)}" />
          ${q0.trim() ? `<button class="btn btnGhost clearBtn" id="globalSearchClear" type="button" title="Clear">${iconSvg('x')}</button>` : ''}
        </div>
        <span class="badge">${showResults ? results.length : '—'}</span>
      </div>
      <div class="divider"></div>
      <div class="small">Multiple words are treated as <b>AND</b>. Tip: press <span class="kbd">Esc</span> to clear.</div>
    </div>

    <div class="divider"></div>

    ${!q0.trim() ? `
      <div class="empty">
        <div class="emptyTitle">Start typing to search</div>
        <div class="small">Try a section name, a checklist item, or a phrase from your notes.</div>
        <div class="divider"></div>
        <a class="btn btnGhost" href="#/sections">${iconSvg('grid')} Browse sections</a>
      </div>
    ` : ''}

    ${showResults ? `
      <ul class="list">
        ${results
          .map(
            (r) => /* html */ `
          <li class="item">
            <div>
              <div class="toolbar" style="gap:8px; align-items:center; margin-bottom:4px">
                <div class="itemTitle" style="margin:0"><span class="kindIcon">${kindIconSvg(r.section.kind)}</span> ${escapeHtml(r.section.title || 'Untitled')}</div>
                <span class="badge">${escapeHtml(kindLabel(r.section.kind))}</span>
                ${r.where === 'content' ? `<span class="badge">Match in content</span>` : ''}
              </div>
              ${r.note ? `<div class="itemNote">${escapeHtml(r.note)}</div>` : ''}
            </div>
            <a class="btn" href="#/s/${encodeURIComponent(r.section.id)}">Open</a>
          </li>
        `
          )
          .join('')}
      </ul>

      ${results.length === 0 ? `<div class="empty" style="margin-top:12px"><div class="emptyTitle">No results</div><div class="small">Try fewer words, or check spelling.</div></div>` : ''}
    ` : ''}
  `;
}

export function bindSearchHandlers({ root, state, onState }) {
  const input = root.querySelector('#globalSearch');

  const clear = () => {
    onState({ ...state, searchQuery: '' });
    if (input) input.value = '';
  };

  input?.addEventListener('input', (e) => {
    onState({ ...state, searchQuery: e.target.value });
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      clear();
    }
  });

  root.querySelector('#globalSearchClear')?.addEventListener('click', () => {
    clear();
    setTimeout(() => input?.focus?.({ preventScroll: true }), 0);
  });

  // nice default: focus search on page open
  setTimeout(() => input?.focus?.({ preventScroll: true }), 0);
}
