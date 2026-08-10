import { useState } from 'react';
import type { Course, Player, Round } from '../../types';
import { Card, Pill } from '../../ui/components';
import { calculateRoundMatchStates } from '../../logic/rounds';
import type { HoleOutcome, MatchState } from '../../logic/match';

function nameOf(players: Player[], id: string) {
  return players.find((p) => p.id === id)?.name ?? '—';
}

/** Grafisk hål-för-hål-rad: A | = | M ... */
function HoleStrip({ state, players }: { state: MatchState; players: Player[] }) {
  const p1Initial = nameOf(players, state.player1Id).charAt(0).toUpperCase();
  const p2Initial = nameOf(players, state.player2Id).charAt(0).toUpperCase();

  const cell = (o: HoleOutcome) => {
    if (!o.bothScored) {
      return { label: '·', cls: 'bg-fairway-100 text-fairway-300' };
    }
    if (o.winner === 'player1')
      return { label: p1Initial, cls: 'bg-fairway-600 text-white' };
    if (o.winner === 'player2')
      return { label: p2Initial, cls: 'bg-flag-500 text-white' };
    return { label: '=', cls: 'bg-fairway-200 text-fairway-600' };
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {state.holeOutcomes.map((o) => {
        const c = cell(o);
        return (
          <div key={o.holeNumber} className="flex flex-col items-center gap-1">
            <div
              className={[
                'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold',
                c.cls,
              ].join(' ')}
            >
              {c.label}
            </div>
            <span className="text-[10px] tabular-nums text-fairway-400">
              {o.holeNumber}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MatchCard({
  state,
  players,
  index,
}: {
  state: MatchState;
  players: Player[];
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const p1 = nameOf(players, state.player1Id);
  const p2 = nameOf(players, state.player2Id);

  const decided = state.status === 'decided' || state.status === 'finished';
  const bigStatus = state.result
    ? state.result.isDraw
      ? 'AS'
      : state.result.displayResult
    : state.leaderId
      ? `${state.upBy} UP`
      : 'AS';

  const winnerLine = state.result
    ? state.result.isDraw
      ? 'Delad match'
      : `${nameOf(players, state.result.winnerId!)} vinner`
    : state.leaderId
      ? `${nameOf(players, state.leaderId)} leder`
      : 'Lika';

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-fairway-500">
          Match {index + 1}
        </span>
        {decided ? (
          <Pill tone="done">Färdig</Pill>
        ) : state.holesPlayed > 0 ? (
          <Pill tone="live">Pågår</Pill>
        ) : (
          <Pill>Ej spelad</Pill>
        )}
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <p className="text-right text-lg font-bold text-fairway-900">{p1}</p>
        <div className="flex flex-col items-center px-2">
          <span className="rounded-xl bg-fairway-900 px-3 py-1 text-lg font-black text-white">
            {bigStatus}
          </span>
        </div>
        <p className="text-left text-lg font-bold text-fairway-900">{p2}</p>
      </div>

      <p className="mt-2 text-center text-sm font-medium text-fairway-600">
        {winnerLine} · efter {state.holesPlayed} hål
      </p>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 w-full rounded-xl bg-fairway-50 py-2 text-sm font-semibold text-fairway-600 active:bg-fairway-100"
      >
        {open ? 'Dölj hål-för-hål' : 'Visa hål-för-hål'}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <HoleStrip state={state} players={players} />
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fairway-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-fairway-600" /> {p1}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-flag-500" /> {p2}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-fairway-200" /> Delat
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

export function MatchesTab({
  round,
  players,
  course,
}: {
  round: Round;
  players: Player[];
  course: Course;
}) {
  const states = calculateRoundMatchStates(round, players, course);
  return (
    <div className="space-y-3">
      {round.matches.map((match, i) => (
        <MatchCard key={match.id} state={states[i]} players={players} index={i} />
      ))}
    </div>
  );
}
