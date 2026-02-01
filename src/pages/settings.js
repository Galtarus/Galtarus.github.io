import { confirmDialog } from '../lib/dialogs.js';
import { exportAll, importAllFromFile, resetAllData } from '../lib/appData.js';
import { iconSvg } from '../components/icons.js';
import { loadSections } from '../stores/sectionsStore.js';

export function initSettingsState(state) {
  return {
    ...state,
    sections: Array.isArray(state.sections) ? state.sections : loadSections(),
  };
}

export function SettingsPage(state) {
  const sections = Array.isArray(state.sections) ? state.sections : loadSections();

  return /* html */ `
    <div class="pageHeader">
      <div>
        <h1 class="h1" style="margin:0 0 6px">Settings</h1>
        <div class="small">Offline-first. Your data stays in this browser unless you export it.</div>
      </div>
      <a class="btn btnGhost" href="#/sections">${iconSvg('grid')} Sections</a>
    </div>

    <div class="panel">
      <div class="itemTitle" style="margin-bottom:6px">Backup & restore</div>
      <div class="small">Export a JSON backup before switching device/browser or clearing site data.</div>

      <div class="divider"></div>
      <div class="toolbar">
        <button class="btn" id="settingsExport" type="button">Export JSON</button>
        <label class="btn btnGhost" for="settingsImport" style="cursor:pointer;">Import JSON</label>
        <input id="settingsImport" type="file" accept="application/json" style="display:none" />
        <span class="badge">${sections.length} sections</span>
      </div>
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

  const file = root.querySelector('#settingsImport');
  file?.addEventListener('change', async () => {
    const f = file.files?.[0];
    if (!f) return;

    const res = await importAllFromFile(f);
    if (res.ok) {
      onState({ ...state, sections: res.sections });
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
    onState({ ...state, sections: [] });
    window.location.hash = '#/sections';
  });
}
