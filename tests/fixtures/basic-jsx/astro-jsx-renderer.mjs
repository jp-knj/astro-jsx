import { Fragment } from 'astro-jsx';

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

export const name = 'astro-jsx-fixture-renderer';

export function check(Component) {
  return typeof Component === 'function';
}

export async function renderToStaticMarkup(Component, props, children) {
  const rendered = await Component({ ...(props ?? {}), children });
  const html = await renderChild(rendered);
  return { html, attrs: {} };
}

export default {
  name,
  check,
  renderToStaticMarkup,
};

async function renderChild(child) {
  if (child === null || child === undefined || typeof child === 'boolean') {
    return '';
  }

  if (typeof child === 'string') {
    return escapeHtml(child);
  }

  if (typeof child === 'number') {
    return String(child);
  }

  if (isHtmlNode(child)) {
    return child.__html;
  }

  if (child instanceof Promise) {
    return renderChild(await child);
  }

  if (Array.isArray(child)) {
    const parts = await Promise.all(child.map(renderChild));
    return parts.join('');
  }

  if (isFragmentNode(child)) {
    return renderChild(child.props.children ?? []);
  }

  if (isComponentNode(child)) {
    const resolved = await child.type(child.props);
    return renderChild(resolved);
  }

  if (isElementNode(child)) {
    return renderElement(child);
  }

  throw new TypeError(`Unsupported child value: ${typeof child}`);
}

async function renderElement(node) {
  const { type, props } = node;
  const { children, ...rawAttrs } = props ?? {};
  const attrs = renderAttributes(rawAttrs);
  const childrenHtml = await renderChild(children ?? []);

  if (childrenHtml.length === 0 && VOID_ELEMENTS.has(type)) {
    return `<${type}${attrs}>`;
  }

  return `<${type}${attrs}>${childrenHtml}</${type}>`;
}

function hasType(value) {
  return typeof value === 'object' && value !== null && 'type' in value;
}

function isElementNode(node) {
  return hasType(node) && typeof node.type === 'string';
}

function isComponentNode(node) {
  return hasType(node) && typeof node.type === 'function';
}

function isFragmentNode(node) {
  return hasType(node) && node.type === Fragment;
}

function renderAttributes(props) {
  const entries = [];
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || key === 'className') continue;
    if (value === undefined || value === null) continue;

    if (typeof value === 'boolean') {
      if (value) entries.push(key);
      continue;
    }

    let normalized;
    if (key === 'class') {
      normalized = normalizeClass(value);
      if (!normalized) continue;
    } else if (key === 'style') {
      normalized = normalizeStyle(value);
      if (!normalized) continue;
    } else {
      normalized = String(value);
    }

    entries.push(`${key}="${escapeAttribute(normalized)}"`);
  }

  return entries.length > 0 ? ` ${entries.join(' ')}` : '';
}

function normalizeClass(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join(' ');
  return Object.entries(value)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([token]) => token)
    .join(' ');
}

function normalizeStyle(value) {
  if (typeof value === 'string') return value;
  return Object.entries(value)
    .map(([prop, val]) => `${hyphenate(prop)}:${val}`)
    .join(';');
}

function hyphenate(value) {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function escapeHtml(value) {
  return value.replace(/[&<>]/g, (char) => HTML_ESCAPES[char]);
}

function escapeAttribute(value) {
  return value.replace(/[&"<>]/g, (char) => HTML_ESCAPES[char]);
}

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

function isHtmlNode(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    value.__brand === 'HtmlNode' &&
    typeof value.__html === 'string'
  );
}
