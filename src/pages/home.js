import { escapeHtml } from '../lib/dom.js';

function kindLabel(kind) {
  if (kind === 'ideaVault') return 'Idea Vault';
  if (kind === 'checklist') return 'Checklist';
  if (kind === 'notes') return 'Notes';
  return kind || 'Section';
}

export function HomePage(state) {
  const sections = Array.isArray(state?.sections) ? state.sections : [];

  return /* html */ `
    <div class="pageHeader">
      <div>
        <h1 class="h1" style="margin:0 0 6px">Hub</h1>
        <div class="small">Tes sections et ton contenu, au même endroit.</div>
      </div>
      <a class="btn btnGhost" href="#/search">Search</a>
    </div>

    <div class="panel">
      <div class="toolbar">
        <a class="btn" href="#/sections">Gérer / Ajouter</a>
      </div>
    </div>

    <div class="divider"></div>

    <ul class="list">
      ${sections
        .map(
          (s) => /* html */ `
        <li class="item">
          <div>
            <div class="itemTitle">${escapeHtml(s.title || 'Untitled')}</div>
            <div class="itemNote">${escapeHtml(kindLabel(s.kind))}</div>
          </div>
          <a class="btn" href="#/s/${encodeURIComponent(s.id)}">Open</a>
        </li>
      `
        )
        .join('')}
    </ul>

    ${sections.length === 0 ? `<div class="small">Aucune section. Va sur “Gérer / Ajouter”.</div>` : ''}
  `;
}
