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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function OverviewScreen({ navigate }: { navigate: NavigateFn }) {
  const { currentTournament, setSchedule } = useApp();

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
  const nothingStarted = t.rounds.every((r) => r.status === 'not_started');

  // Lottning: ankarspelare (spelare 1) och dennes motståndare i runda 1.
  const anchor = t.players[0];
  const round1 = t.rounds.find((r) => r.roundNumber === 1);
  const anchorMatch = round1?.matches.find(
    (m) => m.player1Id === anchor.id || m.player2Id === anchor.id,
  );
  const anchorOpponentId = anchorMatch
    ? anchorMatch.player1Id === anchor.id
      ? anchorMatch.player2Id
      : anchorMatch.player1Id
    : null;

  const chooseOpponent = (opponentId: string) => {
    const rest = t.players
      .filter((p) => p.id !== anchor.id && p.id !== opponentId)
      .map((p) => p.id);
    setSchedule([anchor.id, opponentId, ...rest]);
  };

  const randomize = () => setSchedule(shuffle(t.players.map((p) => p.id)));

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
        {nothingStarted && (
          <section className="space-y-3">
            <SectionTitle>Lottning</SectionTitle>
            <Card className="space-y-4 p-4">
              <div>
                <p className="mb-2 text-sm font-medium text-fairway-700">
                  Vem möter {anchor.name} i runda 1?
                </p>
                <div className="flex flex-wrap gap-2">
                  {t.players
                    .filter((p) => p.id !== anchor.id)
                    .map((p) => {
                      const active = anchorOpponentId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => chooseOpponent(p.id)}
                          className={[
                            'rounded-xl px-4 py-2.5 text-sm font-semibold',
                            active
                              ? 'bg-fairway-600 text-white'
                              : 'bg-fairway-100 text-fairway-700 active:bg-fairway-200',
                          ].join(' ')}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                </div>
              </div>
              <Button variant="secondary" onClick={randomize}>
                🎲 Slumpa lottning
              </Button>
            </Card>
          </section>
        )}

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
