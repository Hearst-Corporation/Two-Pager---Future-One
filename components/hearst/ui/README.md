# components/hearst/ui — primitives UI

Vocabulaire UI partagé du cockpit Oracle. **NE PAS recoder** un bouton/carte/table/champ
en inline : importer ces primitives. Tokens `--cp-*` uniquement (cf. `cp-tokens.css`).

```js
import { Button, Card, Table, Row, Cell, Field, Badge, SectionHead, Eyebrow, KpiGrid, KpiCard }
  from '@/components/hearst/ui';
```

| Primitive | Remplace l'inline | Props clés |
|---|---|---|
| `Button` | `govBtn`/`useBtn`/`navBtn`/`tabBtn`/`addBtn`/`validateBtn`/`secBtn`/`delBtn` | `variant` (primary·secondary·ghost·muted·danger), `size` (sm·md·lg), `href`, `disabled`, `block` |
| `Card` | classe `.cp-card` + `S.card`/`S.kpiCard` inline | `padding` (sm·md·lg), `accent`, `hover`, `as` |
| `Table` + `Row`/`Cell`/`THead` | `th`/`td`/`tdLabel` recodés ×5 | `head` (auto thead), `scroll` ; `Cell` : `header`, `label` |
| `Field` | `fieldLabel` + `input`/`select`/`textarea` du CRUD sources | `label`, `type` (text·number·url·date·select·textarea), `required`, `options` |
| `Badge` | pastilles statut inline | `tone` (neutral·accent·success·warning·danger), `pill` |
| `SectionHead` | `SectionHeading`/`sectionHead`/`SectionHead`/`boardHead` ×4 | `title`, `num`, `eyebrow`, `hint`, `level` |
| `Eyebrow` | `EYEBROW`/`eyebrow`/`kicker` inline | `accent`, `block` |
| `KpiGrid` | `kpiGrid`/`statRow`/`secondaryKpis` | `cols` (défaut auto-fit) — enfants = `KpiCard` |
| `KpiCard` | (existant, réexporté) | `label`, `value`, `format`, `size`, … |

**Règles** : couleur → token `--cp-*` (jamais hex/rgba/`--ct-`/`--color-`, gardé par `lint:cockpit`).
Tout nouveau token → `cp-tokens.css` (gardé par `lint:tokens`).
