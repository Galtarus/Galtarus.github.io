import { el, mount } from '../lib/ui.js?v=20260203ux27';

export function viewEdit({ root, store, setStore, navigate, id }) {
  const isNew = id === 'new';
  const existing = !isNew ? store.entries.find((e) => e.id === id) : null;

  const entry = existing || {
    id: null,
    date: todayISO(),
    title: '',
    summary: '',
    tags: [],
    youtubeId: '',
  };

  const left = el('section', { class: 'panel' },
    el('h2', {}, isNew ? 'Add entry' : 'Edit entry'),
    el('div', { class: 'panel-body stack' },
      formRow('Date (YYYY-MM-DD)', inputDate(entry.date)),
      formRow('Title', inputText('title', entry.title, 'e.g. Released v1')),
      formRow('Summary', inputTextarea('summary', entry.summary, 'What happened?')),
      formRow('Tags (comma-separated)', inputText('tags', (entry.tags || []).join(', '), 'e.g. launch, ui')),
      formRow('YouTube ID (optional)', inputText('youtubeId', entry.youtubeId || '', 'e.g. dQw4w9WgXcQ')),
      formRow('Image URL (optional, https)', inputText('imageUrl', entry.imageUrl || '', 'https://…')),
      el('div', { class: 'hr' }),
      el('div', { class: 'row wrap' },
        el('button', {
          class: 'btn primary',
          type: 'button',
          onclick: () => onSave(),
        }, 'Save'),
        el('button', {
          class: 'btn',
          type: 'button',
          onclick: () => (existing ? navigate(`/entry/${existing.id}`) : navigate('/')),
        }, 'Cancel'),
        existing
          ? el('button', { class: 'btn danger', type: 'button', onclick: () => onDelete() }, 'Delete')
          : null
      ),
      el('div', { class: 'footer-note' }, 'Saved locally in your browser (localStorage).')
    )
  );

  const right = el('aside', { class: 'panel right-panel' },
    el('h2', {}, 'Help'),
    el('div', { class: 'panel-body stack' },
      el('p', { class: 'muted' }, 'YouTube: paste only the video ID (not the full URL).'),
      el('p', { class: 'muted' }, 'Tags: used for search/filter (Cycle 4).'),
      el('button', { class: 'btn', type: 'button', onclick: () => navigate('/about') }, 'About')
    )
  );

  mount(root, left, right);

  function onSave() {
    const date = left.querySelector('[name="date"]').value.trim();
    const title = left.querySelector('[name="title"]').value.trim();
    const summary = left.querySelector('[name="summary"]').value.trim();
    const tagsRaw = left.querySelector('[name="tags"]').value;
    const youtubeId = left.querySelector('[name="youtubeId"]').value.trim();
    const imageUrl = left.querySelector('[name="imageUrl"]').value.trim();

    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => t.replace(/^#/, ''));

    const cleanDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';

    if (!title) {
      alert('Title is required.');
      return;
    }

    if (isNew) {
      const newId = genId();
      const newEntry = {
        id: newId,
        date: cleanDate,
        title,
        summary,
        tags,
        youtubeId: youtubeId || null,
        imageUrl: normalizeImageUrl(imageUrl),
      };
      const nextEntries = [...store.entries, newEntry];
      setStore({ entries: nextEntries, selectedId: newId });
      navigate(`/entry/${newId}`);
      return;
    }

    if (!existing) {
      alert('Entry not found.');
      navigate('/');
      return;
    }

    const updated = {
      ...existing,
      date: cleanDate,
      title,
      summary,
      tags,
      youtubeId: youtubeId || null,
      imageUrl: normalizeImageUrl(imageUrl),
    };

    const nextEntries = store.entries.map((e) => (e.id === existing.id ? updated : e));
    setStore({ entries: nextEntries, selectedId: existing.id });
    navigate(`/entry/${existing.id}`);
  }

  function onDelete() {
    if (!existing) return;
    if (!confirm(`Delete "${existing.title}"?`)) return;
    const nextEntries = store.entries.filter((e) => e.id !== existing.id);
    setStore({ entries: nextEntries, selectedId: nextEntries.at(-1)?.id || null });
    navigate('/');
  }
}

function formRow(label, input) {
  return el('label', { class: 'stack' },
    el('span', { class: 'muted', style: 'color: var(--muted)' }, label),
    input
  );
}

function inputText(name, value, placeholder = '') {
  return el('input', {
    class: 'input',
    type: 'text',
    name,
    value: value ?? '',
    placeholder,
  });
}

function inputTextarea(name, value, placeholder = '') {
  return el('textarea', {
    class: 'input',
    rows: '5',
    placeholder,
    name,
  }, value ?? '');
}

function inputDate(value) {
  return el('input', {
    class: 'input',
    type: 'text',
    name: 'date',
    value: value ?? '',
    placeholder: 'YYYY-MM-DD',
    inputmode: 'numeric',
  });
}

function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function genId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeImageUrl(url) {
  const u = (url || '').trim();
  if (!u) return null;
  // Keep CSP simple: allow only https images by convention.
  if (!u.startsWith('https://')) {
    alert('Image URL must start with https:// (or leave it blank).');
    return null;
  }
  return u;
}
