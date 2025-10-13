import { z } from 'zod';
import { Fragment } from '../core/fragment';
import type { ComponentType } from '../types/nodes';

export const ElementNodeSchema = z
  .object({
    type: z.string(),
    props: z.record(z.any()),
    key: z.union([z.string(), z.number()]).nullable().optional(),
  })
  .brand<'ElementNode'>();

const ComponentTypeSchema = z.custom<ComponentType>(
  (value): value is ComponentType => typeof value === 'function',
  { message: 'type must be a function (ComponentType)' },
);

export const ComponentNodeSchema = z
  .object({
    type: ComponentTypeSchema,
    props: z.record(z.any()),
    key: z.union([z.string(), z.number()]).nullable().optional(),
  })
  .brand<'ComponentNode'>();

export const FragmentNodeSchema = z
  .object({
    type: z.custom<typeof Fragment>(
      (value): value is typeof Fragment => value === Fragment,
      { message: 'type must be Fragment' },
    ),
    props: z.object({ children: z.any().optional() }).catchall(z.any()),
    key: z.union([z.string(), z.number()]).nullable().optional(),
  })
  .brand<'FragmentNode'>();

export const HtmlNodeSchema = z
  .object({
    __html: z.string(),
    __brand: z.literal('HtmlNode'),
  })
  .brand<'HtmlNode'>();
