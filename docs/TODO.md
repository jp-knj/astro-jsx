# astro-jsx TODO

Based on specification v0.1 - Server-only JSX runtime for Astro

## Architecture Decisions

- **JSX Transform Mode**: `preserve` + custom SWC transformer (recommended)
- **Build-time Safety**: Detect dangerous patterns at compile time
- **Optimization Strategy**: Leverage SWC's Rust-based speed for optimizations
- **Integration Approach**: Astro Integration handles all configuration automatically
- **Security First**: Fail fast on dangerous patterns (className, html() in attrs, etc.)

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
- [x] Implement `renderToString()` with escaped string output
- [x] Normalize void elements, boolean attributes, and empty children
- [x] Support `class` / `style` minimal serialization rules
- [x] Implement attribute serialization order:
  1. `id`
  2. `class` 
  3. `style`
  4. Common attributes (`name`, `type`, `value`, `href`, `src`, `alt`)
  5. `data-*` attributes (alphabetically)
  6. `aria-*` attributes (alphabetically)
  7. Other known attributes (alphabetically)
  8. Unknown attributes (alphabetically, with warnings)

### 5.2 Safety & Diagnostics
- [x] Fail-fast when `html()` is encountered in attributes
- [x] Block `className` usage (runtime error)
- [x] Block `dangerouslySetInnerHTML` 
- [x] Single-pass HTML escaping at final serialization
- [x] Provide actionable error messages with doc references
- [x] Add snapshot/fixture coverage for renderer edge cases

### 5.3 Streaming Readiness (v0.3 Prep)
- [x] Draft `renderToStream` API surface (Node/Web Streams)
- [x] Identify buffering/flush strategy and TODO markers
- [x] Capture known gaps for v0.3 epic handoff

## 🎯 Phase 6: Plugin & Actions Integration

### 6.1 Astro Plugin Scaffold
- [x] Auto-configure `jsx: preserve` in tsconfig
- [x] Integrate SWC transformer plugin (falls back gracefully when @swc/core is missing)
- [x] Detect `.astro` `client:*` usage during build
- [x] Inject SSR island markers and props JSON payloads
- [x] Respect `compat.acceptClassName` option during transform
- [x] Build-time validation for dangerous patterns

### 6.2 Delegated Actions Runtime
- [x] Implement actions runtime with delegated `click`/`input`/`change`/`submit`
- [x] Ensure per-event delegation setup and teardown
- [x] Provide virtual module entry for client bundles

### 6.3 Serialization Safety
- [x] Enforce JSON-safe props with 32KB per-island default cap
- [x] Emit descriptive errors for non-serializable values
- [x] Surface diagnostics for prop size overruns in dev

### 6.4 Static Analysis & Build Guards
- [x] Detect inline event handlers and fail build with guidance
- [x] Block unsupported `client:*` events with helpful messaging
- [x] Integration test coverage across `client:load/idle/visible/media`

### 6.5 Examples & DX Hooks
- [x] `examples/astro-minimal` (SSR only) wired to plugin build
- [x] `examples/astro-actions` showcasing delegated events
- [x] Dev overlay or logging for island boundaries & JS budget

## 🎯 Phase 7: SWC JSX Transformer

### 7.1 Core Transformation
- [ ] Transform preserve mode JSX to astro-jsx runtime calls
- [ ] Automatic jsx vs jsxs selection (single vs multiple children)
- [ ] Fragment transformation
- [ ] Component detection and proper handling

### 7.2 Build-time Validation
- [ ] Error on className usage (suggest class instead)
- [ ] Error on html() in attributes
- [ ] Error on event handlers without client:* directive
- [ ] Error on dangerouslySetInnerHTML
- [ ] Warn on unknown attributes
- [ ] Validate void elements don't have children

### 7.3 SWC-powered Optimizations
- [ ] Remove unnecessary Fragments (single child case)
- [ ] Hoist static props outside component
- [ ] Dead code elimination
- [ ] Inline small static components
- [ ] Constant folding for template literals

### 7.4 Developer Experience
- [ ] Accurate error locations with source maps
- [ ] Quick fix suggestions in error messages
- [ ] Fast builds (Rust performance)
- [ ] Preserve JSX for better debugging
- [ ] HMR-friendly transformations

### 7.5 Testing
- [ ] Transformation correctness tests
- [ ] Error detection test suite
- [ ] Optimization verification
- [ ] Performance benchmarks vs other transformers
- [ ] Edge case coverage (nested JSX, conditionals, etc.)

## 🎯 Phase 8: Build & Testing Infrastructure

