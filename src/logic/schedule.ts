import type { PlayerId } from '../types';

export interface ScheduledMatch {
  player1Id: PlayerId;
  player2Id: PlayerId;
}

export interface ScheduledRound {
  roundNumber: number;
  matches: ScheduledMatch[];
}

/**
 * Genererar ett round-robin-schema för exakt fyra spelare där alla möter
 * alla exakt en gång: 3 rundor × 2 matcher = 6 unika singelmatcher.
 *
 * Ordningen följer specifikationen:
 *   Runda 1: (1v2) och (3v4)
 *   Runda 2: (1v3) och (2v4)
 *   Runda 3: (1v4) och (2v3)
 *
 * @param playerIds exakt fyra spelar-id i önskad ordning
 */
export function generateRoundRobinSchedule(playerIds: PlayerId[]): ScheduledRound[] {
  if (playerIds.length !== 4) {
    throw new Error('Round-robin-schemat kräver exakt fyra spelare.');
  }
  const [p1, p2, p3, p4] = playerIds;

  return [
    {
      roundNumber: 1,
      matches: [
        { player1Id: p1, player2Id: p2 },
        { player1Id: p3, player2Id: p4 },
      ],
    },
    {
      roundNumber: 2,
      matches: [
        { player1Id: p1, player2Id: p3 },
        { player1Id: p2, player2Id: p4 },
      ],
    },
    {
      roundNumber: 3,
      matches: [
        { player1Id: p1, player2Id: p4 },
        { player1Id: p2, player2Id: p3 },
      ],
    },
  ];
}
