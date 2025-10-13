/**
 * Fragment ノードの識別に利用される特別な Symbol。
 *
 * 備考:
 * - Symbol.for でグローバルレジストリ登録により、複数バージョン混在時の互換性を保証。
 * - ユーザーはこのシンボルを直接参照して <Fragment /> を構成可能。
 * - 型ガードでは参照同一性（=== Fragment）で判定。
 * - 値は Symbol のため、TypeScript 型システムで一意に扱われる。
 */
export const Fragment = Symbol.for('astro-jsx.Fragment');
