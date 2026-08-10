import type { Course, HoleScore, Player } from '../types';
import { formatToPar } from '../lib/format';

interface ScorecardProps {
  players: Player[];
  course: Course;
  scores: HoleScore[];
}

function grossFor(scores: HoleScore[], playerId: string, holeNumber: number): number | null {
  const s = scores.find((x) => x.playerId === playerId && x.holeNumber === holeNumber);
  return s?.grossScore ?? null;
}

/** Summa gross + par för de hål (i urvalet) där spelaren har en score. */
function sumFor(
  scores: HoleScore[],
  course: Course,
  playerId: string,
  holeNumbers: number[],
): { gross: number; par: number; hasAny: boolean } {
  let gross = 0;
  let par = 0;
  let hasAny = false;
  for (const n of holeNumbers) {
    const g = grossFor(scores, playerId, n);
    if (g == null) continue;
    const hole = course.holes.find((h) => h.number === n);
    if (!hole) continue;
    gross += g;
    par += hole.par;
    hasAny = true;
  }
  return { gross, par, hasAny };
}

export function Scorecard({ players, course, scores }: ScorecardProps) {
  const holes = [...course.holes].sort((a, b) => a.number - b.number);
  const is18 = holes.length === 18;

  const front = holes.filter((h) => h.number <= 9).map((h) => h.number);
  const back = holes.filter((h) => h.number > 9).map((h) => h.number);
  const all = holes.map((h) => h.number);

  const cell = 'px-2 py-2 text-center tabular-nums';

  const SubtotalRow = ({
    label,
    holeNumbers,
    strong,
  }: {
    label: string;
    holeNumbers: number[];
    strong?: boolean;
  }) => {
    const parSum = holeNumbers.reduce(
      (acc, n) => acc + (course.holes.find((h) => h.number === n)?.par ?? 0),
      0,
    );
    return (
      <tr
        className={[
          'border-t-2 border-fairway-200',
          strong ? 'bg-fairway-900 text-white' : 'bg-fairway-100 text-fairway-800',
        ].join(' ')}
      >
        <td className={`${cell} text-left font-bold`}>{label}</td>
        <td className={`${cell} font-bold`}>{parSum}</td>
        {players.map((p) => {
          const { gross, hasAny } = sumFor(scores, course, p.id, holeNumbers);
          return (
            <td key={p.id} className={`${cell} font-bold`}>
              {hasAny ? gross : '–'}
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-fairway-900/5">
      <table className="w-full min-w-[22rem] border-collapse text-sm">
        <thead>
          <tr className="bg-fairway-900 text-white">
            <th className="px-2 py-2.5 text-left font-semibold">Hål</th>
            <th className="px-2 py-2.5 text-center font-semibold">Par</th>
            {players.map((p) => (
              <th key={p.id} className="px-2 py-2.5 text-center font-semibold">
                {p.name.length > 6 ? `${p.name.slice(0, 6)}.` : p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {holes.map((hole, idx) => {
            const rows = [
              <tr
                key={hole.number}
                className={idx % 2 ? 'bg-fairway-50/40' : 'bg-white'}
              >
                <td className="px-2 py-2 text-left font-semibold text-fairway-700">
                  {hole.number}
                </td>
                <td className={`${cell} text-fairway-500`}>{hole.par}</td>
                {players.map((p) => {
                  const g = grossFor(scores, p.id, hole.number);
                  const diff = g != null ? g - hole.par : 0;
                  return (
                    <td
                      key={p.id}
                      className={[
                        cell,
                        'font-semibold',
                        g == null
                          ? 'text-fairway-300'
                          : diff < 0
                            ? 'text-red-600'
                            : diff > 0
                              ? 'text-fairway-900'
                              : 'text-fairway-600',
                      ].join(' ')}
                    >
                      {g ?? '–'}
                    </td>
                  );
                })}
              </tr>,
            ];
            // Ut-summa efter hål 9 för 18-hålsrunda.
            if (is18 && hole.number === 9) {
              rows.push(<SubtotalRow key="out" label="Ut (1–9)" holeNumbers={front} />);
            }
            if (is18 && hole.number === 18) {
              rows.push(<SubtotalRow key="in" label="In (10–18)" holeNumbers={back} />);
            }
            return rows;
          })}

          <SubtotalRow label="Totalt" holeNumbers={all} strong />

          {/* Mot par */}
          <tr className="border-t border-fairway-100 bg-white">
            <td className="px-2 py-2 text-left font-bold text-fairway-500" colSpan={2}>
              Mot par
            </td>
            {players.map((p) => {
              const { gross, par, hasAny } = sumFor(scores, course, p.id, all);
              return (
                <td key={p.id} className={`${cell} font-bold text-fairway-900`}>
                  {hasAny ? formatToPar(gross - par) : '–'}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
