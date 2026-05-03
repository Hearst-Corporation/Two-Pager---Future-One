# Futur One — Two-Pager

Présentation commerciale A3 plié en 2, rendue dans le navigateur et exportable en PDF.

## Stack
- **Next.js 14** (App Router)
- **React** — inline styles uniquement, pas de Tailwind ni CSS modules
- **Design tokens** — définis dans `app/globals.css` sous `:root`

## Structure

```
app/
  globals.css       ← tokens couleur (--color-*)
  layout.jsx
  page.jsx          ← UI principale + sélecteur de vue

components/
  FoldableA3.jsx    ← moteur de rendu A3 plié (REF_W 480 × REF_H 680)
  pages/
    P1Cover.jsx     ← Couverture  : FUTUR ONE. / cover-facade.png
    P2InsideLeft.jsx ← Intérieur gauche : Hero + Opportunity + Footer
    P3InsideRight.jsx ← Intérieur droite : The Method + Hub + Funding
    P4Back.jsx      ← Dos : AI is the new gas. / back-cover.png

public/
  cover-facade.png
  back-cover.png
```

## Vues disponibles
| Vue | Description |
|---|---|
| Fermé | P1 seule (couverture) |
| Ouvert | P2 + P3 côte à côte (intérieur) |
| Dos | P4 seule |
| À plat | Recto (P4\|P1) + Verso (P2\|P3) |

## Lancer le projet

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Palette

Tous les tokens sont dans `app/globals.css`. Catégories :
- `--color-bg-*` — fonds de page
- `--color-gray-*` — échelle de gris (100 → 900)
- `--color-dark-*` — surfaces sombres (couvertures, bands)
- `--color-accent-*` — rouge cramoisie (signature Futur One)
- `--color-text-*` — hiérarchie typographique
- `--color-border-*` — bordures et lignes

## Contraintes layout
Les hauteurs de section sont verrouillées (total 680px par page).
Voir `CLAUDE.md` pour les règles complètes.
