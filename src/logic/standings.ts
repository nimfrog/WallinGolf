import type { Hole, Player, PlayerId, Round } from '../types';
import { calculateMatchState } from './match';

export interface StandingRow {
  placement: number;
  playerId: PlayerId;
  name: string;
  /** Spelade (avslutade) matcher. */
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
}

const POINTS_WIN = 1;
const POINTS_DRAW = 0.5;

/**
 * Beräknar totalställningen utifrån samtliga avslutade rundor.
 *
 * Poäng: vinst = 1, delad match = 0,5 vardera, förlust = 0.
 * Sortering primärt på poäng (fallande). Vid lika poäng delas placeringen
 * (t.ex. 1, 1, 3, 4) och ingen ytterligare tiebreak tillämpas.
 */
export function calculateStandings(
  players: Player[],
  rounds: Round[],
  holes: Hole[],
): StandingRow[] {
  const byId = new Map<PlayerId, StandingRow>();
  for (const p of players) {
    byId.set(p.id, {
      placement: 0,
      playerId: p.id,
      name: p.name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
    });
  }

  const handicapOf = new Map(players.map((p) => [p.id, p.playingHandicap]));

  for (const round of rounds) {
    if (round.status !== 'completed') continue;

    for (const match of round.matches) {
      const state = calculateMatchState(
        { id: match.player1Id, playingHandicap: handicapOf.get(match.player1Id) ?? 0 },
        { id: match.player2Id, playingHandicap: handicapOf.get(match.player2Id) ?? 0 },
        holes,
        round.scores,
      );
      const result = state.result;
      if (!result) continue; // ofärdig match räknas inte

      const row1 = byId.get(match.player1Id);
      const row2 = byId.get(match.player2Id);
      if (!row1 || !row2) continue;

      row1.played += 1;
      row2.played += 1;

      if (result.isDraw) {
        row1.draws += 1;
        row2.draws += 1;
        row1.points += POINTS_DRAW;
        row2.points += POINTS_DRAW;
      } else {
        const winner = result.winnerId === row1.playerId ? row1 : row2;
        const loser = result.winnerId === row1.playerId ? row2 : row1;
        winner.wins += 1;
        winner.points += POINTS_WIN;
        loser.losses += 1;
      }
    }
  }

  const rows = [...byId.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return a.name.localeCompare(b.name, 'sv');
  });

  // Delad placering vid lika poäng (1, 1, 3, ...).
  let lastPoints: number | null = null;
  let lastPlacement = 0;
  rows.forEach((row, index) => {
    if (lastPoints !== null && row.points === lastPoints) {
      row.placement = lastPlacement;
    } else {
      row.placement = index + 1;
      lastPlacement = row.placement;
      lastPoints = row.points;
    }
  });

  return rows;
}
