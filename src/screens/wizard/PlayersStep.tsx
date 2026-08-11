import type { PlayerDraft } from '../../data/sampleData';
import { TEE_OPTIONS } from '../../data/sampleData';
import type { DerivedHandicap } from '../../logic/draftHandicap';
import { Card } from '../../ui/components';
import { formatNumber } from '../../lib/format';

interface PlayersStepProps {
  drafts: PlayerDraft[];
  derived: DerivedHandicap[];
  onChange: (index: number, patch: Partial<PlayerDraft>) => void;
}

const fieldClass =
  'w-full rounded-xl border-2 border-fairway-200 bg-white px-3 py-3 text-base font-medium text-fairway-900 outline-none focus:border-fairway-500';

const labelClass =
  'mb-1 block text-[11px] font-bold uppercase tracking-wide text-fairway-500';

function Toggle<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              'rounded-xl px-4 py-2 text-sm font-semibold',
              active
                ? 'bg-fairway-600 text-white'
                : 'bg-fairway-100 text-fairway-700 active:bg-fairway-200',
            ].join(' ')}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function PlayersStep({ drafts, derived, onChange }: PlayersStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-fairway-600">
        Ange fyra spelare. Spelhandicap beräknas automatiskt från exakt handicap,
        tee och kön när banan har slopedata – annars anger du det manuellt.
      </p>

      {drafts.map((draft, index) => {
        const d = derived[index];
        return (
          <Card key={index} className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-fairway-600 text-sm font-bold text-white">
                {index + 1}
              </span>
              <span className="text-sm font-semibold text-fairway-700">
                Spelare {index + 1}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className={labelClass}>Namn</label>
                <input
                  className={fieldClass}
                  value={draft.name}
                  placeholder="Namn"
                  autoCapitalize="words"
                  onChange={(e) => onChange(index, { name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Exakt HCP</label>
                  <input
                    className={fieldClass}
                    value={draft.exactHandicap}
                    inputMode="decimal"
                    placeholder="27,8"
                    onChange={(e) => onChange(index, { exactHandicap: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Kön</label>
                  <Toggle
                    ariaLabel={`Kön spelare ${index + 1}`}
                    value={draft.gender}
                    onChange={(gender) => onChange(index, { gender })}
                    options={
                      [
                        { value: 'herr', label: 'Herr' },
                        { value: 'dam', label: 'Dam' },
                      ] as const
                    }
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Tee</label>
                <Toggle
                  ariaLabel={`Tee spelare ${index + 1}`}
                  value={draft.tee}
                  onChange={(tee) => onChange(index, { tee })}
                  options={TEE_OPTIONS.map((t) => ({ value: t, label: t }))}
                />
              </div>

              {/* Spelhandicap */}
              <div className="rounded-xl bg-fairway-50 p-3">
                <div className="flex items-center justify-between">
                  <span className={labelClass + ' mb-0'}>Spelhandicap</span>
                  {d.rating && (
                    <button
                      type="button"
                      onClick={() =>
                        onChange(index, {
                          overridePlayingHandicap: !draft.overridePlayingHandicap,
                        })
                      }
                      className="text-xs font-semibold text-fairway-600 underline-offset-2 active:underline"
                    >
                      {d.showManual ? 'Använd beräknat' : 'Ange manuellt'}
                    </button>
                  )}
                </div>

                {d.showManual ? (
                  <div className="mt-2">
                    <input
                      className={fieldClass}
                      value={draft.manualPlayingHandicap}
                      inputMode="numeric"
                      placeholder="Spelhandicap"
                      aria-label={`Spelhandicap spelare ${index + 1}`}
                      onChange={(e) =>
                        onChange(index, { manualPlayingHandicap: e.target.value })
                      }
                    />
                    {!d.rating && (
                      <p className="mt-1 text-xs text-fairway-500">
                        Ingen slopedata för {draft.tee.toLowerCase()} ({draft.gender}) på
                        den valda banan – ange spelhandicap manuellt.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-1 flex items-end justify-between">
                    <div>
                      <p className="text-4xl font-black leading-none text-fairway-900">
                        {d.effective ?? '–'}
                      </p>
                    </div>
                    {d.rating && (
                      <p className="text-right text-xs text-fairway-500">
                        Beräknat · {d.rating.tee} {d.rating.gender}
                        <br />
                        CR {formatNumber(d.rating.courseRating)} / Slope {d.rating.slope}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
