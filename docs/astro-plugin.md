# Astro Plugin Scaffold (WIP)

This document tracks the bootstrap state of the astro-jsx integration plugin. The current
implementation purposely does **not** transform code yet; it only sets up the integration
wiring so the remaining checklist items can be implemented incrementally.

## Current behaviour

- Registers an Astro integration (`src/plugin/index.ts`) that:
  - Forces TypeScript to keep JSX in `preserve` mode and point `jsxImportSource` to
    `astro-jsx/runtime`.
  - Automatically registers the runtime renderer via `addRenderer(rendererManifest)`, so fixture and
    user projects no longer need a bespoke `astro-jsx-renderer.mjs` entry.
  - Injects a Vite plugin scaffold before other transforms run.
- The Vite plugin (`src/plugin/transform.ts`) currently:
  - Logs any `.astro` file containing `client:*` directives.
  - Attempts to transform `.tsx`/`.jsx` files using `@swc/core` (if available);
    otherwise it falls back to pass-through with a single warning.
  - Warns when `className` is used and `compat.acceptClassName` is disabled (ahead of hard errors).
  - Emits an `astro-jsx-islands.json` asset summarising detected island markers for SSR payload injection.
  - Collects placeholder island payload metadata so future work can enqueue SSR markers.

## Next steps

1. Swap the no-op transform with an SWC-based pass that rewrites JSX, respects
   `compat.acceptClassName`, and emits diagnostics.
2. Emit island marker HTML plus JSON payloads using the collected metadata during `buildEnd`.
3. Wire up build-time validation (className/html/dangerous patterns) directly inside the transform.
4. Expose result structures so other parts of the integration (actions runtime, serialization safety)
   can hook into the same metadata.
5. Add automated tests covering `.astro` detection, compat options, and transform output once SWC is
   integrated.

Refer to `docs/TODO.md#61-astro-plugin-scaffold` for the full checklist.
