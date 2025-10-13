# Children Handling

astro-jsx keeps the runtime lightweight and defers rendering decisions to adapters, but it still normalises child values so renderers receive predictable shapes.

## Supported primitives
- `string` values are preserved with no escaping; renderers should HTML-escape when serialising unless the value is wrapped in `html()`.
- `number` values, including `0`, are passed through untouched.

## Empty-like inputs
- `boolean`, `null`, and `undefined` children collapse to "no output"—the runtime removes the `children` prop entry entirely. This mirrors React/Preact and simplifies `children ?? []` coercions downstream.

## Raw HTML nodes
- Values returned from `html()` survive as-is inside `children`. Renderers must spot the branded `{ __html, __brand: 'HtmlNode' }` shape and opt out of escaping when emitting markup.

## Nested arrays
- Nested arrays are flattened in insertion order. Empty slots (booleans, `null`, `undefined`) are dropped during the flattening process, so renderers can iterate with a simple `.forEach` without extra guarding.

## Async children
- Promises are preserved verbatim; the runtime never awaits them. Renderers decide whether to `await`, stream, or reject pending children. This keeps astro-jsx unbiased toward specific rendering models (streaming SSR vs. blocking render).
- Promises can appear alongside synchronous children or be nested inside arrays. Flattening stops at the promise boundary so adapters can control resolution timing.
- v0.1 uses **depth-first sequential await** strategy for resolution. When a Promise rejects, the error propagates up to the `renderToString` caller for handling.
- Streaming support is planned for v0.3 with error recovery strategies.

## Component children
- Function components passed as children are stored as component nodes. The runtime does **not** invoke them—execution timing is the renderer's responsibility.
- When invoked, component children can return the same shapes as top-level components: a single node, an array of nodes, or a promise that resolves to either. Renderers should normalize those return values using the same rules they apply elsewhere.

## Renderer expectations
- The runtime never clones child nodes; adapters are free to re-wrap or hydrate the normalised values if they need immutability guarantees.
- Future work may introduce first-class helpers around async child handling (timeouts, suspense-style wrappers). For now, adapters should validate that any resolved value matches the `Child` contract.
- Text nodes should be HTML-escaped by the renderer when serialising (using standard escaping for `& < > " '`), unless wrapped in `html()`.
- **Special elements**: `<script>` and `<style>` children are **prohibited in v0.1** (fail-fast). If needed in future releases, they will require dedicated escaping rules defined separately.
