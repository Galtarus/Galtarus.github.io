# Galtarus (offline hub)

Mini **Single Page App** (sans framework, sans build) orientée "product" : un hub offline avec des *sections* (Idea Vault, Checklists, Notes) stockées en localStorage.

- 100% statique
- CSP strict : **connect-src 'none'** (pas de réseau)
- Export/Import JSON pour backup/sync manuel

## Démarrer
- Ouvre `index.html` dans ton navigateur (double-clic) ou lance un petit serveur local.

### Serveur local (recommandé)
Si tu as Node :
```bash
npx serve .
```
Ou Python :
```bash
python -m http.server 5173
```
Puis ouvre http://localhost:5173

## Structure
- `index.html` : point d’entrée (+ CSP)
- `src/main.js` : boot + render loop (préservation focus/scroll)
- `src/router.js` : mini routeur hash (`#/`, `#/sections`, `#/s/:id`, `#/search`)
- `src/pages/*` : pages
- `src/sections/*` : types de section (Idea Vault / Checklist / Notes)
- `src/stores/*` : stores localStorage (offline)
- `src/components/*` : composants
- `src/styles/*` : CSS

## Déploiement (simple)
Comme c’est du statique, tu peux déployer sur :
- GitHub Pages
- Netlify
- Vercel

On peut ajouter un build (Vite) plus tard si besoin.
