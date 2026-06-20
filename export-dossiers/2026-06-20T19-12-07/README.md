# Export base de données — Oracle / HEARST
Généré : 2026-06-20T19:12:07.053Z
Projet : HEARST Qatar AI & Data Center Hub (f36225e9-6c67-4c41-b836-943680c9f865)

## Contenu
- **scenarios** : 155
- **memos** : 31
- **memos_with_detail** : 31
- **sources** : 48
- **deals** : 8

## Dossiers
- `project.json` — projet HEARST (sponsor, partenaires, pays…)
- `scenarios/` — 1 JSON par scénario : inputs + **PNL calculé** (revenue/power/opex/EBITDA/FCF/DSCR) + IRR/NPV/MOIC/capex
- `scenarios/pnl-csv/` — **PNL année par année en CSV** (Excel/Numbers)
- `scenarios/_index.json` — table récap (IRR, NPV, MOIC, EBITDA, DSCR, capex) par scénario
- `memos/` — memos stratégiques : `.json` (memo_json complet), `.md` si rendu, **`.html` imprimable**
- `sources.json` — evidence register
- `deals.json` — archétypes de deals
