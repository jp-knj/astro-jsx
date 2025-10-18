import type { AstroIntegrationLogger } from 'astro';
import type { AstroJsxPluginOptions, TransformerContext } from './internal.js';
import { transformWithSwc } from './internal.js';
import {
  DEFAULT_ISLAND_PROP_BUDGET_BYTES,
  formatBytes,
  normalizeIslandPayload,
} from './serialization.js';

type TransformResult = { code: string; map?: string | null } | undefined;

type PluginHookContext = {
  emitFile: (asset: {
    type: 'asset';
    fileName: string;
    source: string;
  }) => void;
};

export interface AstroJsxVitePlugin {
  name: string;
  enforce?: 'pre' | 'post';
  resolveId?: (id: string) => Promise<string | null> | string | null;
  load?: (id: string) => Promise<string | null> | string | null;
  transform?: (
    this: PluginHookContext,
    code: string,
    id: string,
  ) => Promise<TransformResult>;
  buildEnd?: () => void;
  generateBundle?: (this: PluginHookContext) => void;
}

const CLIENT_DIRECTIVE_PATTERN = /client:([a-zA-Z-]+)/g;
const SUPPORTED_CLIENT_DIRECTIVES = new Set([
  'load',
  'idle',
  'visible',
  'media',
]);

const ASTRO_INLINE_EVENT_PATTERN = /<[^>]+\bon:[a-zA-Z][\w:-]*\s*=/;
const JSX_INLINE_EVENT_PATTERN = /<[^>]+\bon[A-Z][A-Za-z0-9]*\s*=/;

const ACTIONS_VIRTUAL_ID = 'astro-jsx:actions';
const RESOLVED_ACTIONS_VIRTUAL_ID = '\0astro-jsx:actions';

// JSX コードに混入してはならない（あるいは注意したい）パターンを、わかりやすいキー名でまとめて管理する。
// `classNameAttribute` / `dangerousHtmlAttribute` は `...=` という属性記法だけを捉えることで、変数名などの誤検知を避ける。
const JSX_GUARD_PATTERNS = {
  classNameAttribute: /className\s*=/,
  dangerousHtmlAttribute: /dangerouslySetInnerHTML\s*=/,
} as const;

