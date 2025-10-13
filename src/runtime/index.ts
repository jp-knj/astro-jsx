// Import types for re-export
import './types/jsx';

// Import from organized modules
import { createRuntime } from './config/runtime';
import { Fragment } from './core/fragment';

// Create default runtime instance
const defaultRuntime = createRuntime();

// Export public API
export const configure = defaultRuntime.configure;
export const getRuntimeConfig = defaultRuntime.getConfig;
export const jsx = defaultRuntime.jsx;
export const jsxs = defaultRuntime.jsxs;
export const jsxDEV = defaultRuntime.jsxDEV;
export const html = defaultRuntime.html;

// Export Fragment and utilities
export { Fragment };
export { createRuntime };

// Export functions for advanced use cases
export { createElement } from './core/create-element';
export { createHtmlNode } from './core/html';
export { normalizeChildren, appendChild } from './core/children';

// Re-export types
export type {
  // Node types
  ElementNode,
  ComponentNode,
  FragmentNode,
  HtmlNode,
  JSXNode,
  JSXElementType,
  ComponentType,
  // Props and attributes
  Children,
  Child,
  ClassAttributeValue,
  StyleAttributeValue,
  AttributeValue,
  FragmentProps,
} from './types/nodes';

export type {
  RuntimeConfig,
  RuntimeState,
} from './types/runtime';

export type {
  PropsFor,
  IntrinsicProps,
  EventHandler,
} from './core/create-element';

// Type guards (for advanced use)
export {
  hasType,
  isElementNode,
  isComponentNode,
  isFragmentNode,
  isJSXNode,
} from './validation/guards';

export { isHtmlNode } from './validation/attributes';
