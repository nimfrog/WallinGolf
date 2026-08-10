import type { NavigateFn } from '../navigation';
import { useApp } from '../state/AppContext';
import { ScreenShell } from '../ui/ScreenShell';
import { CenteredNotice } from '../ui/components';
import { TournamentResultDetails } from './TournamentResultDetails';
import { formatDateLong } from '../lib/format';

export function HistoryDetailScreen({
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
      <ScreenShell title="Turnering" onBack={() => navigate({ name: 'history' })}>
        <CenteredNotice
          title="Turneringen kunde inte hittas"
          actionLabel="Till historiken"
          onAction={() => navigate({ name: 'history' })}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title={tournament.course.name}
      subtitle={formatDateLong(tournament.createdAt)}
      onBack={() => navigate({ name: 'history' })}
    >
      <TournamentResultDetails tournament={tournament} />
    </ScreenShell>
  );
}
