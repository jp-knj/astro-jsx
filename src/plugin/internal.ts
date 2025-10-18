import type { AstroIntegrationLogger } from 'astro';

/**
 * SWC 統合で `className` を受け入れるかどうかを制御する互換モード設定。
 * SSR で HTML 属性を優先したい場合は `false` (初期値) のままにし、React 由来の `className` をそのまま書きたい場合は `true` にします。
 * Astro では基本的に `class` を推奨するため、互換維持が必要なプロジェクトのみ opt-in で利用します。
 */
export interface CompatOptions {
  acceptClassName?: boolean;
}

/**
 * ビルド時に検出した `client:*` ディレクティブや危険なパターンを外部へ通知したい場合にフックするための診断設定。
 * Astro 本体のロガーや独自のテレメトリへ流したいケースを想定しています。
 */
export interface DiagnosticsOptions {
  onClientDirectiveDetected?: (payload: {
    id: string;
    directive: string;
    code: string;
  }) => void;
}

/**
 * `astro-jsx` プラグイン全体の設定オブジェクト。
 * `compat` で互換挙動、`diagnostics` で検出イベントのハンドリングを調整できます。
 */
export interface AstroJsxPluginOptions {
  compat?: CompatOptions;
  diagnostics?: DiagnosticsOptions;
}

/**
 * `.astro` ファイルで `client:*` ディレクティブが見つかったときに生成する島 (island) 情報。
 * 将来的に SSR で島ごとの hydration データを注入するためのキューとして利用します。
 */
export interface DeferredIslandPayload {
  marker: string;
  props: Record<string, unknown> | undefined;
}

/**
 * Vite 変換フェーズで共有する内部コンテキスト。
 * `acceptClassName` はオプションの結果、`collectIslandPayload` は島情報を蓄積するためのコールバックです。
 */
export interface TransformerContext {
  acceptClassName: boolean;
  collectIslandPayload: (payload: DeferredIslandPayload) => void;
}

/**
 * Astro の `astro:config:setup` フックで TypeScript 設定を部分的に上書きするためのパッチ構造。
 * `tsconfig` 全体を生成し直すのではなく、必要なキーのみを返します。
 */
export interface TsconfigCompilerOptionsPatch {
  compilerOptions: {
    jsx?: 'preserve';
    jsxImportSource?: string;
  };
}

/**
 * TypeScript に JSX をそのまま残す (`preserve`) よう強制し、JSX の自動インポート先を `astro-jsx/runtime` に揃えます。
 * Astro プロジェクト側で既存設定があっても、ここで上書きすることで SWC トランスフォームと整合性を取ります。
 */
export function ensureJsxPreserve(
  logger: AstroIntegrationLogger,
): TsconfigCompilerOptionsPatch {
  logger.debug(
    'astro-jsx: ensuring TypeScript compilerOptions.jsx is set to "preserve".',
  );

  return {
    compilerOptions: {
      jsx: 'preserve',
      jsxImportSource: 'astro-jsx/runtime',
    },
  };
}

/**
 * SWC へ渡すための入力情報。
 * - `filename`: 変換対象ファイルの絶対/相対パス。拡張子から `tsx` か `jsx` かを判定します。
 * - `code`: 実際にトランスフォームしたいソースコード文字列。
 * - `acceptClassName`: `className` を許容する互換モードかどうか。
 */
export interface SwcTransformOptions {
  filename: string;
  code: string;
  acceptClassName: boolean;
}

/**
 * SWC が返すコードとソースマップのラッパー。
 * ソースマップは未生成の場合 `null` を返すため union で表現しています。
 */
export interface SwcTransformResult {
  code: string;
  map: string | null;
}

let warnedAboutMissingSwc = false;

/**
 * SWC (`@swc/core`) を動的に読み込み、React 自動変換を利用して Astro 向け JSX を変換します。
 * `@swc/core` が依存に存在しない場合は警告を 1 度だけ出しつつ `undefined` を返し、呼び出し側でフォールバック実装に切り替えられるようにしています。
 */
export async function transformWithSwc(
  options: SwcTransformOptions,
  logger: AstroIntegrationLogger,
): Promise<SwcTransformResult | undefined> {
  const swc = await loadSwc(logger);
  if (!swc) {
    return undefined;
  }

  const isTsx = options.filename.endsWith('.tsx');
  const isJsx = options.filename.endsWith('.jsx');
  const parserSyntax = isTsx ? 'typescript' : 'ecmascript';

  const parserConfig =
    parserSyntax === 'typescript'
      ? {
          syntax: 'typescript',
          tsx: isTsx,
          decorators: false,
          dynamicImport: true,
        }
      : {
          syntax: 'ecmascript',
          jsx: isJsx,
          decorators: false,
          dynamicImport: true,
        };

  const transformOptions: Parameters<typeof swc.transform>[1] = {
    filename: options.filename,
    sourceMaps: true,
    jsc: {
      parser: parserConfig,
      transform: {
        react: {
          runtime: 'automatic',
          importSource: 'astro-jsx/runtime',
          useBuiltins: false,
          development: false,
          refresh: false,
        },
      },
    },
    module: {
      type: 'es6',
    },
  };

  const result = await swc.transform(options.code, transformOptions);

  if (!options.acceptClassName) {
    // SWC 側でも React 互換変換により className -> class へ変換されますが、
    // プラグインでは追加の診断を走らせる予定なので今後このブロックでチェックを行います。
  }

  return {
    code: result.code,
    map: result.map ?? null,
  };
}

/**
 * `@swc/core` を遅延ロードし、存在しない場合はロギングだけ行って `undefined` を返します。
 * ビルド環境によってはネイティブバイナリの配布が難しいため、依存を optional にする設計です。
 */
async function loadSwc(logger: AstroIntegrationLogger) {
  try {
    const swc = await import('@swc/core');
    return swc;
  } catch (error) {
    if (!warnedAboutMissingSwc) {
      warnedAboutMissingSwc = true;
      logger.warn(
        'astro-jsx: @swc/core not found. JSX files will bypass transformation until the dependency is installed.',
      );
    }
    return undefined;
  }
}
