import escapeHtml from 'escape-html';

import type {
  Child,
  Children,
  ClassAttributeValue,
  ComponentNode,
  ElementNode,
  FragmentNode,
  StyleAttributeValue,
} from '../runtime/types/nodes';
import { isHtmlNode } from '../runtime/validation/attributes';
import {
  isComponentNode,
  isElementNode,
  isFragmentNode,
  isJSXNode,
} from '../runtime/validation/guards';

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

const COMMON_ATTRIBUTES = [
  'name',
  'type',
  'value',
  'href',
  'src',
  'alt',
] as const;
const COMMON_ATTRIBUTE_ORDER = new Map<string, number>(
  COMMON_ATTRIBUTES.map((attr, index) => [attr, index]),
);

const KNOWN_ATTRIBUTES = new Set<string>([
  'accept',
  'accept-charset',
  'action',
  'allow',
  'async',
  'autocapitalize',
  'autocomplete',
  'autofocus',
  'autoplay',
  'charset',
  'checked',
  'cite',
  'cols',
  'colspan',
  'content',
  'contenteditable',
  'controls',
  'coords',
  'crossorigin',
  'datetime',
  'decoding',
  'default',
  'defer',
  'disabled',
  'download',
  'draggable',
  'enctype',
  'enterkeyhint',
  'form',
  'formaction',
  'formenctype',
  'formmethod',
  'formnovalidate',
  'formtarget',
  'height',
  'hidden',
  'high',
  'href',
  'hreflang',
  'id',
  'inputmode',
  'integrity',
  'ismap',
  'kind',
  'label',
  'lang',
  'loading',
  'list',
  'loop',
  'low',
  'max',
  'maxlength',
  'media',
  'method',
  'min',
  'minlength',
  'multiple',
  'muted',
  'name',
  'novalidate',
  'open',
  'optimum',
  'pattern',
  'placeholder',
  'playsinline',
  'poster',
  'preload',
  'readonly',
  'referrerpolicy',
  'rel',
  'required',
  'reversed',
  'rows',
  'rowspan',
  'sandbox',
  'scope',
  'selected',
  'shape',
  'size',
  'sizes',
  'slot',
  'span',
  'spellcheck',
  'src',
  'srcdoc',
  'srclang',
  'srcset',
  'step',
  'style',
  'tabindex',
  'target',
  'title',
  'translate',
  'type',
  'width',
  'wrap',
]);

const unknownAttributeWarnings = new Set<string>();

/**
 * Renders any supported runtime value to an HTML string, escaping text and normalizing
 * attributes according to Astro JSX serialization rules.
 *
 * @param {Child | Children} input Child or tree produced by the runtime.
 * @returns {Promise<string>} HTML markup for the provided input.
 */
export async function renderToString(input: Child | Children): Promise<string> {
  return await convertValue(input);
}

/**
 * Resolves a runtime value into serialized markup, recursing through async and composite
 * structures (arrays, components, fragments) while enforcing supported node types.
 *
 * @param {unknown} value Candidate runtime value.
 * @returns {Promise<string>} Serialized HTML chunk for the value.
 */
