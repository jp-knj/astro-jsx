# Raw HTML via `html()`

The `html()` helper returns a branded value that signals "this string is trusted HTML". It is the astro-jsx equivalent of Astro's [`set:html`](https://docs.astro.build/en/reference/directives-reference/#sethtml) directive:

```ts
import { html, jsx } from 'astro-jsx/runtime';

const markup = html('<em>Hello</em>');
const div = jsx('div', { children: markup });
```

## Usage constraints

- Use `html()` sparingly and only with content you have already sanitised.
- Pass the resulting value to `children` (or nested inside children arrays/promises). It is **strictly forbidden** in attribute slots.
- Attempting to provide a branded HTML value to an attribute (for example, `class={html('<b>')}`) throws an immediate error: `html() cannot be used in attributes` to guard against injection attacks.
- The `HtmlNode` type (`{ __html, __brand: 'HtmlNode' }`) is excluded from attribute types at compile-time, providing TypeScript-level safety.

## Escaping behaviour

- **Normal text nodes**: Renderers must HTML-escape `& < > " '` characters **once at serialisation time**.
- **`html()` content**: Passed through **without any escaping**. The renderer must detect the branded shape and emit the raw HTML directly.
- **Double-escaping prevention**: The runtime and renderers ensure escaping happens **exactly once** at the final serialisation point, never during intermediate processing.

## Security considerations

- Never pass user-generated content directly to `html()` without proper sanitisation.
- Consider using modern linting tools like Biome with custom rules to detect unsafe `html()` usage patterns in your codebase.
- Future releases may include built-in safety checks for common XSS patterns (v0.2).

Internally, `html()` mirrors the way `set:html` skips string escaping. By centralising the escape hatch behind a branded value, downstream renderers can spot raw HTML and handle it consistently.
