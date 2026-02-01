import { escapeHtml } from '../lib/dom.js';
import { downloadJson, readFileText, safeParseJson } from '../lib/storage.js';
import {
  loadSections,
  saveSections,
  addSection,
  deleteSection,
  SECTION_KINDS,
  normalizeSections,
} from '../stores/sectionsStore.js';
import { loadSectionData, saveSectionData } from '../stores/sectionDataStore.js';

export function initSectionsState(state) {
  return {
    ...state,
    sections: loadSections(),
    sectionsQuery: String(state.sectionsQuery ?? ''),
    sectionsSort: String(state.sectionsSort ?? 'newest'),
  };
}

function sortSections(items, sort) {
  const arr = [...items];
  if (sort === 'title') arr.sort((a, b) => String(a.title).localeCompare(String(b.title)));
  else if (sort === 'kind') arr.sort((a, b) => String(a.kind).localeCompare(String(b.kind)));
  else arr.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  return arr;
}

function kindLabel(kind) {
  if (kind === SECTION_KINDS.CHECKLIST) return 'Checklist';
  if (kind === SECTION_KINDS.NOTES) return 'Notes';
  return 'Idea Vault';
}

function kindIcon(kind) {
  // simple, CSP-safe glyphs (no external assets)
  if (kind === SECTION_KINDS.CHECKLIST) return '☑';
  if (kind === SECTION_KINDS.NOTES) return '✎';
  return '✦';
}

export function SectionsPage(state) {
  const sections = Array.isArray(state?.sections) ? state.sections : loadSections();

  const q = String(state.sectionsQuery ?? '').trim().toLowerCase();
  const filtered = q
    ? sections.filter((s) => {
        const t = String(s.title ?? '').toLowerCase();
        const d = String(s.desc ?? '').toLowerCase();
        return t.includes(q) || d.includes(q) || String(s.kind).toLowerCase().includes(q);
      })
    : sections;

  const sorted = sortSections(filtered, state.sectionsSort ?? 'newest');

  return /* html */ `
    <h1 class="h1">Sections</h1>

    <div class="panel">
      <div class="toolbar">
        <input id="secTitle" class="field" placeholder="Nom de section…" autocomplete="off" />
        <select id="secKind" class="field select" aria-label="Type">
          <option value="${SECTION_KINDS.IDEA_VAULT}">Idea Vault</option>
          <option value="${SECTION_KINDS.CHECKLIST}">Checklist</option>
          <option value="${SECTION_KINDS.NOTES}">Notes</option>
        </select>
        <button class="btn" id="secAdd" type="button">+ Ajouter</button>
      </div>
      <div class="divider"></div>
      <div class="toolbar">
        <input id="secSearch" class="field" placeholder="Rechercher sections…" value="${escapeHtml(state.sectionsQuery ?? '')}" />
        <select id="secSort" class="field select" aria-label="Sort">
          <option value="newest" ${state.sectionsSort === 'newest' ? 'selected' : ''}>Nouvelles</option>
          <option value="title" ${state.sectionsSort === 'title' ? 'selected' : ''}>Titre</option>
          <option value="kind" ${state.sectionsSort === 'kind' ? 'selected' : ''}>Type</option>
        </select>
        <span class="badge">${sorted.length}/${sections.length}</span>
      </div>

      <div class="divider"></div>
      <div class="toolbar">
        <button class="btn btnGhost" id="btnExport" type="button">Export JSON</button>
        <label class="btn btnGhost" for="importFile" style="cursor:pointer;">
          Import…
        </label>
        <input id="importFile" type="file" accept="application/json" style="display:none" />
      </div>

      <div class="divider"></div>
      <div class="small">Tout est offline (localStorage). Le CSP bloque le réseau. Export/Import sert à sauvegarder et synchroniser manuellement.</div>
    </div>

    <div class="divider"></div>

    <ul class="list">
      ${sorted
        .map(
          (s) => /* html */ `
        <li class="item">
          <div>
            <div class="itemTitle"><span class="kind">${kindIcon(s.kind)}</span> ${escapeHtml(s.title || 'Untitled')}</div>
            <div class="itemNote">${escapeHtml(kindLabel(s.kind))}${s.desc ? ` • ${escapeHtml(s.desc)}` : ''}</div>
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

    ${sorted.length === 0 ? `<div class="divider"></div><div class="small">Aucun résultat.</div>` : ''}
  `;
}

function exportAll(sections) {
  const payload = {
    app: 'galtarus',
    version: 1,
    exportedAt: new Date().toISOString(),
    sections,
    data: {},
  };

  for (const s of sections) {
    payload.data[s.id] = {
      kind: s.kind,
      data: loadSectionData(s.id, s.kind) ?? null,
    };
  }

  downloadJson(`galtarus-export-${new Date().toISOString().slice(0, 10)}.json`, payload);
}

function importAll(rawText) {
  const parsed = safeParseJson(rawText);
  if (!parsed || parsed.app !== 'galtarus' || !parsed.sections) {
    return { ok: false, reason: 'invalid_format' };
  }

  const sections = normalizeSections(parsed.sections);
  if (!sections?.length) return { ok: false, reason: 'no_sections' };

  saveSections(sections);

  const data = parsed.data && typeof parsed.data === 'object' ? parsed.data : {};
  for (const s of sections) {
    const entry = data[s.id];
    if (entry && entry.kind === s.kind && entry.data) {
      saveSectionData(s.id, s.kind, entry.data);
    }
  }

  return { ok: true, sections };
}

export function bindSectionsHandlers({ root, state, onState }) {
  const title = root.querySelector('#secTitle');
  const kind = root.querySelector('#secKind');
  const search = root.querySelector('#secSearch');
  const sort = root.querySelector('#secSort');
  const file = root.querySelector('#importFile');

  const setListState = (patch) => onState({ ...state, ...patch });

  search?.addEventListener('input', (e) => setListState({ sectionsQuery: e.target.value }));
  sort?.addEventListener('change', (e) => setListState({ sectionsSort: e.target.value }));

  const add = () => {
    const t = (title?.value ?? '').trim();
    if (!t) return;

    const k = (kind?.value ?? SECTION_KINDS.IDEA_VAULT);
    const next = addSection({ title: t, kind: k, desc: '' }, state.sections);

    if (title) title.value = '';
    title?.focus({ preventScroll: true });

    onState({ ...state, sections: next });
  };

  root.querySelector('#secAdd')?.addEventListener('click', add);
  title?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') add();
  });

  root.querySelectorAll('[data-del-sec]')?.forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-del-sec');
      const next = deleteSection(id, state.sections);
      onState({ ...state, sections: next });
    });
  });

  root.querySelector('#btnExport')?.addEventListener('click', () => {
    exportAll(state.sections ?? loadSections());
  });

  file?.addEventListener('change', async () => {
    const f = file.files?.[0];
    if (!f) return;

    const text = await readFileText(f);
    const res = importAll(text);
    if (res.ok) {
      onState({ ...state, sections: res.sections });
    }

    // allow importing the same file again
    file.value = '';
  });
}
