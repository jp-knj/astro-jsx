import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    resolveSnapshotPath(testPath, snapExtension) {
      const projectRoot = __dirname;
      const testRelative = path.relative(projectRoot, testPath);
      const testDir = path.dirname(testRelative).replace(/^src[\/]/, '');
      const snapshotDir = path.resolve(projectRoot, 'tests/snapshots', testDir);
      return path.join(
        snapshotDir,
        `${path.basename(testPath)}${snapExtension}`,
      );
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.ts', 'src/runtime/jsx-types.ts'],
    },
  },
});
