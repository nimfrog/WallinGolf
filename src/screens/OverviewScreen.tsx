import { useApp } from '../state/AppContext';
import type { NavigateFn } from '../navigation';
import type { Match, Player, Round } from '../types';
import { ScreenShell } from '../ui/ScreenShell';
import { Button, Card, CenteredNotice, Pill, SectionTitle } from '../ui/components';
import { StandingsTable } from '../ui/StandingsTable';
import { PlayIcon } from '../ui/Icons';
import { calculateStandings } from '../logic/standings';
import { calculateRoundMatchStates } from '../logic/rounds';
import type { MatchState } from '../logic/match';

function nameOf(players: Player[], id: string): string {
  return players.find((p) => p.id === id)?.name ?? '—';
}

function resultText(state: MatchState, players: Player[]): string {
  if (!state.result) return '';
  if (state.result.isDraw) return `Delad match · AS`;
  return `${nameOf(players, state.result.winnerId!)} ${state.result.displayResult}`;
}

function MatchRow({
  match,
  state,
  players,
}: {
  match: Match;
  state?: MatchState;
  players: Player[];
}) {
  const p1 = nameOf(players, match.player1Id);
  const p2 = nameOf(players, match.player2Id);
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="font-semibold text-fairway-900">
        {p1} <span className="text-fairway-400">vs</span> {p2}
      </span>
      {state?.result ? (
        <span className="text-right text-sm font-semibold text-fairway-600">
          {resultText(state, players)}
        </span>
      ) : state && state.holesPlayed > 0 ? (
        <span className="text-right text-sm font-medium text-fairway-500">
          {state.leaderId ? `${nameOf(players, state.leaderId)} ${state.upBy} UP` : 'AS'}
        </span>
      ) : null}
    </div>
  );
}

export function OverviewScreen({ navigate }: { navigate: NavigateFn }) {
  const { currentTournament } = useApp();

  if (!currentTournament) {
    return (
      <ScreenShell title="Turneringsöversikt" onBack={() => navigate({ name: 'home' })}>
        <CenteredNotice
          title="Ingen pågående turnering"
          description="Starta en ny turnering från startsidan."
          actionLabel="Till startsidan"
          onAction={() => navigate({ name: 'home' })}
        />
      </ScreenShell>
    );
  }

  const t = currentTournament;
  const standings = calculateStandings(t.players, t.rounds, t.course.holes);

  const hasInProgress = t.rounds.some((r) => r.status === 'in_progress');
  // Nästa spelbara runda = första ej startade rundan.
  const nextPlayable = t.rounds.find((r) => r.status === 'not_started');

  const anyCompleted = t.rounds.some((r) => r.status === 'completed');

  const roundActionLabel = (round: Round): string => {
    if (round.status === 'in_progress') return `Fortsätt runda ${round.roundNumber}`;
    return `Starta runda ${round.roundNumber}`;
  };

  return (
    <ScreenShell
      title="Turneringsöversikt"
      subtitle={`${t.course.name} · ${t.course.holes.length} hål`}
      onBack={() => navigate({ name: 'home' })}
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <SectionTitle>Rundor</SectionTitle>
          {t.rounds.map((round) => {
            const states = calculateRoundMatchStates(round, t.players, t.course);
            const isNext = nextPlayable?.roundNumber === round.roundNumber && !hasInProgress;
            const isInProgress = round.status === 'in_progress';
            const canAct = isInProgress || isNext;

            return (
              <Card key={round.roundNumber} className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-lg font-bold text-fairway-900">
                    Runda {round.roundNumber}
                  </p>
                  {round.status === 'completed' ? (
                    <Pill tone="done">Avslutad</Pill>
                  ) : round.status === 'in_progress' ? (
                    <Pill tone="live">Pågår</Pill>
                  ) : (
                    <Pill>Ej startad</Pill>
                  )}
                </div>

                <div className="divide-y divide-fairway-100">
                  {round.matches.map((match, i) => (
                    <MatchRow
                      key={match.id}
                      match={match}
                      state={states[i]}
                      players={t.players}
                    />
                  ))}
                </div>

                {canAct && (
                  <div className="mt-3">
                    <Button
                      onClick={() =>
                        navigate({ name: 'round', roundNumber: round.roundNumber })
                      }
                    >
                      <PlayIcon width={20} height={20} />
                      {roundActionLabel(round)}
                    </Button>
                  </div>
                )}

                {round.status === 'not_started' && !canAct && (
                  <p className="mt-3 text-center text-sm text-fairway-400">
                    {hasInProgress
                      ? 'Avsluta den pågående rundan först.'
                      : 'Spela föregående runda först.'}
                  </p>
                )}
              </Card>
            );
          })}
        </section>

        {anyCompleted && (
          <section className="space-y-3">
            <SectionTitle>Totalställning</SectionTitle>
            <StandingsTable rows={standings} />
          </section>
        )}
      </div>
    </ScreenShell>
  );
}
