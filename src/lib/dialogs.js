// Lightweight dialog helpers (CSP-safe, no external deps)

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
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'danger', // danger | neutral
} = {}) {
  const dlg = ensureDialog();

  return new Promise((resolve) => {
    const onClose = () => {
      dlg.removeEventListener('close', onClose);
      resolve(dlg.returnValue === 'ok');
    };

    setDialogHTML(
      dlg,
      /* html */ `
        <form method="dialog" class="dialogCard">
          <div class="dialogHeader">
            <div class="dialogTitle">${title}</div>
          </div>
          <div class="dialogBody">${message}</div>
          <div class="dialogActions">
            <button class="btn btnGhost" value="cancel">${cancelText}</button>
            <button class="btn ${tone === 'danger' ? 'btnDanger' : ''}" value="ok">${confirmText}</button>
          </div>
        </form>
      `
    );

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
            <div class="dialogTitle">${title}</div>
          </div>

          <div class="dialogBody">
            <label class="dialogLabel" for="dlgTitle">Title</label>
            <input id="dlgTitle" class="field" autocomplete="off" value="${String(initialTitle).replace(/"/g, '&quot;')}" />

            <div class="divider"></div>

            <label class="dialogLabel" for="dlgDesc">Description (optional)</label>
            <textarea id="dlgDesc" class="field textarea" rows="3">${String(initialDesc || '')}</textarea>
          </div>

          <div class="dialogActions">
            <button class="btn btnGhost" value="cancel">${cancelText}</button>
            <button class="btn" value="ok">${saveText}</button>
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
