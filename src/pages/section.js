import { escapeHtml } from '../lib/dom.js';
import { loadSections, getSectionById } from '../stores/sectionsStore.js';
import { SECTION_KINDS } from '../stores/sectionsStore.js';

import { initIdeaVaultState, IdeaVaultPage, bindIdeaVaultHandlers } from '../sections/ideaVault.js';
import { initChecklistState, ChecklistPage, bindChecklistHandlers } from '../sections/checklist.js';
import { initNotesState, NotesPage, bindNotesHandlers } from '../sections/notes.js';

export function initSectionState(state, { sectionId }) {
  const sections = loadSections();
  const section = getSectionById(sections, sectionId);

  if (!section) {
    return { ...state, __section: null, sections };
  }

  // ensure global sections present (for navigation/export)
  const base = { ...state, sections, __section: section };

  if (section.kind === SECTION_KINDS.CHECKLIST) return initChecklistState(base, { section });
  if (section.kind === SECTION_KINDS.NOTES) return initNotesState(base, { section });
  return initIdeaVaultState(base, { section });
}

export function SectionPage(state) {
  const section = state.__section;

  if (!section) {
    return /* html */ `
      <h1 class="h1">Section introuvable</h1>
      <p class="p">Cette section n'existe pas (ou a été supprimée).</p>
      <a class="btn" href="#/sections">Retour aux sections</a>
    `;
  }

  if (section.kind === SECTION_KINDS.CHECKLIST) return ChecklistPage(state);
  if (section.kind === SECTION_KINDS.NOTES) return NotesPage(state);
  return IdeaVaultPage(state);
}

export function bindSectionHandlers(ctx) {
  const section = ctx.state.__section;
  if (!section) return;

  if (section.kind === SECTION_KINDS.CHECKLIST) return bindChecklistHandlers(ctx);
  if (section.kind === SECTION_KINDS.NOTES) return bindNotesHandlers(ctx);
  return bindIdeaVaultHandlers(ctx);
}

export function SectionTitle(state) {
  const section = state.__section;
  if (!section) return 'Section';

  if (section.kind === SECTION_KINDS.CHECKLIST) return `Checklist • ${escapeHtml(section.title)}`;
  if (section.kind === SECTION_KINDS.NOTES) return `Notes • ${escapeHtml(section.title)}`;
  return `Idea Vault • ${escapeHtml(section.title)}`;
}
