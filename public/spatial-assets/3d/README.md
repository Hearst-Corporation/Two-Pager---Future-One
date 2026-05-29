# ORACLE — 3D Spatial Asset Drop Zone

Externally-produced **GLB** geometry (Gemini / Blender pipeline) lands here.
One file per catalog asset, named from its registry id with dots → dashes:

```
data-halls/hall-50mw.glb
power/power-substation.glb
cooling/cooling-liquid_plant.glb
network/network-fiber_entry.glb
sovereign/sov-govcloud.glb
```

## Governing rule

A GLB is **never** rendered just because the file exists. It renders only when
its entry in `lib/spatial/assets/manifest.ts` has:

```
status: 'approved'   AND   approved: true
```

Until then, every view shows a clean institutional placeholder
(`components/hearst/visuals/SpatialPlaceholder.jsx`), gated by
`VISUAL_PLACEHOLDER_MODE` (default `true`).

## Promotion workflow (per asset)

1. Drop the `.glb` in the right category folder (path must match the manifest
   `file_path`).
2. Set `status: 'candidate'`, `source_tool`, `created_by`, `version`, `license`.
3. Validate dimensions/scale/anchor/ports against the catalog footprint.
4. When vetted: `status: 'approved'`, `approved: true`, `last_validated_at`.
5. Set `NEXT_PUBLIC_VISUAL_PLACEHOLDER_MODE=false` to switch approved views to
   their real renderer (still per-asset gated by `canRenderView`).

`.gitkeep` files keep the empty category folders in version control.
