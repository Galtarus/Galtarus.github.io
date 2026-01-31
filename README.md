# spa-starter

Petit starter **Single Page App** (sans framework, sans build) pour itérer vite à partir de prompts.

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
- `index.html` : point d’entrée
- `src/main.js` : boot + router
- `src/router.js` : mini routeur hash (`#/`, `#/about`, ...)
- `src/pages/*` : pages (fonctions qui retournent du HTML)
- `src/components/*` : petits composants
- `src/styles/*` : CSS

## Déploiement (simple)
Comme c’est du statique, tu peux déployer sur :
- GitHub Pages
- Netlify
- Vercel

On peut ajouter un build (Vite) plus tard si besoin.
