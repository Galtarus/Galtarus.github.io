import { el } from '../lib/ui.js';

export function ytEmbed(youtubeId) {
  const shell = el('div', { class: 'embed-shell' });
  const label = `Load YouTube video (${youtubeId})`;

  const btn = el('button', {
    class: 'btn',
    type: 'button',
    'aria-label': label,
  }, 'Load video');

  btn.addEventListener('click', () => {
    btn.disabled = true;
    btn.textContent = 'Loading…';

    const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?rel=0`;
    const frame = el('iframe', {
      class: 'embed-frame',
      src,
      title: 'YouTube video',
      loading: 'lazy',
      allow:
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      referrerpolicy: 'strict-origin-when-cross-origin',
      allowfullscreen: 'true',
    });

    shell.appendChild(frame);
  });

  shell.appendChild(btn);
  return shell;
}
