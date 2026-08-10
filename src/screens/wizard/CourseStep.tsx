import type { Course } from '../../types';
import type { HoleDraftInput } from '../../logic/validation';
import { ALLOWED_HOLE_COUNTS } from '../../logic/validation';
import { Card, Pill } from '../../ui/components';
import { MinusIcon, PlusIcon } from '../../ui/Icons';

interface CourseStepProps {
  savedCourses: Course[];
  selectedCourseId: string | null;
  onSelectCourse: (id: string | null) => void;

  name: string;
  onNameChange: (name: string) => void;
  holeCount: number;
  onHoleCountChange: (count: number) => void;
  holes: HoleDraftInput[];
  onHoleChange: (index: number, patch: Partial<HoleDraftInput>) => void;
}

const inputClass =
  'w-full rounded-xl border-2 border-fairway-200 bg-white px-3 py-3 text-base font-medium text-fairway-900 outline-none focus:border-fairway-500';

export function CourseStep({
  savedCourses,
  selectedCourseId,
  onSelectCourse,
  name,
  onNameChange,
  holeCount,
  onHoleCountChange,
  holes,
  onHoleChange,
}: CourseStepProps) {
  const creatingNew = selectedCourseId === null;

  const parStep = (index: number, delta: number) => {
    const current = Number(holes[index].par) || 4;
    const next = Math.min(6, Math.max(3, current + delta));
    onHoleChange(index, { par: String(next) });
  };

  return (
    <div className="space-y-5">
      {savedCourses.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-fairway-500">
            Sparade banor
          </p>
          <div className="space-y-2">
            {savedCourses.map((c) => {
              const active = selectedCourseId === c.id;
              return (
                <Card
                  key={c.id}
                  onClick={() => onSelectCourse(c.id)}
                  className={[
                    'flex items-center justify-between p-4',
                    active ? 'ring-2 ring-fairway-500' : '',
                  ].join(' ')}
                >
                  <div>
                    <p className="font-semibold text-fairway-900">{c.name}</p>
                    <p className="text-sm text-fairway-500">{c.holes.length} hål</p>
                  </div>
                  {active && <Pill tone="done">Vald</Pill>}
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <Card
        onClick={creatingNew ? undefined : () => onSelectCourse(null)}
        className={[
          'p-4',
          creatingNew ? 'ring-2 ring-fairway-500' : 'cursor-pointer active:bg-fairway-50',
        ].join(' ')}
      >
        <div className="flex items-center justify-between">
          <p className="font-semibold text-fairway-900">Skapa ny bana</p>
          {creatingNew ? <Pill tone="done">Aktiv</Pill> : <Pill>Välj</Pill>}
        </div>

        {creatingNew && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-fairway-500">
                Banans namn
              </label>
              <input
                className={inputClass}
                value={name}
                placeholder="T.ex. Viksjö GK"
                onChange={(e) => onNameChange(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-fairway-500">
                Antal hål
              </label>
              <div className="flex gap-2">
                {ALLOWED_HOLE_COUNTS.map((count) => {
                  const active = holeCount === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => onHoleCountChange(count)}
                      className={[
                        'flex-1 rounded-xl py-3 text-base font-bold',
                        active
                          ? 'bg-fairway-600 text-white'
                          : 'bg-fairway-100 text-fairway-700 active:bg-fairway-200',
                      ].join(' ')}
                    >
                      {count}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-[2.5rem_1fr_5rem] items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-wide text-fairway-500">
                <span>Hål</span>
                <span className="text-center">Par</span>
                <span className="text-right">HCP/SI</span>
              </div>
              {holes.map((hole, index) => (
                <div
                  key={hole.number}
                  className="grid grid-cols-[2.5rem_1fr_5rem] items-center gap-2 rounded-xl bg-fairway-50 px-2 py-2"
                >
                  <span className="text-center text-lg font-bold text-fairway-900">
                    {hole.number}
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      aria-label={`Minska par hål ${hole.number}`}
                      onClick={() => parStep(index, -1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-fairway-700 active:bg-fairway-100"
                    >
                      <MinusIcon width={18} height={18} />
                    </button>
                    <span className="w-6 text-center text-lg font-bold tabular-nums text-fairway-900">
                      {hole.par}
                    </span>
                    <button
                      type="button"
                      aria-label={`Öka par hål ${hole.number}`}
                      onClick={() => parStep(index, 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-fairway-700 active:bg-fairway-100"
                    >
                      <PlusIcon width={18} height={18} />
                    </button>
                  </div>
                  <input
                    className="w-full rounded-lg border-2 border-fairway-200 bg-white px-2 py-2 text-center text-base font-semibold tabular-nums text-fairway-900 outline-none focus:border-fairway-500"
                    value={hole.strokeIndex}
                    inputMode="numeric"
                    aria-label={`Stroke Index hål ${hole.number}`}
                    onChange={(e) => onHoleChange(index, { strokeIndex: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
