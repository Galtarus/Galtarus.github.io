import { iconSvg } from './icons.js';

export function Layout({ title = 'GALTARUS', currentPath = '#/' } = {}) {
  const isCurrent = (p) => (p === currentPath ? 'aria-current="page"' : '');

  return /* html */ `
    <div class="container">
      <div class="shell">
        <header class="topbar">
          <div class="brand">
            <div class="logo" aria-hidden="true"></div>
            <div class="title">${title}</div>
          </div>
        </header>

        <main class="main" id="view" aria-live="polite"></main>

        <nav class="tabs" aria-label="Navigation">
          <a href="#/" ${isCurrent('#/')}>${iconSvg('home')}<span class="label">Hub</span></a>
          <a href="#/sections" ${isCurrent('#/sections')}>${iconSvg('grid')}<span class="label">Sections</span></a>
          <a href="#/search" ${isCurrent('#/search')}>${iconSvg('search')}<span class="label">Search</span></a>
        </nav>

        <dialog id="appDialog" class="dialog" aria-label="Dialog"></dialog>
      </div>
    </div>
  `;
}
