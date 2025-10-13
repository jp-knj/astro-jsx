import type { AttributeValue, Children, HtmlNode } from '../types/nodes';
import type { RuntimeConfig } from '../types/runtime';

/**
 * コア属性（class/style）を検証する。
 *
 * @param props 対象 props
 * @throws TypeError 型が不正な場合
 */
export function assertValidCoreAttributes(
  props: Record<string, unknown>,
): void {
  if ('class' in props) {
    assertValidClassAttribute(props.class);
  }

  if ('style' in props) {
    assertValidStyleAttribute(props.style);
  }
}

/**
 * class 属性値の検証を行う。
 *
 * 許可:
 * - string
 * - string[]（配列）
 * - Record<string, boolean>（条件付きクラスのフラグ）
 *
 * @param value 値
 * @throws TypeError 型が不正な場合
 */
export function assertValidClassAttribute(value: unknown): void {
  if (value === undefined || value === null) return;
  if (typeof value === 'string') return;
  if (isStringArray(value)) return;
  if (isStringBooleanRecord(value)) return;

  throw new TypeError(
    'class attribute must be a string, string[], or Record<string, boolean>',
  );
}

/**
 * style 属性値の検証を行う。
 *
 * 許可:
 * - string
 * - Record<string, string | number>（読み取り専用でも可）
 *
 * @param value 値
 * @throws TypeError 型が不正な場合
 */
export function assertValidStyleAttribute(value: unknown): void {
  if (value === undefined || value === null) return;
  if (typeof value === 'string') return;
  if (isStringNumberRecord(value)) return;

  throw new TypeError(
    'style attribute must be a string or Record<string, string | number>',
  );
}

/**
 * 属性内に HtmlNode が混入していないかを検証する。
 *
 * 注意:
 * - children は検証対象外（children には HtmlNode を許す）
 *
 * @param props 対象 props
 * @throws TypeError HtmlNode が検出された場合
 */
export function assertNoHtmlAttributes(
  props: Record<string, AttributeValue | Children | undefined>,
): void {
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue;
    if (containsHtmlNode(value)) {
      throw new TypeError('html() cannot be used in attributes');
    }
  }
}

/**
 * 古いオプションが含まれないかをチェックする。
 *
 * @param config 設定
 * @throws Error 非推奨オプションが含まれる場合
 */
export function assertNoDeprecatedOptions(config?: RuntimeConfig): void {
  if (!config) return;

  const entries = Object.entries(config as Record<string, unknown>);
  if (entries.length === 0) return;

  if ('compat' in (config as Record<string, unknown>)) {
    throw new Error(
      'compat.acceptClassName was removed; drop legacy configuration.',
    );
  }

  throw new Error('astro-jsx runtime does not accept configuration options.');
}

/**
 * すべての要素が string である配列かを判定する。
 *
 * @param value 判定対象
 * @returns 条件を満たす場合に true
 */
function isStringArray(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

/**
 * Record<string, boolean> かを判定する。
 *
 * @param value 判定対象
 * @returns 条件を満たす場合に true
 */
function isStringBooleanRecord(
  value: unknown,
): value is Record<string, boolean> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.values(value as Record<string, unknown>).every(
    (entry) => typeof entry === 'boolean',
  );
}

/**
 * Readonly<Record<string, string | number>> かを判定する。
 *
 * @param value 判定対象
 * @returns 条件を満たす場合に true
 */
function isStringNumberRecord(
  value: unknown,
): value is Readonly<Record<string, string | number>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.values(value as Record<string, unknown>).every((entry) => {
    return typeof entry === 'string' || typeof entry === 'number';
  });
}

/**
 * HtmlNode かを判定する。
 *
 * @param value 判定対象
 * @returns HtmlNode なら true
 */
export function isHtmlNode(value: unknown): value is HtmlNode {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { __brand?: unknown; __html?: unknown };
  return (
    candidate.__brand === 'HtmlNode' && typeof candidate.__html === 'string'
  );
}

/**
 * 値に HtmlNode が含まれているかを判定する。
 *
 * @param value 判定対象
 * @returns HtmlNode が含まれる場合に true
 */
function containsHtmlNode(value: unknown): boolean {
  if (isHtmlNode(value)) return true;
  if (Array.isArray(value)) {
    return value.some((item) => containsHtmlNode(item));
  }
  if (typeof value === 'object' && value !== null) {
    for (const nested of Object.values(value)) {
      if (containsHtmlNode(nested)) {
        return true;
      }
    }
  }
  return false;
}
