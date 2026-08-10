import type { ReactNode } from 'react';

export interface BottomNavItem {
  key: string;
  label: string;
  icon: ReactNode;
}

export function BottomNav({
  items,
  active,
  onSelect,
}: {
  items: BottomNavItem[];
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-fairway-100 bg-white/95 backdrop-blur">
      <div className="mx-auto grid w-full max-w-lg grid-cols-4">
        {items.map((item) => {
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={[
                'flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold',
                'transition-colors',
                isActive ? 'text-fairway-700' : 'text-fairway-400 active:text-fairway-600',
              ].join(' ')}
            >
              <span
                className={[
                  'flex h-8 w-12 items-center justify-center rounded-full transition-colors',
                  isActive ? 'bg-fairway-100' : '',
                ].join(' ')}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
