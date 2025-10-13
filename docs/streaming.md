# Streaming Rendering Design (Draft)

## Goals

- Provide a `renderToStream` API that mirrors the `renderToString` semantics while enabling progressive delivery.
- Support both Node.js `Readable` streams and Web Streams so the API works in Astro's SSR adapter layer and edge runtimes.
- Preserve the existing renderer guarantees (single-pass escaping, void-element handling, diagnostics) without duplicating logic.

## Proposed API Surface

```ts
import type { RenderToStreamResult } from 'astro-jsx/render';

export interface RenderToStreamOptions {
  signal?: AbortSignal;
  /** Flush buffered chunks after this many bytes (default: 16 KB). */
  highWaterMark?: number;
  /** Enable diagnostic hooks when the stream completes or aborts. */
  onComplete?: (metrics: RenderToStreamMetrics) => void;
}

export interface RenderToStreamMetrics {
  bytesWritten: number;
  chunks: number;
  aborted: boolean;
}

export function renderToNodeStream(
  input: Child | Children,
  options?: RenderToStreamOptions,
): RenderToStreamResult<NodeJS.ReadableStream>;

export function renderToWebStream(
  input: Child | Children,
  options?: RenderToStreamOptions,
): RenderToStreamResult<ReadableStream<Uint8Array>>;

export interface RenderToStreamResult<TStream> {
  stream: TStream;
  /** Resolve once the stream flushes all buffered output. */
  completed: Promise<RenderToStreamMetrics>;
  /** Cancel in-flight rendering (propagates AbortError). */
  cancel(reason?: unknown): void;
}
```

### Usage Sketch (Node)

```ts
import { renderToNodeStream } from 'astro-jsx/render';

const { stream, completed } = renderToNodeStream(tree, {
  highWaterMark: 32 * 1024,
});

stream.pipe(res);
await completed;
```

### Usage Sketch (Web Stream)

```ts
import { renderToWebStream } from 'astro-jsx/render';

const { stream, cancel } = renderToWebStream(tree, { signal: context.request.signal });
return new Response(stream, {
  headers: { 'Content-Type': 'text/html; charset=utf-8' },
});
```

## Buffering & Flush Strategy

- Default to a 16 KB chunk size to align with Node's `stream.Writable` defaults; expose `highWaterMark` override.
- Use the existing `convertValue` generator but emit strings into a `BufferBuilder` that flushes once the size threshold is reached.
- For Promises:
  - Await sequentially (same as `renderToString`) but flush buffered output before awaiting slow children to maximise early bytes.
  - If a Promise rejects, emit a structured error event and abort the stream.
- TODO markers in implementation:
  - `TODO(v0.3): support HTML comment flushing for suspense placeholders.`
  - `TODO(v0.3): investigate parallel resolution for sibling async children.`
  - `TODO(v0.3): expose hook for instrumentation (server timing headers).`

## Known Gaps / Follow-up Items

- Streaming HTML requires specialised escaping for `<script>` and `<style>` if we add support in v0.3 (tracked in 5.3 backlog).
- Need adapter-specific helpers for environments that only support Web Streams but expect `Response` objects (Edge).
- Error boundaries for async child failures are not yet designed; current plan aborts the whole stream.
- Integration tests should cover:
  - Slow async components (backpressure scenarios).
  - Interleaving raw HTML (`html()` values) to ensure zero-copy writes.
  - Aborted requests (client disconnect).
- Documentation work: author guidance on minimising waterfalls when using streaming.

