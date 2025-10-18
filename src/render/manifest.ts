export const RENDERER_NAME = 'astro-jsx-renderer';
export const SERVER_ENTRYPOINT = 'astro-jsx/render/renderer';
export const JSX_IMPORT_SOURCE = 'astro-jsx/runtime';

export interface AstroRendererManifest {
  name: string;
  serverEntrypoint: string;
  clientEntrypoint?: string;
  jsxImportSource?: string;
}

export const rendererManifest: AstroRendererManifest = {
  name: RENDERER_NAME,
  serverEntrypoint: SERVER_ENTRYPOINT,
  jsxImportSource: JSX_IMPORT_SOURCE,
};

export default rendererManifest;
