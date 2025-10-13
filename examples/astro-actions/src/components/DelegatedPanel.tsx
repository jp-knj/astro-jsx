import { html } from 'astro-jsx/runtime';

export interface DelegatedAction {
  value: string;
  label: string;
  description?: string;
}

export interface DelegatedPanelProps {
  heading?: string;
  actions: DelegatedAction[];
}

const introCopy = html(
  '<strong>Try the buttons below:</strong> the delegated listener updates the log without attaching individual handlers.',
);

export function DelegatedPanel({
  heading = 'Preset actions',
  actions,
}: DelegatedPanelProps) {
  return (
    <section id="action-buttons" aria-label={heading}>
      <header>
        <h2>{heading}</h2>
        <p>{introCopy}</p>
      </header>

      <ul>
        {actions.map(({ value, label, description }) => (
          <button
            key={value}
            type="button"
            data-value={value}
            aria-label={description ?? label}
          >
            {label}
          </button>
        ))}
      </ul>
    </section>
  );
}
