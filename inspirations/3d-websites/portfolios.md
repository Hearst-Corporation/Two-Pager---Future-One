# Portfolios 3D — devs solo & créatifs

Curatée mai 2026. Focus : devs/designers indépendants dont le portfolio est une démo de leur niveau.

## Tier S — référence absolue

### Bruno Simon
- **URL** : https://bruno-simon.com
- **Stack** : Three.js + Cannon.js + Blender baked
- **Pourquoi** : portfolio = jeu de voiture jouable. Aucun autre portfolio n'a autant marqué le métier. Code OSS sur GitHub.
- **Extraire** : approche "scene-as-resume", baked lighting, intégration physique légère.

### Yuri Artyukh (akella)
- **URL** : https://akella.org
- **YouTube** : https://www.youtube.com/c/akella
- **Pourquoi** : tutoriels live-coding "Awwwards site recreated in 2 hours". Le meilleur prof gratuit pour comprendre comment les pros font.
- **Extraire** : techniques de shaders distortion, hover effects WebGL, scroll-driven.

### Jordan Breton
- **URL** : à vérifier (FWA SOTD oct 2025)
- **Stack** : Three.js / R3F
- **Pourquoi** : île volante avec écosystème complet (vent, eau, feu, faune).
- **Extraire** : layering d'éléments naturels, ambient sound design, easter eggs.

---

## Tier A — très solides

### Samsy
- **Stack** : WebGPU
- **Pourquoi** : cyberpunk haute volée, 120fps. Direction artistique tranchée (rare).
- **Extraire** : palette néon cohérente, holographic UI overlays.

### Ameen Abdullah
- **Stack** : WebGPU + Three.js
- **Pourquoi** : Awwwards winner, sakura scene contemplative. Mood opposé à Samsy.
- **Extraire** : particules organiques, transition loader → scene.

### OHZI Interactive
- **Pourquoi** : Awwwards Developer Award. Studio portfolio = vitrine technique.
- **Extraire** : qualité du post-processing (bloom, DoF), typographie 3D.

---

## Tier B — à connaître

### Robin Payot
- Effets WebGL + scroll. Techniques accessibles à reproduire.

### Lorenzo Cadamuro
- Génératif + 3D. Pour l'inspiration "art code".

### Lhsai (Henry Heffernan)
- **URL** : https://henryheffernan.com
- Portfolio "PC dans une chambre 90s" — autre approche gamifiée.

---

## Patterns à voler dans les portfolios

| Pattern | Vu chez | Quand l'utiliser |
|---------|---------|------------------|
| Scene-as-resume (gamifiée) | Bruno Simon, Henry Heffernan | Si le portfolio EST le projet |
| Single mood scene contemplative | Ameen Abdullah, Jordan Breton | Pour un dev créatif/artistique |
| Bento grid 3D + cards floating | OHZI, Samsy | Pour structurer plusieurs cas clients |
| Hover-distortion sur projets | Yuri Artyukh tutos | Liste de cas avec prévisu WebGL |
| Cinematic loader 2-3s | Quasi tous les SOTM | Premier wow obligatoire |

## Anti-patterns observés

- **Trop de 3D partout** = lourd, moche, illisible. Les meilleurs alternent zones 3D et zones plates.
- **Pas de fallback mobile** = -50% du trafic perdu. Toujours une version dégradée.
- **Audio auto-on** = banni (UX + autoplay policies). Toggle visible.
- **Loading > 5s sans feedback** = bounce. Loader doit être un teaser, pas un mur.
