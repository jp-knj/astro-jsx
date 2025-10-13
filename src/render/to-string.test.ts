import { describe, expect, test } from 'vitest';
import { Fragment, createRuntime, renderToString } from '../runtime/index';

describe('renderToString', () => {
  test('renders simple element with escaped text', async () => {
    const runtime = createRuntime();
    const node = runtime.jsx('p', { children: 'Hello & <astro>' });

    await expect(renderToString(node)).resolves.toBe(
      '<p>Hello &amp; &lt;astro&gt;</p>',
    );
  });

  test('renders raw html children without escaping', async () => {
    const runtime = createRuntime();
    const raw = runtime.html('<em>safe</em>');
    const node = runtime.jsx('div', { children: raw });

    await expect(renderToString(node)).resolves.toBe(
      '<div><em>safe</em></div>',
    );
  });

  test('serializes class and style attributes with ordering', async () => {
    const runtime = createRuntime();
    const node = runtime.jsx('div', {
      id: 'hero',
      class: ['card', 'primary'],
      style: { marginTop: '1rem', opacity: 0.75 },
      'data-test-id': 'banner',
      'aria-label': 'Hero section',
      hidden: true,
    });

    await expect(renderToString(node)).resolves.toBe(
      '<div id="hero" class="card primary" style="margin-top:1rem;opacity:0.75" data-test-id="banner" aria-label="Hero section" hidden></div>',
    );
  });

  test('orders common attributes ahead of data/aria/known buckets', async () => {
    const runtime = createRuntime();
    const node = runtime.jsx('input', {
      id: 'field',
      class: 'primary',
      type: 'text',
      placeholder: 'Name',
      disabled: true,
      'data-cy': 'input-name',
      'aria-label': 'Full name',
    });

    await expect(renderToString(node)).resolves.toBe(
      '<input id="field" class="primary" type="text" data-cy="input-name" aria-label="Full name" disabled placeholder="Name">',
    );
  });

  test('omits falsy boolean attributes and drains void element children', async () => {
    const runtime = createRuntime();
    const node = runtime.jsx('img', {
      src: '/logo.png',
      alt: 'Logo',
      draggable: false,
      children: 'should-ignore',
    });

    await expect(renderToString(node)).resolves.toBe(
      '<img src="/logo.png" alt="Logo">',
    );
  });

  test('renders fragments and component output depth-first with promises', async () => {
    const runtime = createRuntime();

    const AsyncChild = async () => {
      return runtime.jsx('span', {
        children: await Promise.resolve('async'),
      });
    };

    const node = runtime.jsx(Fragment, {
      children: [
        runtime.jsx('strong', { children: 'sync' }),
        runtime.jsx(AsyncChild, {}),
        Promise.resolve(' tail'),
      ],
    });

    await expect(renderToString(node)).resolves.toBe(
      '<strong>sync</strong><span>async</span> tail',
    );
  });

  test('serializes complex tree snapshot for regression safety', async () => {
    const runtime = createRuntime();

    const AsyncBadge = async () =>
      runtime.jsx('span', {
        class: { badge: true, async: true },
        children: await Promise.resolve('async'),
      });

    const node = runtime.jsx(Fragment, {
      children: [
        runtime.jsx('article', {
          id: 'post-42',
          class: ['entry', 'featured'],
          style: { marginTop: '2rem', '--accent-color': '#663399' },
          'data-order': 2,
          'aria-label': 'Featured post',
          hidden: false,
          children: [
            runtime.jsx('header', {
              class: 'entry-header',
              children: runtime.jsx('h1', { children: 'Deep dive' }),
            }),
            runtime.jsx('section', {
              class: { content: true, draft: false },
              children: [
                runtime.jsx('p', { children: 'Server-rendered output' }),
                runtime.html('<pre data-raw="1">&lt;raw&gt;</pre>'),
                runtime.jsx(AsyncBadge, {}),
              ],
            }),
          ],
        }),
        runtime.jsx('input', {
          id: 'newsletter',
          type: 'email',
          placeholder: 'Email',
          required: true,
          checked: false,
        }),
      ],
    });

    await expect(renderToString(node)).resolves.toMatchSnapshot();
  });
});
