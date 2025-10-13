import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const modulePath = './delegate';

declare global {
  interface Window {
    __ASTRO_JSX_DELEGATE__?: unknown;
  }
}

class StubElement extends EventTarget {
  parentElement: StubElement | null = null;
  readonly nodeType = 1;

  constructor(parent: StubElement | null = null) {
    super();
    this.parentElement = parent;
  }
}

class DocumentStub {
  private listeners = new Map<string, EventListener>();

  addEventListener(type: string, listener: EventListener, _capture?: boolean) {
    this.listeners.set(type, listener);
  }

  removeEventListener(
    type: string,
    listener: EventListener,
    _capture?: boolean,
  ) {
    const registered = this.listeners.get(type);
    if (registered === listener) {
      this.listeners.delete(type);
    }
  }

  dispatch(type: string, event: Event) {
    const listener = this.listeners.get(type);
    if (listener) {
      listener.call(this, event);
    }
  }

  hasListener(type: string) {
    return this.listeners.has(type);
  }
}

const originalDescriptors = {
  window: Object.getOwnPropertyDescriptor(globalThis, 'window'),
  document: Object.getOwnPropertyDescriptor(globalThis, 'document'),
  Element: Object.getOwnPropertyDescriptor(globalThis, 'Element'),
};

async function importDelegate() {
  return await import(modulePath);
}

function unsetGlobalProperty(key: 'window' | 'document' | 'Element'): void {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
  if (descriptor?.configurable ?? true) {
    Object.defineProperty(globalThis, key, {
      value: undefined,
      configurable: true,
      writable: true,
    });
  }
}

beforeEach(() => {
  vi.resetModules();
  unsetGlobalProperty('window');
  unsetGlobalProperty('document');
  unsetGlobalProperty('Element');
  (
    globalThis as Window & { __ASTRO_JSX_DELEGATE__?: unknown }
  ).__ASTRO_JSX_DELEGATE__ = undefined;
});

afterEach(() => {
  const restore = (key: 'window' | 'document' | 'Element') => {
    const descriptor = originalDescriptors[key];
    if (descriptor) {
      Object.defineProperty(globalThis, key, descriptor);
    } else {
      unsetGlobalProperty(key);
    }
  };

  restore('window');
  restore('document');
  restore('Element');
});

function defineBrowserEnvironment() {
  const document = new DocumentStub();
  const window = { document } as unknown as Window;

  Object.defineProperty(globalThis, 'document', {
    value: document,
    configurable: true,
  });

  Object.defineProperty(globalThis, 'window', {
    value: window,
    configurable: true,
  });

  Object.defineProperty(globalThis, 'Element', {
    value: StubElement,
    configurable: true,
  });

  return { document, window };
}

describe('delegate runtime (node fallback)', () => {
  test('register returns noop when document is unavailable', async () => {
    const { delegate } = await importDelegate();

    const noop = delegate.register(
      new EventTarget() as unknown as Element,
      'click',
      vi.fn(),
    );
    expect(() => noop()).not.toThrow();
  });
});

describe('delegate runtime (browser stub)', () => {
  test('invokes handlers from nearest element outward', async () => {
    const { document } = defineBrowserEnvironment();

    const child = new StubElement();
    const parent = new StubElement();
    child.parentElement = parent;

    const { delegate } = await importDelegate();

    const calls: Array<string> = [];

    delegate.register(parent as unknown as Element, 'click', () => {
      calls.push('parent');
    });

    delegate.register(child as unknown as Element, 'click', () => {
      calls.push('child');
    });

    const event = new Event('click');
    Object.defineProperty(event, 'composedPath', {
      value: () => [child, parent],
    });
    Object.defineProperty(event, 'target', {
      value: child,
    });

    (document as DocumentStub).dispatch('click', event);

    expect(calls).toEqual(['child', 'parent']);
  });

  test('unregister prevents handler invocation', async () => {
    const { document } = defineBrowserEnvironment();
    const element = new StubElement();

    const { delegate } = await importDelegate();

    const handler = vi.fn();
    const dispose = delegate.register(
      element as unknown as Element,
      'click',
      handler,
    );
    dispose();

    const event = new Event('click');
    Object.defineProperty(event, 'composedPath', {
      value: () => [element],
    });
    Object.defineProperty(event, 'target', {
      value: element,
    });

    (document as DocumentStub).dispatch('click', event);

    expect(handler).not.toHaveBeenCalled();
  });

  test('destroy removes all listeners', async () => {
    const { document } = defineBrowserEnvironment();
    const element = new StubElement();

    const { delegate } = await importDelegate();

    delegate.register(element as unknown as Element, 'click', vi.fn());
    delegate.register(element as unknown as Element, 'input', vi.fn());

    delegate.destroy();

    expect((document as DocumentStub).hasListener('click')).toBe(false);
    expect((document as DocumentStub).hasListener('input')).toBe(false);
  });

  test('duplicate registrations return noop disposer', async () => {
    defineBrowserEnvironment();
    const element = new StubElement();
    const handler = vi.fn();

    const { delegate } = await importDelegate();

    const first = delegate.register(
      element as unknown as Element,
      'click',
      handler,
    );
    const second = delegate.register(
      element as unknown as Element,
      'click',
      handler,
    );

    second();

    const event = new Event('click');
    Object.defineProperty(event, 'composedPath', {
      value: () => [element],
    });
    Object.defineProperty(event, 'target', {
      value: element,
    });

    (globalThis.document as DocumentStub).dispatch('click', event);

    expect(handler).toHaveBeenCalledTimes(1);

    first();
  });

  test('registerMany delegates multiple events and disposes once', async () => {
    const { document } = defineBrowserEnvironment();
    const element = new StubElement();
    const click = vi.fn();
    const input = vi.fn();

    const { delegate } = await importDelegate();

    const dispose = delegate.registerMany(element as unknown as Element, {
      click,
      input,
    });

    const createEvent = (type: string) => {
      const event = new Event(type);
      Object.defineProperty(event, 'composedPath', {
        value: () => [element],
      });
      Object.defineProperty(event, 'target', {
        value: element,
      });
      return event;
    };

    (document as DocumentStub).dispatch('click', createEvent('click'));

    expect(click).toHaveBeenCalledTimes(1);

    (document as DocumentStub).dispatch('input', createEvent('input'));

    expect(input).toHaveBeenCalledTimes(1);

    dispose();

    (document as DocumentStub).dispatch('click', createEvent('click'));
    (document as DocumentStub).dispatch('input', createEvent('input'));

    expect(click).toHaveBeenCalledTimes(1);
    expect(input).toHaveBeenCalledTimes(1);
  });
});
