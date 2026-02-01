// Lightweight dialog helpers (CSP-safe, no external deps)

import { escapeHtml } from './dom.js';

function ensureDialog() {
  let dlg = document.getElementById('appDialog');
  if (dlg) return dlg;

  // Fallback if Layout hasn't rendered yet
  dlg = document.createElement('dialog');
  dlg.id = 'appDialog';
  dlg.className = 'dialog';
  document.body.appendChild(dlg);
  return dlg;
}

function setDialogHTML(dlg, html) {
  dlg.innerHTML = html;
}

export function confirmDialog({
  title = 'Confirm',
  message = 'Are you sure?',
  messageHtml = null,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'danger', // danger | neutral
  requireText = null, // e.g. "DELETE" or a section title
  requirePlaceholder = 'Type to confirm…',
} = {}) {
  const dlg = ensureDialog();

  return new Promise((resolve) => {
    const onClose = () => {
      dlg.removeEventListener('close', onClose);
      resolve(dlg.returnValue === 'ok');
    };

    const safeTitle = escapeHtml(title);
    const safeMessage = messageHtml != null ? String(messageHtml) : escapeHtml(message);
    const needsText = typeof requireText === 'string' && requireText.length > 0;
    const reqId = 'dlgConfirmText';

    setDialogHTML(
      dlg,
      /* html */ `
        <form method="dialog" class="dialogCard">
          <div class="dialogHeader">
            <div class="dialogTitle">${safeTitle}</div>
          </div>
          <div class="dialogBody">
            <div>${safeMessage}</div>
            ${needsText ? `
              <div class="divider"></div>
              <label class="dialogLabel" for="${reqId}">Type <span class="kbd">${escapeHtml(requireText)}</span> to confirm</label>
              <input id="${reqId}" class="field" autocomplete="off" placeholder="${escapeHtml(requirePlaceholder)}" />
            ` : ''}
          </div>
          <div class="dialogActions">
            <button class="btn btnGhost" value="cancel">${escapeHtml(cancelText)}</button>
            <button id="dlgConfirmBtn" class="btn ${tone === 'danger' ? 'btnDanger' : ''}" value="ok">${escapeHtml(confirmText)}</button>
          </div>
        </form>
      `
    );

    // If we require typed confirmation, disable the confirm button until it matches.
    if (needsText) {
      const input = dlg.querySelector(`#${reqId}`);
      const btn = dlg.querySelector('#dlgConfirmBtn');
      const expected = String(requireText);
      const sync = () => {
        const ok = String(input?.value ?? '') === expected;
        if (btn) btn.disabled = !ok;
      };
      sync();
      input?.addEventListener('input', sync);
      setTimeout(() => input?.focus?.(), 0);
    }

    dlg.addEventListener('close', onClose);
    try {
      dlg.showModal();
    } catch {
      // If showModal isn't available, fall back to native confirm
      resolve(window.confirm(`${title}\n\n${message}`));
    }
  });
}

export function editSectionDialog({
  title = 'Edit section',
  initialTitle = '',
  initialDesc = '',
  saveText = 'Save',
  cancelText = 'Cancel',
} = {}) {
  const dlg = ensureDialog();

  return new Promise((resolve) => {
    const onClose = () => {
      dlg.removeEventListener('close', onClose);
      if (dlg.returnValue !== 'ok') return resolve(null);

      const t = dlg.querySelector('#dlgTitle')?.value ?? '';
      const d = dlg.querySelector('#dlgDesc')?.value ?? '';
      resolve({ title: String(t).trim(), desc: String(d).trim() });
    };

    setDialogHTML(
      dlg,
      /* html */ `
        <form method="dialog" class="dialogCard">
          <div class="dialogHeader">
            <div class="dialogTitle">${escapeHtml(title)}</div>
          </div>

          <div class="dialogBody">
            <label class="dialogLabel" for="dlgTitle">Title</label>
            <input id="dlgTitle" class="field" autocomplete="off" value="${escapeHtml(String(initialTitle))}" />

            <div class="divider"></div>

            <label class="dialogLabel" for="dlgDesc">Description (optional)</label>
            <textarea id="dlgDesc" class="field textarea" rows="3">${escapeHtml(String(initialDesc || ''))}</textarea>
          </div>

          <div class="dialogActions">
            <button class="btn btnGhost" value="cancel">${escapeHtml(cancelText)}</button>
            <button class="btn" value="ok">${escapeHtml(saveText)}</button>
          </div>
        </form>
      `
    );

    dlg.addEventListener('close', onClose);
    try {
      dlg.showModal();
      const input = dlg.querySelector('#dlgTitle');
      input?.focus();
      input?.select?.();
    } catch {
      const nextTitle = window.prompt('Title', initialTitle);
      if (nextTitle === null) return resolve(null);
      const nextDesc = window.prompt('Description (optional)', initialDesc);
      if (nextDesc === null) return resolve(null);
      resolve({ title: String(nextTitle).trim(), desc: String(nextDesc).trim() });
    }
  });
}
