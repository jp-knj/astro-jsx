import type { RuntimeState } from '../types/runtime';

/**
 * 設定がロックされた後のエラーメッセージ。
 *
 * createElement や html 呼び出しで初回レンダーが始まると state.locked が true になり、
 * 以降の configure 呼び出しはこのエラーを投げる。
 */
export const CONFIG_LOCKED_ERROR =
  'Runtime configuration is locked after first render. Configure must be called before any jsx() or html() calls.';

/**
 * 設定が書き込み可能か（レンダーが始まっていないか）を確認する。
 *
 * @throws Error レンダー開始後に設定を書き換えようとした場合
 */
export function assertWritable(state: RuntimeState): void {
  if (state.locked) {
    throw new Error(CONFIG_LOCKED_ERROR);
  }
}

/**
 * 新しいランタイム状態を作成する。
 *
 * @returns 初期状態
 */
export function createRuntimeState(): RuntimeState {
  return {
    locked: false,
  };
}

/**
 * ランタイム状態をロックする。
 * 初回レンダー時に呼び出され、以降の設定変更を禁止する。
 *
 * @param state ランタイム状態
 */
export function lockState(state: RuntimeState): void {
  state.locked = true;
}
