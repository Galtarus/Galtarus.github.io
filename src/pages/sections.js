import { escapeHtml } from '../lib/dom.js';
import { confirmDialog, editSectionDialog } from '../lib/dialogs.js';
import { exportAll, importAllFromFile } from '../lib/appData.js';
import { iconSvg, kindIconSvg } from '../components/icons.js';
import {
  loadSections,
  createSection,
  deleteSection,
  updateSectionMeta,
  SECTION_KINDS,
} from '../stores/sectionsStore.js';
import { loadSectionData, deleteSectionData } from '../stores/sectionDataStore.js';

export function initSectionsState(state) {
  return {
    ...state,
    sections: loadSections(),
    sectionsQuery: String(state.sectionsQuery ?? ''),
    sectionsSort: String(state.sectionsSort ?? 'recent'),
  };
}

function sortSections(items, sort) {
  const arr = [...items];
  if (sort === 'title') arr.sort((a, b) => String(a.title).localeCompare(String(b.title)));
  else if (sort === 'kind') arr.sort((a, b) => String(a.kind).localeCompare(String(b.kind)));
  else if (sort === 'newest') arr.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  else arr.sort((a, b) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0));
  return arr;
}

function kindLabel(kind) {
  if (kind === SECTION_KINDS.CHECKLIST) return 'Checklist';
  if (kind === SECTION_KINDS.NOTES) return 'Notes';
  return 'Ideas';
}

