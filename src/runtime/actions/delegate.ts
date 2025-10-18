import type { DelegateRuntime } from './types';
import type { DelegateEventMap, DelegateHandler } from './types';

const EVENT_NAMES = ['click', 'input', 'change', 'submit'] as const;
type DelegateEventName = (typeof EVENT_NAMES)[number];

type AnyDelegateHandler = DelegateHandler<DelegateEventName>;

interface ElementHandlers
  extends Map<DelegateEventName, Set<AnyDelegateHandler>> {}

interface ListenerMap extends Map<DelegateEventName, EventListener> {}

interface HandlerRegistry extends WeakMap<Element, ElementHandlers> {}

interface ListenerCounter extends Map<DelegateEventName, number> {}

const noop = () => {
  /* noop */
};

const hasDocument = typeof document !== 'undefined';
const hasWindow = typeof window !== 'undefined';
const isBrowserEnvironment = hasDocument && hasWindow;

function createNoopRuntime(): DelegateRuntime {
  const noOpDisposer = () => {
    /* noop */
  };

  return Object.freeze({
    register: () => noOpDisposer,
    registerMany: () => noOpDisposer,
    destroy: () => {
      /* noop */
    },
  });
}

function createDelegateRuntime(): DelegateRuntime {
  const listeners: ListenerMap = new Map();
  const handlerCounts: ListenerCounter = new Map();
  const registry: HandlerRegistry = new WeakMap();

  const ensureListener = (event: DelegateEventName) => {
    if (listeners.has(event)) {
      return;
    }

    const listener: EventListener = (nativeEvent) => {
      dispatch(event, nativeEvent as DelegateEventMap[typeof event]);
    };

    document.addEventListener(event, listener, true);
    listeners.set(event, listener);
  };

  const teardownListener = (event: DelegateEventName) => {
    const listener = listeners.get(event);
    if (!listener) return;
    if ((handlerCounts.get(event) ?? 0) > 0) return;
    document.removeEventListener(event, listener, true);
    listeners.delete(event);
  };

  const incrementCount = (event: DelegateEventName) => {
    handlerCounts.set(event, (handlerCounts.get(event) ?? 0) + 1);
  };

  const decrementCount = (event: DelegateEventName) => {
    const next = (handlerCounts.get(event) ?? 0) - 1;
    if (next <= 0) {
      handlerCounts.delete(event);
    } else {
      handlerCounts.set(event, next);
    }
  };

  const register: DelegateRuntime['register'] = (target, event, handler) => {
    if (!isElement(target)) {
      return noop;
    }

    let perElement = registry.get(target);
    if (!perElement) {
      perElement = new Map();
      registry.set(target, perElement);
    }

    let handlers = perElement.get(event);
    if (!handlers) {
      handlers = new Set();
      perElement.set(event, handlers);
    }

    if (handlers.has(handler as AnyDelegateHandler)) {
      return noop;
    }

    handlers.add(handler as AnyDelegateHandler);
    incrementCount(event);
    ensureListener(event);

    let disposed = false;

    return () => {
      if (disposed) return;
      disposed = true;
      handlers?.delete(handler as AnyDelegateHandler);
      decrementCount(event);
      if (handlers?.size === 0) {
        perElement?.delete(event);
      }
      if (perElement && perElement.size === 0) {
        registry.delete(target);
      }
      teardownListener(event);
    };
  };

  const registerMany: DelegateRuntime['registerMany'] = (target, map) => {
    const disposers: Array<() => void> = [];
    for (const event of EVENT_NAMES) {
      const handler = map[event];
      if (handler) {
        disposers.push(
          register(target, event, handler as DelegateHandler<typeof event>),
        );
      }
    }

    let disposed = false;
    return () => {
      if (disposed) return;
      disposed = true;
      for (const dispose of disposers) {
        dispose();
      }
    };
  };

  const destroy: DelegateRuntime['destroy'] = () => {
    for (const [event, listener] of listeners) {
      document.removeEventListener(event, listener, true);
    }
    listeners.clear();
    handlerCounts.clear();
    // WeakMap cannot be cleared; relying on GC once references drop.
  };

  const dispatch = (
    event: DelegateEventName,
    nativeEvent: DelegateEventMap[DelegateEventName],
  ) => {
    const elements = resolvePropagationPath(nativeEvent);
    for (const element of elements) {
      const registered = registry.get(element);
      if (!registered) continue;
      const handlers = registered.get(event);
      if (!handlers || handlers.size === 0) continue;

      const snapshot = Array.from(handlers);
      for (const handler of snapshot) {
        try {
          handler(nativeEvent, element);
        } catch {
          // Swallow handler exceptions to avoid breaking delegation chain.
        }
      }
    }
  };

  return Object.freeze({ register, registerMany, destroy });
}

function resolvePropagationPath(event: Event): Element[] {
  const seen = new Set<Element>();
  const results: Element[] = [];

  const maybeAdd = (node: unknown) => {
    if (isElement(node) && !seen.has(node)) {
      seen.add(node);
      results.push(node);
    }
  };

  if (typeof event.composedPath === 'function') {
    const path = event.composedPath();
    for (const node of path) {
      maybeAdd(node);
    }
    return results;
  }

  const candidateTarget = (event as unknown as { target?: unknown }).target;

  let current: Element | null = isElement(candidateTarget)
    ? (candidateTarget as Element)
    : null;

  while (current) {
    maybeAdd(current);
    current = current.parentElement;
  }

  return results;
}

function isElement(value: unknown): value is Element {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  if (typeof Element !== 'undefined' && value instanceof Element) {
    return true;
  }

  const candidate = value as { nodeType?: unknown };
  return candidate.nodeType === 1;
}

const delegateRuntime: DelegateRuntime = isBrowserEnvironment
  ? createDelegateRuntime()
  : createNoopRuntime();

if (isBrowserEnvironment) {
  const globalDelegate = (
    window as Window & { __ASTRO_JSX_DELEGATE__?: DelegateRuntime }
  ).__ASTRO_JSX_DELEGATE__;
  if (!globalDelegate) {
    Object.defineProperty(window, '__ASTRO_JSX_DELEGATE__', {
      value: delegateRuntime,
      enumerable: false,
      configurable: true,
      writable: false,
    });
  }
}

Object.freeze(delegateRuntime);

export const delegate = delegateRuntime;

export type {
  DelegateEventMap,
  DelegateHandler,
  DelegateMap,
  DelegateRuntime,
} from './types';
