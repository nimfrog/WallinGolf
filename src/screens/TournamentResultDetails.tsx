import { useState } from 'react';
import type { Player, Tournament } from '../types';
import { Card, Pill, SectionTitle } from '../ui/components';
import { StandingsTable } from '../ui/StandingsTable';
import { Scorecard } from '../ui/Scorecard';
import { calculateStandings } from '../logic/standings';
import { calculateRoundMatchStates } from '../logic/rounds';

function nameOf(players: Player[], id: string) {
  return players.find((p) => p.id === id)?.name ?? '—';
}

interface PlayerMatchLine {
  opponent: string;
  text: string;
  tone: 'win' | 'draw' | 'loss';
}

/** Alla matcher (över alla rundor) för en spelare, med resultat. */
function matchesForPlayer(t: Tournament, playerId: string): PlayerMatchLine[] {
  const lines: PlayerMatchLine[] = [];
  for (const round of t.rounds) {
    const states = calculateRoundMatchStates(round, t.players, t.course);
    round.matches.forEach((match, i) => {
      if (match.player1Id !== playerId && match.player2Id !== playerId) return;
      const opponentId =
        match.player1Id === playerId ? match.player2Id : match.player1Id;
      const state = states[i];
      const result = state.result;
      if (!result) {
        lines.push({ opponent: nameOf(t.players, opponentId), text: '–', tone: 'draw' });
        return;
      }
      if (result.isDraw) {
        lines.push({
          opponent: nameOf(t.players, opponentId),
          text: 'Delad · AS',
          tone: 'draw',
        });
      } else if (result.winnerId === playerId) {
        lines.push({
          opponent: nameOf(t.players, opponentId),
          text: `Vinst ${result.displayResult}`,
          tone: 'win',
        });
      } else {
        lines.push({
          opponent: nameOf(t.players, opponentId),
          text: `Förlust ${result.displayResult}`,
          tone: 'loss',
        });
      }
    });
  }
  return lines;
}

const TONE_CLASS: Record<PlayerMatchLine['tone'], string> = {
  win: 'text-fairway-700',
  draw: 'text-fairway-500',
  loss: 'text-red-500',
};

export function TournamentResultDetails({ tournament }: { tournament: Tournament }) {
  const standings = calculateStandings(
    tournament.players,
    tournament.rounds,
    tournament.course.holes,
  );
  const [openRound, setOpenRound] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <SectionTitle>Slutställning</SectionTitle>
        <StandingsTable rows={standings} highlightWinner />
      </section>

      <section className="space-y-3">
        <SectionTitle>Spelarnas matcher</SectionTitle>
        <div className="space-y-3">
          {standings.map((row) => {
            const lines = matchesForPlayer(tournament, row.playerId);
            return (
              <Card key={row.playerId} className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-lg font-bold text-fairway-900">{row.name}</p>
                  <Pill tone="neutral">
                    {row.points.toLocaleString('sv-SE', { maximumFractionDigits: 1 })} p
                  </Pill>
                </div>
                <div className="space-y-1.5">
                  {lines.map((line, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-fairway-600">vs {line.opponent}</span>
                      <span className={`font-semibold ${TONE_CLASS[line.tone]}`}>
                        {line.text}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Scorekort per runda</SectionTitle>
        <div className="space-y-3">
          {tournament.rounds.map((round) => {
            const open = openRound === round.roundNumber;
            return (
              <Card key={round.roundNumber} className="p-4">
                <button
                  type="button"
                  onClick={() =>
                    setOpenRound(open ? null : round.roundNumber)
                  }
                  className="flex w-full items-center justify-between"
                >
                  <span className="text-base font-bold text-fairway-900">
                    Runda {round.roundNumber}
                  </span>
                  <span className="text-sm font-semibold text-fairway-500">
                    {open ? 'Dölj' : 'Visa scorekort'}
                  </span>
                </button>
                {open && (
                  <div className="mt-3">
                    <Scorecard
                      players={tournament.players}
                      course={tournament.course}
                      scores={round.scores}
                    />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
