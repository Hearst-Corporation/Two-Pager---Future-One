# Core libs — moteurs 3D web

État de l'art mai 2026. Choix de la lib selon le cas d'usage.

---

## Three.js
- **URL** : https://threejs.org
- **Quand l'utiliser** : tout projet 3D web sérieux. C'est le standard de fait.
- **Tu écris** : du JS / TS impératif. Tu gères ta scene, ton renderer, ta camera, ton loop.
- **Force** : contrôle total, communauté énorme, examples massifs.
- **Faiblesse** : verbose, pas React-friendly nativement.

## React Three Fiber (R3F)
- **URL** : https://r3f.docs.pmnd.rs
- **Maintainer** : Poimandres (pmndrs)
- **Quand l'utiliser** : tu codes en React/Next.js → c'est obligatoire (vs Three.js vanilla).
- **Tu écris** : du JSX déclaratif. Three.js devient des composants React.
- **Force** : ergonomie, intégration totale avec l'écosystème React, tree-shaking, hooks.
- **Faiblesse** : abstraction → debug parfois plus complexe, légère overhead.

## Drei (R3F helpers)
- **URL** : https://github.com/pmndrs/drei
- **Quand l'utiliser** : avec R3F, *toujours*. Sauve 80% du boilerplate.
- **Ce que ça apporte** : `<OrbitControls />`, `<Environment />`, `<useGLTF />`, `<Text3D />`, `<Html />`, `<ContactShadows />`, `<Sky />`, etc.
- **Règle** : avant d'écrire 30 lignes Three.js, vérifier si Drei a un helper.

## Spline
- **URL** : https://spline.design
- **Quand l'utiliser** : prototypage rapide, designers non-devs, scènes simples-moyennes.
- **Tu écris** : rien (éditeur visuel). Export en `.splinecode` ou React component.
- **Force** : zero-code, collaboration designer/dev, rapide.
- **Faiblesse** : plafond technique vite atteint, fichiers lourds, dépendance à leur runtime.
- **Quand l'éviter** : projet à long terme, optimisation perf critique, animations très complexes.

## Babylon.js
- **URL** : https://babylonjs.com
- **Quand l'utiliser** : projet "game-like" lourd (3D enterprise, simulation, gros catalog viewer).
- **Force** : éditeur officiel (Babylon Editor), physique intégrée, support Microsoft.
- **Faiblesse** : moins populaire que Three.js sur le créatif web, ressources moindres.

## PlayCanvas
- **URL** : https://playcanvas.com
- **Quand l'utiliser** : jeu navigateur, configurateur lourd. Éditeur visuel cloud.
- **Force** : performance, moteur de jeu mature.
- **Faiblesse** : niche, communauté plus petite.

## Unity WebGL / Unreal Pixel Streaming
- **Quand l'utiliser** : si l'expérience EXISTE déjà en Unity/Unreal et qu'on veut la porter web. Sinon → overkill.
- **Faiblesse** : taille du build énorme, perf mobile catastrophique, temps de chargement.

---

## WebGPU — émergent en 2026

- **Statut mai 2026** : supporté Chrome/Edge/Safari Tech Preview. Adoption en prod : ~30% des Awwwards SOTM récents utilisent WebGPU.
- **Three.js WebGPURenderer** : stable. Permet d'utiliser TSL (Three.js Shading Language) au lieu de GLSL.
- **Quand passer à WebGPU** :
  - Tu vises >50k particules
  - Tu veux du compute shader (simulation fluide, foules)
  - Ton public cible a Chrome récent (B2B tech, créatif, jeunesse urbaine)
- **Quand rester sur WebGL** :
  - Audience large (>50% mobile, navigateurs anciens)
  - Effets simples qui n'ont pas besoin de compute
  - Tu veux que ça marche partout sans fallback

---

## Loaders / formats 3D

| Format | Quand l'utiliser |
|--------|------------------|
| **glTF / GLB** | Standard absolu. Toujours commencer par ça. |
| **DRACO compressed glTF** | Quand le glTF dépasse 5MB. Compression géométrie agressive. |
| **Meshopt** | Alternative à DRACO, parfois meilleure. |
| **USDZ** | iOS Quick Look (AR). Pour shopping AR. |
| **FBX, OBJ** | Legacy. Convertir en glTF avant prod. |

**Outil** : https://gltf.report → analyse + optimisation glTF en ligne.
**Outil** : Blender → exporter glTF natif depuis 2.8+.

---

## Décision rapide

```
Tu codes en React ?
├── OUI → R3F + Drei (toujours)
└── NON → Three.js vanilla

Designer doit éditer la scène ?
├── OUI → Spline (proto) puis migration R3F si projet sérieux
└── NON → R3F direct

Performance critique (>50k particules, compute) ?
├── OUI → R3F + WebGPURenderer (Three.js WebGPU)
└── NON → R3F + WebGL classique

Cible mobile lourde ?
└── R3F + DRACO + LOD + post-processing minimaliste
```
