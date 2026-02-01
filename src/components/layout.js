import { iconSvg } from './icons.js';

export function Layout({ title = 'GALTARUS', currentPath = '#/' } = {}) {
  const isCurrent = (p) => (p === currentPath ? 'aria-current="page"' : '');

  return /* html */ `
    <button class="skipLink" type="button" data-skip>Skip to content</button>
    <div class="container">
      <div class="shell">
        <div class="app">
          <aside class="sidebar" aria-label="Sidebar">
            <div class="brand" style="padding: 6px 6px 10px;">
              <div class="logo" aria-hidden="true"></div>
              <div class="title">${title}</div>
            </div>
            <nav class="sideNav" aria-label="Primary">
              <a href="#/" ${isCurrent('#/')}>${iconSvg('home')} Home</a>
              <a href="#/sections" ${isCurrent('#/sections')}>${iconSvg('grid')} Sections</a>
              <a href="#/search" ${isCurrent('#/search')}>${iconSvg('search')} Search</a>
              <a href="#/settings" ${isCurrent('#/settings')}>${iconSvg('settings')} Settings</a>
            </nav>
          </aside>

          <div>
            <header class="topbar">
              <div class="brand" style="gap: 8px;">
                <div class="logo" aria-hidden="true"></div>
                <div class="title">${title}</div>
              </div>
              <div class="toolbar" style="justify-content:flex-end">
                <a class="iconBtn" href="#/settings" title="Settings" aria-label="Settings">${iconSvg('settings')}</a>
              </div>
            </header>

            <main class="main" id="view" aria-live="polite" tabindex="-1"></main>
          </div>
        </div>

        <!-- Mobile only -->
        <nav class="tabs" aria-label="Navigation">
          <a href="#/" ${isCurrent('#/')}>${iconSvg('home')}<span class="label">Home</span></a>
          <a href="#/sections" ${isCurrent('#/sections')}>${iconSvg('grid')}<span class="label">Sections</span></a>
          <a href="#/search" ${isCurrent('#/search')}>${iconSvg('search')}<span class="label">Search</span></a>
          <a href="#/settings" ${isCurrent('#/settings')}>${iconSvg('settings')}<span class="label">Settings</span></a>
        </nav>

        <dialog id="appDialog" class="dialog" aria-label="Dialog"></dialog>
      </div>
    </div>
  `;
}
