# Recipes — combos qui marchent par cas d'usage

Si tu sais ce que tu veux faire, voici la stack à dégainer. Chaque recette = combo testé en prod sur des sites primés 2025–2026.

---

## 🎯 Recette 1 — "Hero 3D produit qui tourne"
**Cas** : SaaS B2B, page produit. Un objet 3D flotte/tourne dans le hero, le reste est UI classique.

```
Next.js (App Router)
+ React Three Fiber + Drei
+ Framer Motion (animations UI)
+ Tailwind (UI)
+ Vercel (deploy)
```

**Composants Drei utiles** : `<Float />`, `<Environment preset="city" />`, `<ContactShadows />`, `<PresentationControls />`.

**Pattern** :
```jsx
<Canvas>
  <PresentationControls global polar={[-0.4, 0.2]}>
    <Float speed={2} rotationIntensity={0.5}>
      <Model />
    </Float>
    <Environment preset="city" />
    <ContactShadows position={[0, -1, 0]} blur={3} />
  </PresentationControls>
</Canvas>
```

**Référence visuelle** : pages produit Linear, Vercel, Resend.

---

## 🎯 Recette 2 — "Scrollytelling Apple-like"
**Cas** : produit physique premium. Le scroll fait évoluer une scène 3D (rotation, zoom, sections).

```
Next.js
+ R3F + Drei
+ Theatre.js + @theatre/r3f (timeline visuelle)
+ GSAP ScrollTrigger (sync scroll → timeline)
+ Lenis (smooth scroll)
+ Tailwind
```

**Workflow** :
1. Créer la scène R3F.
2. Ouvrir Theatre.js Studio dans le navigateur en dev.
3. Animer la caméra + objets visuellement, sauvegarder en JSON.
4. ScrollTrigger pousse la `position` Theatre en fonction du scroll.

**Référence** : pages iPhone Apple, Lando Norris site.

---

## 🎯 Recette 3 — "Site jouable / portfolio gamifié"
**Cas** : portfolio créatif, microsite event. L'utilisateur drive un personnage / explore une scène.

```
Next.js OU Vite (selon préférence)
+ R3F + Drei
+ @react-three/rapier (physique)
+ Zustand (state)
+ Tone.js OU Howler.js (audio)
+ Pas de smooth scroll
```

**Composants clés** : `<KeyboardControls />` (Drei), `<RigidBody />` (Rapier), `<PointerLockControls />` ou WASD custom.

**Référence** : Bruno Simon portfolio, Henry Heffernan, Messenger.

**Attention** : audio uniquement après interaction (autoplay policies). Toggle visible. Tutoriel onboarding obligatoire.

---

## 🎯 Recette 4 — "Microsite campagne Awwwards-tier"
**Cas** : campagne marketing courte (3-5 min), brand-led, partageable.

```
Vite + React (pas Next, pas besoin SSR)
+ R3F + Drei + postprocessing
+ Theatre.js
+ GSAP + ScrollTrigger
+ Lenis
+ Rive (motion graphics 2D overlay)
+ shaders custom GLSL
+ Tone.js (audio ambient)
+ Vercel / Cloudflare Pages
```

**Référence** : Lando Norris, Wanted For Nothing, sites Lusion.

**Budget temps** : 8-16 semaines à 2-3 personnes (1 dev WebGL, 1 motion designer, 1 art director).

---

## 🎯 Recette 5 — "Editorial scroll-driven (long-form storytelling)"
**Cas** : article narratif riche, présentation d'une marque/cause, journalisme immersif.

```
Astro OU Next.js
+ R3F (zones 3D ponctuelles, pas full-screen continu)
+ GSAP ScrollTrigger
+ Lenis
+ Custom CSS animations + Tailwind
+ MDX pour le contenu
```

**Pattern** : alternance sections plates (texte, image) et sections 3D pinnées. Pas de 3D continue → rythme + perf.

**Référence** : Pudding.cool, Hello Monday case studies, Locomotive sites.

---

## 🎯 Recette 6 — "Configurateur produit 3D"
**Cas** : e-commerce premium, sneakers, voitures, montres, mobilier.

```
Next.js
+ R3F + Drei (`<Center />`, `<OrbitControls />`, `<Environment />`)
+ Zustand (state du configurateur)
+ Drei `<Decal />` pour sticker / texture personnalisée
+ Stripe / Shopify côté commerce
```

**Composants Drei utiles** : `<MeshTransmissionMaterial />` (verre), `<MeshReflectorMaterial />` (sol), `<AccumulativeShadows />` (ombres réalistes).

**Attention** : modèle glTF DRACO, max 5MB. Préparer un viewer mobile dégradé.

---

## 🎯 Recette 7 — "Globe / map 3D infra-as-marketing"
**Cas** : SaaS infra (CDN, hosting, IA inference). Un globe avec des connexions.

```
R3F + Drei
+ three-globe OU custom shader globe
+ Framer Motion (UI)
+ JSON de data points
```

**Référence** : Vercel, Cloudflare, Resend, anciens sites Stripe.

**Trick** : tu peux bien souvent faire un globe avec une sphère + texture earth + lignes en `BufferGeometry`. Pas besoin de three-globe complet.

---

## 🎯 Recette 8 — "WebGPU avant-garde (compute, particules massives)"
**Cas** : tu veux être primé sur l'avant-garde technique. Sakura, foule, simulation fluide.

```
Vite + React
+ R3F WebGPURenderer
+ TSL (Three.js Shading Language)
+ postprocessing (compatible WebGPU)
+ Theatre.js
+ Fallback WebGL pour les navigateurs incompatibles
```

**Référence** : Ameen Abdullah sakura, Samsy cyberpunk.

**Avertissement** : prévoir un fallback ou un message "expérience optimale sur Chrome récent".

---

## ⚙️ Méta-règles

1. **Toujours commencer par un prototype Spline** si la 3D est exploratoire — quitte à tout réécrire en R3F après.
2. **Tester sur iPhone moyen (pas Pro)** dès la semaine 1. Si ça rame là, scope down.
3. **Ne jamais lancer en prod sans `prefers-reduced-motion`**.
4. **Loader < 3s ou storytelling de loader.** Au-delà sans contenu visuel, bounce.
5. **Audio toujours opt-in.**
6. **Lighthouse 70+ minimum** sur Performance même pour un site Awwwards (2026 = pas d'excuse).

---

## Pour Prese Hub spécifiquement

Pour la **présentation A3 print**, aucune de ces recettes ne s'applique : c'est du print, pas du web 3D.

**SI** un jour on veut faire la **version web companion** :
- Recette 5 (editorial scroll-driven) ou Recette 2 (scrollytelling Apple-like) seraient les meilleures.
- Stack idéale : Next.js + R3F + Theatre.js + GSAP + Lenis + Tailwind.
- Modéliser le datacenter / campus en glTF (Blender → DRACO export).
- Garder la même direction artistique que le print (tokens dans `app/globals.css`).
