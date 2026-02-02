function iso(d) {
  // yyyy-mm-dd
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function demoEntries() {
  return [
    {
      id: 'e-1994-birth',
      date: '1994-02-02',
      title: 'Birth',
      summary: 'Origin point on the timeline (demo).',
      tags: ['life'],
      imageUrl: './assets/img/demo-birth.png',
    },
    {
      id: 'e-2012-trip',
      date: '2012-07-14',
      title: 'Trip photo',
      summary: 'Example of an image preview (PNG served from this project).',
      tags: ['photo'],
      imageUrl: './assets/img/demo-trip.png',
    },
    {
      id: 'e-2016-video',
      date: '2016-06-18',
      title: 'Video memory',
      summary: 'Example YouTube thumbnail + click-through to details.',
      tags: ['video'],
      youtubeId: 'dQw4w9WgXcQ',
    },
    {
      id: 'e-2020-project',
      date: '2020-10-01',
      title: 'Project milestone',
      summary: 'Screenshot-style PNG preview to test density and legibility.',
      tags: ['work'],
      imageUrl: './assets/img/demo-project.png',
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
