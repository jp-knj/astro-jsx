import type { JSXNode } from '../../src/runtime/types';

const snapshot: JSXNode = {
  type: 'article',
  key: undefined,
  props: {
    id: 'root',
    class: 'card',
    children: [
      'hello',
      {
        type: 'span',
        key: undefined,
        props: {
          class: 'badge',
          children: 'new',
        },
      },
    ],
  },
};

export default snapshot;