async function convertValue(value: unknown): Promise<string> {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return '';

  if (isPromiseLike(value)) {
    return await convertValue(await value);
  }

  if (Array.isArray(value)) {
    let out = '';
    for (const child of value) {
      out += await convertValue(child);
    }
    return out;
  }

  if (isHtmlNode(value)) {
    return value.__html;
  }

  if (typeof value === 'string') {
    return escapeText(value);
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (isElementNode(value)) {
    return await convertElement(value);
  }

  if (isComponentNode(value)) {
    return await convertComponent(value);
  }

  if (isFragmentNode(value)) {
    return await convertFragment(value);
  }

  if (isJSXNode(value)) {
    throw new TypeError(
      `Unsupported JSX node type: ${String(value.type)}. See docs/children.md#renderer-expectations`,
    );
  }

  if (typeof value === 'object') {
    throw new TypeError(
      'Unsupported object received in renderToString. See docs/children.md#renderer-expectations',
    );
  }

  return String(value);
}

/**
 * Serializes a JSX element node including its attribute list and child subtree.
 *
 * @param {ElementNode} node Runtime element node.
 * @returns {Promise<string>} HTML string for the element.
 */
async function convertElement(node: ElementNode): Promise<string> {
  const tagName = node.type;
  const props = node.props ?? {};
  const { children, ...attrs } = props;

  const attributesString = serializeAttributes(attrs);

  if (VOID_ELEMENTS.has(tagName)) {
    if (children !== undefined) {
      // Drain children for consistency; ignore actual markup per HTML spec.
      await convertValue(children);
    }
    return `<${tagName}${attributesString}>`;
  }

  const content = await convertValue(children);
  return `<${tagName}${attributesString}>${content}</${tagName}>`;
}

/**
 * Invokes a component node and renders the resulting value.
 *
 * @param {ComponentNode} node Runtime component node.
 * @returns {Promise<string>} Serialized output from the component.
 */
async function convertComponent(node: ComponentNode): Promise<string> {
  const result = await node.type(node.props);
  return await convertValue(result);
}

/**
 * Serializes a fragment node by rendering its children in sequence.
 *
 * @param {FragmentNode} node Runtime fragment node.
 * @returns {Promise<string>} Concatenated serialized children.
 */
async function convertFragment(node: FragmentNode): Promise<string> {
  return await convertValue(node.props.children);
}

type NormalizedAttribute = {
  name: string;
  value: string | true;
  priority: number;
  rank?: number;
};

/**
 * Normalizes, validates, and orders an attribute bag for serialization.
 *
 * @param {Record<string, unknown>} props Raw props excluding children.
 * @returns {string} Attribute string prefixed with a space when non-empty.
 */
function serializeAttributes(props: Record<string, unknown>): string {
  const items: NormalizedAttribute[] = [];

  for (const [name, raw] of Object.entries(props)) {
    if (name === 'children' || name === 'key') continue;
    if (raw === undefined || raw === null) continue;

    if (name === 'className') {
      throw new Error(
        'className is not supported; use class instead. See docs/attributes.md#forbidden-patterns',
      );
    }

    if (name === 'dangerouslySetInnerHTML') {
      throw new Error(
        'dangerouslySetInnerHTML is not supported. Use html() instead. See docs/html.md#usage-constraints',
      );
    }

    const classification = classifyAttribute(name);

    if (typeof raw === 'boolean') {
      if (!raw) continue;
      items.push({
        name,
        value: true,
        priority: classification.priority,
        rank: classification.rank,
      });
      continue;
    }

    if (name === 'class') {
      const normalized = normalizeClass(raw as ClassAttributeValue);
      if (!normalized) continue;
      items.push({
        name,
        value: escapeAttribute(normalized),
        priority: classification.priority,
        rank: classification.rank,
      });
      continue;
    }

    if (name === 'style') {
      const normalized = normalizeStyle(raw as StyleAttributeValue);
      if (!normalized) continue;
      items.push({
        name,
        value: escapeAttribute(normalized),
        priority: classification.priority,
        rank: classification.rank,
      });
      continue;
    }

    if (isHtmlNode(raw)) {
      throw new TypeError(
        'html() values cannot be used in attributes; pass them as children instead. See docs/html.md#usage-constraints',
      );
    }

    if (typeof raw === 'function' || typeof raw === 'symbol') {
      throw new TypeError(
        `Unsupported attribute value for ${name}: ${typeof raw}`,
      );
    }

    if (typeof raw === 'object') {
      throw new TypeError(`Unsupported attribute value for ${name}: object`);
    }

    const value = String(raw);
    items.push({
      name,
      value: escapeAttribute(value),
      priority: classification.priority,
      rank: classification.rank,
    });
  }

  if (items.length === 0) {
    return '';
  }

  items.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    if (a.rank !== undefined && b.rank !== undefined) {
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }
    } else if (a.rank !== undefined) {
      return -1;
    } else if (b.rank !== undefined) {
      return 1;
    }
    return a.name.localeCompare(b.name);
  });

  const serialized = items
    .map((item) =>
      item.value === true ? item.name : `${item.name}="${item.value}"`,
    )
    .join(' ');

  return ` ${serialized}`;
}

