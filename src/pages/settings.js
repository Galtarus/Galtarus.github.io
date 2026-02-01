import { escapeHtml } from '../lib/dom.js';
import { confirmDialog } from '../lib/dialogs.js';
import { exportAll, importAllFromFile, resetAllData } from '../lib/appData.js';
import { iconSvg } from '../components/icons.js';
import { loadSections } from '../stores/sectionsStore.js';

export function initSettingsState(state) {
  return {
    ...state,
    sections: Array.isArray(state.sections) ? state.sections : loadSections(),
    importMode: state.importMode === 'replace' ? 'replace' : 'merge',
    importStatus: state.importStatus ?? null, // { tone: 'ok'|'warn'|'danger', message: string }
  };
}

function statusHtml(status) {
  if (!status) return '';
  const toneClass = status.tone === 'danger' ? 'badgeDanger' : status.tone === 'warn' ? 'badgeWarn' : 'badgeOk';
  return /* html */ `
    <div class="divider"></div>
    <div class="toolbar" style="justify-content:space-between; align-items:flex-start">
      <span class="badge ${toneClass}">Import</span>
      <div class="small" style="flex:1; margin-left:10px">${escapeHtml(status.message)}</div>
    </div>
  `;
}

export function SettingsPage(state) {
  const sections = Array.isArray(state.sections) ? state.sections : loadSections();
  const mode = state.importMode === 'replace' ? 'replace' : 'merge';

  return /* html */ `
    <div class="pageHeader">
      <div>
        <h1 class="h1" style="margin:0 0 6px">Settings</h1>
        <div class="small">Offline-first. Your data stays in this browser unless you export it.</div>
      </div>
      <div class="toolbar" style="justify-content:flex-end">
        <a class="btn btnGhost" href="#/sections">${iconSvg('grid')} Sections</a>
        <a class="btn btnGhost" href="#/">${iconSvg('home')} Hub</a>
      </div>
    </div>

    <div class="panel">
      <div class="itemTitle" style="margin-bottom:6px">Backup & restore</div>
      <div class="small">Export a JSON backup before switching device/browser or clearing site data.</div>

      ${sections.length === 0 ? `
        <div class="divider"></div>
        <div class="empty" style="padding:10px 0">
          <div class="emptyTitle">No sections yet</div>
          <div class="small">Create a section first, then export a backup here.</div>
          <div class="divider"></div>
          <a class="btn" href="#/sections">${iconSvg('grid')} Go to sections</a>
        </div>
      ` : ''}

      <div class="divider"></div>
      <div class="toolbar">
        <button class="btn" id="settingsExport" type="button">Export JSON</button>
        <label class="btn btnGhost" for="settingsImport" style="cursor:pointer;">Import JSON</label>
        <input id="settingsImport" type="file" accept="application/json" style="display:none" />
        <span class="badge">${sections.length} sections</span>
      </div>

      <div class="divider"></div>
      <label class="small" style="display:flex; gap:10px; align-items:center; cursor:pointer; user-select:none;">
        <input id="settingsImportReplace" type="checkbox" ${mode === 'replace' ? 'checked' : ''} />
        <span><b>Replace existing data</b> (clears current local data before importing)</span>
      </label>
      <div class="small" style="margin-top:6px">Default is <b>Merge</b>: it imports without overwriting existing sections, and safely remaps conflicting IDs.</div>

      ${statusHtml(state.importStatus)}
    </div>

    <div class="divider"></div>

    <div class="panel">
      <div class="itemTitle" style="margin-bottom:6px">Danger zone</div>
      <div class="small">This removes all sections + section data from localStorage on this device.</div>

      <div class="divider"></div>
      <div class="toolbar">
        <button class="btn btnDanger" id="settingsReset" type="button">Reset all data</button>
      </div>
    </div>
  `;
}

export function bindSettingsHandlers({ root, state, onState }) {
  root.querySelector('#settingsExport')?.addEventListener('click', () => {
    exportAll(state.sections ?? loadSections());
  });

  root.querySelector('#settingsImportReplace')?.addEventListener('change', (e) => {
    onState({ ...state, importMode: e.target.checked ? 'replace' : 'merge' });
  });

  const file = root.querySelector('#settingsImport');
  file?.addEventListener('change', async () => {
    const f = file.files?.[0];
    if (!f) return;

    const mode = state.importMode === 'replace' ? 'replace' : 'merge';
    const res = await importAllFromFile(f, { mode });

    if (res.ok) {
      const s = res.summary;
      const msg = mode === 'replace'
        ? `Replaced local data. Imported ${s.sectionsImported} sections (${s.dataImported} with data).`
        : `Merged ${s.sectionsImported} sections (${s.dataImported} with data).${s.sectionsRemapped ? ` Remapped ${s.sectionsRemapped} conflicting IDs.` : ''}`;

      onState({
        ...state,
        sections: res.sections,
        importStatus: {
          tone: res.warnings?.length ? 'warn' : 'ok',
          message: res.warnings?.length ? `${msg} ${res.warnings[0]}` : msg,
        },
      });
    } else {
      const message =
        res.reason === 'invalid_json' ? 'Could not parse JSON.'
          : res.reason === 'wrong_app' ? 'This file does not look like a Galtarus export.'
            : res.reason === 'missing_sections' ? 'Invalid export: missing “sections”.'
              : res.reason === 'no_sections' ? 'Import file contains no sections.'
                : 'Import failed.';

      onState({
        ...state,
        importStatus: { tone: 'danger', message },
      });
    }

    file.value = '';
  });

  root.querySelector('#settingsReset')?.addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Reset all data?',
      message:
        'This will permanently remove all your sections and their content from this browser. Export a backup first if you care about this data.',
      confirmText: 'Reset',
      cancelText: 'Cancel',
      tone: 'danger',
      requireText: 'RESET',
      requirePlaceholder: 'RESET',
    });
    if (!ok) return;

    resetAllData({ keepDemo: false });
    onState({ ...state, sections: [], importStatus: null });
    window.location.hash = '#/sections';
  });
}
