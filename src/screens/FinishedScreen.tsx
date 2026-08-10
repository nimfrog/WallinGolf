import type { NavigateFn } from '../navigation';
import { useApp } from '../state/AppContext';
import { ScreenShell } from '../ui/ScreenShell';
import { Button, CenteredNotice } from '../ui/components';
import { TournamentResultDetails } from './TournamentResultDetails';
import { calculateStandings } from '../logic/standings';
import { formatPoints } from '../lib/format';

export function FinishedScreen({
  tournamentId,
  navigate,
}: {
  tournamentId: string;
  navigate: NavigateFn;
}) {
  const { history } = useApp();
  const tournament = history.find((t) => t.id === tournamentId);

  if (!tournament) {
    return (
      <ScreenShell title="Turnering avslutad">
        <CenteredNotice
          title="Turneringen kunde inte hittas"
          actionLabel="Till startsidan"
          onAction={() => navigate({ name: 'home' })}
        />
      </ScreenShell>
    );
  }

  const standings = calculateStandings(
    tournament.players,
    tournament.rounds,
    tournament.course.holes,
  );
  const winner = standings[0];

  return (
    <ScreenShell title="Turnering avslutad" subtitle={tournament.course.name}>
      <div className="space-y-6">
        {/* Vinnar-hero */}
        <div className="rounded-[var(--radius-card)] bg-fairway-900 px-6 py-8 text-center text-white shadow-lg">
          <p className="text-2xl">🏆</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.25em] text-flag-400">
            WallinMatch
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-fairway-300">
            Turneringsvinnare
          </p>
          {winner && (
            <>
              <p className="mt-1 text-4xl font-black tracking-tight">{winner.name}</p>
              <p className="mt-1 text-lg font-bold text-flag-400">
                {formatPoints(winner.points)} poäng
              </p>
            </>
          )}
        </div>

        <TournamentResultDetails tournament={tournament} />

        <Button onClick={() => navigate({ name: 'home' })}>Till startsidan</Button>
      </div>
    </ScreenShell>
  );
}
