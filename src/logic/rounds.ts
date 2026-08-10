import type { Course, HoleScore, Player, PlayerId, Round } from '../types';
import { calculateMatchState, type MatchState } from './match';

/** Beräknar matchställningen för samtliga matcher i en runda. */
export function calculateRoundMatchStates(
  round: Round,
  players: Player[],
  course: Course,
): MatchState[] {
  const handicapOf = new Map(players.map((p) => [p.id, p.playingHandicap]));
  return round.matches.map((match) =>
    calculateMatchState(
      { id: match.player1Id, playingHandicap: handicapOf.get(match.player1Id) ?? 0 },
      { id: match.player2Id, playingHandicap: handicapOf.get(match.player2Id) ?? 0 },
      course.holes,
      round.scores,
    ),
  );
}

/** Alla spelar-id som deltar i rundan (från dess matcher). */
export function playerIdsInRound(round: Round): PlayerId[] {
  const ids = new Set<PlayerId>();
  for (const match of round.matches) {
    ids.add(match.player1Id);
    ids.add(match.player2Id);
  }
  return [...ids];
}

/** true om samtliga fyra spelare har en gross-score på samtliga hål. */
export function isRoundFullyScored(round: Round, course: Course): boolean {
  const ids = playerIdsInRound(round);
  for (const hole of course.holes) {
    for (const id of ids) {
      const score = round.scores.find(
        (s) => s.holeNumber === hole.number && s.playerId === id,
      );
      if (!score || score.grossScore == null) return false;
    }
  }
  return true;
}

/** Antal hål som har fullständiga scorer (alla spelare). */
export function fullyScoredHoleCount(round: Round, course: Course): number {
  const ids = playerIdsInRound(round);
  let count = 0;
  for (const hole of course.holes) {
    const complete = ids.every((id) => {
      const score = round.scores.find(
        (s) => s.holeNumber === hole.number && s.playerId === id,
      );
      return score != null && score.grossScore != null;
    });
    if (complete) count += 1;
  }
  return count;
}

/** Skapar en tom score-tabell (par som förval) för alla spelare × alla hål. */
export function createInitialScores(
  playerIds: PlayerId[],
  course: Course,
): HoleScore[] {
  const scores: HoleScore[] = [];
  for (const hole of course.holes) {
    for (const playerId of playerIds) {
      scores.push({ holeNumber: hole.number, playerId, grossScore: null });
    }
  }
  return scores;
}
