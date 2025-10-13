import { lockState } from '../config/state';
import type {
  AttributeValue,
  Children,
  FragmentProps,
  JSXElementType,
  JSXNode,
} from '../types/nodes';
import type { RuntimeState } from '../types/runtime';
import {
  assertNoHtmlAttributes,
  assertValidCoreAttributes,
} from '../validation/attributes';
import {
  ComponentNodeSchema,
  ElementNodeSchema,
  FragmentNodeSchema,
} from '../validation/schemas';
import { normalizeChildren } from './children';
import { Fragment } from './fragment';

// Props type helper
export type PropsFor<T extends JSXElementType> = T extends string
  ? IntrinsicProps
  : // biome-ignore lint/suspicious/noExplicitAny: Runtime generics need an `any` fallback for component props
    T extends (props: infer P) => any
    ? P
    : FragmentProps;

// Intrinsic elements props
export type IntrinsicProps = {
  // Core attributes
  class?: string | readonly string[] | Record<string, boolean>;
  style?: string | Readonly<Record<string, string | number>>;
  children?: Children;

  // Event handlers (type-only, not yet implemented)
  onClick?: EventHandler;
  onInput?: EventHandler;
  onChange?: EventHandler;
  onSubmit?: EventHandler;

  // Allow any other attributes
  [key: string]: AttributeValue | Children | EventHandler | undefined;
};

export type EventHandler = never;

/**
 * ノードを構築するコアファクトリ。
 *
 * 処理:
 * 1. state.locked を true にし、以降の設定変更を禁止
 * 2. props を正規化（class/style 検証、children 正規化）
 * 3. type に応じて各スキーマで検証・構築
 *
 * @param state ランタイム状態（locked を内部更新）
 * @param type intrinsic 名、コンポーネント関数、または Fragment
 * @param props プロパティ（null 可）
 * @param key 任意のキー
 * @returns 生成された JSX ノード
 * @throws TypeError 無効な type の場合
 * @throws TypeError 属性に HtmlNode が含まれる場合（children は除く）
 */
export function createElement<T extends JSXElementType>(
  state: RuntimeState,
  type: T,
  props: PropsFor<T> | null,
  key?: string | number | null,
): JSXNode {
  lockState(state);

  // biome-ignore lint/suspicious/noExplicitAny: Props are intentionally loose until events/types stabilize
  const normalizedProps = normalizeProps(props as Record<string, any> | null);

  if (typeof type === 'string') {
    assertNoHtmlAttributes(normalizedProps);
    return ElementNodeSchema.parse({ type, props: normalizedProps, key });
  }

  if (typeof type === 'function') {
    return ComponentNodeSchema.parse({
      type,
      props: normalizedProps,
      key,
    });
  }

  if (type === Fragment) {
    const fragmentProps: FragmentProps = normalizedProps;
    return FragmentNodeSchema.parse({
      type: Fragment,
      props: fragmentProps,
      key,
    });
  }

  throw new TypeError(`Invalid JSX element type: ${String(type)}`);
}

/**
 * props を正規化する。
 *
 * 処理:
 * - class/style の基本検証を行う
 * - children が存在する場合は normalizeChildren を適用
 *   0件: children を削除
 *   1件: 単値に置換
 *   2件以上: 配列に置換
 *
 * @param props 入力 props（null 可）
 * @returns 正規化後の props
 * @throws TypeError class/style の型が不正な場合
 */
function normalizeProps(
  // biome-ignore lint/suspicious/noExplicitAny: v0.2 keeps props flexible until renderer contracts stabilize
  props: Record<string, any> | null,
  // biome-ignore lint/suspicious/noExplicitAny: v0.2 keeps props flexible until renderer contracts stabilize
): Record<string, any> {
  if (!props) return {};

  const nextProps = { ...props };

  assertValidCoreAttributes(nextProps);

  let normalizedProps = nextProps;
  if ('children' in nextProps) {
    const normalizedChildren = normalizeChildren(nextProps.children);
    if (normalizedChildren === undefined) {
      const { children: _omitted, ...rest } = nextProps;
      normalizedProps = rest;
    } else {
      nextProps.children = normalizedChildren;
      normalizedProps = nextProps;
    }
  }

  return normalizedProps;
}
