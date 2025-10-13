import type { AstroIntegrationLogger } from 'astro';

export const DEFAULT_ISLAND_PROP_BUDGET_BYTES = 32 * 1024;

type SeenSet = Set<unknown>;

type NormalizeArgs = {
  marker: string;
  props: unknown;
  budgetBytes: number;
  logger: AstroIntegrationLogger;
  isDev: boolean;
};

type NormalizedPayload = {
  marker: string;
  props?: unknown;
  bytes: number;
};

export function normalizeIslandPayload({
  marker,
  props,
  budgetBytes,
  logger,
  isDev,
}: NormalizeArgs): NormalizedPayload {
  if (props === undefined) {
    logDiagnostics(logger, isDev, marker, 0, budgetBytes);
    return { marker, bytes: 0 };
  }

  assertJsonSerializable(props, 'props');

  const json = JSON.stringify(props);
  if (json === undefined) {
    const message = `astro-jsx: island payload for "${marker}" could not be serialized. Ensure props are JSON-compatible values.`;
    logger.error(message);
    throw new TypeError(message);
  }

  const bytes = byteLength(json);
  if (bytes > budgetBytes) {
    const message =
      `astro-jsx: island payload for "${marker}" is ${formatBytes(bytes)},` +
      ` exceeding the ${formatBytes(budgetBytes)} budget.`;
    logger.error(message);
    if (isDev) {
      logger.info(
        `astro-jsx: reduce props for "${marker}" or split into smaller islands.`,
      );
    }
    throw new RangeError(message);
  }

  const normalizedProps = JSON.parse(json);

  logDiagnostics(logger, isDev, marker, bytes, budgetBytes);

  return {
    marker,
    props: normalizedProps,
    bytes,
  };
}

export function assertJsonSerializable(
  value: unknown,
  path = 'value',
  seen: SeenSet = new Set(),
): void {
  if (value === null) return;

  const type = typeof value;
  if (type === 'string' || type === 'boolean') return;
  if (type === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError(
        `${path} must be a finite number, received ${value}.`,
      );
    }
    return;
  }

  if (type === 'bigint' || type === 'symbol' || type === 'function') {
    throw new TypeError(`${path} contains non-JSON value of type ${type}.`);
  }

  if (type === 'undefined') {
    throw new TypeError(`${path} cannot be undefined in JSON payloads.`);
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) {
      throw new TypeError(`${path} contains a circular reference.`);
    }
    seen.add(value);
    value.forEach((item, index) => {
      assertJsonSerializable(item, `${path}[${index}]`, seen);
    });
    seen.delete(value);
    return;
  }

  if (type === 'object') {
    if (seen.has(value)) {
      throw new TypeError(`${path} contains a circular reference.`);
    }
    seen.add(value);

    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      const constructorName = (value as { constructor?: { name?: string } })
        .constructor?.name;
      throw new TypeError(
        `${path} must be a plain object; received ${constructorName ?? 'object'}.`,
      );
    }

    for (const [key, entry] of Object.entries(
      value as Record<string, unknown>,
    )) {
      assertJsonSerializable(entry, `${path}.${key}`, seen);
    }

    seen.delete(value);
    return;
  }

  throw new TypeError(`${path} contains unsupported JSON value.`);
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return `${bytes}B`;
  if (bytes < 1024) return `${bytes}B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)}KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)}MB`;
}

function logDiagnostics(
  logger: AstroIntegrationLogger,
  isDev: boolean,
  marker: string,
  bytes: number,
  budgetBytes: number,
) {
  if (!isDev) return;
  logger.info(
    `astro-jsx: island "${marker}" props ${formatBytes(bytes)} ` +
      `(budget ${formatBytes(budgetBytes)}).`,
  );
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}
