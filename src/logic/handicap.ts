import type { Course, Gender, Hole, PlayerId, Tee, TeeRating } from '../types';

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

/** Slår upp slope-rating för en given tee och kön på en bana. */
export function findTeeRating(
  course: Course,
  tee: Tee,
  gender: Gender | undefined,
): TeeRating | undefined {
  if (!course.ratings) return undefined;
  return course.ratings.find(
    (r) => r.tee === tee && (gender == null || r.gender === gender),
  );
}

/** Slår upp spelhandicap (18-hål) i en exakt slopetabell. */
export function lookupHandicapTable(
  table: { start: number; lowerBounds: number[] },
  exactHandicap: number,
): number {
  let idx = 0;
  for (let i = 0; i < table.lowerBounds.length; i++) {
    if (exactHandicap >= table.lowerBounds[i]) idx = i;
  }
  return table.start + idx;
}

/**
 * Beräknar spelhandicap (course handicap) från exakt handicap och slope-rating,
 * skalat till antalet spelade hål (t.ex. ×9/18 för en 9-hålsrunda).
 *
 * Finns en exakt slopetabell (rating.table) används den – då matchar värdet
 * klubbens tryckta tabell exakt. Annars används standardformeln:
 *   round( (exaktHCP × Slope/113 + (CR − Par18)) × antalHål/18 )
 */
export function calculatePlayingHandicap(
  exactHandicap: number,
  rating: TeeRating,
  holeCount: number,
): number {
  const full18 = rating.table
    ? lookupHandicapTable(rating.table, exactHandicap)
    : exactHandicap * (rating.slope / 113) + (rating.courseRating - rating.par);
  const rounded = Math.round(full18 * (holeCount / 18));
  return rounded === 0 ? 0 : rounded; // undvik -0
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
