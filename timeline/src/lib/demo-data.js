function iso(d) {
  // yyyy-mm-dd
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function demoEntries() {
  // Use https images for now (user request): avoids any local-path / cache confusion.
  // These are placeholders to validate layout + thumbnails at multiple eras.
  return [
    {
      id: 'e-1994-birth',
      date: '1994-02-02',
      title: 'Birth',
      summary: 'Origin point on the timeline (demo).',
      tags: ['life'],
      imageUrl: 'https://picsum.photos/seed/timeline-birth/960/540',
    },
    {
      id: 'e-2003-school',
      date: '2003-09-01',
      title: 'School days',
      summary: 'A simple memory card with a thumbnail.',
      tags: ['life'],
      imageUrl: 'https://picsum.photos/seed/timeline-school/960/540',
    },
    {
      id: 'e-2012-trip',
      date: '2012-07-14',
      title: 'Trip photo',
      summary: 'Example of an image preview (loaded from a URL).',
      tags: ['photo'],
      imageUrl: 'https://picsum.photos/seed/timeline-trip/960/540',
    },
    {
      id: 'e-2016-video',
      date: '2016-06-18',
      title: 'Video memory',
      summary: 'YouTube thumbnail on the axis + click through to details.',
      tags: ['video'],
      youtubeId: 'dQw4w9WgXcQ',
    },
    {
      id: 'e-2020-project',
      date: '2020-10-01',
      title: 'Project milestone',
      summary: 'Screenshot-style thumbnail to stress-test density.',
      tags: ['work'],
      imageUrl: 'https://picsum.photos/seed/timeline-project/960/540',
    },
    {
      id: 'e-2024-family',
      date: '2024-12-24',
      title: 'Family moment',
      summary: 'Another thumbnail near “present” time.',
      tags: ['life'],
      imageUrl: 'https://picsum.photos/seed/timeline-family/960/540',
    },
    {
      id: 'e-2026-proto',
      date: iso(new Date()),
      title: 'Timeline prototype',
      summary: 'Dense labels + media previews should stay readable on the axis.',
      tags: ['meta'],
      youtubeId: null,
    },
  ];
}
