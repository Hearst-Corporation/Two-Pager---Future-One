# Product experiences — landing pages 3D commerciales

Sites où la 3D sert à vendre un produit/service réel (pas juste à montrer du skill).
Curatée mai 2026.

## Cas d'école : Apple-tier

### Apple — pages produit (iPhone, Vision Pro, Mac)
- **URL** : https://www.apple.com/iphone/
- **Stack** : WebGL custom + scroll-driven + USDZ pour AR
- **Pourquoi** : référence absolue du "scrollytelling produit". Chaque scroll = nouvelle scène, transitions invisibles.
- **Extraire** : pinning de sections, parallax multi-layer, vidéos vs WebGL hybride.

### Bang & Olufsen
- 3D produits ultra haut de gamme. Matériaux PBR léchés.
- **Extraire** : qualité des matériaux (cuir, alu, tissu), HDR environment maps.

---

## Tech / SaaS

### Linear
- **URL** : https://linear.app
- **Stack** : React + WebGL pour les hero animations + Framer Motion
- **Pourquoi** : prouve que le SaaS B2B peut être visuellement *beau*. Subtil mais présent.
- **Extraire** : light WebGL en hero, gradients animés, micro-interactions.

### Vercel
- 3D parcimonieuse mais signature. Triangle hero, deploy globe.
- **Extraire** : "moins c'est plus" — un seul effet 3D mémorable suffit.

### Stripe
- Le gradient animé de Stripe est devenu un mème → preuve qu'un seul effet bien fait définit une marque.

### Arc Browser (The Browser Company)
- **URL** : https://arc.net
- Storytelling produit + 3D ponctuelle + typographie forte.
- **Extraire** : comment alterner sections "marketing classique" et sections "expérience".

---

## E-commerce 3D

### Nike
- 3D shoe configurators sur certaines collections.
- **Extraire** : product viewer rotation, color picker temps réel.

### Lusion x Nike collabs (voir lusion.co/projects)
- Cas d'école campagnes Nike avec WebGL.

### Beats by Dre — pages produit
- Hero 3D + spec page tech.

---

## Automotive (la catégorie qui pousse le plus)

### Lando Norris (sport mais traité comme produit)
- Voir `awards-2025-2026.md`.

### Porsche, Audi, Lamborghini configurators
- Configurateurs en ligne 3D temps réel.
- **Extraire** : LOD (level of detail), streaming progressif, color/wheel/options en temps réel.

---

## Game studios / entertainment

### Rockstar Games (GTA VI page)
- Site simple mais rare → l'attente fait l'effet. Anti-pattern utile : *parfois moins de 3D = plus d'impact*.

### Riot Games — pages champions League of Legends
- Hero 3D character + cinematic.

### Larian Studios (Baldur's Gate)
- Storytelling fort + assets pré-rendus + ambiance.

---

## Patterns produit qui marchent

| Pattern | Quand l'utiliser |
|---------|------------------|
| Hero 3D objet flottant + rotation auto | Produit physique premium |
| Scroll = découper le produit / l'explorer | Tech, vehicles, watches |
| Configurateur live (couleur, matériaux) | E-commerce premium |
| Globe / map 3D pour "dimension globale" | SaaS infra (Vercel, Cloudflare style) |
| Hero plat + 3D dans les sections internes | SaaS B2B (Linear pattern) |

## Anti-patterns produit

- **3D pour cacher un produit faible** : la 3D ne sauvera pas une mauvaise value prop.
- **3D qui empêche d'acheter** : si le bouton CTA est noyé dans la scène, c'est raté.
- **Démo desktop only** : si ton produit cible mobile (e-commerce surtout), la 3D doit fonctionner sur iPhone moyen ou être conditionnelle.
