import { escapeHtml } from '../lib/dom.js';

export function LabPage(state) {
  const value = state?.labText ?? '';

  return /* html */ `
    <h1 class="h1">Lab</h1>
    <p class="p">Petit bac à sable: tape un texte et il apparaît en dessous.</p>

    <div class="card" style="padding:14px; border-radius: 12px;">
      <label class="small" for="labInput">Ton texte</label>
      <div style="height:8px"></div>
      <input id="labInput" value="${escapeHtml(value)}" placeholder="Écris ici…" 
        style="width:100%; padding:10px 12px; border-radius: 12px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);" />
      <div style="height:12px"></div>
      <div class="small">Aperçu:</div>
      <div style="margin-top:6px; padding:10px 12px; border-radius: 12px; border: 1px solid var(--border); background: rgba(255,255,255,0.04);">
        ${escapeHtml(value) || '<span class="small">(vide)</span>'}
      </div>
    </div>
  `;
}

export function bindLabHandlers({ root, state, onState }) {
  const input = root.querySelector('#labInput');
  if (!input) return;

  input.addEventListener('input', (e) => {
    onState({ ...state, labText: e.target.value });
  });
}
