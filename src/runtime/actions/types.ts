export interface DelegateEventMap {
  click: MouseEvent;
  input: InputEvent | Event;
  change: Event;
  submit: SubmitEvent | Event;
}

export type DelegateHandler<T extends keyof DelegateEventMap> = (
  event: DelegateEventMap[T],
  target: Element,
) => void;

export interface DelegateMap {
  click?: DelegateHandler<'click'>;
  input?: DelegateHandler<'input'>;
  change?: DelegateHandler<'change'>;
  submit?: DelegateHandler<'submit'>;
}

export interface DelegateRuntime {
  register<T extends keyof DelegateEventMap>(
    target: Element,
    event: T,
    handler: DelegateHandler<T>,
  ): () => void;

  registerMany(target: Element, map: DelegateMap): () => void;

  destroy(): void;
}
