import type { StandingRow } from '../logic/standings';
import { formatPoints } from '../lib/format';

/** Kompakt totalställningstabell. */
export function StandingsTable({
  rows,
  highlightWinner = false,
}: {
  rows: StandingRow[];
  highlightWinner?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-fairway-900/5">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-fairway-900 text-white">
            <th className="px-2 py-2.5 text-left font-semibold">#</th>
            <th className="px-2 py-2.5 text-left font-semibold">Spelare</th>
            <th className="px-1.5 py-2.5 text-center font-semibold" title="Matcher">
              M
            </th>
            <th className="px-1.5 py-2.5 text-center font-semibold" title="Vinster">
              V
            </th>
            <th className="px-1.5 py-2.5 text-center font-semibold" title="Delade">
              D
            </th>
            <th className="px-1.5 py-2.5 text-center font-semibold" title="Förluster">
              F
            </th>
            <th className="px-2 py-2.5 text-right font-semibold" title="Poäng">
              P
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isWinner = highlightWinner && i === 0 && row.placement === 1;
            return (
              <tr
                key={row.playerId}
                className={[
                  'border-t border-fairway-100',
                  isWinner ? 'bg-flag-100/60' : i % 2 ? 'bg-fairway-50/40' : 'bg-white',
                ].join(' ')}
              >
                <td className="px-2 py-3 font-bold tabular-nums text-fairway-500">
                  {row.placement}
                </td>
                <td className="px-2 py-3 font-semibold text-fairway-900">
                  {row.name}
                  {isWinner && <span className="ml-1">🏆</span>}
                </td>
                <td className="px-1.5 py-3 text-center tabular-nums text-fairway-600">
                  {row.played}
                </td>
                <td className="px-1.5 py-3 text-center tabular-nums text-fairway-600">
                  {row.wins}
                </td>
                <td className="px-1.5 py-3 text-center tabular-nums text-fairway-600">
                  {row.draws}
                </td>
                <td className="px-1.5 py-3 text-center tabular-nums text-fairway-600">
                  {row.losses}
                </td>
                <td className="px-2 py-3 text-right text-base font-bold tabular-nums text-fairway-900">
                  {formatPoints(row.points)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
