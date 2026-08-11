import { describe, it, expect } from 'vitest';
import type { Hole, HoleScore, Player, PlayerId, Round } from '../../types';
import {
  generateRoundRobinSchedule,
  calculateMatchHandicapDifference,
  calculateReceivedStrokesPerHole,
  calculateNetScore,
  determineHoleWinner,
  calculateMatchState,
  calculateStandings,
  calculatePlayingHandicap,
  findTeeRating,
} from '../index';
import type { TeeRating } from '../../types';
import { VIKSJO_9_COURSE } from '../../data/sampleData';

/* --- Testhjälpare --------------------------------------------------------- */

/** Skapar `n` hål. Stroke Index = hålnummer om inget annat anges. */
function makeHoles(n: number, strokeIndexByHole?: Record<number, number>): Hole[] {
  return Array.from({ length: n }, (_, i) => {
    const number = i + 1;
    return {
      number,
      par: 4,
      strokeIndex: strokeIndexByHole?.[number] ?? number,
    };
  });
}

function scoresFrom(
  holes: Hole[],
  p1: PlayerId,
  p2: PlayerId,
  grosses: Record<PlayerId, (number | null)[]>,
): HoleScore[] {
  const out: HoleScore[] = [];
  holes.forEach((hole, i) => {
    for (const pid of [p1, p2]) {
      out.push({ holeNumber: hole.number, playerId: pid, grossScore: grosses[pid][i] });
    }
  });
  return out;
}

const player = (id: string, playingHandicap: number): { id: string; playingHandicap: number } => ({
  id,
  playingHandicap,
});

/* --- 1 & 2: Schemagenerering --------------------------------------------- */

describe('generateRoundRobinSchedule', () => {
  const ids = ['a', 'b', 'c', 'd'];

  it('genererar exakt 3 rundor och 6 unika matcher (test 1)', () => {
    const schedule = generateRoundRobinSchedule(ids);
    expect(schedule).toHaveLength(3);
    const matches = schedule.flatMap((r) => r.matches);
    expect(matches).toHaveLength(6);

    const keys = matches.map((m) => [m.player1Id, m.player2Id].sort().join('-'));
    expect(new Set(keys).size).toBe(6);
  });

  it('varje spelare möter alla andra exakt en gång (test 2)', () => {
    const schedule = generateRoundRobinSchedule(ids);
    const matches = schedule.flatMap((r) => r.matches);

    for (const id of ids) {
      const opponents = matches
        .filter((m) => m.player1Id === id || m.player2Id === id)
        .map((m) => (m.player1Id === id ? m.player2Id : m.player1Id));
      expect(opponents).toHaveLength(3);
      expect(new Set(opponents)).toEqual(new Set(ids.filter((x) => x !== id)));
    }
  });

  it('följer det specificerade mönstret för rundorna', () => {
    const [r1, r2, r3] = generateRoundRobinSchedule(ids);
    expect(r1.matches).toEqual([
      { player1Id: 'a', player2Id: 'b' },
      { player1Id: 'c', player2Id: 'd' },
    ]);
    expect(r2.matches).toEqual([
      { player1Id: 'a', player2Id: 'c' },
      { player1Id: 'b', player2Id: 'd' },
    ]);
    expect(r3.matches).toEqual([
      { player1Id: 'a', player2Id: 'd' },
      { player1Id: 'b', player2Id: 'c' },
    ]);
  });

  it('kräver exakt fyra spelare', () => {
    expect(() => generateRoundRobinSchedule(['a', 'b', 'c'])).toThrow();
    expect(() => generateRoundRobinSchedule(['a', 'b', 'c', 'd', 'e'])).toThrow();
  });
});

/* --- 3 & 4: Handicapfördelning ------------------------------------------- */

