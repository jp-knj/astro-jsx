import type { JSXNode } from './nodes';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elementName: string]: any;
    }

    type Element = JSXNode | null | false;

    interface IntrinsicAttributes {
      key?: string | number;
      ref?: never;
    }

    interface ElementChildrenAttribute {
      children: {};
    }

    type LibraryManagedAttributes<Component, Props> = Props;
  }
}
