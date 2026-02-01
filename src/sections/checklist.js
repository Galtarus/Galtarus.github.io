import { escapeHtml } from '../lib/dom.js';
import { uid } from '../lib/id.js';
import { confirmDialog } from '../lib/dialogs.js';
import { iconSvg } from '../components/icons.js';
import { loadSectionData, saveSectionData } from '../stores/sectionDataStore.js';
import { touchSection } from '../stores/sectionsStore.js';

function normalizeItems(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((it) => it && typeof it === 'object')
    .map((it) => ({
      id: String(it.id || uid('ck')),
      text: String(it.text || ''),
      done: Boolean(it.done),
      createdAt: Number.isFinite(it.createdAt) ? it.createdAt : Date.now(),
    }));
}

export function initChecklistState(state, { section }) {
  const saved = loadSectionData(section.id, section.kind);
  const items = normalizeItems(saved?.items);

  return {
    ...state,
    __section: section,
    __view: {
      ...(state.__view ?? {}),
      [section.id]: {
        query: String(state.__view?.[section.id]?.query ?? ''),
        sort: String(state.__view?.[section.id]?.sort ?? 'todoFirst'),
      },
    },
    __data: {
      ...(state.__data ?? {}),
      [section.id]: {
        items,
      },
    },
  };
}

function getView(state, sid) {
  return state.__view?.[sid] ?? { query: '', sort: 'todoFirst' };
}

function getItems(state, sid) {
  return state.__data?.[sid]?.items ?? [];
}

function applySort(items, sort) {
  const arr = [...items];
  if (sort === 'created') arr.sort((a, b) => b.createdAt - a.createdAt);
  else if (sort === 'text') arr.sort((a, b) => String(a.text).localeCompare(String(b.text)));
  else {
    // todoFirst
    arr.sort((a, b) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt);
  }
  return arr;
}

export function ChecklistPage(state) {
  const section = state.__section;
  const sid = section.id;
  const view = getView(state, sid);

  const items = getItems(state, sid);
  const q = view.query.trim().toLowerCase();
  const filtered = q ? items.filter((it) => String(it.text).toLowerCase().includes(q)) : items;
  const sorted = applySort(filtered, view.sort);

  const newId = `ckNew_${sid}`;
  const searchId = `ckSearch_${sid}`;
  const sortId = `ckSort_${sid}`;

  const doneCount = items.filter((it) => it.done).length;

  return /* html */ `
    <div class="pageHeader">
      <div>
        <div class="h1">${escapeHtml(section.title || 'Checklist')}</div>
        <div class="small">${doneCount}/${items.length} done</div>
      </div>
      <a class="btn btnGhost" href="#/sections">${iconSvg('arrowLeft')} Sections</a>
    </div>

    <div class="panel">
      <div class="toolbar">
        <input id="${searchId}" class="field" placeholder="Search" value="${escapeHtml(view.query)}" />
        <select id="${sortId}" class="field select" aria-label="Sort">
          <option value="todoFirst" ${view.sort === 'todoFirst' ? 'selected' : ''}>Todo first</option>
          <option value="created" ${view.sort === 'created' ? 'selected' : ''}>Newest</option>
          <option value="text" ${view.sort === 'text' ? 'selected' : ''}>Text</option>
        </select>
        <span class="badge">${sorted.length}/${items.length}</span>
      </div>

      <div class="divider"></div>
      <div class="toolbar">
        <input id="${newId}" class="field" placeholder="New item" autocomplete="off" />
        <button class="btn" data-action="ck:add" type="button">${iconSvg('plus')} Add</button>
      </div>
    </div>

    <div class="divider"></div>

    <ul class="list">
      ${sorted
        .map(
          (it) => /* html */ `
        <li class="item">
          <label class="ckRow">
            <input type="checkbox" data-ck-toggle="${escapeHtml(it.id)}" ${it.done ? 'checked' : ''} />
            <span class="ckText ${it.done ? 'ckDone' : ''}">${escapeHtml(it.text || '')}</span>
          </label>
          <button class="iconBtn" type="button" data-del="${escapeHtml(it.id)}" title="Delete" aria-label="Delete">${iconSvg('trash')}</button>
        </li>
      `
        )
        .join('')}
    </ul>

    ${items.length === 0 ? `<div class="divider"></div><div class="empty"><div class="emptyTitle">No items yet</div><div class="small">Add your first checklist item above.</div></div>` : ''}
    ${sorted.length === 0 && items.length > 0 ? `<div class="divider"></div><div class="small">No results.</div>` : ''}
  `;
}

export function bindChecklistHandlers({ root, state, onState }) {
  const section = state.__section;
  const sid = section.id;

  const field = root.querySelector(`#ckNew_${CSS.escape(sid)}`);
  const search = root.querySelector(`#ckSearch_${CSS.escape(sid)}`);
  const sort = root.querySelector(`#ckSort_${CSS.escape(sid)}`);

  const setView = (patch) => {
    const prev = getView(state, sid);
    onState({
      ...state,
      __view: { ...(state.__view ?? {}), [sid]: { ...prev, ...patch } },
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

  const add = () => {
    const t = (field?.value ?? '').trim();
    if (!t) {
      field?.focus({ preventScroll: true });
      return;
    }

    persist([{ id: uid('ck'), text: t, done: false, createdAt: Date.now() }, ...getItems(state, sid)]);
    if (field) field.value = '';
    field?.focus({ preventScroll: true });
  };

  root.querySelector('[data-action="ck:add"]')?.addEventListener('click', add);
  field?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') add();
  });

  root.querySelectorAll('[data-ck-toggle]')?.forEach((el) => {
    el.addEventListener('change', () => {
      const id = el.getAttribute('data-ck-toggle');
      const next = getItems(state, sid).map((it) => (it.id === id ? { ...it, done: el.checked } : it));
      persist(next);
    });
  });

  root.querySelectorAll('[data-del]')?.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-del');
      const ok = await confirmDialog({
        title: 'Delete item?',
        message: 'This cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        tone: 'danger',
      });
      if (!ok) return;
      persist(getItems(state, sid).filter((it) => it.id !== id));
    });
  });
}