describe('handicapfördelning', () => {
  it('skillnad 6 i spelhandicap ger 6 korrekt fördelade slag (test 3)', () => {
    expect(calculateMatchHandicapDifference(12, 18)).toBe(6);

    const holes = makeHoles(9); // SI 1..9 = hålnummer
    const dist = calculateReceivedStrokesPerHole(6, holes);

    // Hålen med SI 1..6 (dvs hål 1..6) får 1 slag, resten 0.
    for (let h = 1; h <= 6; h++) expect(dist.get(h)).toBe(1);
    for (let h = 7; h <= 9; h++) expect(dist.get(h)).toBe(0);

    const total = [...dist.values()].reduce((a, b) => a + b, 0);
    expect(total).toBe(6);
  });

  it('11 slag på 9 hål ger 1 slag överallt + 1 extra på de två lägsta SI (test 4)', () => {
    const holes = makeHoles(9);
    const dist = calculateReceivedStrokesPerHole(11, holes);

    // Hål med SI 1 och 2 får 2 slag, övriga 1.
    expect(dist.get(1)).toBe(2);
    expect(dist.get(2)).toBe(2);
    for (let h = 3; h <= 9; h++) expect(dist.get(h)).toBe(1);

    const total = [...dist.values()].reduce((a, b) => a + b, 0);
    expect(total).toBe(11);
  });

  it('fördelar korrekt även på 18 hål med spridd Stroke Index', () => {
    // SI omvänt mot hålnummer för att bevisa att SI styr, inte hålnummer.
    const siMap: Record<number, number> = {};
    for (let h = 1; h <= 18; h++) siMap[h] = 19 - h; // hål 18 = SI 1
    const holes = makeHoles(18, siMap);

    const dist = calculateReceivedStrokesPerHole(3, holes);
    // 3 slag -> de tre lägsta SI = hål 18, 17, 16.
    expect(dist.get(18)).toBe(1);
    expect(dist.get(17)).toBe(1);
    expect(dist.get(16)).toBe(1);
    expect(dist.get(15)).toBe(0);
    expect([...dist.values()].reduce((a, b) => a + b, 0)).toBe(3);
  });
});

/* --- Spelhandicap från slope (9-hål, Viksjö) ----------------------------- */

describe('calculatePlayingHandicap (9-hål)', () => {
  const gulHerr: TeeRating = {
    tee: 'Gul',
    gender: 'herr',
    courseRating: 59.3,
    slope: 101,
    par: 60,
  };
  const rodDam: TeeRating = {
    tee: 'Röd',
    gender: 'dam',
    courseRating: 58.4,
    slope: 91,
    par: 60,
  };

  it('räknar 9-hålsspelhandicap från exakt HCP, slope och CR', () => {
    // (27.8 × 101/113 + (59.3−60)) × 9/18 = 12.07 → 12
    expect(calculatePlayingHandicap(27.8, gulHerr, 9)).toBe(12);
    // (9.2 × 101/113 − 0.7) × 0.5 = 3.76 → 4
    expect(calculatePlayingHandicap(9.2, gulHerr, 9)).toBe(4);
    // (22.8 × 91/113 + (58.4−60)) × 0.5 = 8.38 → 8
    expect(calculatePlayingHandicap(22.8, rodDam, 9)).toBe(8);
  });

  it('scratch (HCP 0) ger ungefär CR−par halverat', () => {
    // (0 + (59.3−60)) × 0.5 = −0.35 → 0
    expect(calculatePlayingHandicap(0, gulHerr, 9)).toBe(0);
  });

  it('full skala på 18 hål ger dubbelt mot 9 hål-termen', () => {
    // 18-hål: 27.8 × 101/113 + (59.3−60) = 24.15 → 24
    expect(calculatePlayingHandicap(27.8, gulHerr, 18)).toBe(24);
  });
});

/* --- Viksjös exakta slopetabell ------------------------------------------ */

describe('Viksjö exakt slopetabell (klubbens 2017-tabell)', () => {
  const r = (tee: string, gender: 'herr' | 'dam') =>
    findTeeRating(VIKSJO_9_COURSE, tee, gender)!;

  it('herr röd HCP 47 ger 35 över 18 hål och 18 över 9 hål', () => {
    expect(calculatePlayingHandicap(47, r('Röd', 'herr'), 18)).toBe(35);
    expect(calculatePlayingHandicap(47, r('Röd', 'herr'), 9)).toBe(18);
  });

  it('herr gul HCP 47 ger 42 över 18 och 21 över 9', () => {
    expect(calculatePlayingHandicap(47, r('Gul', 'herr'), 18)).toBe(42);
    expect(calculatePlayingHandicap(47, r('Gul', 'herr'), 9)).toBe(21);
  });

  it('exempelspelarnas 9-håls spelhandicap', () => {
    expect(calculatePlayingHandicap(27.1, r('Gul', 'herr'), 9)).toBe(12); // Andreas
    expect(calculatePlayingHandicap(22.9, r('Gul', 'herr'), 9)).toBe(10); // Martin
    expect(calculatePlayingHandicap(43.2, r('Röd', 'dam'), 9)).toBe(17); // Jessica
    expect(calculatePlayingHandicap(47.3, r('Gul', 'herr'), 9)).toBe(21); // Melker
  });

  it('scratch (HCP 0) följer tabellens startvärden', () => {
    expect(calculatePlayingHandicap(0, r('Gul', 'herr'), 18)).toBe(-1);
    expect(calculatePlayingHandicap(0, r('Röd', 'herr'), 18)).toBe(-5);
  });
});

