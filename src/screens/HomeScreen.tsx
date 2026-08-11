import { useApp } from '../state/AppContext';
import type { NavigateFn } from '../navigation';
import { Button, Card, EmptyState, Pill, SectionTitle } from '../ui/components';
import { FlagIcon, HistoryIcon, PlayIcon, TrophyIcon } from '../ui/Icons';
import { formatDateLong, formatPoints } from '../lib/format';
import { calculateStandings } from '../logic/standings';

export function HomeScreen({ navigate }: { navigate: NavigateFn }) {
  const { currentTournament, history, discardCurrentTournament } = useApp();

  const activeRound = currentTournament?.rounds.find((r) => r.status === 'in_progress');
  const nextRound = currentTournament?.rounds.find((r) => r.status === 'not_started');

  const resumeTarget = () => {
    if (!currentTournament) return;
    if (activeRound) navigate({ name: 'round', roundNumber: activeRound.roundNumber });
    else navigate({ name: 'overview' });
  };

  return (
    <div className="flex min-h-full flex-col">
      {/* Hero */}
      <div className="safe-top bg-fairway-900 px-4 pb-8 pt-10 text-white">
        <div className="mx-auto w-full max-w-lg">
          <div className="flex items-center gap-2">
            <FlagIcon className="text-flag-400" width={28} height={28} />
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-fairway-200">
              Golf · Singel matchspel
            </span>
          </div>
          <h1 className="mt-3 text-5xl font-black tracking-tight">
            Wallin<span className="text-flag-400">Match</span>
          </h1>
          <p className="mt-2 max-w-sm text-fairway-100">
            Fyra spelare. Sex matcher. Alla möter alla. Byggd för mobilen ute på banan.
          </p>
        </div>
      </div>

      <main className="mx-auto -mt-4 w-full max-w-lg flex-1 space-y-6 rounded-t-3xl bg-transparent px-4 pb-10 pt-2">
        {/* Pågående turnering */}
        {currentTournament && (
          <section className="space-y-3">
            <SectionTitle>Pågående turnering</SectionTitle>
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-fairway-900">
                    {currentTournament.course.name}
                  </p>
                  <p className="text-sm text-fairway-500">
                    {currentTournament.players.map((p) => p.name).join(' · ')}
                  </p>
                </div>
                <Pill tone={activeRound ? 'live' : 'neutral'}>
                  {activeRound
                    ? `Runda ${activeRound.roundNumber} pågår`
                    : nextRound
                      ? `Runda ${nextRound.roundNumber} väntar`
                      : 'Klar'}
                </Pill>
              </div>
              <div className="mt-4 flex gap-3">
                <Button onClick={resumeTarget}>
                  <PlayIcon width={20} height={20} />
                  Fortsätt
                </Button>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'Vill du kasta den pågående turneringen? Detta går inte att ångra.',
                    )
                  ) {
                    discardCurrentTournament();
                  }
                }}
                className="mt-3 w-full text-center text-sm font-medium text-red-500 active:text-red-700"
              >
                Kasta pågående turnering
              </button>
            </Card>
          </section>
        )}

        {/* Ny turnering */}
        <section className="space-y-3">
          {!currentTournament && <SectionTitle>Kom igång</SectionTitle>}
          <Button
            variant={currentTournament ? 'secondary' : 'primary'}
            onClick={() => {
              if (
                currentTournament &&
                !window.confirm(
                  'Du har en pågående turnering. Vill du starta en ny? Den pågående kastas.',
                )
              ) {
                return;
              }
              if (currentTournament) discardCurrentTournament();
              navigate({ name: 'new' });
            }}
          >
            <FlagIcon width={20} height={20} />
            Ny turnering
          </Button>
        </section>

        {/* Historik */}
        <section className="space-y-3">
          <SectionTitle
            right={
              history.length > 0 ? (
                <button
                  type="button"
                  onClick={() => navigate({ name: 'history' })}
                  className="text-sm font-semibold text-fairway-600"
                >
                  Visa alla
                </button>
              ) : undefined
            }
          >
            Tidigare turneringar
          </SectionTitle>

          {history.length === 0 ? (
            <EmptyState
              icon={<HistoryIcon width={32} height={32} />}
              title="Inga avslutade turneringar än"
              description="Dina färdigspelade turneringar sparas här."
            />
          ) : (
            <div className="space-y-3">
              {history.slice(0, 3).map((t) => {
                const standings = calculateStandings(t.players, t.rounds, t.course.holes);
                const winner = standings[0];
                return (
                  <Card
                    key={t.id}
                    className="flex items-center gap-4 p-4"
                    onClick={() =>
                      navigate({ name: 'historyDetail', tournamentId: t.id })
                    }
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-flag-100 text-flag-600">
                      <TrophyIcon width={22} height={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-fairway-900">
                        {t.course.name}
                      </p>
                      <p className="truncate text-sm text-fairway-500">
                        {formatDateLong(t.createdAt)}
                      </p>
                    </div>
                    {winner && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-fairway-900">
                          {winner.name}
                        </p>
                        <p className="text-xs text-fairway-500">
                          {formatPoints(winner.points)} p
                        </p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
