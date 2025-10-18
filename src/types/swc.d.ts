declare module '@swc/core' {
  interface TransformConfig {
    filename?: string;
    sourceMaps?: boolean | 'inline';
    jsc?: unknown;
    module?: unknown;
  }

  interface TransformOutput {
    code: string;
    map?: string | null;
  }

  export function transform(
    code: string,
    options: TransformConfig,
  ): Promise<TransformOutput>;
}
