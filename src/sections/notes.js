import { escapeHtml } from '../lib/dom.js';
import { iconSvg } from '../components/icons.js';
import { loadSectionData, saveSectionData } from '../stores/sectionDataStore.js';
import { touchSection } from '../stores/sectionsStore.js';

export function initNotesState(state, { section }) {
  const saved = loadSectionData(section.id, section.kind);
  const text = typeof saved?.text === 'string' ? saved.text : '';

  return {
    ...state,
    __section: section,
    __data: {
      ...(state.__data ?? {}),
      [section.id]: { text },
    },
    __view: {
      ...(state.__view ?? {}),
      [section.id]: {
        query: String(state.__view?.[section.id]?.query ?? ''),
      },
    },
  };
}

function getView(state, sid) {
  return state.__view?.[sid] ?? { query: '' };
}

function getText(state, sid) {
  return String(state.__data?.[sid]?.text ?? '');
}

export function NotesPage(state) {
  const section = state.__section;
  const sid = section.id;
  const view = getView(state, sid);

  const text = getText(state, sid);
  const q = view.query.trim().toLowerCase();

  const matches = q ? text.toLowerCase().includes(q) : null;
  const noteId = `notesText_${sid}`;
  const searchId = `notesSearch_${sid}`;

  return /* html */ `
    <div class="pageHeader">
      <div>
        <div class="h1">${escapeHtml(section.title || 'Notes')}</div>
        <div class="small">Offline notes - autosave</div>
      </div>
      <a class="btn btnGhost" href="#/sections">${iconSvg('arrowLeft')} Sections</a>
    </div>

    <div class="panel">
      <div class="toolbar">
        <input id="${searchId}" class="field" placeholder="Search in note" value="${escapeHtml(view.query)}" />
        <span class="badge">${matches === null ? '—' : matches ? 'match' : 'no match'}</span>
      </div>
      <div class="divider"></div>
      <textarea id="${noteId}" class="field textarea notesArea" rows="12" placeholder="Write here...">${escapeHtml(text)}</textarea>
      <div class="divider"></div>
      <div class="small">Tip: focus is preserved on mobile (the keyboard should not close on each keystroke).</div>
    </div>
  `;
}

export function bindNotesHandlers({ root, state, onState }) {
  const section = state.__section;
  const sid = section.id;

  const textarea = root.querySelector(`#notesText_${CSS.escape(sid)}`);
  const search = root.querySelector(`#notesSearch_${CSS.escape(sid)}`);

  const setView = (patch) => {
    const prev = getView(state, sid);
    onState({
      ...state,
      __view: { ...(state.__view ?? {}), [sid]: { ...prev, ...patch } },
    });
  };

  search?.addEventListener('input', (e) => setView({ query: e.target.value }));

  let saveTimer = null;
  textarea?.addEventListener('input', () => {
    const text = textarea.value;

    // update state without forcing re-focus to another element
    onState({
      ...state,
      __data: { ...(state.__data ?? {}), [sid]: { text } },
    });

    // debounce persistence
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveSectionData(sid, section.kind, { text, updatedAt: Date.now() });
      const nextSections = touchSection(sid, state.sections);
      onState({
        ...state,
        sections: nextSections,
        __data: { ...(state.__data ?? {}), [sid]: { text } },
      });
      saveTimer = null;
    }, 250);
  });
}
