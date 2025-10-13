# astro-jsx TODO

Based on specification v0.1 - Server-only JSX runtime for Astro

## 🎯 Phase 1: Core Runtime Implementation

### 1.1 Basic JSX Runtime (`src/runtime/`)
- [x] Implement `jsx` function (automatic JSX transform)
  - [x] Handle string types (HTML elements)
  - [x] Handle function types (components)
  - [x] Props normalization (minimal)
  - [x] Key parameter retention (for future use)
- [x] Implement `jsxs` function (multi-child variant)
- [x] Implement `Fragment` component
- [x] Create core node structure types
  - [x] Element node type
  - [x] Component node type
  - [x] Fragment node type
  - [x] HtmlNode type (for raw HTML)

### 1.2 Raw HTML API
- [x] Implement `html(raw: string)` function
  - [x] Create HtmlNode type with __html marker
  - [x] Type definition to exclude from attributes
  - [x] Documentation on Astro `set:html` equivalence
- [x] Add runtime guard against attribute usage
  - [x] Error message: `html() cannot be used in attributes`

## 🎯 Phase 2: Attribute Handling

### 2.1 Core Attributes
- [x] `class` attribute support
  - [x] Accept string type
  - [x] Accept string[] type
  - [x] Accept Record<string, boolean> type
  - [x] Store raw value (no normalization in runtime)
- [x] `style` attribute support
  - [x] Accept string type
  - [x] Accept object { [prop: string]: string | number }
  - [x] Store raw value (no normalization in runtime)

### 2.2 Boolean Attributes
- [x] Store boolean values as-is
- [x] Document renderer responsibility for presence/absence

### 2.3 Unknown Attributes
- [x] Pass-through mechanism for unknown attributes
- [x] Document ESLint rules needed for safety

## 🎯 Phase 3: Children Handling

### 3.1 Basic Children Types
- [x] Support string children
- [x] Support number children
- [x] Support boolean children (render as empty)
- [x] Support null/undefined (render as empty)
- [x] Support HtmlNode children
- [x] Support nested arrays of children

### 3.2 Async Children
- [x] Support Promise<Child> type
- [x] Document renderer responsibility for await
- [x] Type definitions for async children

### 3.3 Component Children
- [x] Support function components as children
- [x] Document renderer execution responsibility
- [x] Handle component return types (element/array/Promise)

## 🎯 Phase 4: TypeScript Definitions

### 4.1 Core JSX Types (`src/runtime/jsx-runtime.d.ts`)
- [x] Define JSX namespace
- [x] Define IntrinsicElements (v0.1: permissive with any)
- [x] Define Element type
- [x] Define ElementChildrenAttribute
- [x] Define LibraryManagedAttributes

### 4.2 Attribute Type Safety
- [x] Exclude HtmlNode from attribute value types
- [x] Type tests for compile-time rejection
- [x] Document planned v0.2 strictness improvements

### 4.3 Export Types
- [x] Export JSX types from runtime
- [x] Export component prop types
- [x] Export HtmlNode type

## 🎯 Phase 5: Render Pipeline

### 5.1 `renderToString()` MVP
- [ ] Implement `renderToString()` with escaped string output
- [ ] Normalize void elements, boolean attributes, and empty children
- [ ] Support `class` / `style` minimal serialization rules

### 5.2 Safety & Diagnostics
- [ ] Fail-fast when `html()` is encountered in attributes
- [ ] Provide actionable error messages with doc references
- [ ] Add snapshot/fixture coverage for renderer edge cases

### 5.3 Streaming Readiness (v0.3 Prep)
- [ ] Draft `renderToStream` API surface (Node/Web Streams)
- [ ] Identify buffering/flush strategy and TODO markers
- [ ] Capture known gaps for v0.3 epic handoff

## 🎯 Phase 6: Plugin & Actions Integration

### 6.1 Astro Plugin Scaffold
- [ ] Detect `.astro` `client:*` usage during build
- [ ] Inject SSR island markers and props JSON payloads
- [ ] Respect `compat.acceptClassName` option during transform

### 6.2 Delegated Actions Runtime
- [ ] Implement actions runtime with delegated `click`/`input`/`change`/`submit`
- [ ] Ensure per-event delegation setup and teardown
- [ ] Provide virtual module entry for client bundles

### 6.3 Serialization Safety
- [ ] Enforce JSON-safe props with 32KB per-island default cap
- [ ] Emit descriptive errors for non-serializable values
- [ ] Surface diagnostics for prop size overruns in dev

### 6.4 Static Analysis & Build Guards
- [ ] Detect inline event handlers and fail build with guidance
- [ ] Block unsupported `client:*` events with helpful messaging
- [ ] Integration test coverage across `client:load/idle/visible/media`

### 6.5 Examples & DX Hooks
- [ ] `examples/astro-minimal` (SSR only) wired to plugin build
- [ ] `examples/astro-actions` showcasing delegated events
- [ ] Dev overlay or logging for island boundaries & JS budget

## 🎯 Phase 7: Build & Testing Infrastructure

### 7.1 Build Configuration
- [x] Configure TypeScript for ESM output
- [x] Setup exports map in package.json
- [x] Configure jsx-runtime and jsx-dev-runtime exports
- [x] Ensure tree-shaking friendly bundles

### 7.2 Unit Tests
- [x] jsx/jsxs function tests
- [x] Fragment tests
- [x] html() function tests
- [x] Attribute normalization tests
- [x] Children handling tests
- [x] Type safety tests (compile-time)
- [x] Snapshot tests for node structures
- [ ] Renderer unit tests covering escape/void/class/style
- [ ] Plugin/actions unit tests for serialization guards

