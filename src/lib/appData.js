import { downloadJson, safeParseJson, readFileText } from './storage.js';
import { uid } from './id.js';
import {
  loadSections,
  saveSections,
  normalizeSections,
} from '../stores/sectionsStore.js';
import {
  loadSectionData,
  saveSectionData,
  deleteSectionData,
} from '../stores/sectionDataStore.js';

// Centralized backup/restore + reset helpers.

export function exportAll(sections = null) {
  const list = Array.isArray(sections) ? sections : loadSections();

  const payload = {
    app: 'galtarus',
    version: 2,
    exportedAt: new Date().toISOString(),
    sections: list,
    data: {},
  };

  for (const s of list) {
    payload.data[s.id] = {
      kind: s.kind,
      data: loadSectionData(s.id, s.kind) ?? null,
    };
  }

  downloadJson(`galtarus-export-${new Date().toISOString().slice(0, 10)}.json`, payload);
}

function validateImportPayload(parsed) {
  if (!parsed || typeof parsed !== 'object') return { ok: false, reason: 'invalid_json' };
  if (parsed.app !== 'galtarus') return { ok: false, reason: 'wrong_app' };
  if (!Array.isArray(parsed.sections)) return { ok: false, reason: 'missing_sections' };
  return { ok: true };
}

/**
 * Import a full backup.
 *
 * modes:
 * - replace: clears existing galtarus.* keys, then restores exactly what's in the file.
 * - merge (default): appends imported sections; never overwrites existing sections/data.
 *   If an imported section id already exists, it is remapped to a new id (safe merge).
 */
export function importAll(rawText, { mode = 'merge' } = {}) {
  const parsed = safeParseJson(rawText);
  const v = validateImportPayload(parsed);
  if (!v.ok) return { ok: false, reason: v.reason };

  const imported = normalizeSections(parsed.sections);
  if (!imported?.length) return { ok: false, reason: 'no_sections' };

  const data = parsed.data && typeof parsed.data === 'object' ? parsed.data : {};
  const warnings = [];

  if (mode === 'replace') {
    resetAllData({ keepDemo: false });
    saveSections(imported);

    let dataImported = 0;
    for (const s of imported) {
      const entry = data[s.id];
      if (entry && entry.kind === s.kind && entry.data != null) {
        saveSectionData(s.id, s.kind, entry.data);
        dataImported++;
      }
    }

    return {
      ok: true,
      mode,
      sections: imported,
      summary: {
        sectionsImported: imported.length,
        sectionsRemapped: 0,
        sectionsSkipped: 0,
        dataImported,
        dataSkipped: imported.length - dataImported,
      },
      warnings,
    };
  }

  // merge mode
  const existing = loadSections();
  const existingIds = new Set(existing.map((s) => s.id));

  const merged = [...existing];

  let remapped = 0;
  let skippedData = 0;
  let importedData = 0;

  for (const s0 of imported) {
    let s = s0;

    if (existingIds.has(s.id)) {
      // safest behavior: do NOT overwrite existing. Instead, remap the imported section.
      const newId = uid('sec');
      s = { ...s, id: newId, title: `${s.title} (import)` };
      remapped++;
    }

    existingIds.add(s.id);
    merged.push(s);

    const entry = data[s0.id];
    if (entry && entry.kind === s.kind && entry.data != null) {
      const already = loadSectionData(s.id, s.kind);
      if (already != null) {
        skippedData++;
        warnings.push(`Skipped data for section “${s.title}” (already exists).`);
      } else {
        saveSectionData(s.id, s.kind, entry.data);
        importedData++;
      }
    } else {
      skippedData++;
    }
  }

  saveSections(merged);

  return {
    ok: true,
    mode,
    sections: merged,
    summary: {
      sectionsImported: imported.length,
      sectionsRemapped: remapped,
      sectionsSkipped: 0,
      dataImported: importedData,
      dataSkipped: skippedData,
    },
    warnings,
  };
}

export async function importAllFromFile(file, opts) {
  const text = await readFileText(file);
  return importAll(text, opts);
}

export function resetAllData({ keepDemo = false } = {}) {
  // Remove all keys for this app.
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('galtarus.')) keys.push(k);
  }

  for (const k of keys) localStorage.removeItem(k);

  if (keepDemo) {
    // Reinitialize with default sections by reading then saving.
    const sections = loadSections();
    saveSections(sections);
  }
}

export function deleteSectionEverywhere(section) {
  if (!section) return;
  deleteSectionData(section.id, section.kind);
}
