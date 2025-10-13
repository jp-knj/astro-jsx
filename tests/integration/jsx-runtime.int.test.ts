import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadFixture } from '../utils/fixture';

describe('astro-jsx runtime integration (static)', () => {
  const fixtureURL = new URL('../fixtures/basic-jsx/', import.meta.url);
  let fixture: Awaited<ReturnType<typeof loadFixture>>;

  beforeAll(async () => {
    fixture = await loadFixture(fixtureURL);
    await fixture.build();
  });

  afterAll(async () => {
    await fixture.cleanup();
  });

  it('produces index.html during build', () => {
    const html = fixture.readDistFile('index.html');
    expect(html).toContain('<html');
  });

  it('preserves class/className contract and normalized children output', () => {
    const html = fixture.readDistFile('index.html');

    expect(html).toMatch(/class="a"/);
    expect(html).not.toMatch(/className=/);
    expect(html).toContain('X');
    expect(html).not.toContain('false');
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('null');
  });
});
