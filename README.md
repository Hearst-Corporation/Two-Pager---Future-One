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
# ou alias équivalent :
npm run rundev
```

> ⚠️ **Règle absolue** — le dev server tourne **toujours** sur le port **5005**
> (`dev` et `rundev` appellent la même commande dans `package.json`). Ne jamais lancer sur 3000 ni un autre port.

Ouvrir [http://localhost:5005](http://localhost:5005).

### Routes disponibles
| URL | Page |
|---|---|
| `/` | Landing principale |
| `/brochure` | Brochure A3 plié (P1 → P4, 4 vues) |
| `/datacenter` | One-pager isolé ; logos footer `public/partners/*.svg`, filigranes `*-icon.svg` (alignement vertical calibré dans le viewBox) |
| `/print` | Vue print A3 |

**Landing `/`** — `components/landing/SectionMethod.jsx` : le conteneur `sticky` utilise `overflow: clip` plutôt que `hidden`, sinon WebKit peut traiter ce nœud comme scrollport et casser le « pin » + le défilement lié au track horizontal.

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
