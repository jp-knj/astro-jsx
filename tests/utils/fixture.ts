import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { symlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { AstroInlineConfig } from 'astro';
import { build } from 'astro';

type Fixture = {
  root: string;
  build: (inlineConfig?: AstroInlineConfig) => Promise<void>;
  readDistFile: (path: string) => string;
  listDistFiles: (dir?: string) => string[];
  cleanup: () => Promise<void>;
};

export async function loadFixture(rootDir: URL | string): Promise<Fixture> {
  const root =
    typeof rootDir === 'string' ? resolve(rootDir) : resolve(rootDir.pathname);

  const repoNodeModules = resolve(root, '../../..', 'node_modules');
  const fixtureNodeModules = join(root, 'node_modules');
  const packageRoot = resolve(root, '..', '..', '..');
  const selfLink = join(repoNodeModules, 'astro-jsx');

  if (existsSync(repoNodeModules) && !existsSync(selfLink)) {
    await symlink(packageRoot, selfLink, 'junction');
  }

  if (!existsSync(fixtureNodeModules) && existsSync(repoNodeModules)) {
    mkdirSync(join(root), { recursive: true });
    await symlink(repoNodeModules, fixtureNodeModules, 'junction');
  }

  return {
    root,
    async build(inline) {
      await build(
        { root, logLevel: 'error', ...inline },
        { teardownCompiler: false },
      );
    },
    readDistFile(p) {
      return readFileSync(join(root, 'dist', p), 'utf8');
    },
    listDistFiles(dir = '.') {
      return readdirSync(join(root, 'dist', dir));
    },
    async cleanup() {
      // no-op for now; placeholder for future dev/preview usage
    },
  };
}
