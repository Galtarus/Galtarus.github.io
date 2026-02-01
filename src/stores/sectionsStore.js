import { loadJson, saveJson } from '../lib/storage.js';
import { uid } from '../lib/id.js';

const KEY = 'galtarus.sections.v2';

export const SECTION_KINDS = {
  IDEA_VAULT: 'ideaVault',
  CHECKLIST: 'checklist',
  NOTES: 'notes',
};

const DEFAULT_SECTIONS = [
  {
    id: 'starwars',
    kind: SECTION_KINDS.IDEA_VAULT,
    title: 'Star Wars — Pitch Vault',
    desc: 'Idées de films, twists, scènes, thèmes.',
    createdAt: Date.now(),
  },
];

export function normalizeSections(list) {
  if (!Array.isArray(list)) return null;
  return list
    .filter((s) => s && typeof s === 'object')
    .map((s) => ({
      id: String(s.id || '').trim() || uid('sec'),
      kind: String(s.kind || SECTION_KINDS.IDEA_VAULT),
      title: String(s.title || 'Untitled'),
      desc: String(s.desc || ''),
      createdAt: Number.isFinite(s.createdAt) ? s.createdAt : Date.now(),
    }));
}

export function loadSections() {
  // v2 first
  const v2 = normalizeSections(loadJson(KEY));
  if (v2?.length) return v2;

  // migrate v1 if present
  const v1 = normalizeSections(loadJson('galtarus.sections.v1'));
  if (v1?.length) {
    saveSections(v1);
    return v1;
  }

  return DEFAULT_SECTIONS;
}

export function saveSections(list) {
  saveJson(KEY, list);
}

export function addSection({ title, kind, desc = '' }, prev) {
  const next = [
    {
      id: uid('sec'),
      kind,
      title,
      desc,
      createdAt: Date.now(),
    },
    ...(prev ?? []),
  ];
  saveSections(next);
  return next;
}

export function deleteSection(id, prev) {
  const next = (prev ?? []).filter((s) => s.id !== id);
  saveSections(next);
  return next;
}

export function getSectionById(sections, id) {
  return (sections ?? []).find((s) => s.id === id) ?? null;
}
