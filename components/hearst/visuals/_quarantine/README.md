# QUARANTINE — disabled legacy spatial renderers

These are the original hand-drawn SVG renderers. They are **disabled and not
imported anywhere** — they produced incorrectly-scaled / clipped / non-
institutional output and are NOT for presentation.

They are preserved here (not deleted) for reference only. Nothing in the app
imports this folder, so it is never compiled or shipped.

The active spatial views (`components/hearst/visuals/*.jsx`) render
`SpatialPlaceholder` until APPROVED 3D assets exist. The real renderers will be
rebuilt against the approved-asset manifest (`lib/spatial/assets/manifest.ts`),
not resurrected from this quarantine.
