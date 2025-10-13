import type { AstroIntegration } from 'astro';
import type { AstroJsxPluginOptions } from './internal';
import { ensureJsxPreserve } from './internal';
import { createAstroJsxTransformPlugin } from './transform';

export { ensureJsxPreserve } from './internal';
export type { AstroJsxPluginOptions } from './internal';

export default function astroJsxPlugin(
  options: AstroJsxPluginOptions = {},
): AstroIntegration {
  return {
    name: 'astro-jsx-plugin',
    hooks: {
      'astro:config:setup': (params) => {
        const { updateConfig, logger } = params;

        const tsconfigPatch = ensureJsxPreserve(logger);

        const vitePlugin = createAstroJsxTransformPlugin(options, logger);

        const configPatch = {
          tsconfig: tsconfigPatch,
          vite: {
            plugins: [vitePlugin],
          },
        } as unknown as Parameters<typeof updateConfig>[0];

        updateConfig(configPatch);

        logger.debug(
          'astro-jsx: registered SWC transform scaffold (falls back to pass-through when @swc/core is unavailable).',
        );
      },
    },
  };
}
