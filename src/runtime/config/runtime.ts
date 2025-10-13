import { createElement } from '../core/create-element';
import { createHtmlNode } from '../core/html';
import type { HtmlNode, JSXElementType, JSXNode } from '../types/nodes';
import type { RuntimeConfig, RuntimeState } from '../types/runtime';
import { assertNoDeprecatedOptions } from '../validation/attributes';
import { assertWritable, createRuntimeState } from './state';

// TypeScript will resolve this type from core/create-element.ts later
type PropsFor<T extends JSXElementType> = T extends string
  ? // biome-ignore lint/suspicious/noExplicitAny: Runtime generics need an `any` fallback for non-typed host elements
    Record<string, any>
  : // biome-ignore lint/suspicious/noExplicitAny: Runtime generics need an `any` fallback for non-typed host elements
    T extends (props: infer P) => any
    ? P
    : // biome-ignore lint/suspicious/noExplicitAny: Runtime generics need an `any` fallback for non-typed host elements
      Record<string, any>;

/**
 * 新しいランタイムインスタンスを生成する。
 *
 * 返却されるオブジェクトは以下の関数を提供する:
 * - configure: レンダー開始前に設定を適用する（ロック後はエラー）
 * - getConfig: 現在の設定を取得する（現状は空オブジェクト）
 * - jsx/jsxs/jsxDEV: JSX ノードを生成するファクトリ
 * - html: 生の HTML ノードを生成するヘルパー
 *
 * @param initialConfig 起動時に与える設定。未対応のキーは拒否される
 * @returns ランタイムの公開 API
 * @throws Error initialConfig に未対応のオプションが含まれる場合
 */
export function createRuntime(initialConfig?: RuntimeConfig) {
  assertNoDeprecatedOptions(initialConfig);

  const state: RuntimeState = createRuntimeState();

  /**
   * ランタイム設定を適用する。
   *
   * 注意:
   * - 初回レンダー（createElement/html 呼び出し）後はロックされ、例外を投げる。
   *
   * @param config 適用する設定
   * @throws Error ロック後に呼び出した場合
   * @throws Error 未対応のオプションが含まれる場合
   */
  function configure(config: RuntimeConfig): void {
    assertWritable(state);
    assertNoDeprecatedOptions(config);
  }

  /**
   * 現在の設定を返す。
   *
   * 現バージョンでは空オブジェクトを返す。将来拡張のためのプレースホルダー。
   *
   * @returns 設定オブジェクト
   */
  function getConfig(): RuntimeConfig {
    return {};
  }

  /**
   * JSX エレメントを生成する。
   *
   * 契約:
   * - props.children は normalizeChildren により
   *   0件: 省略 / 1件: 単値 / 2件以上: 配列 に正規化される
   * - null/undefined/boolean の子要素は除去される
   * - Promise は待機せず、そのまま要素として保持される
   *
   * @param type intrinsic 名、コンポーネント関数、もしくは Fragment
   * @param props プロパティ。class/style の基本検証を行う
   * @param key 任意のキー
   * @returns 構築された JSX ノード
   * @throws TypeError 無効な type の場合
   * @throws TypeError 属性に HtmlNode が含まれていた場合（children は除く）
   */
  function jsx<T extends JSXElementType>(
    type: T,
    props?: PropsFor<T> | null,
    key?: string | number | null,
  ): JSXNode {
    return createElement(state, type, props ?? null, key);
  }

  /**
   * jsx と同等。複数子要素の最適化でエミッタから呼ばれる想定の別名。
   */
  function jsxs<T extends JSXElementType>(
    type: T,
    props?: PropsFor<T> | null,
    key?: string | number | null,
  ): JSXNode {
    return createElement(state, type, props ?? null, key);
  }

  /**
   * 開発時ビルドが利用するバリアント。挙動は jsx と同等。
   */
  function jsxDEV<T extends JSXElementType>(
    type: T,
    props?: PropsFor<T> | null,
    key?: string | number | null,
  ): JSXNode {
    return createElement(state, type, props ?? null, key);
  }

  /**
   * 生の HTML ノードを生成する。
   *
   * @param raw 信頼済み HTML 文字列
   * @returns HtmlNode
   * @throws TypeError raw が文字列でない場合
   */
  function html(raw: string): HtmlNode {
    return createHtmlNode(state, raw);
  }

  return { configure, getConfig, jsx, jsxs, jsxDEV, html };
}
