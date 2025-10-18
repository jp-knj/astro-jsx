import type { AstroIntegrationLogger } from 'astro';
import { describe, expect, test, vi } from 'vitest';
import {
  DEFAULT_ISLAND_PROP_BUDGET_BYTES,
  assertJsonSerializable,
  formatBytes,
  normalizeIslandPayload,
} from './serialization.js';

const createLogger = (): AstroIntegrationLogger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe('assertJsonSerializable', () => {
  test('accepts plain objects and arrays', () => {
    expect(() =>
      assertJsonSerializable({ foo: ['bar', 1, true] }),
    ).not.toThrow();
  });

  test('throws on functions', () => {
    expect(() => assertJsonSerializable({ onClick: () => {} })).toThrow(
      /non-JSON value/,
    );
  });

  test('throws on undefined', () => {
    expect(() => assertJsonSerializable([undefined])).toThrow(
      /cannot be undefined/,
    );
  });

  test('throws on circular references', () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    expect(() => assertJsonSerializable(obj)).toThrow(/circular reference/);
  });

  test('throws on custom class instances', () => {
    class Point {
      constructor(
        readonly x: number,
        readonly y: number,
      ) {}
    }
    expect(() => assertJsonSerializable(new Point(1, 2))).toThrow(
      /plain object/,
    );
  });
});

describe('normalizeIslandPayload', () => {
  test('normalizes props and reports byte usage', () => {
    const logger = createLogger();

    const result = normalizeIslandPayload({
      marker: 'example:client:load',
      props: { message: 'hello' },
      budgetBytes: DEFAULT_ISLAND_PROP_BUDGET_BYTES,
      logger,
      isDev: true,
    });

    expect(result.props).toEqual({ message: 'hello' });
    expect(result.bytes).toBeGreaterThan(0);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringMatching(/props \d+B/),
    );
  });

  test('throws when payload exceeds budget', () => {
    const logger = createLogger();
    const bigValue = 'x'.repeat(DEFAULT_ISLAND_PROP_BUDGET_BYTES + 1);

    expect(() =>
      normalizeIslandPayload({
        marker: 'oversized',
        props: { value: bigValue },
        budgetBytes: DEFAULT_ISLAND_PROP_BUDGET_BYTES,
        logger,
        isDev: false,
      }),
    ).toThrow(/exceeding/);
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('formatBytes', () => {
  test('formats bytes, KB, and MB appropriately', () => {
    expect(formatBytes(500)).toBe('500B');
    expect(formatBytes(4096)).toBe('4.0KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0MB');
  });
});
