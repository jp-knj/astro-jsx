import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadFixture } from '../utils/fixture';

describe('astro-jsx client directives integration', () => {
  const fixtureURL = new URL('../fixtures/client-directives/', import.meta.url);
  let fixture: Awaited<ReturnType<typeof loadFixture>>;

  beforeAll(async () => {
    const testDir = dirname(fileURLToPath(import.meta.url));
    const repoRoot = resolve(testDir, '../..');
    const distPluginEntry = resolve(repoRoot, 'dist/plugin/index.js');

    if (!existsSync(distPluginEntry)) {
      execSync('pnpm build', { cwd: repoRoot, stdio: 'inherit' });
    }

    fixture = await loadFixture(fixtureURL);
    await fixture.build();
  });

  afterAll(async () => {
    await fixture.cleanup();
  });

  it('emits astro-jsx-islands.json with supported directives', () => {
    const manifest = JSON.parse(
      fixture.readDistFile('astro-jsx-islands.json'),
    ) as Array<{ marker: string; props?: Record<string, unknown> }>;

    expect(manifest).toHaveLength(4);
    expect(manifest.map((entry) => entry.marker)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('client:load'),
        expect.stringContaining('client:idle'),
        expect.stringContaining('client:visible'),
        expect.stringContaining('client:media'),
      ]),
    );

    for (const entry of manifest) {
      expect(entry.props ?? {}).toEqual({});
    }
  });
});
