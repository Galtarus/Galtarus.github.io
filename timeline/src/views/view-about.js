import { el } from '../lib/ui.js?v=20260202ux5';
import { downloadJson } from '../lib/download.js?v=20260202ux5';
import { demoEntries } from '../lib/demo-data.js?v=20260202ux5';

const APP_KEY = 'timeline.app.v1';

export function viewAbout({ root }) {
  root.appendChild(
    el('section', { class: 'panel', style: 'grid-column: 1 / -1' },
      el('h2', {}, 'About'),
      el('div', { class: 'panel-body stack' },
        el('p', {}, 'Timeline is a self-contained static SPA living under /timeline/. It uses hash routing, vanilla JS modules, and local persistence (localStorage for MVP).'),
        el('p', { class: 'muted' }, 'Privacy note: YouTube embeds load only after an explicit click and use youtube-nocookie.com.'),
        el('p', { class: 'muted' }, 'No build tools; everything is served as static files by GitHub Pages.'),
        el('div', { class: 'hr' }),
        el('h3', { style: 'margin:0' }, 'Data tools'),
        el('div', { class: 'row wrap' },
          el('button', { class: 'btn', type: 'button', onclick: () => onExport() }, 'Export JSON'),
          el('label', { class: 'btn', style: 'display:inline-block' },
            'Import JSON',
            el('input', { type: 'file', accept: 'application/json', style: 'display:none', onchange: (e) => onImport(e) })
          ),
          el('button', { class: 'btn danger', type: 'button', onclick: () => onReset() }, 'Reset to demo')
        ),
        el('p', { class: 'muted' }, 'Import replaces your local data. Export creates a JSON file of your entries.')
      )
    )
  );
}

function onExport() {
  const state = loadState();
  const entries = state?.entries || [];
  downloadJson('timeline-export.json', { version: 1, exportedAt: new Date().toISOString(), entries });
}

async function onImport(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const entries = Array.isArray(parsed?.entries) ? parsed.entries : null;
    if (!entries) throw new Error('Invalid file format: expected { entries: [...] }');

    if (!confirm(`Import ${entries.length} entries? This will overwrite your current local timeline.`)) return;

    const cleaned = entries
      .map((x) => normalizeEntry(x))
      .filter(Boolean);

    const next = { version: 1, entries: cleaned, selectedId: cleaned.at(-1)?.id || null, filters: { q: '', tag: '' } };
    saveState(next);
    location.hash = '#/';
    location.reload();
  } catch (err) {
    alert(`Import failed: ${err?.message || err}`);
  } finally {
    e.target.value = '';
  }
}

function onReset() {
  if (!confirm('Reset timeline to demo data? This will overwrite your current local timeline.')) return;
  const entries = demoEntries();
  const next = { version: 1, entries, selectedId: entries.at(-1)?.id || null, filters: { q: '', tag: '' } };
  saveState(next);
  location.hash = '#/';
  location.reload();
}

function loadState() {
  try {
    const raw = localStorage.getItem(APP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(APP_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function normalizeEntry(x) {
  if (!x || typeof x !== 'object') return null;
  const id = typeof x.id === 'string' && x.id ? x.id : null;
  if (!id) return null;
  const title = typeof x.title === 'string' ? x.title : '';
  const summary = typeof x.summary === 'string' ? x.summary : '';
  const date = typeof x.date === 'string' ? x.date : '';
  const youtubeId = typeof x.youtubeId === 'string' ? x.youtubeId : null;
  const imageUrl = typeof x.imageUrl === 'string' ? x.imageUrl : null;
  const tags = Array.isArray(x.tags) ? x.tags.map((t) => String(t).replace(/^#/, '').trim()).filter(Boolean) : [];
  return { id, title, summary, date, youtubeId, imageUrl, tags };
}
