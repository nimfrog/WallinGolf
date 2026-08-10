import type { Hole, HoleScore, MatchResult, MatchStatus, PlayerId } from '../types';
import {
  calculateMatchStrokeAllocation,
  calculateNetScore,
  type MatchStrokeAllocation,
} from './handicap';

export type HoleWinner = 'player1' | 'player2' | 'halved';

/**
 * Avgör vem som vinner ett hål utifrån nettoscore.
 * Lägre nettoscore vinner. Lika netto delar hålet.
 */
export function determineHoleWinner(net1: number, net2: number): HoleWinner {
  if (net1 < net2) return 'player1';
  if (net2 < net1) return 'player2';
  return 'halved';
}

export interface HoleOutcome {
  holeNumber: number;
  bothScored: boolean;
  p1Gross: number | null;
  p2Gross: number | null;
  p1Received: number;
  p2Received: number;
  p1Net: number | null;
  p2Net: number | null;
  winner: HoleWinner | null;
}

export interface MatchState {
  player1Id: PlayerId;
  player2Id: PlayerId;
  allocation: MatchStrokeAllocation;
  holeOutcomes: HoleOutcome[];
  /** Antal hål där båda spelarna har en registrerad score. */
  holesPlayed: number;
  /** Ställning ur player1:s perspektiv: positivt = player1 leder. */
  lead: number;
  /** Id på den som leder, eller null vid AS. */
  leaderId: PlayerId | null;
  /** Ledningens storlek (absolutbelopp). */
  upBy: number;
  status: MatchStatus;
  /** Hålnummer där matchen avgjordes i förtid, annars null. */
  decidedAtHole: number | null;
  /** Färdigt resultat när matchen är avgjord/slutförd, annars null. */
  result: MatchResult | null;
  /** Kort ställningstext utan namn: "AS" eller "2 UP". */
  scoreText: string;
}

interface MatchPlayerInput {
  id: PlayerId;
  playingHandicap: number;
}

function grossFor(
  scores: HoleScore[],
  playerId: PlayerId,
  holeNumber: number,
): number | null {
  const found = scores.find(
    (s) => s.playerId === playerId && s.holeNumber === holeNumber,
  );
  return found && found.grossScore != null ? found.grossScore : null;
}

/**
 * Bygger fullständig matchställning för en 1-vs-1-match utifrån ALLA
 * registrerade hålscorer. Ställningen räknas alltid om från grunden – aldrig
 * enbart inkrementellt – så att en ändrad score på ett tidigare hål ger
 * korrekt omräkning av hålvinnare, matchställning och avgörandetidpunkt.
 */
