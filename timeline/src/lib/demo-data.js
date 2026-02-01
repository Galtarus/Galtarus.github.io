function iso(d) {
  // yyyy-mm-dd
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function demoEntries() {
  const now = new Date();

  return [
    {
      id: 'e-001',
      date: iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14)),
      title: 'Kickoff: timeline prototype',
      summary: 'A tiny static timeline SPA with hash routing and demo data.',
      tags: ['meta', 'build'],
      youtubeId: 'dQw4w9WgXcQ',
    },
    {
      id: 'e-002',
      date: iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)),
      title: 'Feature: browse + detail view',
      summary: 'Browse events, open details, and embed YouTube with click-to-load.',
      tags: ['ui', 'timeline'],
      youtubeId: null,
    },
    {
      id: 'e-003',
      date: iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)),
      title: 'Editor: add and edit entries',
      summary: 'Local persistence via localStorage. (IndexedDB can be added later.)',
      tags: ['editor', 'storage'],
      youtubeId: null,
    },
  ];
}