export function createAstroJsxTransformPlugin(
  options: AstroJsxPluginOptions,
  logger: AstroIntegrationLogger,
): AstroJsxVitePlugin {
  type CollectedIslandPayload = {
    marker: string;
    props?: unknown;
    bytes: number;
  };

  const islandPayloads: CollectedIslandPayload[] = [];
  const islandBudget = DEFAULT_ISLAND_PROP_BUDGET_BYTES;
  const isDev = process.env.NODE_ENV !== 'production';

  const context: TransformerContext = {
    acceptClassName: Boolean(options.compat?.acceptClassName),
    collectIslandPayload: (payload) => {
      const normalized = normalizeIslandPayload({
        marker: payload.marker,
        props: payload.props,
        budgetBytes: islandBudget,
        logger,
        isDev,
      });
      islandPayloads.push(normalized);
    },
  };

  const plugin: AstroJsxVitePlugin = {
    name: 'astro-jsx-swc-transform',
    enforce: 'pre',
    resolveId(id) {
      if (id === ACTIONS_VIRTUAL_ID) {
        return RESOLVED_ACTIONS_VIRTUAL_ID;
      }
      return null;
    },
    load(id) {
      if (id === RESOLVED_ACTIONS_VIRTUAL_ID) {
        return [
          "export { delegate } from 'astro-jsx/runtime/delegate';",
          'export type {',
          '  DelegateEventMap,',
          '  DelegateHandler,',
          '  DelegateMap,',
          '  DelegateRuntime,',
          "} from 'astro-jsx/runtime/delegate';",
        ].join('\n');
      }
      return null;
    },
    async transform(code: string, id: string): Promise<TransformResult> {
      if (id.endsWith('.astro')) {
        if (ASTRO_INLINE_EVENT_PATTERN.test(code)) {
          throw new Error(
            `astro-jsx: inline event handlers (on:*) are not supported in ${id}. Use delegated actions via astro-jsx:actions or client directives.`,
          );
        }

        detectClientDirectives({
          code,
          id,
          options,
          logger,
          collectIslandPayload: context.collectIslandPayload,
        });
        return undefined; // do not mutate Astro files at this stage
      }

      if (!id.endsWith('.tsx') && !id.endsWith('.jsx')) {
        return undefined;
      }

      if (JSX_INLINE_EVENT_PATTERN.test(code)) {
        throw new Error(
          `astro-jsx: inline JSX event handlers are not supported in ${id}. Use delegated actions via astro-jsx:actions and server-driven events.`,
        );
      }

      if (
        !context.acceptClassName &&
        JSX_GUARD_PATTERNS.classNameAttribute.test(code)
      ) {
        throw new Error(
          `astro-jsx: "className" is not supported in ${id}. Enable compat.acceptClassName or rename to "class".`,
        );
      }

      if (JSX_GUARD_PATTERNS.dangerousHtmlAttribute.test(code)) {
        throw new Error(
          `astro-jsx: detected dangerouslySetInnerHTML in ${id}. Use astro-jsx html() helper instead.`,
        );
      }

      const swcResult = await transformWithSwc(
        {
          filename: id,
          code,
          acceptClassName: context.acceptClassName,
        },
        logger,
      );

      if (swcResult) {
        return {
          code: swcResult.code,
          map: swcResult.map,
        };
      }

      return undefined;
    },

    buildEnd() {
      if (islandPayloads.length === 0) return;
      const totalBytes = islandPayloads.reduce(
        (sum, entry) => sum + entry.bytes,
        0,
      );
      logger.debug(
        `astro-jsx: prepared ${islandPayloads.length} island payload(s) (${formatBytes(totalBytes)} total) for astro-jsx-islands.json emission.`,
      );
    },

    generateBundle(this: PluginHookContext) {
      if (islandPayloads.length === 0) return;

      const manifest = islandPayloads.map(({ marker, props }) => {
        return props === undefined ? { marker } : { marker, props };
      });

      const source = JSON.stringify(manifest, null, 2);
      this.emitFile({
        type: 'asset',
        fileName: 'astro-jsx-islands.json',
        source,
      });

      const totalBytes = islandPayloads.reduce(
        (sum, entry) => sum + entry.bytes,
        0,
      );
      logger.info(
        `astro-jsx: emitted astro-jsx-islands.json with ${islandPayloads.length} SSR island payload(s), totaling ${formatBytes(totalBytes)}.`,
      );
    },
  };

  return plugin;
}

function detectClientDirectives(args: {
  code: string;
  id: string;
  options: AstroJsxPluginOptions;
  logger: AstroIntegrationLogger;
  collectIslandPayload: TransformerContext['collectIslandPayload'];
}): void {
  const { code, id, options, logger, collectIslandPayload } = args;
  const matches = Array.from(code.matchAll(CLIENT_DIRECTIVE_PATTERN));
  if (matches.length === 0) return;

  const supported = new Set<string>();
  const unsupported = new Set<string>();

  for (const match of matches) {
    const directive = match[0];
    const token = match[1];
    if (!SUPPORTED_CLIENT_DIRECTIVES.has(token)) {
      unsupported.add(directive);
      continue;
    }
    supported.add(directive);
  }

  if (unsupported.size > 0) {
    const unsupportedList = Array.from(unsupported).join(', ');
    const supportedList = Array.from(SUPPORTED_CLIENT_DIRECTIVES)
      .map((entry) => `client:${entry}`)
      .join(', ');
    throw new Error(
      `astro-jsx: unsupported client directive(s) ${unsupportedList} in ${id}. ` +
        `Supported directives: ${supportedList}.`,
    );
  }

  if (supported.size === 0) return;

  const directives = Array.from(supported);
  logger.info(
    `astro-jsx: detected client directives ${directives.join(', ')} in ${id}.`,
  );

  for (const directive of directives) {
    collectIslandPayload({
      marker: `${id}:${directive}`,
      props: {},
    });
  }

  options.diagnostics?.onClientDirectiveDetected?.({
    id,
    directive: directives.join(','),
    code,
  });
}
