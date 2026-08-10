import { useEffect, useRef, useState } from 'react';
import { MinusIcon, PlusIcon } from './Icons';

interface ScoreStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Färgar siffran, t.ex. relativt par. */
  numberClassName?: string;
}

/**
 * Stor +/- kontroll för snabb scoreinmatning med en hand.
 * Siffran är tryckbar för att skriva in score direkt.
 */
export function ScoreStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  numberClassName = '',
}: ScoreStepperProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const commitDraft = () => {
    const parsed = parseInt(draft, 10);
    if (Number.isFinite(parsed)) onChange(clamp(parsed));
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Minska score"
        onClick={() => onChange(clamp(value - 1))}
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-fairway-100 text-fairway-700 active:bg-fairway-200 disabled:opacity-40"
        disabled={value <= min}
      >
        <MinusIcon width={30} height={30} />
      </button>

      {editing ? (
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitDraft();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="h-16 w-20 rounded-2xl border-2 border-fairway-300 bg-white text-center text-4xl font-bold tabular-nums text-fairway-900 outline-none"
        />
      ) : (
        <button
          type="button"
          aria-label="Ange score"
          onClick={() => {
            setDraft(String(value));
            setEditing(true);
          }}
          className={[
            'h-16 w-20 rounded-2xl text-4xl font-bold tabular-nums',
            'flex items-center justify-center active:bg-fairway-50',
            numberClassName || 'text-fairway-900',
          ].join(' ')}
        >
          {value}
        </button>
      )}

      <button
        type="button"
        aria-label="Öka score"
        onClick={() => onChange(clamp(value + 1))}
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-fairway-600 text-white active:bg-fairway-700 disabled:opacity-40"
        disabled={value >= max}
      >
        <PlusIcon width={30} height={30} />
      </button>
    </div>
  );
}
