/**
 * Datamodeller för WallinMatch.
 *
 * All spellogik arbetar mot dessa typer. Typerna hålls medvetet enkla och
 * serialiserbara (inga klasser, inga Map/Set) så att hela tillståndet kan
 * sparas direkt till localStorage och byggas om deterministiskt.
 */

export type PlayerId = string;

/** En tee, t.ex. "Gul" eller "Röd". Fritt textfält. */
export type Tee = string;

export type Gender = 'herr' | 'dam';

export interface Player {
  id: PlayerId;
  name: string;
  /** Exakt handicap, t.ex. 27.1. */
  exactHandicap: number;
  /** Spelhandicap – heltal som används i all matchlogik. */
  playingHandicap: number;
  tee: Tee;
  /** Kön, används för att välja rätt slope-rating. Valfritt. */
  gender?: Gender;
}

/**
 * Exakt spelhandicaptabell (klubbens officiella slopetabell). Varje rad höjer
 * spelhandicap med 1, så det räcker med startvärdet och radernas undre gränser
 * (exakt handicap) i stigande ordning. Värdet avser 18 hål (par 60).
 */
export interface PlayingHandicapTable {
  /** Spelhandicap (18-hål) för första raden. */
  start: number;
  /** Undre gräns i exakt handicap för varje rad, stigande. Plus-hcp = negativt. */
  lowerBounds: number[];
}

/**
 * Slope-rating för en tee (och kön). Course Rating och par anges som
 * ratingens 18-hålsvärden (så som de står i slopetabellen); appen skalar
 * automatiskt till antalet spelade hål.
 */
export interface TeeRating {
  tee: Tee;
  gender: Gender;
  /** Course Rating (18-hål), t.ex. 59.3. */
  courseRating: number;
  slope: number;
  /** Par som ratingen avser (18-hål), t.ex. 60. */
  par: number;
  /**
   * Klubbens exakta slopetabell. Om den finns används den istället för
   * formeln (matchar den tryckta tabellen slag för slag).
   */
  table?: PlayingHandicapTable;
}

export interface Hole {
  /** Hålnummer, 1-baserat. */
  number: number;
  par: number;
  /** Stroke Index / HCP för hålet. Unikt inom banan, 1..antalHål. */
  strokeIndex: number;
}

export interface Course {
  id: string;
  name: string;
  /** 9, 12 eller 18 hål. */
  holes: Hole[];
  /** Valfria slope-ratings per tee/kön för automatisk spelhandicap. */
  ratings?: TeeRating[];
}

/** En registrerad gross-score för en spelare på ett specifikt hål. */
export interface HoleScore {
  holeNumber: number;
  playerId: PlayerId;
  /** null = ännu ej registrerad. */
  grossScore: number | null;
}

export type MatchStatus = 'not_started' | 'in_progress' | 'decided' | 'finished';

/**
 * Resultatet av en enskild 1-vs-1-match. Byggs alltid om från alla
 * registrerade hålscorer – aldrig enbart inkrementellt.
 */
export interface MatchResult {
  winnerId: PlayerId | null;
  loserId: PlayerId | null;
  isDraw: boolean;
  /** Antal hål ledningen var på vid avgörandet (eller efter sista hålet). */
  margin: number;
  /** Antal hål som återstod när matchen avgjordes. 0 om avgjord på sista. */
  holesRemaining: number;
  /** Färdig visningstext, t.ex. "3&2", "2&1", "1 UP", "AS". */
  displayResult: string;
}

export interface Match {
  id: string;
  player1Id: PlayerId;
  player2Id: PlayerId;
}

export type RoundStatus = 'not_started' | 'in_progress' | 'completed';

export interface Round {
  roundNumber: number;
  /** Exakt två separata singelmatcher per runda. */
  matches: Match[];
  /** Alla gross-scorer för rundan (alla spelare × alla hål). */
  scores: HoleScore[];
  status: RoundStatus;
}

export type TournamentStatus = 'setup' | 'active' | 'finished';

export interface Tournament {
  id: string;
  /** ISO-datumsträng när turneringen skapades. */
  createdAt: string;
  players: Player[];
  course: Course;
  rounds: Round[];
  status: TournamentStatus;
}

/** Hela appens persisterade tillstånd. */
export interface AppData {
  /** Pågående turnering (setup eller aktiv). null om ingen. */
  currentTournament: Tournament | null;
  /** Avslutade turneringar, senaste först. */
  history: Tournament[];
  /** Sparade banor som kan återanvändas. */
  courses: Course[];
}
