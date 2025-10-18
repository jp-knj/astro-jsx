import type { Child, Children, ComponentType } from '../runtime/types/nodes';
import { renderToString } from './to-string';

export const name = 'astro-jsx-renderer';

export function check(Component: unknown): Component is ComponentType {
  return typeof Component === 'function';
}

export async function renderToStaticMarkup(
  Component: ComponentType,
  props: Record<string, unknown> | null | undefined,
  children: Children,
) {
  const rendered = await Component({ ...(props ?? {}), children });
  const html = await renderToString(rendered as Child | Children);
  return { html, attrs: {} };
}

export default {
  name,
  check,
  renderToStaticMarkup,
};
