import type { NavigateFn } from '../navigation';
import { useApp } from '../state/AppContext';
import { ScreenShell } from '../ui/ScreenShell';
import { Card, EmptyState, Pill } from '../ui/components';
import { HistoryIcon, TrophyIcon } from '../ui/Icons';
import { calculateStandings } from '../logic/standings';
import { formatDateLong, formatPoints } from '../lib/format';

export function HistoryScreen({ navigate }: { navigate: NavigateFn }) {
  const { history } = useApp();

  return (
    <ScreenShell title="Historik" onBack={() => navigate({ name: 'home' })}>
      {history.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon width={32} height={32} />}
          title="Inga avslutade turneringar"
          description="Här samlas alla dina färdigspelade turneringar."
        />
      ) : (
        <div className="space-y-3">
          {history.map((t) => {
            const standings = calculateStandings(t.players, t.rounds, t.course.holes);
            const winner = standings[0];
            return (
              <Card
                key={t.id}
                className="p-4"
                onClick={() => navigate({ name: 'historyDetail', tournamentId: t.id })}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-fairway-400">
                      {formatDateLong(t.createdAt)}
                    </p>
                    <p className="mt-0.5 truncate text-lg font-bold text-fairway-900">
                      {t.course.name}
                    </p>
                    <p className="truncate text-sm text-fairway-500">
                      {t.players.map((p) => p.name).join(' · ')}
                    </p>
                  </div>
                  <Pill tone="flag">{t.course.holes.length} hål</Pill>
                </div>

                {winner && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-flag-100/60 px-3 py-2">
                    <TrophyIcon className="text-flag-600" width={18} height={18} />
                    <span className="text-sm font-semibold text-fairway-800">
                      {winner.name}
                    </span>
                    <span className="ml-auto text-sm font-bold text-fairway-900">
                      {formatPoints(winner.points)} p
                    </span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </ScreenShell>
  );
}
