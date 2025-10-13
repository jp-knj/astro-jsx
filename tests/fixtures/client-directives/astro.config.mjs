import { defineConfig } from 'astro/config';
import astroJsxPlugin from './astro-jsx-plugin.mjs';

export default defineConfig({
  output: 'static',
  integrations: [astroJsxPlugin()],
});
