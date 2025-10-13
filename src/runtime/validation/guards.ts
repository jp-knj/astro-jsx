// guards.ts

import { Fragment } from '../core/fragment';
import type {
  ComponentNode,
  ElementNode,
  FragmentNode,
  JSXNode,
} from '../types/nodes';

/**
 * @file astro-jsx の内部ノードモデルに対するランタイム型ガード群
 *
 * 本モジュールはランタイムで生成されたノードを Element / Component / Fragment に判別する
 * ための軽量な型ガードを提供する。チェックは浅く、追加の割り当てを行わない。
 *
 * 判定方針
 * - ElementNode: node.type が string である
 * - ComponentNode: node.type が function である
 * - FragmentNode: node.type が Fragment と同一インスタンスである（同値ではなく同一性）
 *
 * 備考
 * - Fragment の検出は typeof が symbol であるかではなく、エクスポートされる Fragment との
 *   参照同一性で判定する。他所で生成された別シンボルを誤検出しないため。
 * - ここでの判定は最小限。生成時の構造検証はスキーマ層（例: zod）で行うこと。
 */

/** 最低限頼る形。非 null オブジェクトで、type フィールドを持つもの。 */
export type JsxNodeWithType = { readonly type: unknown } & Record<
  string,
  unknown
>;

/**
 * 非 null オブジェクトであり、かつ type フィールドを持つかを判定する内部ヘルパー。
 * 公開ガード内での重複を避けるために分離している。
 *
 * @internal
 */
export const hasType = (v: unknown): v is JsxNodeWithType =>
  typeof v === 'object' && v !== null && 'type' in v;

/**
 * ElementNode かどうかを判定する。node.type が string のときに真。
 *
 * @param node 判定対象
 * @returns ElementNode なら true
 */
export const isElementNode = (node: unknown): node is ElementNode =>
  hasType(node) && typeof node.type === 'string';

/**
 * ComponentNode かどうかを判定する。node.type が function のときに真。
 *
 * @param node 判定対象
 * @returns ComponentNode なら true
 */
export const isComponentNode = (node: unknown): node is ComponentNode =>
  hasType(node) && typeof node.type === 'function';

/**
 * FragmentNode かどうかを判定する。node.type が Fragment と同一インスタンスのときに真。
 *
 * @param node 判定対象
 * @returns FragmentNode なら true
 */
export const isFragmentNode = (node: unknown): node is FragmentNode =>
  hasType(node) && node.type === Fragment;

/**
 * 任意の JSXNode（Element / Component / Fragment のいずれか）かどうかを判定する総合ガード。
 *
 * @param node 判定対象
 * @returns JSXNode なら true
 */
export const isJSXNode = (node: unknown): node is JSXNode =>
  isElementNode(node) || isComponentNode(node) || isFragmentNode(node);