function formatTime(ts) {
  if (!Number.isFinite(ts)) return '';
  try {
    return new Date(ts).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
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

  const sorted = sortSections(filtered, state.sectionsSort ?? 'recent');

  return /* html */ `
    <div class="pageHeader">
      <div>
        <h1 class="h1" style="margin:0 0 6px">Sections</h1>
        <div class="small">Create, rename, and organize your offline sections.</div>
      </div>
      <div class="toolbar" style="justify-content:flex-end">
        <a class="btn btnGhost" href="#/settings">${iconSvg('settings')} Settings</a>
        <a class="btn btnGhost" href="#/">${iconSvg('home')} Hub</a>
      </div>
    </div>

    <div class="panel">
      <div class="itemTitle" style="margin-bottom:8px">Create a section</div>
      <div class="toolbar">
        <input id="secTitle" class="field" placeholder="Title (required)" autocomplete="off" />
        <select id="secKind" class="field select" aria-label="Type">
          <option value="${SECTION_KINDS.IDEA_VAULT}">Ideas</option>
          <option value="${SECTION_KINDS.CHECKLIST}">Checklist</option>
          <option value="${SECTION_KINDS.NOTES}">Notes</option>
        </select>
        <button class="btn" id="secAdd" type="button" disabled>${iconSvg('plus')} Create</button>
      </div>
      <div class="divider"></div>
      <input id="secDesc" class="field" placeholder="Description (optional)" autocomplete="off" />
      <div class="divider"></div>
      <div class="small">Tip: press <span class="kbd">Enter</span> to create. Hold <span class="kbd">Alt</span> while creating to open immediately (desktop).</div>

      <div class="divider"></div>
      <div class="toolbar">
        <input id="secSearch" class="field" placeholder="Search sections" value="${escapeHtml(state.sectionsQuery ?? '')}" />
        <select id="secSort" class="field select" aria-label="Sort">
          <option value="recent" ${state.sectionsSort === 'recent' ? 'selected' : ''}>Last edited</option>
          <option value="newest" ${state.sectionsSort === 'newest' ? 'selected' : ''}>Newest</option>
          <option value="title" ${state.sectionsSort === 'title' ? 'selected' : ''}>Title</option>
          <option value="kind" ${state.sectionsSort === 'kind' ? 'selected' : ''}>Type</option>
        </select>
        <span class="badge">${sorted.length}/${sections.length}</span>
      </div>

      <div class="divider"></div>
      <div class="toolbar">
        <button class="btn btnGhost" id="btnExport" type="button">Export JSON</button>
        <label class="btn btnGhost" for="importFile" style="cursor:pointer;">Import JSON</label>
        <input id="importFile" type="file" accept="application/json" style="display:none" />
      </div>

      <div class="divider"></div>
      <div class="small">Everything is stored locally (localStorage). Export/Import is your backup.</div>
    </div>

    <div class="divider"></div>

    ${sections.length === 0 ? `
      <div class="empty">
        <div class="emptyTitle">No sections yet</div>
        <div class="small">Start with a ready-made section, or create a custom one above.</div>
        <div class="divider"></div>
        <div class="row">
          <button class="btn" type="button" data-empty-create="${SECTION_KINDS.NOTES}">${kindIconSvg(SECTION_KINDS.NOTES)} New Notes</button>
          <button class="btn" type="button" data-empty-create="${SECTION_KINDS.CHECKLIST}">${kindIconSvg(SECTION_KINDS.CHECKLIST)} New Checklist</button>
          <button class="btn" type="button" data-empty-create="${SECTION_KINDS.IDEA_VAULT}">${kindIconSvg(SECTION_KINDS.IDEA_VAULT)} New Ideas</button>
        </div>
      </div>
      <div class="divider"></div>
    ` : ''}

    <ul class="list">
      ${sorted
        .map((s) => {
          const when = formatTime(s.updatedAt ?? s.createdAt);
          return /* html */ `
        <li class="item">
          <div>
            <div class="itemTitle">
              <a class="itemLink" href="#/s/${encodeURIComponent(s.id)}">
                <span class="kindIcon">${kindIconSvg(s.kind)}</span>
                ${escapeHtml(s.title || 'Untitled')}
              </a>
            </div>
            <div class="itemMeta">
              <span class="badge">${escapeHtml(kindLabel(s.kind))}</span>
              ${when ? `<span class="badge">Edited ${escapeHtml(when)}</span>` : ''}
            </div>
            ${s.desc ? `<div class="itemNote">${escapeHtml(s.desc)}</div>` : ''}
          </div>
          <div class="toolbar" style="justify-content:flex-end">
            <a class="btn" href="#/s/${encodeURIComponent(s.id)}" style="min-height: var(--tap);">Open</a>
            <button class="iconBtn" type="button" data-edit-sec="${escapeHtml(s.id)}" title="Edit" aria-label="Edit">${iconSvg('edit')}</button>
            <button class="iconBtn" type="button" data-del-sec="${escapeHtml(s.id)}" title="Delete" aria-label="Delete">${iconSvg('trash')}</button>
          </div>
        </li>
      `;
        })
        .join('')}
    </ul>

    ${sorted.length === 0 && sections.length > 0 ? `
      <div class="divider"></div>
      <div class="empty">
        <div class="emptyTitle">No results</div>
        <div class="small">Try a different search, or press <span class="kbd">Esc</span> to clear.</div>
      </div>
    ` : ''}
  `;
}

export function bindSectionsHandlers({ root, state, onState }) {
  const title = root.querySelector('#secTitle');
  const desc = root.querySelector('#secDesc');
  const kind = root.querySelector('#secKind');
  const addBtn = root.querySelector('#secAdd');
  const search = root.querySelector('#secSearch');
  const sort = root.querySelector('#secSort');
  const file = root.querySelector('#importFile');

  const setListState = (patch) => onState({ ...state, ...patch });

  const syncCreateEnabled = () => {
    const ok = Boolean((title?.value ?? '').trim());
    if (addBtn) addBtn.disabled = !ok;
  };

  title?.addEventListener('input', syncCreateEnabled);
  syncCreateEnabled();

  search?.addEventListener('input', (e) => setListState({ sectionsQuery: e.target.value }));
  search?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setListState({ sectionsQuery: '' });
      // keep focus for quick retry
      search.value = '';
    }
  });

  sort?.addEventListener('change', (e) => setListState({ sectionsSort: e.target.value }));

  const add = () => {
    const t = (title?.value ?? '').trim();
    if (!t) {
      title?.focus({ preventScroll: true });
      return;
    }

    const k = kind?.value ?? SECTION_KINDS.IDEA_VAULT;
    const d = (desc?.value ?? '').trim();

    const { next, created } = createSection({ title: t, kind: k, desc: d }, state.sections);

    if (title) title.value = '';
    if (desc) desc.value = '';
    syncCreateEnabled();
    title?.focus({ preventScroll: true });

    onState({ ...state, sections: next });

    // Optional: open the created section immediately when user holds Alt (desktop power-user)
    // Avoid auto-navigation on mobile.
    // eslint-disable-next-line no-undef
    if (window.event?.altKey) {
      window.location.hash = `#/s/${encodeURIComponent(created.id)}`;
    }
  };

  addBtn?.addEventListener('click', add);
  title?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') add();
  });

  desc?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') add();
  });

  // Empty-state quick create
  root.querySelectorAll('[data-empty-create]')?.forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.getAttribute('data-empty-create') || SECTION_KINDS.NOTES;
      const t = k === SECTION_KINDS.CHECKLIST ? 'New Checklist' : k === SECTION_KINDS.NOTES ? 'New Notes' : 'New Ideas';

      const { next, created } = createSection({ title: t, kind: k, desc: '' }, state.sections);
      onState({ ...state, sections: next });
      window.location.hash = `#/s/${encodeURIComponent(created.id)}`;
    });
  });

  root.querySelectorAll('[data-edit-sec]')?.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-edit-sec');
      const current = (state.sections ?? []).find((s) => s.id === id);
      if (!current) return;

      const res = await editSectionDialog({
        title: 'Edit section',
        initialTitle: current.title,
        initialDesc: current.desc,
      });
      if (!res || !res.title) return;

      const next = updateSectionMeta(id, { title: res.title, desc: res.desc }, state.sections);
      onState({ ...state, sections: next });
    });
  });

  root.querySelectorAll('[data-del-sec]')?.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-del-sec');
      const current = (state.sections ?? []).find((s) => s.id === id);
      if (!current) return;

      const data = loadSectionData(current.id, current.kind);
      const hasData = (() => {
        if (!data) return false;
        if (typeof data.text === 'string') return data.text.trim().length > 0;
        if (Array.isArray(data.items)) return data.items.length > 0;
        return Object.keys(data).length > 0;
      })();

      const displayTitle = String(current.title || 'Untitled');

      const ok = await confirmDialog({
        title: `Delete “${displayTitle}”?`,
        message: hasData
          ? `This will delete the section and its local content on this device. Type the section title to confirm.`
          : 'This will delete the empty section on this device.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        tone: 'danger',
        requireText: hasData ? displayTitle : null,
        requirePlaceholder: hasData ? displayTitle : 'Type to confirm…',
      });
      if (!ok) return;

      deleteSectionData(current.id, current.kind);
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

    const res = await importAllFromFile(f);
    if (res.ok) {
      onState({ ...state, sections: res.sections });
    }

    // allow importing the same file again
    file.value = '';
  });
}
