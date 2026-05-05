# Motion & scroll — animations 2D/3D, scroll, transitions

Les libs qui transforment un site statique en expérience.

---

## GSAP (GreenSock)
- **URL** : https://gsap.com
- **Statut** : depuis 2024 **gratuit y compris pour le commercial** (rachat par Webflow).
- **Force** : timeline-based, contrôle pixel-perfect, ScrollTrigger inégalé, support cross-browser.
- **Quand l'utiliser** : timelines complexes (intro 5+ étapes), scroll narratif, animations de texte.
- **Plugins critiques** :
  - `ScrollTrigger` — scroll-based animations (irremplaçable)
  - `SplitText` — animation lettre par lettre
  - `Flip` — transitions FLIP pour réorganisation DOM
  - `MorphSVG` — morph paths SVG
  - `DrawSVG` — dessiner des paths progressivement
  - `MotionPath` — suivre un chemin SVG/canvas
- **Combo gagnant** : GSAP + Lenis + R3F → 90% des sites Awwwards 2025–2026.

## Framer Motion
- **URL** : https://motion.dev
- **Quand l'utiliser** : projet React, animations UI déclaratives, gestures (drag, hover, tap).
- **Force** : API React-native, layout animations (`layoutId`), variants.
- **Faiblesse** : moins puissant que GSAP sur scroll narratif complexe.
- **Best for** : SaaS B2B, dashboards, micro-interactions UI.

## Motion (anciennement Framer Motion vanilla)
- **URL** : https://motion.dev
- Version vanilla JS de Framer Motion. Si tu n'es pas en React.

## Theatre.js
- **URL** : https://www.theatrejs.com
- **Quand l'utiliser** : animer des scènes 3D (caméra, objets) avec une **timeline visuelle** (comme After Effects).
- **Force** : éditeur visuel intégré au navigateur, exports JSON, intégration native R3F.
- **Best for** : intro cinématique 3D, scrollytelling 3D piloté par caméra.

## Lenis
- **URL** : https://lenis.darkroom.engineering
- **Maintainer** : studio Darkroom (anciennement créé par Locomotive).
- **Quand l'utiliser** : **toujours** sur un site moderne. Smooth scroll de référence en 2026.
- **Force** : léger (3kb), API simple, bonne accessibilité (respecte `prefers-reduced-motion`), trigger natif.
- **Pas concurrent de** : ScrollTrigger (Lenis = smooth, GSAP = anim sur scroll → ils se combinent).

## locomotive-scroll
- **Statut** : largement remplacé par Lenis. Encore présent sur des projets legacy.
- **Quand encore l'utiliser** : si tu maintiens un site Locomotive existant.

---

## Combos types

### "Scroll-narratif premium" (Apple, Stripe pages)
```
R3F + Drei
+ GSAP ScrollTrigger (pin sections, anim camera/objets)
+ Lenis (smooth scroll)
+ Framer Motion (UI overlays cards)
```

### "Hero 3D + reste classique" (Linear style)
```
R3F (juste le hero)
+ Framer Motion (UI animations)
+ Tailwind / CSS classique pour le reste
+ Pas de smooth scroll forcé
```

### "Scrollytelling cinématique 3D" (Lando Norris style)
```
R3F + Drei
+ Theatre.js (timeline caméra/scène)
+ GSAP ScrollTrigger (sync scroll → timeline Theatre)
+ Lenis
+ Rive (motion graphics 2D overlay)
```

### "Site jouable / interactif" (Bruno Simon style)
```
R3F + Drei
+ @react-three/rapier (physique)
+ Zustand (state global)
+ Tone.js (audio interactif)
+ pas de scroll smooth (gameplay = curseur/clavier)
```

---

## Règles cross-libs

1. **Une seule lib de smooth scroll à la fois** : Lenis OU rien. Jamais Lenis + locomotive.
2. **GSAP ScrollTrigger + Lenis** : il faut wire Lenis dans le ticker GSAP (snippet officiel dans la doc Lenis).
3. **Framer Motion + GSAP** : possible, mais évite que les deux animent le *même* élément. Définir des zones (FM = UI, GSAP = scroll narratif).
4. **Theatre.js + R3F** : intégration native via `@theatre/r3f`. Best DX du marché pour scènes scénarisées.

---

## Prefers-reduced-motion (obligatoire)

Toutes les animations *doivent* respecter :
```css
@media (prefers-reduced-motion: reduce) {
  /* désactiver / réduire */
}
```
- Lenis a un flag natif `lenis.options.smoothWheel = false`.
- GSAP : check `gsap.matchMedia({ '(prefers-reduced-motion: no-preference)': ... })`.
- Framer Motion : `useReducedMotion()` hook.

Si tu skip ça, ton site est **inaccessible et illégal** dans plusieurs juridictions (EAA en UE depuis juin 2025).
