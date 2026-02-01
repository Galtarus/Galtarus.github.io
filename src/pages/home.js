import { escapeHtml } from '../lib/dom.js';
import { iconSvg, kindIconSvg } from '../components/icons.js';
import { createSection, SECTION_KINDS } from '../stores/sectionsStore.js';

function kindLabel(kind) {
  if (kind === SECTION_KINDS.IDEA_VAULT) return 'Idea Vault';
  if (kind === SECTION_KINDS.CHECKLIST) return 'Checklist';
  if (kind === SECTION_KINDS.NOTES) return 'Notes';
  return kind || 'Section';
}

function formatTime(ts) {
  if (!Number.isFinite(ts)) return '';
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function HomePage(state) {
  const sections = Array.isArray(state?.sections) ? state.sections : [];

  const recent = [...sections]
    .sort((a, b) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0))
    .slice(0, 6);

  return /* html */ `
    <div class="pageHeader">
      <div>
        <h1 class="h1" style="margin:0 0 6px">Hub</h1>
        <div class="small">Your offline home for notes, checklists, and idea vaults.</div>
      </div>
      <div class="toolbar" style="justify-content:flex-end">
        <a class="btn btnGhost" href="#/settings">${iconSvg('settings')} Settings</a>
        <a class="btn btnGhost" href="#/search">${iconSvg('search')} Search</a>
      </div>
    </div>

    <div class="panel">
      <div class="toolbar" style="justify-content:space-between; align-items:flex-start">
        <div>
          <div class="itemTitle" style="margin-bottom:6px">Quick actions</div>
          <div class="small">Create a section and start writing immediately.</div>
        </div>
        <a class="btn btnGhost" href="#/sections">${iconSvg('grid')} Manage</a>
      </div>
      <div class="divider"></div>
      <div class="row">
        <button class="btn" type="button" data-quick-create="${SECTION_KINDS.NOTES}">${kindIconSvg(SECTION_KINDS.NOTES)} New Notes</button>
        <button class="btn" type="button" data-quick-create="${SECTION_KINDS.CHECKLIST}">${kindIconSvg(SECTION_KINDS.CHECKLIST)} New Checklist</button>
        <button class="btn" type="button" data-quick-create="${SECTION_KINDS.IDEA_VAULT}">${kindIconSvg(SECTION_KINDS.IDEA_VAULT)} New Idea Vault</button>
      </div>
    </div>

    <div class="divider"></div>

    <div class="panel">
      <div class="toolbar" style="justify-content:space-between">
        <div>
          <div class="itemTitle" style="margin-bottom:6px">Recent</div>
          <div class="small">Jump back into what you edited last.</div>
        </div>
        <a class="btn btnGhost" href="#/sections">All sections</a>
      </div>

      <div class="divider"></div>

      ${sections.length === 0 ? `
        <div class="empty">
          <div class="emptyTitle">No sections yet</div>
          <div class="small">Use the quick actions above to create one.</div>
        </div>
      ` : `
        <ul class="list">
          ${recent
            .map((s) => {
              const when = formatTime(s.updatedAt ?? s.createdAt);
              return /* html */ `
            <li class="item">
              <div>
                <div class="itemTitle"><span class="kindIcon">${kindIconSvg(s.kind)}</span> ${escapeHtml(s.title || 'Untitled')}</div>
                <div class="itemMeta">
                  <span class="badge">${escapeHtml(kindLabel(s.kind))}</span>
                  ${when ? `<span class="badge">${escapeHtml(when)}</span>` : ''}
                </div>
              </div>
              <a class="btn" href="#/s/${encodeURIComponent(s.id)}">Open</a>
            </li>
          `;
            })
            .join('')}
        </ul>
      `}
    </div>
  `;
}

export function bindHomeHandlers({ root, state, onState }) {
  root.querySelectorAll('[data-quick-create]')?.forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.getAttribute('data-quick-create') || SECTION_KINDS.NOTES;
      const title = kind === SECTION_KINDS.CHECKLIST ? 'New Checklist' : kind === SECTION_KINDS.IDEA_VAULT ? 'New Idea Vault' : 'New Notes';

      const { next, created } = createSection({ title, kind, desc: '' }, state.sections);
      onState({ ...state, sections: next });

      // navigate after state sync
      window.location.hash = `#/s/${encodeURIComponent(created.id)}`;
    });
  });
}
