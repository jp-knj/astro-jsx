import type { z } from 'zod';
import type { Fragment } from '../core/fragment';
import type {
  ComponentNodeSchema,
  ElementNodeSchema,
  FragmentNodeSchema,
  HtmlNodeSchema,
} from '../validation/schemas';

export type ElementNode = z.infer<typeof ElementNodeSchema>;
export type ComponentNode = z.infer<typeof ComponentNodeSchema>;
export type FragmentNode = z.infer<typeof FragmentNodeSchema>;
export type HtmlNode = z.infer<typeof HtmlNodeSchema>;

// biome-ignore lint/suspicious/noExplicitAny: v0.2 will tighten runtime component props typing
export type ComponentType = (props: any) => unknown;
type FragmentType = typeof Fragment;
export type JSXElementType = string | ComponentType | FragmentType;
export type JSXNode = ElementNode | ComponentNode | FragmentNode;

export type Children = Child | Child[];
export type Child =
  | string
  | number
  | boolean
  | null
  | undefined
  | HtmlNode
  | JSXNode
  | Child[]
  | Promise<Child>;

export type ClassAttributeValue =
  | string
  | readonly string[]
  | (Record<string, boolean> & {
      __html?: never;
      __brand?: never;
    });

export type StyleAttributeValue =
  | string
  | (Readonly<Record<string, string | number>> & {
      __html?: never;
      __brand?: never;
    })
  | (Record<string, string | number> & {
      __html?: never;
      __brand?: never;
    });

type AttributePrimitive = string | number | boolean | null | undefined;

export type AttributeValue =
  | AttributePrimitive
  | JSXNode
  | ClassAttributeValue
  | StyleAttributeValue;

export type FragmentProps = {
  children?: Children;
  [key: string]: unknown;
};