export function calculateMatchState(
  player1: MatchPlayerInput,
  player2: MatchPlayerInput,
  holes: Hole[],
  scores: HoleScore[],
): MatchState {
  const allocation = calculateMatchStrokeAllocation(
    player1.id,
    player1.playingHandicap,
    player2.id,
    player2.playingHandicap,
    holes,
  );

  const p1Received = (n: number) =>
    allocation.receivingPlayerId === player1.id
      ? (allocation.receivedPerHole.get(n) ?? 0)
      : 0;
  const p2Received = (n: number) =>
    allocation.receivingPlayerId === player2.id
      ? (allocation.receivedPerHole.get(n) ?? 0)
      : 0;

  const totalHoles = holes.length;
  const orderedHoles = [...holes].sort((a, b) => a.number - b.number);

  const holeOutcomes: HoleOutcome[] = [];
  let lead = 0; // player1-perspektiv
  let holesPlayed = 0;

  let decidedAtHole: number | null = null;
  let decisionLead = 0;
  let decisionRemaining = 0;

  for (const hole of orderedHoles) {
    const g1 = grossFor(scores, player1.id, hole.number);
    const g2 = grossFor(scores, player2.id, hole.number);
    const r1 = p1Received(hole.number);
    const r2 = p2Received(hole.number);

    if (g1 == null || g2 == null) {
      holeOutcomes.push({
        holeNumber: hole.number,
        bothScored: false,
        p1Gross: g1,
        p2Gross: g2,
        p1Received: r1,
        p2Received: r2,
        p1Net: g1 == null ? null : calculateNetScore(g1, r1),
        p2Net: g2 == null ? null : calculateNetScore(g2, r2),
        winner: null,
      });
      continue;
    }

    const net1 = calculateNetScore(g1, r1);
    const net2 = calculateNetScore(g2, r2);
    const winner = determineHoleWinner(net1, net2);

    if (winner === 'player1') lead += 1;
    else if (winner === 'player2') lead -= 1;

    holesPlayed += 1;

    holeOutcomes.push({
      holeNumber: hole.number,
      bothScored: true,
      p1Gross: g1,
      p2Gross: g2,
      p1Received: r1,
      p2Received: r2,
      p1Net: net1,
      p2Net: net2,
      winner,
    });

    // Kontrollera avgörande i förtid: ledningen större än återstående hål.
    const remaining = totalHoles - hole.number;
    if (decidedAtHole == null && Math.abs(lead) > remaining && remaining > 0) {
      decidedAtHole = hole.number;
      decisionLead = lead;
      decisionRemaining = remaining;
    }
  }

  const leaderId = lead > 0 ? player1.id : lead < 0 ? player2.id : null;
  const upBy = Math.abs(lead);
  const scoreText = leaderId == null ? 'AS' : `${upBy} UP`;

  const allHolesScored = holesPlayed === totalHoles && totalHoles > 0;

  let status: MatchStatus;
  let result: MatchResult | null = null;

  if (holesPlayed === 0) {
    status = 'not_started';
  } else if (decidedAtHole != null) {
    status = 'decided';
    result = determineMatchResult({
      player1Id: player1.id,
      player2Id: player2.id,
      lead: decisionLead,
      holesRemaining: decisionRemaining,
      decidedEarly: true,
    });
  } else if (allHolesScored) {
    status = 'finished';
    result = determineMatchResult({
      player1Id: player1.id,
      player2Id: player2.id,
      lead,
      holesRemaining: 0,
      decidedEarly: false,
    });
  } else {
    status = 'in_progress';
  }

  return {
    player1Id: player1.id,
    player2Id: player2.id,
    allocation,
    holeOutcomes,
    holesPlayed,
    lead,
    leaderId,
    upBy,
    status,
    decidedAtHole,
    result,
    scoreText,
  };
}

export interface DetermineMatchResultInput {
  player1Id: PlayerId;
  player2Id: PlayerId;
  /** Ledning ur player1:s perspektiv vid avgörandet eller efter sista hålet. */
  lead: number;
  /** Antal återstående hål vid avgörandet (0 om efter sista hålet). */
  holesRemaining: number;
  /** true om matchen avgjordes i förtid (ledning > återstående hål). */
  decidedEarly: boolean;
}

/**
 * Skapar ett färdigt MatchResult med korrekt visningstext.
 *   - Avgjord i förtid: "3&2", "2&1" osv.
 *   - Avgjord på sista hålet: "1 UP", "2 UP" osv.
 *   - Lika: "AS" (delad match).
 */
export function determineMatchResult(input: DetermineMatchResultInput): MatchResult {
  const { player1Id, player2Id, lead, holesRemaining, decidedEarly } = input;

  if (lead === 0) {
    return {
      winnerId: null,
      loserId: null,
      isDraw: true,
      margin: 0,
      holesRemaining,
      displayResult: 'AS',
    };
  }

  const winnerId = lead > 0 ? player1Id : player2Id;
  const loserId = lead > 0 ? player2Id : player1Id;
  const margin = Math.abs(lead);

  const displayResult =
    decidedEarly && holesRemaining > 0
      ? `${margin}&${holesRemaining}`
      : `${margin} UP`;

  return {
    winnerId,
    loserId,
    isDraw: false,
    margin,
    holesRemaining,
    displayResult,
  };
}
