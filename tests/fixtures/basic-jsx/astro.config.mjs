import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RENDERER_ENTRY = resolve(__dirname, './astro-jsx-renderer.mjs');

export default defineConfig({
  output: 'static',
  jsx: 'automatic',
  jsxImportSource: 'astro-jsx/runtime',
  integrations: [
    {
      name: 'astro-jsx-runtime-fixture',
      hooks: {
        'astro:config:setup'({ addRenderer }) {
          addRenderer({
            name: 'astro-jsx-fixture-renderer',
            serverEntrypoint: RENDERER_ENTRY,
          });
        },
      },
    },
  ],
});
