import { lockState } from '../config/state';
import type { HtmlNode } from '../types/nodes';
import type { RuntimeState } from '../types/runtime';
import { HtmlNodeSchema } from '../validation/schemas';

/**
 * HtmlNode を生成する。
 *
 * 処理:
 * 1. state.locked を true にし、以降の設定変更を禁止
 * 2. 入力が文字列であることを検証
 * 3. HtmlNodeSchema で構造を検証
 *
 * @param state ランタイム状態（locked を内部更新）
 * @param raw 信頼済み HTML 文字列
 * @returns HtmlNode
 * @throws TypeError raw が文字列でない場合
 */
export function createHtmlNode(state: RuntimeState, raw: string): HtmlNode {
  lockState(state);

  if (typeof raw !== 'string') {
    throw new TypeError('html() expects a string argument');
  }

  return HtmlNodeSchema.parse({
    __html: raw,
    __brand: 'HtmlNode' as const,
  });
}