### 8.1 Build Configuration
- [x] Configure TypeScript for ESM output
- [x] Setup exports map in package.json
- [x] Configure jsx-runtime and jsx-dev-runtime exports
- [x] Ensure tree-shaking friendly bundles

### 8.2 Unit Tests
- [x] jsx/jsxs function tests
- [x] Fragment tests
- [x] html() function tests
- [x] Attribute normalization tests
- [x] Children handling tests
- [x] Type safety tests (compile-time)
- [x] Snapshot tests for node structures
- [ ] Renderer unit tests covering escape/void/class/style
- [ ] Plugin/actions unit tests for serialization guards

### 8.3 Integration Tests
- [x] Test with Astro's jsx configuration
- [x] Test with automatic JSX transform
- [x] Test className compatibility mode
- [x] Test async component rendering preparation
- [ ] End-to-end actions coverage across browsers/environments

## 🎯 Phase 9: Documentation

### 9.1 API Documentation
- [ ] Document jsx/jsxs/Fragment usage
- [ ] Document html() API and safety model
- [ ] Document compatibility options
- [ ] Mental model comparison with Astro's `set:html`
- [ ] Document `renderToString()` contract and limitations
- [ ] Document actions lifecycle and supported events

### 9.2 Migration Guides
- [ ] From hono/jsx migration guide
- [ ] From React SSR migration guide
- [ ] className → class transition guide
- [ ] Actions-first migration tips for existing Astro islands

### 9.3 Configuration Examples
- [ ] tsconfig.json setup example
- [ ] Vite configuration example
- [ ] Astro integration example
- [ ] Example actions wiring & hydration walkthrough

## 🎯 Phase 10: Error Handling & DX

### 10.1 Error Messages
- [ ] Clear error for `html()` in attributes
- [ ] Warning system for dangerous patterns
- [ ] Development vs production error behavior
- [ ] Link errors to troubleshooting docs

### 10.2 Development Experience
- [ ] Source maps support
- [ ] Helpful error stack traces
- [ ] Component name preservation in dev
- [ ] Dev inspector for delegated action targets

## 🎯 Phase 11: Linting (Optional Biome Rules)

### 11.1 Core Rules
- [ ] `no-raw-html-in-attributes` rule
- [ ] `no-ssr-event-handlers` rule
- [ ] `prefer-class-over-className` rule
- [ ] `no-inline-event-handlers` rule (actions focus)
- [ ] Rule configuration presets

### 11.2 Documentation
- [ ] Rule documentation
- [ ] Configuration examples
- [ ] Integration with existing ESLint setups

## 🎯 Phase 12: Performance & Optimization

### 12.1 Runtime Performance
- [ ] Minimize object allocations
- [ ] Optimize props normalization path
- [ ] Benchmark against hono/jsx baseline
- [ ] Measure delegated actions overhead

### 12.2 Bundle Size
- [ ] Measure runtime footprint
- [ ] Ensure tree-shaking works
- [ ] Document size comparison with alternatives
- [ ] Track client JS emitted by actions runtime

## 🎯 Phase 13: Release Preparation

### 13.1 Quality Assurance
- [ ] Complete test coverage (>90%)
- [ ] No TypeScript errors
- [ ] ESLint compliance
- [ ] Performance benchmarks documented
- [ ] Actions end-to-end checks recorded

### 13.2 Documentation Review
- [ ] README completeness
- [ ] API documentation review
- [ ] Example code validation
- [ ] Migration guide testing
- [ ] Actions FAQ & troubleshooting validated

### 13.3 Release Checklist
- [ ] Version bump
- [ ] Changelog update
- [ ] NPM publish preparation
- [ ] GitHub release draft
- [ ] ADR covering actions/SSR strategy merged

## ✅ Definition of Done Tracking

### v0.1 (MVP + actions minimal)
- [ ] SSR stable: `renderToString()` coverage and major tag snapshots
- [ ] `preserve` + SWC transformer builds successfully
- [ ] Build-time security checks working (className, html() in attrs, etc.)
- [ ] Attribute order stability verified
- [ ] `client:*` actions delegation works for `load/idle/visible/media`
- [ ] Misuse (`html()` attrs/inline functions/unsupported events) stops at type or build
- [ ] Docs and examples explain NO JS by default and `set:html` ↔ `html()` differences

### v0.2 (Hardening & DX)
- [ ] Renderer and actions error messages in unified format
- [ ] Lint rules active in CI detecting misuse
- [ ] Dev visualization (island boundaries, JS budget) available by default
- [ ] SWC transformer optimizations verified in production

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
