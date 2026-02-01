import { SECTION_KINDS } from '../stores/sectionsStore.js';

const common = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

export function iconSvg(name) {
  if (name === 'trash') {
    return `<svg ${common} aria-hidden="true"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 16h10l1-16" /><path d="M10 11v7" /><path d="M14 11v7" /></svg>`;
  }
  if (name === 'edit') {
    return `<svg ${common} aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>`;
  }
  if (name === 'plus') {
    return `<svg ${common} aria-hidden="true"><path d="M12 5v14" /><path d="M5 12h14" /></svg>`;
  }
  if (name === 'arrowLeft') {
    return `<svg ${common} aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>`;
  }
  if (name === 'spark') {
    return `<svg ${common} aria-hidden="true"><path d="M12 2l1.5 6.2L20 10l-6.5 1.8L12 18l-1.5-6.2L4 10l6.5-1.8L12 2z" /></svg>`;
  }
  if (name === 'search') {
    return `<svg ${common} aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>`;
  }
  if (name === 'x') {
    return `<svg ${common} aria-hidden="true"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>`;
  }
  if (name === 'check') {
    return `<svg ${common} aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>`;
  }
  if (name === 'clipboard') {
    return `<svg ${common} aria-hidden="true"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M9 4h6v3H9z" /></svg>`;
  }
  if (name === 'download') {
    return `<svg ${common} aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>`;
  }
  if (name === 'grid') {
    return `<svg ${common} aria-hidden="true"><path d="M4 4h7v7H4z" /><path d="M13 4h7v7h-7z" /><path d="M4 13h7v7H4z" /><path d="M13 13h7v7h-7z" /></svg>`;
  }
  if (name === 'home') {
    return `<svg ${common} aria-hidden="true"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>`;
  }
  if (name === 'settings') {
    return `<svg ${common} aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.04.04a2 2 0 0 1-1.42 3.42h-.1a1.7 1.7 0 0 0-1.63 1.2 2 2 0 0 1-3.78 0 1.7 1.7 0 0 0-1.63-1.2h-.1a2 2 0 0 1-1.42-3.42l.04-.04A1.7 1.7 0 0 0 8.6 15a1.7 1.7 0 0 0-1.43-1.2H7.1a2 2 0 0 1-1.42-3.42l.04-.04A1.7 1.7 0 0 0 6.06 8.5a1.7 1.7 0 0 0-.34-1.87l-.04-.04A2 2 0 0 1 7.1 3.17h.1a1.7 1.7 0 0 0 1.63-1.2 2 2 0 0 1 3.78 0 1.7 1.7 0 0 0 1.63 1.2h.1a2 2 0 0 1 1.42 3.42l-.04.04A1.7 1.7 0 0 0 17.94 8.5c0 .43.13.85.34 1.2.21.35.33.75.33 1.17s-.12.82-.33 1.17c-.21.35-.34.77-.34 1.2z" /></svg>`;
  }

  return `<svg ${common} aria-hidden="true"><path d="M12 20h.01" /></svg>`;
}

export function kindIconSvg(kind) {
  if (kind === SECTION_KINDS.CHECKLIST) {
    return `<svg ${common} aria-hidden="true"><path d="M9 11l2 2 4-4" /><path d="M4 7h3" /><path d="M4 12h3" /><path d="M4 17h3" /><path d="M9 7h11" /><path d="M9 12h11" /><path d="M9 17h11" /></svg>`;
  }
  if (kind === SECTION_KINDS.NOTES) {
    return `<svg ${common} aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /><path d="M8 13h8" /><path d="M8 17h8" /></svg>`;
  }
  // idea vault
  return `<svg ${common} aria-hidden="true"><path d="M12 2a7 7 0 0 0-4 12c.5.5 1 1.4 1 2.2V17h6v-.8c0-.8.5-1.7 1-2.2A7 7 0 0 0 12 2z" /><path d="M9 21h6" /><path d="M10 17v4" /><path d="M14 17v4" /></svg>`;
}
