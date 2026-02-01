// Tiny hash router. Routes are like #/ or #/entry/<id> or #/edit/<id>

export function createRouter() {
  const listeners = new Set();

  function parseHash() {
    const raw = (location.hash || '#/').replace(/^#/, '');
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    const parts = path.split('/').filter(Boolean);
    return { path, parts };
  }

  function match() {
    const { parts } = parseHash();

    if (parts.length === 0) return { name: 'timeline', params: {} };

    if (parts[0] === 'entry' && parts[1]) return { name: 'entry', params: { id: parts[1] } };
    if (parts[0] === 'edit') return { name: 'edit', params: { id: parts[1] || 'new' } };
    if (parts[0] === 'about') return { name: 'about', params: {} };

    return { name: 'timeline', params: {} };
  }

  function navigate(path) {
    const safe = path.startsWith('#') ? path : `#${path}`;
    if (location.hash === safe) return;
    location.hash = safe;
  }

  function notify() {
    for (const fn of listeners) fn();
  }

  window.addEventListener('hashchange', notify);

  return {
    match,
    navigate,
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
