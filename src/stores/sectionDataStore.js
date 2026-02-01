import { loadJson, saveJson } from '../lib/storage.js';

const VERSION = 1;

export function sectionKey(sectionId, kind) {
  return `galtarus.section.${encodeURIComponent(sectionId)}.${kind}.v${VERSION}`;
}

export function loadSectionData(sectionId, kind) {
  return loadJson(sectionKey(sectionId, kind));
}

export function saveSectionData(sectionId, kind, data) {
  saveJson(sectionKey(sectionId, kind), data);
}

export function deleteSectionData(sectionId, kind) {
  localStorage.removeItem(sectionKey(sectionId, kind));
}
