import { useEffect, useMemo, useState } from 'react';
import type { NavigateFn } from '../../navigation';
import { useApp } from '../../state/AppContext';
import { ScreenShell } from '../../ui/ScreenShell';
import { Button, CenteredNotice, SectionTitle } from '../../ui/components';
import { BottomNav, type BottomNavItem } from '../../ui/BottomNav';
import { StandingsTable } from '../../ui/StandingsTable';
import { Scorecard } from '../../ui/Scorecard';
import { FlagIcon, SwordsIcon, GridIcon, TrophyIcon, CheckIcon } from '../../ui/Icons';
import { HoleTab } from './HoleTab';
import { MatchesTab } from './MatchesTab';
import { calculateStandings } from '../../logic/standings';
import { isRoundFullyScored } from '../../logic/rounds';

type TabKey = 'hole' | 'matches' | 'scorecard' | 'standings';

const NAV_ITEMS: BottomNavItem[] = [
  { key: 'hole', label: 'Runda', icon: <FlagIcon width={22} height={22} /> },
  { key: 'matches', label: 'Matcher', icon: <SwordsIcon width={22} height={22} /> },
  { key: 'scorecard', label: 'Scorekort', icon: <GridIcon width={22} height={22} /> },
  { key: 'standings', label: 'Tabell', icon: <TrophyIcon width={22} height={22} /> },
];

export function RoundScreen({
  roundNumber,
  navigate,
}: {
  roundNumber: number;
  navigate: NavigateFn;
}) {
  const { currentTournament, startRound } = useApp();

  // Starta rundan om den inte redan är igång.
  useEffect(() => {
    const round = currentTournament?.rounds.find((r) => r.roundNumber === roundNumber);
    if (round && round.status === 'not_started') {
      startRound(roundNumber);
    }
  }, [currentTournament, roundNumber, startRound]);

  const [tab, setTab] = useState<TabKey>('hole');

  const t = currentTournament;
  const round = t?.rounds.find((r) => r.roundNumber === roundNumber);

  // Startas på första ospelade hålet.
  const initialHole = useMemo(() => {
    if (!t || !round) return 1;
    for (const hole of t.course.holes) {
      const incomplete = round.matches.some((m) => {
        const s1 = round.scores.find(
          (s) => s.holeNumber === hole.number && s.playerId === m.player1Id,
        );
        const s2 = round.scores.find(
          (s) => s.holeNumber === hole.number && s.playerId === m.player2Id,
        );
        return s1?.grossScore == null || s2?.grossScore == null;
      });
      if (incomplete) return hole.number;
    }
    return t.course.holes[t.course.holes.length - 1].number;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t?.id, roundNumber]);

  const [holeNumber, setHoleNumber] = useState(initialHole);

  if (!t || !round) {
    return (
      <ScreenShell title={`Runda ${roundNumber}`} onBack={() => navigate({ name: 'home' })}>
        <CenteredNotice
          title="Rundan kunde inte laddas"
          actionLabel="Till översikten"
          onAction={() => navigate({ name: 'overview' })}
        />
      </ScreenShell>
    );
  }

  const fullyScored = isRoundFullyScored(round, t.course);
  const standings = calculateStandings(t.players, t.rounds, t.course.holes);
  const completedCount = t.rounds.filter((r) => r.status === 'completed').length;

  return (
    <div className="min-h-full">
      <ScreenShell
        title={`Runda ${roundNumber}`}
        subtitle={`${t.course.name} · ${t.course.holes.length} hål`}
        onBack={() => navigate({ name: 'overview' })}
        bottomInset
      >
        {tab === 'hole' && (
          <HoleTab
            round={round}
            players={t.players}
            course={t.course}
            holeNumber={holeNumber}
            onHoleChange={setHoleNumber}
          />
        )}

        {tab === 'matches' && (
          <MatchesTab round={round} players={t.players} course={t.course} />
        )}

        {tab === 'scorecard' && (
          <div className="space-y-3">
            <SectionTitle>Scorekort · Runda {roundNumber}</SectionTitle>
            <Scorecard players={t.players} course={t.course} scores={round.scores} />
          </div>
        )}

        {tab === 'standings' && (
          <div className="space-y-3">
            <SectionTitle>Totalställning</SectionTitle>
            {completedCount === 0 ? (
              <p className="rounded-2xl bg-white p-4 text-sm text-fairway-500 ring-1 ring-fairway-900/5">
                Tabellen uppdateras efter varje avslutad runda. Den här rundan räknas
                när du avslutar den.
              </p>
            ) : (
              <StandingsTable rows={standings} />
            )}
          </div>
        )}

        {/* Avsluta runda – visas när alla scorer finns */}
        {fullyScored && (
          <div className="mt-6">
            <Button onClick={() => navigate({ name: 'roundFinish', roundNumber })}>
              <CheckIcon width={20} height={20} />
              Avsluta runda {roundNumber}
            </Button>
          </div>
        )}
      </ScreenShell>

      <BottomNav items={NAV_ITEMS} active={tab} onSelect={(k) => setTab(k as TabKey)} />
    </div>
  );
}