/* --- 5, 6, 7: Netto och hålvinnare --------------------------------------- */

describe('netto och hålvinnare', () => {
  it('gross 5 minus 1 erhållet slag ger netto 4 (test 5)', () => {
    expect(calculateNetScore(5, 1)).toBe(4);
  });

  it('lägre nettoscore vinner hålet (test 6)', () => {
    expect(determineHoleWinner(4, 5)).toBe('player1');
    expect(determineHoleWinner(6, 5)).toBe('player2');
  });

  it('samma nettoscore delar hålet (test 7)', () => {
    expect(determineHoleWinner(5, 5)).toBe('halved');
  });
});

/* --- 8: Matchställning ---------------------------------------------------- */

describe('calculateMatchState – ställning', () => {
  it('räknar matchställningen korrekt när spelarna vinner olika hål (test 8)', () => {
    const holes = makeHoles(9);
    // Lika spelhandicap -> inga slag. p1 vinner hål 1, p2 hål 2, delat hål 3.
    const scores = scoresFrom(holes, 'a', 'b', {
      a: [4, 5, 4, null, null, null, null, null, null],
      b: [5, 4, 4, null, null, null, null, null, null],
    });
    const state = calculateMatchState(player('a', 10), player('b', 10), holes, scores);

    expect(state.holesPlayed).toBe(3);
    expect(state.lead).toBe(0);
    expect(state.leaderId).toBeNull();
    expect(state.scoreText).toBe('AS');
    expect(state.status).toBe('in_progress');
  });

  it('visar ledaren korrekt med namnlös ställningstext', () => {
    const holes = makeHoles(9);
    const scores = scoresFrom(holes, 'a', 'b', {
      a: [4, 4, null, null, null, null, null, null, null],
      b: [5, 5, null, null, null, null, null, null, null],
    });
    const state = calculateMatchState(player('a', 10), player('b', 10), holes, scores);
    expect(state.lead).toBe(2);
    expect(state.leaderId).toBe('a');
    expect(state.scoreText).toBe('2 UP');
  });
});

/* --- 9, 10, 11: Avgörande och slutresultat ------------------------------- */

