import { useEffect } from 'react';
import type { Course, Player, Round } from '../../types';
import { useApp } from '../../state/AppContext';
import { Card } from '../../ui/components';
import { ScoreStepper } from '../../ui/ScoreStepper';
import { ChevronLeftIcon, ChevronRightIcon } from '../../ui/Icons';
import { calculateRoundMatchStates } from '../../logic/rounds';
import type { MatchState } from '../../logic/match';

interface HoleTabProps {
  round: Round;
  players: Player[];
  course: Course;
  holeNumber: number;
  onHoleChange: (holeNumber: number) => void;
}

function nameOf(players: Player[], id: string) {
  return players.find((p) => p.id === id)?.name ?? '—';
}

/** Prickar som visar antal erhållna slag. */
function StrokeDots({ count }: { count: number }) {
  if (count <= 0) return <span className="text-sm text-fairway-300">Inga slag</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-flag-600">
      <span className="tracking-tight">{'●'.repeat(count)}</span>
      {count} erhål{count === 1 ? 'let' : 'lna'} slag
    </span>
  );
}

export function HoleTab({ round, players, course, holeNumber, onHoleChange }: HoleTabProps) {
  const { setScore, ensureHoleDefaults } = useApp();

  const hole = course.holes.find((h) => h.number === holeNumber) ?? course.holes[0];
  const holeIndex = course.holes.findIndex((h) => h.number === hole.number);
  const totalHoles = course.holes.length;

  // Sätt par som standard för hålet när det visas.
  useEffect(() => {
    ensureHoleDefaults(round.roundNumber, hole.number);
  }, [ensureHoleDefaults, round.roundNumber, hole.number]);

  const states = calculateRoundMatchStates(round, players, course);

  // Slå upp per spelare: match, sida, erhållna slag på hålet.
  const infoFor = (playerId: string) => {
    for (const state of states) {
      const outcome = state.holeOutcomes.find((o) => o.holeNumber === hole.number);
      if (state.player1Id === playerId) {
        return { received: outcome?.p1Received ?? 0 };
      }
      if (state.player2Id === playerId) {
        return { received: outcome?.p2Received ?? 0 };
      }
    }
    return { received: 0 };
  };

  const grossOf = (playerId: string): number => {
    const s = round.scores.find(
      (x) => x.holeNumber === hole.number && x.playerId === playerId,
    );
    return s?.grossScore ?? hole.par;
  };

  return (
    <div className="space-y-4">
      {/* Hålhuvud */}
      <Card className="overflow-hidden">
        <div className="flex items-stretch">
          <button
            type="button"
            aria-label="Föregående hål"
            disabled={holeIndex === 0}
            onClick={() => onHoleChange(course.holes[holeIndex - 1].number)}
            className="flex w-14 items-center justify-center bg-fairway-50 text-fairway-600 active:bg-fairway-100 disabled:opacity-30"
          >
            <ChevronLeftIcon width={28} height={28} />
          </button>

          <div className="flex-1 py-4 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-fairway-500">
              Hål
            </p>
            <p className="text-6xl font-black leading-none text-fairway-900">
              {hole.number}
            </p>
            <div className="mt-2 flex items-center justify-center gap-4 text-sm font-semibold text-fairway-600">
              <span>Par {hole.par}</span>
              <span className="text-fairway-300">·</span>
              <span>HCP {hole.strokeIndex}</span>
            </div>
          </div>

          <button
            type="button"
            aria-label="Nästa hål"
            disabled={holeIndex === totalHoles - 1}
            onClick={() => onHoleChange(course.holes[holeIndex + 1].number)}
            className="flex w-14 items-center justify-center bg-fairway-50 text-fairway-600 active:bg-fairway-100 disabled:opacity-30"
          >
            <ChevronRightIcon width={28} height={28} />
          </button>
        </div>
      </Card>

      {/* Spelarrader */}
      <div className="space-y-3">
        {players.map((player) => {
          const info = infoFor(player.id);
          const gross = grossOf(player.id);
          const net = gross - info.received;
          return (
            <Card key={player.id} className="p-4">
              <div className="mb-3 flex items-baseline justify-between">
                <p className="text-lg font-bold text-fairway-900">{player.name}</p>
                <div className="text-right">
                  <StrokeDots count={info.received} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <ScoreStepper
                  value={gross}
                  onChange={(v) =>
                    setScore(round.roundNumber, hole.number, player.id, v)
                  }
                />
                <div className="pl-2 text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-fairway-400">
                    Netto
                  </p>
                  <p className="text-3xl font-black tabular-nums text-fairway-900">
                    {net}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Resultat per hål för båda matcherna */}
      <div className="space-y-3">
        {round.matches.map((match, i) => (
          <HoleMatchResult
            key={match.id}
            state={states[i]}
            players={players}
            holeNumber={hole.number}
            matchLabel={`Match ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function HoleMatchResult({
  state,
  players,
  holeNumber,
  matchLabel,
}: {
  state: MatchState;
  players: Player[];
  holeNumber: number;
  matchLabel: string;
}) {
  const outcome = state.holeOutcomes.find((o) => o.holeNumber === holeNumber);
  const p1 = nameOf(players, state.player1Id);
  const p2 = nameOf(players, state.player2Id);

  let holeText = 'Väntar på score';
  if (outcome?.bothScored) {
    if (outcome.winner === 'halved') holeText = 'Hålet delas';
    else if (outcome.winner === 'player1') holeText = `${p1} vinner hålet`;
    else holeText = `${p2} vinner hålet`;
  }

  const standingText = state.leaderId
    ? `${nameOf(players, state.leaderId)} ${state.upBy} UP`
    : 'AS';

  return (
    <div className="rounded-2xl bg-fairway-900 px-4 py-3 text-white">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-fairway-300">
          {matchLabel} · {p1} vs {p2}
        </span>
        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold">
          {state.result ? state.result.displayResult : standingText}
        </span>
      </div>
      <p className="mt-1 text-lg font-bold">{holeText}</p>
    </div>
  );
}