/**
 * Classifies an attribute name into ordering buckets with optional rank.
 *
 * @param {string} name Attribute name as provided by the runtime.
 * @returns {{ priority: number; rank?: number }} Ordering metadata.
 */
function classifyAttribute(name: string): { priority: number; rank?: number } {
  const lower = name.toLowerCase();

  if (lower === 'id') return { priority: 0 };
  if (lower === 'class') return { priority: 1 };
  if (lower === 'style') return { priority: 2 };

  const commonRank = COMMON_ATTRIBUTE_ORDER.get(lower);
  if (commonRank !== undefined) {
    return { priority: 3, rank: commonRank };
  }

  if (lower.startsWith('data-')) {
    return { priority: 4 };
  }

  if (lower.startsWith('aria-')) {
    return { priority: 5 };
  }

  if (KNOWN_ATTRIBUTES.has(lower)) {
    return { priority: 6 };
  }

  warnUnknownAttribute(name);
  return { priority: 7 };
}

/**
 * Emits a development-only warning when an unknown attribute is encountered.
 *
 * @param {string} name Attribute name that was not recognized.
 */
function warnUnknownAttribute(name: string): void {
  if (unknownAttributeWarnings.has(name)) {
    return;
  }

  unknownAttributeWarnings.add(name);

  const isProd =
    typeof process !== 'undefined' &&
    process.env !== undefined &&
    process.env.NODE_ENV === 'production';

  if (isProd) return;
  if (typeof console === 'undefined' || typeof console.warn !== 'function') {
    return;
  }

  console.warn(
    `[astro-jsx] Unknown attribute "${name}" encountered during renderToString() serialization.`,
  );
}

/**
 * Coerces `class` prop values into a single space-delimited string.
 *
 * @param {ClassAttributeValue} value Accepted class prop input.
 * @returns {string | undefined} Normalized class name or undefined when empty.
 */
function normalizeClass(value: ClassAttributeValue): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  }

  if (Array.isArray(value)) {
    const classes = value
      .map((entry) => String(entry).trim())
      .filter((entry) => entry.length > 0);
    if (classes.length === 0) return undefined;
    return classes.join(' ');
  }

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([className]) => className.trim())
      .filter((className) => className.length > 0);
    if (entries.length === 0) return undefined;
    return entries.join(' ');
  }

  return undefined;
}

/**
 * Serializes `style` prop values into inline CSS text.
 *
 * @param {StyleAttributeValue} value Accepted style prop input.
 * @returns {string | undefined} CSS declaration string or undefined when empty.
 */
function normalizeStyle(value: StyleAttributeValue): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  }

  if (typeof value === 'object' && value !== null) {
    const parts: string[] = [];
    for (const [property, raw] of Object.entries(value)) {
      if (raw === undefined || raw === null) continue;
      const cssName = toKebabCase(property);
      parts.push(`${cssName}:${String(raw)}`);
    }
    if (parts.length === 0) return undefined;
    return parts.join(';');
  }

  return undefined;
}

/**
 * Escapes HTML special characters in text nodes.
 *
 * @param {string} value Raw text content.
 * @returns {string} Escaped text.
 */
function escapeText(value: string): string {
  return escapeHtml(value);
}

/**
 * Escapes HTML special characters in attribute values.
 *
 * @param {string} value Raw attribute content.
 * @returns {string} Escaped attribute value.
 */
function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

/**
 * Converts camelCase or snake_case property names to kebab-case for CSS.
 *
 * @param {string} value Property name.
 * @returns {string} kebab-case representation.
 */
function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

/**
 * Narrowly detects thenables used by the runtime so they can be awaited.
 *
 * @param {unknown} value Potential promise-like value.
 * @returns {value is PromiseLike<unknown>} True when the value has a callable `then`.
 */
function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    'then' in value &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}
