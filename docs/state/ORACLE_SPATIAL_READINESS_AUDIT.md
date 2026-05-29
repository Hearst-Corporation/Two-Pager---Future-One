# ORACLE_SPATIAL_READINESS_AUDIT.md

**Verified:** 2026-05-29 · filesystem + imports + flags. Audit only — CampusScene NOT built.

## Actual state

### `lib/spatial/` (TypeScript foundation — pure, no rendering)
| File | Role | Contains geometry? | Contains business logic? |
|---|---|---|---|
| `tokens.ts` | colour/spacing tokens (DTCG `c(var,hex)` fallbacks) | no | no |
| `grid.ts` | metre grid + `Dimensions` type | math helpers only | no |
| `typography.ts` | font tokens | no | no |
| `board.ts` | board layout constants (margins, radius, stroke) | layout consts | no |
| `iso.tsx` | isometric projection helpers | **yes (iso math)** | no |
| `placeholder-mode.ts` | `VISUAL_PLACEHOLDER_MODE` gate + 7 view kinds + REQUIRED_ASSETS | no | no |
| `assets/schema.ts` | asset type schema | no | no |
| `assets/registry.ts` | `ALL_ASSETS` catalog ids | no | no |
| `assets/manifest.ts` | manifest derived from catalog; `approved` gate; `canRenderView()` | no | gate logic |
| `assets/catalog/*.ts` | 5 category catalogs (cooling/data-halls/network/power/sovereign) | dimensions/ports metadata | no |

### `components/hearst/visuals/` (the 7 view wrappers + placeholder)
- `SpatialPlaceholder.jsx` — pure SVG placeholder (no fake geometry). **This is what renders today.**
- 7 wrappers (Campus2D/3D, Power/Cooling flow, Regional, Scenario, Phasing) — **all delegate to `SpatialPlaceholder`**; real-renderer branch is a stub (`showReal` falls through).

### `public/spatial-assets/3d/`
- 5 category folders, each with `.gitkeep` only. **0 GLB files.** README present.

### `_quarantine/`
- 7 `.legacy.jsx` renderers (the old hand-drawn SVGs) + README. **Imported nowhere** (grep confirms only `visuals-preview` imports the live visuals).

## Determinations

| Question | Answer (verified) |
|---|---|
| What renders today? | `SpatialPlaceholder` only, in `visuals-preview` (the sole importer). Placeholder mode ON (flag absent → fail-safe). |
| What is placeholder? | All 7 spatial views. |
| What is reusable for CampusScene? | `grid.ts`, `iso.tsx`, `tokens.ts`, `typography.ts`, `board.ts`, the whole `assets/*` (schema/registry/manifest/catalog) — clean, framework-agnostic foundation. |
| What still contains geometry logic? | `iso.tsx` (iso projection math) and `assets/catalog/*` (dimensions/ports). Legacy geometry lives only in `_quarantine` (inert). |
| What still contains business logic? | Only `manifest.ts` `canRenderView()` approval gate. No financial/memo logic anywhere in spatial. |
| What is ready for CampusScene? | The asset manifest + approval gate + folder structure are ready to RECEIVE GLBs. The contract (`canRenderView`, `MANIFEST`, `REQUIRED_ASSETS`) is defined. |
| What is NOT ready? | No GLB assets exist (0 files). No Three.js renderer exists. No `showReal` implementation. Placeholder is the only path. |

**Net:** the spatial layer is a clean, inert scaffold gated OFF. Nothing renders geometry; nothing leaks into production views. Safe foundation, not yet a renderer.
