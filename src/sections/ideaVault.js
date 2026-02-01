import { escapeHtml } from '../lib/dom.js';
import { uid } from '../lib/id.js';
import { confirmDialog, editSectionDialog } from '../lib/dialogs.js';
import { iconSvg } from '../components/icons.js';
import { loadSectionData, saveSectionData } from '../stores/sectionDataStore.js';
import { deleteSectionData } from '../stores/sectionDataStore.js';
import { touchSection, updateSectionMeta, deleteSection, getSectionById } from '../stores/sectionsStore.js';

const SEED = [
  {
    id: 'seed_jedi_protocol',
    title: 'The Jedi are a protocol, not a religion',
    note:
      'An open-source Jedi school: multiple interpretations of the Code, public debates, and a "Council" that looks more like peer review than aristocracy.',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: 'seed_detective',
    title: 'Star Wars as a detective thriller',
    note: 'No super-weapon. An impossible murder on a neutral station. A detective droid + a former Inquisitor on the run.',
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
      <div class="toolbar" style="justify-content:flex-end">
        <button class="iconBtn" type="button" data-action="section:edit" title="Edit section" aria-label="Edit section">${iconSvg('edit')}</button>
        <button class="iconBtn" type="button" data-action="section:delete" title="Delete section" aria-label="Delete section">${iconSvg('trash')}</button>
        <a class="btn btnGhost" href="#/sections">${iconSvg('arrowLeft')} Sections</a>
      </div>
    </div>

    <div class="panel">
      <div class="toolbar">
        <input id="${searchId}" class="field" placeholder="Search" value="${escapeHtml(view.query)}" />
        <select id="${sortId}" class="field select" aria-label="Sort">
          <option value="newest" ${view.sort === 'newest' ? 'selected' : ''}>Newest</option>
          <option value="oldest" ${view.sort === 'oldest' ? 'selected' : ''}>Oldest</option>
          <option value="title" ${view.sort === 'title' ? 'selected' : ''}>Title</option>
        </select>
        <span class="badge">${sorted.length}/${items.length}</span>
      </div>

      <div class="divider"></div>
      <input id="${titleId}" class="field" placeholder="Title" autocomplete="off" />
      <div class="divider"></div>
      <textarea id="${noteId}" class="field textarea" rows="3" placeholder="Note (pitch, twist, scene, etc.)"></textarea>

      <div class="divider"></div>
      <div class="toolbar">
        <button class="btn" data-action="idea:add" type="button">${iconSvg('plus')} Add</button>
        <button class="btn btnGhost" data-action="idea:seed" type="button">${iconSvg('spark')} Seed</button>
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
          <button class="iconBtn" type="button" data-del="${escapeHtml(it.id)}" title="Delete" aria-label="Delete">${iconSvg('trash')}</button>
        </li>
      `
        )
        .join('')}
    </ul>

    ${items.length === 0 ? `<div class="divider"></div><div class="empty"><div class="emptyTitle">No ideas yet</div><div class="small">Add your first idea above (or use Seed).</div></div>` : ''}
    ${sorted.length === 0 && items.length > 0 ? `<div class="divider"></div><div class="small">No results.</div>` : ''}
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
    const nextSections = touchSection(sid, state.sections);
    onState({
      ...state,
      sections: nextSections,
      __data: { ...(state.__data ?? {}), [sid]: { items: nextItems } },
    });
  };

  root.querySelector('[data-action="section:edit"]')?.addEventListener('click', async () => {
    const res = await editSectionDialog({
      title: 'Edit section',
      initialTitle: section.title,
      initialDesc: section.desc,
    });
    if (!res || !res.title) return;

    const nextSections = updateSectionMeta(sid, { title: res.title, desc: res.desc }, state.sections);
    const nextSection = getSectionById(nextSections, sid);
    onState({ ...state, sections: nextSections, __section: nextSection ?? section });
  });

  root.querySelector('[data-action="section:delete"]')?.addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Delete section?',
      message: `This will delete “${section.title}” and its local data on this device.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      tone: 'danger',
      requireText: 'DELETE',
      requirePlaceholder: 'DELETE',
    });
    if (!ok) return;

    deleteSectionData(section.id, section.kind);
    const nextSections = deleteSection(section.id, state.sections);
    onState({ ...state, sections: nextSections, __section: null });
    window.location.hash = '#/sections';
  });

  const add = () => {
    const t = (title?.value ?? '').trim();
    const n = (note?.value ?? '').trim();
    if (!t) {
      title?.focus({ preventScroll: true });
      return;
    }

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
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-del');
      const ok = await confirmDialog({
        title: 'Delete idea?',
        message: 'This cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        tone: 'danger',
      });
      if (!ok) return;

      const nextItems = getItems(state, sid).filter((it) => it.id !== id);
      persist(nextItems);
    });
  });
}
