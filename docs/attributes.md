# Attribute Handling

## Boolean attributes
- astro-jsx keeps boolean attribute values untouched on the node it returns. For example, `jsx('input', { disabled: true })` yields `props.disabled === true`, while passing `false` leaves `props.disabled === false`.
- Rendering layers that consume astro-jsx nodes must decide whether a boolean maps to presence/absence when serialising to HTML (e.g. emit `disabled` when the value is truthy, omit when falsy).
- Because the runtime does not normalise the value, downstream renderers can implement framework-specific rules (including collapsing to empty strings, omitting attributes, or passing through the literal boolean in other environments).

## Unknown attributes
- Props that are not part of the runtime's `class`/`style` handling are passed through untouched. This mirrors React's behaviour and keeps astro-jsx agnostic about future HTML/DOM attributes.
- Consumers should lint for project-specific restrictions. We recommend using modern linting tools like Biome or Astro's built-in checks to prevent typos and dangerous attributes. Future releases may include specific rules for SSR safety (e.g., blocking DOM events that cannot run server-side or guarding against HTML injection).
- Renderers may still choose to filter or coerce unknown props at serialization time if targeting a stricter output surface (e.g. SVG or framework-specific adapters).

## Attribute serialisation order

For stable output (important for caching and snapshot testing), attributes are serialised in this fixed order:

1. `id`
2. `class`
3. `style`
4. Common attributes: `name`, `type`, `value`, `href`, `src`, `alt`
5. `data-*` attributes (alphabetically sorted)
6. `aria-*` attributes (alphabetically sorted)
7. Other known HTML/SVG attributes (alphabetically sorted)
8. Unknown attributes (alphabetically sorted, may trigger warnings in strict mode)

## Special attribute handling

### class attribute
- Accepts: `string | string[] | Record<string, boolean>`
- Arrays are joined with spaces (empty values excluded)
- Objects include keys where value is truthy
- Duplicates are removed
- HTML escaping happens **once** at serialisation

### style attribute
- Accepts: `string | Record<string, string | number>`
- Objects are converted to `kebab-case:value` pairs joined with `;`
- Values of `null`, `undefined`, or empty string are omitted
- No automatic unit suffixes are added (pass `"10px"` not `10`)
- HTML escaping happens **once** at serialisation

### Forbidden patterns
- **`className` is prohibited** - Use `class` instead. This is enforced at:
  - TypeScript level (type error)
  - Build time (compilation error)
  - Runtime (throws error)
- **`HtmlNode` in attributes** - `html()` values cannot be used as attribute values, only in children

## Roadmap for stricter typing (v0.2)
- Attribute unions will narrow towards the HTML standard so TypeScript can flag typos (e.g. `clas` vs `class`).
- Event handler props will become opt-in, matching the renderer contract instead of accepting `any`.
- HtmlNode will stay excluded from attribute slots at the type level; future releases will surface tailored error helpers to improve DX when it leaks through.
