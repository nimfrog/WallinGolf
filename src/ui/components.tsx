import type { ButtonHTMLAttributes, ReactNode } from 'react';

/* --- Knapp ---------------------------------------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-fairway-600 text-white shadow-lg shadow-fairway-900/20 active:bg-fairway-700 disabled:bg-fairway-200 disabled:text-fairway-400 disabled:shadow-none',
  secondary:
    'bg-white text-fairway-800 border-2 border-fairway-200 active:bg-fairway-50 disabled:text-fairway-300 disabled:border-fairway-100',
  ghost: 'bg-transparent text-fairway-700 active:bg-fairway-100/60',
  danger:
    'bg-white text-red-600 border-2 border-red-200 active:bg-red-50 disabled:opacity-50',
};

export function Button({
  variant = 'primary',
  fullWidth = true,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4',
        'text-lg font-semibold tracking-tight select-none',
        'transition-colors duration-100 min-h-[3.5rem]',
        fullWidth ? 'w-full' : '',
        VARIANT_CLASSES[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}

/* --- Kort ----------------------------------------------------------------- */

export function Card({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const clickable = Boolean(onClick);
  return (
    <div
      onClick={onClick}
      className={[
        'rounded-[var(--radius-card)] bg-white shadow-sm ring-1 ring-fairway-900/5',
        clickable ? 'active:scale-[0.99] transition-transform cursor-pointer' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

/* --- Rubrik --------------------------------------------------------------- */

export function SectionTitle({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-fairway-500">
        {children}
      </h2>
      {right}
    </div>
  );
}

/* --- Statusetikett -------------------------------------------------------- */

type PillTone = 'neutral' | 'live' | 'done' | 'flag';

const PILL_TONE: Record<PillTone, string> = {
  neutral: 'bg-fairway-100 text-fairway-600',
  live: 'bg-flag-500 text-white',
  done: 'bg-fairway-600 text-white',
  flag: 'bg-flag-100 text-flag-600',
};

export function Pill({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode;
  tone?: PillTone;
  className?: string;
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide',
        PILL_TONE[tone],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

/* --- Tomt tillstånd ------------------------------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border-2 border-dashed border-fairway-200 bg-white/50 px-6 py-10 text-center">
      {icon && <div className="mb-3 text-fairway-300">{icon}</div>}
      <p className="text-base font-semibold text-fairway-800">{title}</p>
      {description && <p className="mt-1 text-sm text-fairway-500">{description}</p>}
    </div>
  );
}

/* --- Centrerad notis (t.ex. saknad data) ---------------------------------- */

export function CenteredNotice({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div>
        <p className="text-lg font-bold text-fairway-900">{title}</p>
        {description && <p className="mt-1 text-sm text-fairway-500">{description}</p>}
      </div>
      <div className="w-full max-w-xs">
        <Button onClick={onAction}>{actionLabel}</Button>
      </div>
    </div>
  );
}

/* --- Felmeddelande -------------------------------------------------------- */

export function ErrorBanner({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  return (
    <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <ul className="space-y-1">
        {messages.map((m, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden>•</span>
            <span>{m}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
