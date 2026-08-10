import type { NavigateFn } from '../navigation';
import type { Player } from '../types';
import { useApp } from '../state/AppContext';
import { ScreenShell } from '../ui/ScreenShell';
import { Button, Card, CenteredNotice } from '../ui/components';
import { TrophyIcon } from '../ui/Icons';
import { calculateRoundMatchStates } from '../logic/rounds';
import type { MatchState } from '../logic/match';

function nameOf(players: Player[], id: string) {
  return players.find((p) => p.id === id)?.name ?? '—';
}

function ResultCard({ state, players }: { state: MatchState; players: Player[] }) {
  const p1 = nameOf(players, state.player1Id);
  const p2 = nameOf(players, state.player2Id);
  const result = state.result;

  return (
    <Card className="p-5 text-center">
      <p className="text-sm font-semibold text-fairway-500">
        {p1} vs {p2}
      </p>
      {result?.isDraw ? (
        <>
          <p className="mt-2 text-2xl font-black text-fairway-900">Delad match</p>
          <p className="text-lg font-bold text-fairway-500">AS</p>
        </>
      ) : result ? (
        <>
          <p className="mt-2 text-2xl font-black text-fairway-900">
            {nameOf(players, result.winnerId!)} vinner
          </p>
          <p className="text-lg font-bold text-flag-600">{result.displayResult}</p>
        </>
      ) : (
        <p className="mt-2 text-lg font-bold text-red-500">Ofullständig match</p>
      )}
    </Card>
  );
}

export function RoundFinishScreen({
  roundNumber,
  navigate,
}: {
  roundNumber: number;
  navigate: NavigateFn;
}) {
  const { currentTournament, completeRound } = useApp();

  const t = currentTournament;
  const round = t?.rounds.find((r) => r.roundNumber === roundNumber);
  if (!t || !round) {
    return (
      <ScreenShell title="Runda klar" onBack={() => navigate({ name: 'home' })}>
        <CenteredNotice
          title="Rundan kunde inte laddas"
          actionLabel="Till översikten"
          onAction={() => navigate({ name: 'overview' })}
        />
      </ScreenShell>
    );
  }

  const states = calculateRoundMatchStates(round, t.players, t.course);

  const confirm = () => {
    const finished = completeRound(roundNumber);
    if (finished) {
      navigate({ name: 'finished', tournamentId: finished.id });
    } else {
      navigate({ name: 'overview' });
    }
  };

  return (
    <ScreenShell
      title={`Runda ${roundNumber} klar`}
      subtitle={t.course.name}
      onBack={() => navigate({ name: 'round', roundNumber })}
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center py-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-flag-100 text-flag-600">
            <TrophyIcon width={32} height={32} />
          </div>
          <p className="mt-3 text-xl font-black text-fairway-900">
            Resultat runda {roundNumber}
          </p>
          <p className="text-sm text-fairway-500">
            Kontrollera resultaten och bekräfta för att spara till turneringen.
          </p>
        </div>

        {round.matches.map((match, i) => (
          <ResultCard key={match.id} state={states[i]} players={t.players} />
        ))}

        <div className="pt-2">
          <Button onClick={confirm}>Bekräfta och spara</Button>
          <button
            type="button"
            onClick={() => navigate({ name: 'round', roundNumber })}
            className="mt-3 w-full text-center text-sm font-semibold text-fairway-500 active:text-fairway-700"
          >
            Tillbaka och ändra score
          </button>
        </div>
      </div>
    </ScreenShell>
  );
}
