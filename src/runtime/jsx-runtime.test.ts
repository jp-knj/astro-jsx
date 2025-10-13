import { describe, expect, test } from 'vitest';
import snapshotNode from '../../tests/snapshots/runtime/jsx-runtime-node';
import { Fragment, createRuntime } from './index';
import {
  isComponentNode,
  isElementNode,
  isFragmentNode,
} from './validation/guards';

describe('jsx runtime factory', () => {
  test('creates element node for intrinsic tags with key retention', () => {
    const runtime = createRuntime();
    const node = runtime.jsx('div', { id: 'root' }, 'welcome');

    expect(isElementNode(node)).toBe(true);
    expect(node.type).toBe('div');
    expect(node.key).toBe('welcome');
    expect(node.props).toEqual({ id: 'root' });
  });

  test('rejects deprecated compat option during initialization', () => {
    expect(() => createRuntime({ compat: { acceptClassName: true } })).toThrow(
      'compat.acceptClassName was removed; drop legacy configuration.',
    );
  });

  test('throws when html node is assigned to an attribute', () => {
    const runtime = createRuntime();
    const markup = runtime.html('<em>hi</em>');

    expect(() => runtime.jsx('div', { id: markup })).toThrow(
      'html() cannot be used in attributes',
    );
  });

  test('leaves className untouched', () => {
    const runtime = createRuntime();
    const node = runtime.jsx('span', { className: 'badge' });

    expect(node.props.class).toBeUndefined();
  });

  test('rejects deprecated compat.acceptClassName configuration', () => {
    const runtime = createRuntime();

    expect(() =>
      runtime.configure({ compat: { acceptClassName: false } }),
    ).toThrow('compat.acceptClassName was removed; drop legacy configuration.');
  });

  test('locks configuration after first render', () => {
    const runtime = createRuntime();
    runtime.jsx('div');

    expect(() => runtime.configure({})).toThrow(
      'Runtime configuration is locked after first render. Configure must be called before any jsx() or html() calls.',
    );
  });

  test('creates component node for function components', () => {
    const runtime = createRuntime();
    const Component = () => 'ok';

    const node = runtime.jsx(Component, { value: 42 });

    expect(isComponentNode(node)).toBe(true);
    expect(node.type).toBe(Component);
    expect(node.props.value).toBe(42);
  });

  test('creates fragment node when Fragment symbol is used', () => {
    const runtime = createRuntime();
    const node = runtime.jsx(Fragment, { children: ['a', 'b'] });

    expect(isFragmentNode(node)).toBe(true);
    expect(node.type).toBe(Fragment);
    expect(node.props.children).toEqual(['a', 'b']);
  });

  test('jsxs mirrors jsx for multi-child scenarios', () => {
    const runtime = createRuntime();
    const node = runtime.jsxs('ul', { children: ['one', 'two'] }, 'list');

    expect(isElementNode(node)).toBe(true);
    expect(node.props.children).toEqual(['one', 'two']);
    expect(node.key).toBe('list');
  });

  test('html helper returns branded raw HTML node', () => {
    const runtime = createRuntime();
    const raw = runtime.html('<p>safe</p>');

    expect(raw).toEqual({ __html: '<p>safe</p>', __brand: 'HtmlNode' });
  });

  test('preserves class attribute variants without normalization', () => {
    const runtime = createRuntime();

    const stringNode = runtime.jsx('div', { class: 'primary' });
    expect(stringNode.props.class).toBe('primary');

    const arrayValue = ['badge', 'compact'];
    const arrayNode = runtime.jsx('div', { class: arrayValue });
    expect(arrayNode.props.class).toBe(arrayValue);

    const recordValue = { active: true, disabled: false } as const;
    const recordNode = runtime.jsx('div', { class: recordValue });
    expect(recordNode.props.class).toBe(recordValue);
  });

  test('rejects unsupported class attribute types', () => {
    const runtime = createRuntime();

    expect(() => runtime.jsx('div', { class: 42 })).toThrow(
      'class attribute must be a string, string[], or Record<string, boolean>',
    );
  });

  test('preserves style attribute variants without normalization', () => {
    const runtime = createRuntime();

    const stringNode = runtime.jsx('div', { style: 'margin:0' });
    expect(stringNode.props.style).toBe('margin:0');

    const recordValue = { marginTop: '1rem', opacity: 0.75 } as const;
    const recordNode = runtime.jsx('div', { style: recordValue });
    expect(recordNode.props.style).toBe(recordValue);
  });

  test('rejects unsupported style attribute types', () => {
    const runtime = createRuntime();

    expect(() => runtime.jsx('div', { style: true })).toThrow(
      'style attribute must be a string or Record<string, string | number>',
    );
  });

  test('keeps boolean attribute values as booleans', () => {
    const runtime = createRuntime();

    const trueNode = runtime.jsx('input', { disabled: true });
    expect(trueNode.props.disabled).toBe(true);

    const falseNode = runtime.jsx('input', { disabled: false });
    expect(falseNode.props.disabled).toBe(false);
    expect(
      Object.prototype.hasOwnProperty.call(falseNode.props, 'disabled'),
    ).toBe(true);
  });

  test('passes through unknown attributes without normalization', () => {
    const runtime = createRuntime();
    const customHandler = () => {};
    const props = {
      'data-test-id': 'hero-title',
      inert: '',
      onBlur: customHandler,
    } as const;

    const node = runtime.jsx('section', props);

    expect(node.props['data-test-id']).toBe('hero-title');
    expect(node.props.inert).toBe('');
    expect(node.props.onBlur).toBe(customHandler);
  });

  test('supports string children', () => {
    const runtime = createRuntime();
    const node = runtime.jsx('p', { children: 'hello' });

    expect(node.props.children).toBe('hello');
  });

  test('supports number children', () => {
    const runtime = createRuntime();
    const node = runtime.jsx('span', { children: 42 });

    expect(node.props.children).toBe(42);
  });

  test('renders boolean children as empty', () => {
    const runtime = createRuntime();
    const trueNode = runtime.jsx('div', { children: true });
    const falseNode = runtime.jsx('div', { children: false });

    expect(Object.hasOwn(trueNode.props, 'children')).toBe(false);
    expect(Object.hasOwn(falseNode.props, 'children')).toBe(false);
  });

  test('renders nullish children as empty', () => {
    const runtime = createRuntime();
    const nullNode = runtime.jsx('div', { children: null });
    const undefinedNode = runtime.jsx('div', { children: undefined });

    expect(Object.hasOwn(nullNode.props, 'children')).toBe(false);
    expect(Object.hasOwn(undefinedNode.props, 'children')).toBe(false);
  });

  test('supports HtmlNode children', () => {
    const runtime = createRuntime();
    const markup = runtime.html('<strong>bold</strong>');
    const node = runtime.jsx('div', { children: markup });

    expect(node.props.children).toBe(markup);
  });

  test('flattens nested children arrays', () => {
    const runtime = createRuntime();
    const markup = runtime.html('<i>italics</i>');
    const childNode = runtime.jsx('em', { children: 'nested' });
    const node = runtime.jsx('div', {
      children: [
        'a',
        ['b', [null, ['c']]],
        markup,
        [childNode, [false]],
        undefined,
      ],
    });

    expect(node.props.children).toEqual(['a', 'b', 'c', markup, childNode]);
  });

  test('preserves promise children without awaiting them', async () => {
    const runtime = createRuntime();
    const promise = Promise.resolve('later');
    const node = runtime.jsx('div', { children: promise });

    expect(node.props.children).toBe(promise);
    await expect(node.props.children).resolves.toBe('later');
  });

  test('supports arrays mixing sync and async children', async () => {
    const runtime = createRuntime();
    const promise = Promise.resolve('async');
    const node = runtime.jsx('div', {
      children: ['now', promise, [Promise.resolve('nested')]],
    });

    expect(Array.isArray(node.props.children)).toBe(true);
    const children = node.props.children as unknown[];
    expect(children[0]).toBe('now');
    await expect(children[1]).resolves.toBe('async');
    await expect(children[2]).resolves.toBe('nested');
  });

  test('supports component children without executing them', () => {
    const runtime = createRuntime();
    const Child = () => 'rendered';

    const node = runtime.jsx('section', {
      children: runtime.jsx(Child, { value: 1 }),
    });

    expect(isComponentNode(node.props.children)).toBe(true);
    const componentChild = node.props.children as ReturnType<
      typeof runtime.jsx
    >;
    expect(componentChild.type).toBe(Child);
    expect(componentChild.props.value).toBe(1);
  });

  test('element node structure matches snapshot', () => {
    const runtime = createRuntime();
    const node = runtime.jsx('article', {
      id: 'root',
      class: 'card',
      children: [
        'hello',
        runtime.jsx('span', { class: 'badge', children: 'new' }),
      ],
    });

    expect(node).toEqual(snapshotNode);
  });
});
