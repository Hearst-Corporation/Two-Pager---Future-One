# Learn paths — comment monter en niveau 3D web

Parcours d'apprentissage selon le niveau de départ. Mai 2026.

---

## Niveau 0 — "Je connais React mais zéro 3D"

**Objectif** : comprendre Three.js + R3F, faire ton premier hero 3D en 2 semaines.

1. **Three.js Journey — Bruno Simon** *(payant ~$95, lifetime)*
   - https://threejs-journey.com
   - LE cours de référence. Vanilla Three.js d'abord (40h), puis R3F après.
   - Investit-y le temps : c'est le meilleur ROI pédagogique du milieu.

2. **Wawa Sensei R3F course** *(payant)*
   - https://wawasensei.dev/courses/react-three-fiber
   - Plus court, plus moderne, plus orienté projets.

3. **Free alternative** : YouTube Wawa Sensei + Yuri Artyukh + Maxime Heckel articles.

**Projet 0** : refaire le portfolio de Henry Heffernan (PC dans une chambre) en R3F. C'est *le* "hello world" canonique.

---

## Niveau 1 — "Je sais charger un glTF, maintenant je veux animer"

**Objectif** : maîtriser GSAP + ScrollTrigger + Theatre.js + Lenis.

1. **GSAP docs** : https://gsap.com/docs/v3/
   - ScrollTrigger en priorité. Lire tous les exemples.

2. **Theatre.js docs** : https://www.theatrejs.com
   - Tutoriel "Get Started" + tuto vidéo officiel sur R3F.

3. **Lenis docs** : https://lenis.darkroom.engineering
   - 10 minutes, c'est tout. Wire avec GSAP ticker.

**Projet 1** : recréer une page produit Apple-like (scroll-driven, objet 3D qui évolue par section). Référence : page iPhone récente.

---

## Niveau 2 — "Je veux entrer dans les shaders"

**Objectif** : savoir lire/écrire du GLSL, comprendre raymarching/SDF de base.

1. **The Book of Shaders** : https://thebookofshaders.com (gratuit, fondamental).
2. **Three.js Journey — chapitres shaders** (Bruno Simon, payant).
3. **Maxime Heckel — Refraction, dispersion, hologram, etc.** : https://blog.maximeheckel.com
4. **Inigo Quilez articles** : https://iquilezles.org/articles/

**Projet 2** :
- Recréer un effet de distortion d'image au hover (akella-style).
- Recréer un fond animé Stripe-like (gradient noise shader).

---

## Niveau 3 — "Je veux viser Awwwards SOTM"

**Objectif** : maîtriser post-processing, performance optimization, direction artistique.

1. **postprocessing lib** : https://github.com/pmndrs/postprocessing — lire toutes les démos.
2. **Maxime Heckel — Performance R3F** : articles dédiés.
3. **Codrops — Awwwards case studies** : reverse engineering détaillé.
4. **Yuri Artyukh — recreations live** : https://www.youtube.com/c/akella

**Projet 3** : recréer un site Awwwards récent en 1 semaine. Pas pour copier, pour comprendre.

---

## Niveau 4 — "WebGPU et avant-garde"

1. **Three.js WebGPU examples** : https://threejs.org/examples/?q=webgpu
2. **TSL docs** (encore en mouvement, suivre les PRs three.js).
3. **Compute shaders examples** : Three.js examples + articles Codrops 2026.

**Projet 4** : refaire Ameen Abdullah sakura WebGPU. Source d'apprentissage complet.

---

## Outils à installer / configurer

| Outil | Pourquoi |
|-------|----------|
| **Blender** (gratuit) | modélisation, baking, glTF export. Indispensable. |
| **Cursor / VSCode + glsl-canvas** | écrire des shaders avec preview live |
| **gltf.report** | analyser/optimiser glTF |
| **Theatre.js Studio** | éditer scènes 3D dans le navigateur |
| **Spector.js** (extension Chrome) | debug WebGL frame-by-frame |
| **three.js editor** | scène rapide pour tester |
| **GSAP devtools** | debug timelines |

---

## Communautés à rejoindre

| Communauté | Type |
|------------|------|
| **Poimandres Discord** | https://discord.gg/poimandres — R3F, Drei, Zustand. La communauté la plus active. |
| **Three.js Discord** | officiel, plus généraliste. |
| **GSAP Forum** | https://gsap.com/community/ — réponses rapides. |
| **Awwwards Slack / Discord** | si tu veux du networking studio. |

---

## Roadmap réaliste

| Mois | Niveau atteint | Capacité |
|------|---------------|----------|
| 1-2 | 0 → 1 | Hero 3D simple, scroll basique |
| 3-4 | 1 → 2 | Scrollytelling, Theatre.js, premiers shaders |
| 5-8 | 2 → 3 | Site complet niveau "honorable mention" Awwwards |
| 9-12 | 3 → 4 | WebGPU, scène signature, viser SOTM |

À condition de **coder 10h+/semaine**. Sinon, étirer × 2.

---

## Anti-conseils

- ❌ **"Apprendre Three.js avec ChatGPT"** seul : tu vas écrire du code qui marche mais pas comprendre. Utilise l'IA en co-pilote APRÈS le cours, pas à la place.
- ❌ **Sauter Three.js vanilla pour aller direct à R3F** : tu vas être perdu sur tout ce qui dépasse les helpers Drei. Comprendre Three.js d'abord est un investissement de 40h qui te débloque tout le reste.
- ❌ **Vouloir faire un Awwwards en 6 semaines au mois 1** : tu vas brûler. Construis par étapes.
- ❌ **Copier-coller du Codrops sans comprendre** : tu auras une démo qui marche mais tu ne pourras pas la modifier.