describe('calculateMatchState – resultat', () => {
  it('3 UP med två hål kvar avslutas som 3&2 (test 9)', () => {
    const holes = makeHoles(9);
    // p1 vinner hål 1,2,3,5,7 och p2 hål 4. Efter hål 7: p1 +4? Låt oss styra.
    // Enklare: p1 vinner hål 1,2,3 -> 3 UP efter hål 3? Nej, remaining=6.
    // 3 UP med 2 kvar => efter hål 7 (av 9), lead 3.
    // Låt p1 vinna hål 1,2,3,4 och p2 hål 5, delat 6, p1 hål 7 => lead = 4-1 =3?
    // hål1 p1(+1),2 p1(+2),3 p1(+3),4 p1(+4),5 p2(+3),6 delat(+3),7 p1(+4). remaining efter 7 =2, 4>2 avgjort 4&2.
    // Vi vill 3&2: lead 3 efter hål 7. p1 vinner 1,2,3, delat 4,5,6, p1 hål7 => lead 4. Justera:
    // p1 vinner 1,2,3; p2 vinner 4; delat 5,6; p1 vinner 7 => lead = 3 -1 +1 = 3 efter hål 7. remaining 2. 3>2 => 3&2.
    const scores = scoresFrom(holes, 'a', 'b', {
      a: [4, 4, 4, 5, 4, 4, 4, null, null],
      b: [5, 5, 5, 4, 4, 4, 5, null, null],
    });
    const state = calculateMatchState(player('a', 10), player('b', 10), holes, scores);
    expect(state.decidedAtHole).toBe(7);
    expect(state.status).toBe('decided');
    expect(state.result?.winnerId).toBe('a');
    expect(state.result?.displayResult).toBe('3&2');
    expect(state.result?.margin).toBe(3);
    expect(state.result?.holesRemaining).toBe(2);
  });

  it('2 UP med ett hål kvar ger 2&1', () => {
    const holes = makeHoles(9);
    // lead 2 efter hål 8 (remaining 1). p1 vinner hål 1,2; delat 3..8.
    const scores = scoresFrom(holes, 'a', 'b', {
      a: [4, 4, 4, 4, 4, 4, 4, 4, null],
      b: [5, 5, 4, 4, 4, 4, 4, 4, null],
    });
    const state = calculateMatchState(player('a', 10), player('b', 10), holes, scores);
    expect(state.decidedAtHole).toBe(8);
    expect(state.result?.displayResult).toBe('2&1');
  });

  it('1 UP efter sista hålet visas som 1 UP (test 10)', () => {
    const holes = makeHoles(9);
    // p1 vinner hål 1, resten delat. Lead 1 hela vägen, aldrig > remaining.
    const scores = scoresFrom(holes, 'a', 'b', {
      a: [4, 4, 4, 4, 4, 4, 4, 4, 4],
      b: [5, 4, 4, 4, 4, 4, 4, 4, 4],
    });
    const state = calculateMatchState(player('a', 10), player('b', 10), holes, scores);
    expect(state.decidedAtHole).toBeNull();
    expect(state.status).toBe('finished');
    expect(state.result?.displayResult).toBe('1 UP');
    expect(state.result?.winnerId).toBe('a');
    expect(state.result?.holesRemaining).toBe(0);
  });

  it('lika efter sista hålet visas som AS/delad match (test 11)', () => {
    const holes = makeHoles(9);
    const scores = scoresFrom(holes, 'a', 'b', {
      a: [4, 4, 4, 4, 4, 4, 4, 4, 4],
      b: [4, 4, 4, 4, 4, 4, 4, 4, 4],
    });
    const state = calculateMatchState(player('a', 10), player('b', 10), holes, scores);
    expect(state.status).toBe('finished');
    expect(state.result?.isDraw).toBe(true);
    expect(state.result?.displayResult).toBe('AS');
    expect(state.result?.winnerId).toBeNull();
  });

  it('4 UP med 3 kvar ger 4&3', () => {
    const holes = makeHoles(18);
    const a = Array(18).fill(4);
    const b = Array(18).fill(4);
    // p1 vinner hål 1-4 => lead 4 efter hål 4? remaining 14. Not decided.
    // Behöver lead 4 efter hål 15 (remaining 3). Låt p1 vinna hål 12,13,14,15.
    for (const h of [12, 13, 14, 15]) b[h - 1] = 5; // p1 vinner dessa
    const scores = scoresFrom(holes, 'a', 'b', { a, b });
    const state = calculateMatchState(player('a', 10), player('b', 10), holes, scores);
    expect(state.decidedAtHole).toBe(15);
    expect(state.result?.displayResult).toBe('4&3');
  });
});

/* --- 12: Omräkning vid ändrad score -------------------------------------- */

describe('omräkning vid ändrad score (test 12)', () => {
  it('ändrad score på tidigare hål räknar om hela matchen', () => {
    const holes = makeHoles(9);
    // Utgångsläge: p1 vinner hål 1,2,3 -> 3 UP med 6 kvar (ej avgjort).
    const scores = scoresFrom(holes, 'a', 'b', {
      a: [4, 4, 4, 4, 4, 4, 4, 4, 4],
      b: [5, 5, 5, 4, 4, 4, 4, 4, 4],
    });
    let state = calculateMatchState(player('a', 10), player('b', 10), holes, scores);
    // p1 vinner hål 1-3, resten delat. Efter hål 6: lead 3, remaining 3 (ej >).
    // Efter hål 7: remaining 2, 3 > 2 => matchen avgörs 3&2.
    expect(state.lead).toBe(3);
    expect(state.decidedAtHole).toBe(7);
    expect(state.result?.displayResult).toBe('3&2');

    // Ändra hål 1: nu delar de hål 1 istället -> lead 2.
    const edited = scores.map((s) =>
      s.holeNumber === 1 && s.playerId === 'b' ? { ...s, grossScore: 4 } : s,
    );
    state = calculateMatchState(player('a', 10), player('b', 10), holes, edited);
    // p1 vinner hål 2,3 -> lead 2. Delat övrigt. Efter hål 8 remaining1, 2>1 => 2&1.
    expect(state.lead).toBe(2);
    expect(state.decidedAtHole).toBe(8);
    expect(state.result?.displayResult).toBe('2&1');
  });
});

/* --- 13, 14, 15, 16: Poäng och tabell ------------------------------------ */

