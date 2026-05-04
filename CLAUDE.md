# CLAUDE.md — Prese Hub / Futur One Two-Pager

## Projet
Présentation A3 plié en 2 (4 pages portrait, 480×680px chacune) pour Futur One Qatar.
Stack : Next.js · React · inline styles (pas de Tailwind, pas de CSS modules).

---

## 🚨 RÈGLES ABSOLUES — INFRASTRUCTURE (NON NÉGOCIABLE)

### Dev server → port **5005**, toujours.
- `npm run dev` lance **exclusivement** sur `http://localhost:5005`
  (configuré dans `package.json` : `"dev": "next dev -p 5005"`).
- Ne **JAMAIS** lancer sur 3000, 3001, ou un autre port.
- Ne **JAMAIS** modifier le port dans `package.json` sans demande explicite.
- Toute URL communiquée à l'utilisateur doit pointer sur `localhost:5005`.
- Avant de démarrer le dev, vérifier qu'aucun process n'occupe déjà 5005 :
  `lsof -nP -iTCP:5005 -sTCP:LISTEN`.
- Ne pas relancer `npm run dev` si un serveur tourne déjà sur 5005 — Next.js
  basculerait automatiquement sur 5006/5007 et casserait la règle.

---

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
darkBand : 230px
building : 100px
footer   :  80px
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
