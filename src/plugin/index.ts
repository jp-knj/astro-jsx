import type { AstroIntegration } from 'astro';
import { rendererManifest } from '../render/manifest.js';
import type { AstroJsxPluginOptions } from './internal.js';
import { ensureJsxPreserve } from './internal.js';
import { createAstroJsxTransformPlugin } from './transform.js';

export { ensureJsxPreserve } from './internal.js';
export type { AstroJsxPluginOptions } from './internal.js';

export default function astroJsxPlugin(
  options: AstroJsxPluginOptions = {},
): AstroIntegration {
  return {
    name: 'astro-jsx-plugin',
    hooks: {
      'astro:config:setup': (params) => {
        const { updateConfig, addRenderer, logger } = params;

        const tsconfigPatch = ensureJsxPreserve(logger);

        const vitePlugin = createAstroJsxTransformPlugin(options, logger);

        const configPatch = {
          tsconfig: tsconfigPatch,
          vite: {
            plugins: [vitePlugin],
          },
        } as unknown as Parameters<typeof updateConfig>[0];

        updateConfig(configPatch);

        addRenderer(rendererManifest);

        logger.debug(
          'astro-jsx: registered renderer and SWC transform scaffold (falls back to pass-through when @swc/core is unavailable).',
        );
      },
    },
  };
}
