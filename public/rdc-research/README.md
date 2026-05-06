# QF · Research & Development Complex — Photo Dossier

**Site pressenti pour l'implantation du Hub Futur One.**
Inspection cadastrale complète — Education City, Doha, Qatar.

Galerie navigable : http://localhost:5005/rdc-photos

---

## Architecture réelle (validée par photos)

Le complexe **n'est PAS** un assemblage de cubes blancs (comme on aurait pu le supposer
en s'inspirant du QF HQ d'OMA voisin). C'est un dispositif horizontal très différent,
avec une signature architecturale forte :

### Forme générale (vue zénithale — `aerial/drone_top_down_signature.jpg`)
- **Plan en double-arc symétrique** : deux ailes longues incurvées en miroir
- Reliées par une **épine centrale** (axe est-ouest)
- Encadrent **deux cours intérieures** plantées
- Bâtiment d'utilités (B3 / MEP) en retrait au sud
- Footprint global ≈ 200 m × 150 m

### Volumétrie (vues façades)
- **R+2 (3 niveaux)** sur la majeure partie — bandeaux vitrés horizontaux
- **Toiture plate** débordante avec **larges auvents en porte-à-faux** (signature)
- **Auvents inclinés** en métal blanc soutenus par colonnes circulaires fines
- Hauteur estimée : ~12-14 m (parapet inclus)

### Matériaux & langage
- **Façade principale** : **calcaire (limestone) clair** beige doré, en blocs réguliers
- **Façade longue (vitrage)** : **mur-rideau en verre teinté vert/turquoise** sur 3 niveaux
- **Vitrage cintré** suivant la courbure de l'arc (signature P+W)
- Quelques façades secondaires : **béton blanc** percé de petites ouvertures
- **Toiture/auvents** : tôle métallique blanche — bordures fines

### Hall principal (`interior/hall_monumental_staircase.jpg`)
- **Double hauteur** avec mur-rideau vertical sur toute la hauteur
- **Sols en marbre crème** poli
- **Escalier monumental** en pierre, garde-corps verre
- **Suspensions cylindriques** (drum lights) blanches
- Murs intérieurs en panneaux de bois clair

### Laboratoires (`labs/*`)
- **Paillasses centrales** (4-6 par labo) en îlots
- **Sorbonnes (fume hoods)** suspendues
- Mobilier blanc avec **accents verts HBKU** (poignées de tiroirs)
- Sols vinyle gris clair, plafonds techniques avec néons LED
- Équipements scientifiques : microscopes, séquenceurs, spectromètres

---

## Structure du dossier (37 fichiers)

```
public/rdc-research/
├── aerial/      9 photos · drones + satellite + Wikimedia
├── facade/      7 photos · façades extérieures et plaza
├── interior/    1 photo  · hall monumental
├── labs/        3 photos · paillasses, séquenceur, microscope
├── renders/     3 fichiers · renders Perkins+Will (pré-construction)
├── context/     9 photos · Education City voisinage (QF HQ, Ceremonial Court...)
└── plans/       (vide — plans CAO non publics)
```

---

## Sources

| Fournisseur | Type | Nb fichiers |
|---|---|---|
| Redco Construction Al Mana (entrepreneur D&B) | Photos officielles | 17 |
| Wikimedia Commons | Photos contexte + aerial | 12 |
| Esri World Imagery | Mosaïques satellite z18/z19 | 2 |
| Perkins+Will | Renders concept | 3 |

### URLs sources principales
- https://rcalmana.com/project/hamad-bin-khalifa-research-and-development-complex/
- https://commons.wikimedia.org/wiki/Category:Education_City
- https://www.archilovers.com/projects/193449/qatar-research-and-development-complex.html
- https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/

---

## Implications pour la modélisation 3D

La maquette Three.js sur `/rdc-3d` (premier jet) doit être **complètement refaite** pour
respecter la géométrie réelle :

1. Remplacer les 2 cubes parallèles par **2 ailes incurvées en double-arc**
2. Ajouter l'**épine centrale** reliant les ailes
3. Modéliser les **deux cours intérieures plantées**
4. Ajouter les **auvents inclinés en porte-à-faux** sur l'entrée principale
5. Façades : **limestone beige** + **mur-rideau vert turquoise** (pas blanc)
6. Toiture débordante plate (pas de parapet vertical haut)
7. R+2 (pas R+5) — bâtiment horizontal très étalé
