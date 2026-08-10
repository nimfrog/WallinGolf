import type { ReactNode } from 'react';
import { ChevronLeftIcon } from './Icons';

interface ScreenShellProps {
  title: ReactNode;
  subtitle?: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
  children: ReactNode;
  /** Extra utrymme i botten (t.ex. för bottom-nav eller fast knapp). */
  bottomInset?: boolean;
}

/** Gemensamt skärmskal med topbar och scrollbart innehåll. */
export function ScreenShell({
  title,
  subtitle,
  onBack,
  right,
  children,
  bottomInset,
}: ScreenShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="safe-top sticky top-0 z-20 bg-fairway-900 text-white shadow-md">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-3">
          {onBack && (
            <button
              type="button"
              aria-label="Tillbaka"
              onClick={onBack}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full active:bg-white/10"
            >
              <ChevronLeftIcon />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold leading-tight tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-xs text-fairway-200">{subtitle}</p>
            )}
          </div>
          {right}
        </div>
      </header>

      <main
        className={[
          'mx-auto w-full max-w-lg flex-1 px-4 pt-4',
          bottomInset ? 'pb-32' : 'pb-8',
        ].join(' ')}
      >
        {children}
      </main>
    </div>
  );
}
