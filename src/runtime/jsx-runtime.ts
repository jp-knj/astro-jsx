/**
 * @fileoverview React 17+ automatic JSX transform runtime entry point
 *
 * This module exports the functions required by the automatic JSX transform.
 * Bundlers like Vite/ESBuild will import from this module when configured
 * with jsx: 'automatic' and jsxImportSource: 'astro-jsx'.
 */

export { jsx, jsxs, Fragment } from './index';