describe('calculateStandings', () => {
  const players: Player[] = [
    { id: 'a', name: 'Andreas', exactHandicap: 27.1, playingHandicap: 10, tee: 'Gul' },
    { id: 'b', name: 'Martin', exactHandicap: 18, playingHandicap: 10, tee: 'Gul' },
    { id: 'c', name: 'Jessica', exactHandicap: 30, playingHandicap: 10, tee: 'Röd' },
    { id: 'd', name: 'Melker', exactHandicap: 12, playingHandicap: 10, tee: 'Gul' },
  ];
  const holes = makeHoles(9);

  // Hjälp: skapa en completed round där ett givet resultat framtvingas.
  function roundWith(
    roundNumber: number,
    m1: { p1: string; p2: string; winner: string | 'draw' },
    m2: { p1: string; p2: string; winner: string | 'draw' },
  ): Round {
    const scores: HoleScore[] = [];
    const setMatch = (p1: string, p2: string, winner: string | 'draw') => {
      holes.forEach((hole) => {
        let g1 = 4;
        let g2 = 4;
        if (winner === p1) g2 = 5; // p1 vinner varje hål
        else if (winner === p2) g1 = 5;
        scores.push({ holeNumber: hole.number, playerId: p1, grossScore: g1 });
        scores.push({ holeNumber: hole.number, playerId: p2, grossScore: g2 });
      });
    };
    setMatch(m1.p1, m1.p2, m1.winner);
    setMatch(m2.p1, m2.p2, m2.winner);
    return {
      roundNumber,
      status: 'completed',
      matches: [
        { id: `r${roundNumber}m1`, player1Id: m1.p1, player2Id: m1.p2 },
        { id: `r${roundNumber}m2`, player1Id: m2.p1, player2Id: m2.p2 },
      ],
      scores,
    };
  }

  it('vinst=1, delad=0,5, förlust=0 och sorterar på poäng (test 13-16)', () => {
    // Runda 1: a slår b, c slår d.
    // Runda 2: a slår c, b delar d.
    // Runda 3: a slår d, b slår c.
    const rounds: Round[] = [
      roundWith(1, { p1: 'a', p2: 'b', winner: 'a' }, { p1: 'c', p2: 'd', winner: 'c' }),
      roundWith(2, { p1: 'a', p2: 'c', winner: 'a' }, { p1: 'b', p2: 'd', winner: 'draw' }),
      roundWith(3, { p1: 'a', p2: 'd', winner: 'a' }, { p1: 'b', p2: 'c', winner: 'b' }),
    ];

    const standings = calculateStandings(players, rounds, holes);
    const byId = Object.fromEntries(standings.map((r) => [r.playerId, r]));

    // Andreas: 3 vinster = 3p
    expect(byId.a.wins).toBe(3);
    expect(byId.a.points).toBe(3);
    // Martin: 1 delad + 1 vinst + 1 förlust = 1,5p
    expect(byId.b.draws).toBe(1);
    expect(byId.b.wins).toBe(1);
    expect(byId.b.losses).toBe(1);
    expect(byId.b.points).toBe(1.5);
    // Jessica: 1 vinst + 2 förluster = 1p
    expect(byId.c.points).toBe(1);
    // Melker: 1 delad + 2 förluster = 0,5p
    expect(byId.d.points).toBe(0.5);

    // Sortering: Andreas (3), Martin (1,5), Jessica (1), Melker (0,5)
    expect(standings.map((r) => r.playerId)).toEqual(['a', 'b', 'c', 'd']);
    expect(standings.map((r) => r.placement)).toEqual([1, 2, 3, 4]);

    // Alla har spelat 3 matcher.
    expect(standings.every((r) => r.played === 3)).toBe(true);
  });

  it('delar placering vid lika poäng utan extra tiebreak', () => {
    // Endast en runda: a slår b, c delar d -> a=1, c=0,5, d=0,5, b=0.
    const rounds: Round[] = [
      roundWith(1, { p1: 'a', p2: 'b', winner: 'a' }, { p1: 'c', p2: 'd', winner: 'draw' }),
    ];
    const standings = calculateStandings(players, rounds, holes);
    const byId = Object.fromEntries(standings.map((r) => [r.playerId, r]));
    // c och d har samma poäng (0,5) -> delad placering.
    expect(byId.c.points).toBe(0.5);
    expect(byId.d.points).toBe(0.5);
    expect(byId.c.placement).toBe(byId.d.placement);
  });
});
