# CLAUDE.md — Prese Hub / Futur One Two-Pager

## Projet
Présentation A3 plié en 2 (4 pages portrait, 480×680px chacune) pour Futur One Qatar.
Stack : Next.js · React · inline styles (pas de Tailwind, pas de CSS modules).

## Architecture des pages
| Fichier | Page | Rôle |
|---|---|---|
| `components/pages/P1Cover.jsx` | P1 — Couverture | Image `cover-facade.png` + titre FUTUR ONE. |
| `components/pages/P2InsideLeft.jsx` | P2 — Intérieur gauche | Hero dark + Opportunity band + Footer |
| `components/pages/P3InsideRight.jsx` | P3 — Intérieur droite | The Method + Hub diagram + Funding |
| `components/pages/P4Back.jsx` | P4 — Dos | Image `back-cover.png` + "AI is the new gas." |

## Tokens couleur
Tous les tokens sont définis dans `app/globals.css` sous `:root`.
Ne jamais hardcoder de couleur hex dans les composants — utiliser exclusivement `var(--color-*)`.

---

## ⚠️ LAYOUT LOCKS — NE PAS TOUCHER

Les hauteurs de sections sont verrouillées. Elles sont calibrées pixel par pixel pour
que les 4 pages s'impriment correctement sur un A3 plié.

### P3InsideRight — heights LOCKED
```
header   : 122px
phases   : 102px
mid      : 282px
picture  :  82px
building :  92px
TOTAL    : 680px
```

### P2InsideLeft — heights LOCKED
```
hero     : 270px  (anciennement 320px)
darkBand : 220px
building : 100px
footer   :  90px
TOTAL    : 680px
```

### Règles strictes
- Ne jamais modifier `height:` dans les objets de style des sections `SECTION`.
- Ne jamais modifier `REF_W = 480` ni `REF_H = 680` dans `FoldableA3.jsx`.
- Ne jamais ajouter de `padding`, `margin` ou `gap` sur les conteneurs de section
  sans compensation explicite (le total doit rester 680px).
- Le `const SECTION = { flexShrink: 0, flexGrow: 0, minHeight: 0, overflow: 'hidden' }`
  est invariant — ne pas le modifier.
- Pour déplacer du contenu à l'intérieur d'une section, utiliser `padding`,
  `position: absolute`, ou `top` relatif sur les enfants — jamais sur la section elle-même.
