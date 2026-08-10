import type { Hole, PlayerId } from '../types';

/**
 * Skillnaden i spelhandicap mellan två spelare (alltid ≥ 0).
 * Detta är antalet slag som den högre spelaren erhåller i matchen.
 */
export function calculateMatchHandicapDifference(
  playingHandicap1: number,
  playingHandicap2: number,
): number {
  return Math.abs(Math.round(playingHandicap1) - Math.round(playingHandicap2));
}

/**
 * Fördelar ett totalt antal erhållna slag över hålen efter Stroke Index.
 *
 * Generell princip (fungerar även när slagen är fler än antalet hål):
 *   basslag        = floor(total / antalHål)   -> ges på ALLA hål
 *   extraslag      = total % antalHål           -> ges på hålen med lägst SI
 *
 * @returns en map från hålnummer till antal erhållna slag på det hålet
 */
export function calculateReceivedStrokesPerHole(
  totalReceivedStrokes: number,
  holes: Hole[],
): Map<number, number> {
  const result = new Map<number, number>();
  const holeCount = holes.length;

  // Initiera alla hål till 0.
  for (const hole of holes) result.set(hole.number, 0);

  if (holeCount === 0 || totalReceivedStrokes <= 0) return result;

  const base = Math.floor(totalReceivedStrokes / holeCount);
  const extra = totalReceivedStrokes % holeCount;

  for (const hole of holes) result.set(hole.number, base);

  // De `extra` hålen med lägst Stroke Index får ytterligare ett slag.
  const byStrokeIndex = [...holes].sort((a, b) => a.strokeIndex - b.strokeIndex);
  for (let i = 0; i < extra; i++) {
    const hole = byStrokeIndex[i];
    result.set(hole.number, (result.get(hole.number) ?? 0) + 1);
  }

  return result;
}

/** Nettoscore på ett hål: gross minus erhållna slag. */
export function calculateNetScore(grossScore: number, receivedStrokes: number): number {
  return grossScore - receivedStrokes;
}

export interface MatchStrokeAllocation {
  /** Spelaren som spelar från 0 erhållna slag (lägst spelhandicap). */
  scratchPlayerId: PlayerId;
  /** Spelaren som erhåller slagen. Lika med scratch om skillnaden är 0. */
  receivingPlayerId: PlayerId;
  /** Totalt antal slag som den mottagande spelaren erhåller. */
  totalReceivedStrokes: number;
  /** Erhållna slag per hålnummer för den mottagande spelaren. */
  receivedPerHole: Map<number, number>;
}

/**
 * Räknar ut slagfördelningen för en enskild 1-vs-1-match.
 * Spelaren med lägst spelhandicap spelar från 0; motståndaren får skillnaden.
 * Vid lika spelhandicap får båda 0 slag.
 */
export function calculateMatchStrokeAllocation(
  player1Id: PlayerId,
  playingHandicap1: number,
  player2Id: PlayerId,
  playingHandicap2: number,
  holes: Hole[],
): MatchStrokeAllocation {
  const diff = calculateMatchHandicapDifference(playingHandicap1, playingHandicap2);
  const ph1 = Math.round(playingHandicap1);
  const ph2 = Math.round(playingHandicap2);

  // Vid lika spelhandicap är player1 "scratch" per konvention.
  const player1IsScratch = ph1 <= ph2;
  const scratchPlayerId = player1IsScratch ? player1Id : player2Id;
  const receivingPlayerId = player1IsScratch ? player2Id : player1Id;

  return {
    scratchPlayerId,
    receivingPlayerId,
    totalReceivedStrokes: diff,
    receivedPerHole: calculateReceivedStrokesPerHole(diff, holes),
  };
}

/**
 * Bekvämlighetsfunktion: erhållna slag per hål för BÅDA spelarna i en match.
 * Scratch-spelaren får 0 på alla hål.
 */
export function receivedStrokesByPlayer(
  allocation: MatchStrokeAllocation,
  holes: Hole[],
): Record<PlayerId, Map<number, number>> {
  const zero = new Map<number, number>();
  for (const hole of holes) zero.set(hole.number, 0);
  return {
    [allocation.scratchPlayerId]: zero,
    [allocation.receivingPlayerId]: allocation.receivedPerHole,
  };
}
