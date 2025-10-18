import type { AstroIntegrationLogger } from 'astro';
import { describe, expect, fail, test, vi } from 'vitest';
import { ensureJsxPreserve } from './internal.js';
import {
  type AstroJsxVitePlugin,
  createAstroJsxTransformPlugin,
} from './transform.js';

const createLogger = (): AstroIntegrationLogger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe('ensureJsxPreserve', () => {
  test('returns compiler options patch', () => {
    const logger = createLogger();

    const patch = ensureJsxPreserve(logger);

    expect(patch.compilerOptions.jsx).toBe('preserve');
    expect(patch.compilerOptions.jsxImportSource).toBe('astro-jsx/runtime');
    expect(logger.debug).toHaveBeenCalledTimes(1);
  });
});

describe('createAstroJsxTransformPlugin', () => {
  test('throws when className is used without compat.acceptClassName', async () => {
    const logger = createLogger();
    const plugin = createAstroJsxTransformPlugin({}, logger);
    const transform = plugin.transform ?? fail('transform hook missing');

    const context: ThisParameterType<
      NonNullable<AstroJsxVitePlugin['transform']>
    > = { emitFile: vi.fn() };

    await expect(
      transform.call(
        context,
        '<div className="hero" />',
        '/src/components/Hero.tsx',
      ),
    ).rejects.toThrow(/className/);
  });

  test('throws when dangerouslySetInnerHTML is used', async () => {
    const logger = createLogger();
    const plugin = createAstroJsxTransformPlugin(
      { compat: { acceptClassName: true } },
      logger,
    );
    const transform = plugin.transform ?? fail('transform hook missing');

    const context: ThisParameterType<
      NonNullable<AstroJsxVitePlugin['transform']>
    > = { emitFile: vi.fn() };

    await expect(
      transform.call(
        context,
        '<div dangerouslySetInnerHTML={{ __html: "raw" }} />',
        '/src/components/Raw.tsx',
      ),
    ).rejects.toThrow(/dangerouslySetInnerHTML/);
  });

  test('throws when inline event handlers are used in .astro files', async () => {
    const logger = createLogger();
    const plugin = createAstroJsxTransformPlugin({}, logger);
    const transform = plugin.transform ?? fail('transform hook missing');

    const context: ThisParameterType<
      NonNullable<AstroJsxVitePlugin['transform']>
    > = { emitFile: vi.fn() };

    await expect(
      transform.call(
        context,
        '<button on:click={() => {}}></button>',
        '/src/pages/index.astro',
      ),
    ).rejects.toThrow(/inline event handlers/);
  });

  test('throws when inline JSX event handlers are present', async () => {
    const logger = createLogger();
    const plugin = createAstroJsxTransformPlugin({}, logger);
    const transform = plugin.transform ?? fail('transform hook missing');

    const context: ThisParameterType<
      NonNullable<AstroJsxVitePlugin['transform']>
    > = { emitFile: vi.fn() };

    await expect(
      transform.call(
        context,
        '<button onClick={() => {}} />',
        '/src/components/Button.tsx',
      ),
    ).rejects.toThrow(/inline JSX event handlers/);
  });

  test('rejects unsupported client directives', async () => {
    const logger = createLogger();
    const plugin = createAstroJsxTransformPlugin({}, logger);
    const transform = plugin.transform ?? fail('transform hook missing');

    const context: ThisParameterType<
      NonNullable<AstroJsxVitePlugin['transform']>
    > = { emitFile: vi.fn() };

    await expect(
      transform.call(
        context,
        '<div client:only></div>',
        '/src/components/Unsupported.astro',
      ),
    ).rejects.toThrow(/unsupported client directive/);
  });

  test('emits island payload manifest when client directives are detected', async () => {
    const logger = createLogger();
    const plugin = createAstroJsxTransformPlugin({}, logger);
    const transform = plugin.transform ?? fail('transform hook missing');

    const transformContext: ThisParameterType<
      NonNullable<AstroJsxVitePlugin['transform']>
    > = { emitFile: vi.fn() };

    await transform.call(
      transformContext,
      '<div client:load></div>',
      '/src/components/Island.astro',
    );

    plugin.buildEnd?.();

    const emitFile = vi.fn();
    const pluginContext: ThisParameterType<
      NonNullable<AstroJsxVitePlugin['generateBundle']>
    > = { emitFile };
    plugin.generateBundle?.call(pluginContext);

    expect(emitFile).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'asset',
        fileName: 'astro-jsx-islands.json',
      }),
    );

    const source = emitFile.mock.calls[0][0].source as string;
    const manifest = JSON.parse(source) as Array<Record<string, unknown>>;
    expect(manifest).toEqual([
      {
        marker: '/src/components/Island.astro:client:load',
        props: {},
      },
    ]);
  });

  test('exposes actions runtime via virtual module', () => {
    const logger = createLogger();
    const plugin = createAstroJsxTransformPlugin({}, logger);

    const resolved = plugin.resolveId?.('astro-jsx:actions');
    expect(resolved).toBe('\0astro-jsx:actions');

    const contents = plugin.load?.('\0astro-jsx:actions');
    expect(contents).toContain('export { delegate }');
  });
});
