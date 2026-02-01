import { downloadJson, safeParseJson, readFileText } from './storage.js';
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

export function importAll(rawText) {
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

export async function importAllFromFile(file) {
  const text = await readFileText(file);
  return importAll(text);
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
