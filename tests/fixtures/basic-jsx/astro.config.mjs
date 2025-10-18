import { defineConfig } from 'astro/config';
import astroJsxPlugin from 'astro-jsx/plugin';

export default defineConfig({
  output: 'static',
  jsx: 'automatic',
  jsxImportSource: 'astro-jsx/runtime',
  integrations: [
    astroJsxPlugin(),
  ],
});
