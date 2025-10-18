import type { JSXNode } from './nodes';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // biome-ignore lint/suspicious/noExplicitAny: JSX fallback must allow arbitrary intrinsic attributes
      [elementName: string]: any;
    }

    type Element = JSXNode | null | false;

    interface IntrinsicAttributes {
      key?: string | number;
      ref?: never;
    }

    interface ElementChildrenAttribute {
      // biome-ignore lint/complexity/noBannedTypes: Astro runtime accepts any child shape here
      children: {};
    }

    type LibraryManagedAttributes<Component, Props> = Props;
  }
}
