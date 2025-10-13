import type { Child, Children } from '../types/nodes';

/**
 * children を正規化する。
 *
 * 契約:
 * - null/undefined/boolean は除去
 * - 配列は再帰的に平坦化
 * - Promise は待機せず保持
 * - 0件: undefined を返す
 * - 1件: 単値を返す
 * - 2件以上: 配列を返す
 *
 * @param value 任意の入力
 * @returns 正規化後の Children または undefined
 */
export function normalizeChildren(value: unknown): Children | undefined {
  const buffer: Child[] = [];
  appendChild(buffer, value);

  if (buffer.length === 0) return undefined;
  if (buffer.length === 1) return buffer[0];
  return buffer;
}

/**
 * 子要素をバッファへ追加する内部ヘルパー。
 *
 * 規則:
 * - null/undefined/boolean は無視
 * - Array は各要素を走査して追加
 * - PromiseLike はそのまま保持（未待機）
 * - それ以外は Child として追加（型の最終判定はランタイム/スキーマに委ねる）
 *
 * @param buffer 追加先のバッファ
 * @param value 対象の値
 */
export function appendChild(buffer: Child[], value: unknown): void {
  if (value === null || value === undefined) {
    return;
  }

  if (typeof value === 'boolean') {
    return;
  }

  if (isPromiseLike(value)) {
    buffer.push(value as Promise<Child>);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      appendChild(buffer, item);
    }
    return;
  }

  buffer.push(value as Child);
}

/**
 * PromiseLike 判定を行う。
 *
 * @param value 判定対象
 * @returns then 関数を持つ場合に true
 */
function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  if (typeof value !== 'object' && typeof value !== 'function') {
    return false;
  }
  if (value === null) return false;
  const candidate = value as { then?: unknown };
  return typeof candidate.then === 'function';
}
