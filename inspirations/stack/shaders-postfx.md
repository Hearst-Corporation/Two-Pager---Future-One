# Shaders & post-processing — la couche qui donne le wow

Ce qui sépare un "site avec de la 3D" d'un "site primé".

---

## Pourquoi les shaders comptent

Sans shaders custom : ta scène 3D ressemble à un export Blender.
Avec shaders custom : ta scène ressemble à du Lusion / Active Theory.

C'est **la barrière la plus haute** à franchir techniquement, mais c'est ce qui crée la signature visuelle.

---

## Apprendre les shaders

### The Book of Shaders
- **URL** : https://thebookofshaders.com
- Le manuel canonique. Gratuit, accessible, interactif. Auteur : Patricio Gonzalez Vivo.
- Lire en entier : ~10h. ROI énorme.

### Three.js Journey — chapitres shaders
- Bruno Simon, partie payante. Le meilleur cours appliqué à Three.js.

### Maxime Heckel blog
- **URL** : https://blog.maximeheckel.com
- Articles longs sur shaders + R3F. Niveau intermédiaire/avancé. Gratuit.

### Inigo Quilez
- **URL** : https://iquilezles.org
- Le maître mondial des SDF / raymarching. Articles techniques denses. Source de tout ce qui se fait en shadertoy.

### Shadertoy
- **URL** : https://shadertoy.com
- Galerie de shaders. Pour s'inspirer / reverse-engineer (le code est lisible).

---

## Lib pour intégrer post-processing

### postprocessing
- **URL** : https://github.com/pmndrs/postprocessing
- **Maintainer** : Poimandres
- **Quand l'utiliser** : tout projet R3F qui veut bloom, DoF, chromatic aberration, glitch, godrays.
- **Effets disponibles** : Bloom, DepthOfField, ChromaticAberration, Vignette, Noise, Glitch, GodRays, SSAO, SSR (screen-space reflections), Pixelation, ToneMapping.
- **Helper R3F** : `@react-three/postprocessing` → composants déclaratifs `<EffectComposer><Bloom /></EffectComposer>`.

---

## Effets signature à connaître

### Bloom
- L'effet "tout brille un peu". Donne le côté cinématique.
- 90% des sites primés en ont (subtil).
- Attention : appliqué trop fort = effet "amateur".

### Chromatic Aberration
- Décale RGB sur les bords. Donne un côté lens / glitch.
- Doser TRÈS subtilement (0.001-0.003).

### Depth of Field (DoF)
- Flou en fonction de la profondeur. Effet "photographique".
- Coûteux en perf. Réserver aux desktop.

### Distortion shader sur images
- Référence : tutos Yuri Artyukh.
- Pattern : image → texture → shader qui distort UV au hover/scroll.
- Effet immédiat, peu cher en perf.

### Particle systems custom
- GPU instancing avec `<Instances />` (Drei) ou `useFrame` + buffer.
- Pour : sakura, neige, étoiles, foule.

### Raymarching / SDF
- Pour : créer des objets sans géométrie (formes infinies, fractales).
- Coûteux mais signature absolue (cf Inigo Quilez).

### Volumetric fog / godrays
- Référence Awwwards. Donne profondeur cinématique.
- Lib `postprocessing` a des helpers godrays.

### SSR (Screen-Space Reflections)
- Pour les sols qui reflètent. Drei `<MeshReflectorMaterial />` est l'option facile.

---

## TSL — Three.js Shading Language (2025+)

- **URL** : https://github.com/mrdoob/three.js (PRs TSL)
- **Quoi** : alternative TypeScript/JS au GLSL traditionnel. Permet d'écrire des shaders en JS-like.
- **Statut mai 2026** : stable, recommandé pour WebGPU.
- **Quand l'adopter** : nouveau projet WebGPU. Pour les anciens projets WebGL, GLSL reste OK.
- **Force** : autocomplete, refactor, partagé entre vertex/fragment.

---

## Patterns shader fréquents en 2026

| Pattern | Description | Tuto |
|---------|-------------|------|
| **Hover distortion image** | UV warp au survol | akella YouTube |
| **Animated gradient mesh** | Stripe-like (plane + noise) | Codrops |
| **Particle field reactive** | Particules qui réagissent au son/curseur | Maxime Heckel |
| **Glassmorphism shader** | refraction + blur sur object 3D | Drei `<MeshTransmissionMaterial />` |
| **Silk / cloth shader** | ondulation de tissu | wawa-sensei.dev |
| **Liquid metal** | shader chrome + reflection | Codrops + iquilezles |
| **Depth-based fog** | atmosphère cinématique | Drei `<Fog />` puis raffiner |
| **Outline shader** | bord noir style cel-shading / illustration | postprocessing OutlineEffect |

---

## Performance — règles d'or

1. **Mesurer avant d'optimiser**. Chrome DevTools Performance → flame graph.
2. **GPU instancing** pour tout ce qui est répété >50 fois.
3. **Texture atlasing** : une grosse texture > 50 petites.
4. **DRACO** pour la géométrie, **Basis** pour les textures.
5. **LOD** (Level of Detail) : Drei `<Detailed />`.
6. **Frustum culling** : automatique mais vérifier (`frustumCulled = true`).
7. **Pixel ratio cap** : `gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))`.
8. **Post-processing = 30-60% du frame budget**. Couper d'abord en cas de chute fps.
9. **Mobile** : désactiver post-fx, baisser pixel ratio à 1, simplifier shaders.
