import astroJsxPlugin from 'astro-jsx/plugin';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  jsx: 'automatic',
  jsxImportSource: 'astro-jsx/runtime',
  integrations: [astroJsxPlugin()],
});
