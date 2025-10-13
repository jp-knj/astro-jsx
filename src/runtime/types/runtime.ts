export interface RuntimeConfig {
  readonly compat?: unknown;
  readonly [key: string]: unknown;
}

export type RuntimeState = {
  locked: boolean;
};
