export function qs(sel, root = document) {
  return root.querySelector(sel);
}

export function setHTML(el, html) {
  el.innerHTML = html;
}

export function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