### 7.3 Integration Tests
- [x] Test with Astro's jsx configuration
- [x] Test with automatic JSX transform
- [x] Test className compatibility mode
- [x] Test async component rendering preparation
- [ ] End-to-end actions coverage across browsers/environments

## 🎯 Phase 8: Documentation

### 8.1 API Documentation
- [ ] Document jsx/jsxs/Fragment usage
- [ ] Document html() API and safety model
- [ ] Document compatibility options
- [ ] Mental model comparison with Astro's `set:html`
- [ ] Document `renderToString()` contract and limitations
- [ ] Document actions lifecycle and supported events

### 8.2 Migration Guides
- [ ] From hono/jsx migration guide
- [ ] From React SSR migration guide
- [ ] className → class transition guide
- [ ] Actions-first migration tips for existing Astro islands

### 8.3 Configuration Examples
- [ ] tsconfig.json setup example
- [ ] Vite configuration example
- [ ] Astro integration example
- [ ] Example actions wiring & hydration walkthrough

## 🎯 Phase 9: Error Handling & DX

### 9.1 Error Messages
- [ ] Clear error for `html()` in attributes
- [ ] Warning system for dangerous patterns
- [ ] Development vs production error behavior
- [ ] Link errors to troubleshooting docs

### 9.2 Development Experience
- [ ] Source maps support
- [ ] Helpful error stack traces
- [ ] Component name preservation in dev
- [ ] Dev inspector for delegated action targets

## 🎯 Phase 10: ESLint Rules (Companion Package)

### 10.1 Core Rules
- [ ] `no-raw-html-in-attributes` rule
- [ ] `no-ssr-event-handlers` rule
- [ ] `prefer-class-over-className` rule
- [ ] `no-inline-event-handlers` rule (actions focus)
- [ ] Rule configuration presets

### 10.2 Documentation
- [ ] Rule documentation
- [ ] Configuration examples
- [ ] Integration with existing ESLint setups

## 🎯 Phase 11: Performance & Optimization

### 11.1 Runtime Performance
- [ ] Minimize object allocations
- [ ] Optimize props normalization path
- [ ] Benchmark against hono/jsx baseline
- [ ] Measure delegated actions overhead

### 11.2 Bundle Size
- [ ] Measure runtime footprint
- [ ] Ensure tree-shaking works
- [ ] Document size comparison with alternatives
- [ ] Track client JS emitted by actions runtime

## 🎯 Phase 12: Release Preparation

### 12.1 Quality Assurance
- [ ] Complete test coverage (>90%)
- [ ] No TypeScript errors
- [ ] ESLint compliance
- [ ] Performance benchmarks documented
- [ ] Actions end-to-end checks recorded

### 12.2 Documentation Review
- [ ] README completeness
- [ ] API documentation review
- [ ] Example code validation
- [ ] Migration guide testing
- [ ] Actions FAQ & troubleshooting validated

### 12.3 Release Checklist
- [ ] Version bump
- [ ] Changelog update
- [ ] NPM publish preparation
- [ ] GitHub release draft
- [ ] ADR covering actions/SSR strategy merged

## ✅ Definition of Done Tracking

### v0.1 (MVP + actions 最小)
- [ ] SSR 安定: `renderToString()` カバレッジと主要タグ snapshot
- [ ] `client:*` actions 委譲が `load/idle/visible/media` で動作
- [ ] 誤用 (`html()` 属性/インライン関数/非対応イベント/非直列化) が型 or ビルドで停止
- [ ] Docs と examples で NO JS by default と `set:html` ↔ `html()` の差分を解説

### v0.2 (Hardening & DX)
- [ ] Renderer と actions のエラーメッセージが統一フォーマット
- [ ] Lint ルールが CI で有効になり誤用を検知
- [ ] Dev 可視化 (島境界・配布 JS) がデフォで利用可能

### v0.3 (Streaming & Actions 安定化)
- [ ] `renderToStream` が Node/Web Streams 対応でベーシック要件を満たす
- [ ] Actions runtime が再試行・スロットリングを備え、ロギングが本番安全
- [ ] 大規模 props の分割注入オプションとドキュメントが提供される

### v0.4 (Optional Bridges & Sanitize)
- [ ] `hydrate: 'preact'` オプションが SSR 整合性テストを通過
- [ ] `sanitize` プリセットとポストプロセスフックが設定可能
- [ ] セキュリティまわりの ADR / ガイドラインが公開

## 📊 Success Metrics

- [ ] All jsx/jsxs/Fragment/html APIs functional
- [ ] Type safety for `html()` exclusion from attributes
- [ ] Compatibility mode working (`className` → `class`)
- [ ] `renderToString()` baseline benchmarks captured
- [ ] Actions runtime adds <1 KB gzipped by default
- [ ] All test suites passing
- [ ] Documentation complete
- [ ] Zero runtime dependencies

## 🚧 Future Considerations (v0.2+)

- [ ] HTML attribute type strictness
- [ ] Sanitization presets for `html()`
- [ ] Streaming optimizations
- [ ] Advanced diagnostics in dev mode
- [ ] Performance profiling tools
- [ ] Optional preact bridge hardening & hooks support

## Notes

- **Priority**: Focus on Phases 1-6 for initial v0.1 release
- **Testing**: Each phase should include comprehensive tests
- **Documentation**: Update docs as each phase completes
- **Review**: Code review required before marking phase complete
