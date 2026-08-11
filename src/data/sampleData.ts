import type { Course, Gender } from '../types';

/** Exempelnamn enligt specifikationen (endast förslag, kan ändras fritt). */
export const SAMPLE_PLAYER_NAMES = ['Andreas', 'Martin', 'Jessica', 'Melker'] as const;

export interface PlayerDraft {
  name: string;
  exactHandicap: string;
  gender: Gender;
  tee: string;
}

/** Fyra exempelspelare som förifyllda utkast i guiden. */
export function createSamplePlayerDrafts(): PlayerDraft[] {
  return [
    { name: 'Andreas', exactHandicap: '27,1', gender: 'herr', tee: 'Gul' },
    { name: 'Martin', exactHandicap: '22,9', gender: 'herr', tee: 'Gul' },
    { name: 'Jessica', exactHandicap: '43,2', gender: 'dam', tee: 'Röd' },
    { name: 'Melker', exactHandicap: '47,3', gender: 'herr', tee: 'Gul' },
  ];
}

/** Tee-alternativ. */
export const TEE_OPTIONS = ['Gul', 'Röd'] as const;

/**
 * Viksjö GK 9 hål – officiell bandata (par och 18-hålsindex från scorekortet).
 * Stroke Index anges som de officiella hålindexen (udda 1–17); det är den
 * inbördes ordningen som styr slagfördelningen.
 */
export const VIKSJO_9_COURSE: Course = {
  id: 'course_viksjo_9',
  name: 'Viksjö GK 9 hål',
  holes: [
    { number: 1, par: 3, strokeIndex: 7 },
    { number: 2, par: 4, strokeIndex: 3 },
    { number: 3, par: 4, strokeIndex: 5 },
    { number: 4, par: 3, strokeIndex: 11 },
    { number: 5, par: 4, strokeIndex: 1 },
    { number: 6, par: 3, strokeIndex: 9 },
    { number: 7, par: 3, strokeIndex: 13 },
    { number: 8, par: 3, strokeIndex: 17 },
    { number: 9, par: 3, strokeIndex: 15 },
  ],
  // Slope-ratings enligt klubbens slopetabell (18-hålsvärden, par 60).
  // `table` är klubbens exakta spelhandicaptabell (2017) och används vid
  // beräkning; CR/Slope behålls för visning. Spelhandicap för 9 hål = tabellens
  // 18-hålsvärde delat på två (avrundat).
  ratings: [
    {
      tee: 'Gul',
      gender: 'herr',
      courseRating: 59.3,
      slope: 101,
      par: 60,
      table: {
        start: -4,
        lowerBounds: [
          -4, -3.1, -2, -0.8, 0.3, 1.4, 2.5, 3.6, 4.7, 5.9, 7, 8.1, 9.2, 10.3,
          11.5, 12.6, 13.7, 14.8, 15.9, 17.1, 18.2, 19.3, 20.4, 21.5, 22.6, 23.8,
          24.9, 26, 27.1, 28.2, 29.4, 30.5, 31.6, 32.7, 33.8, 35, 37, 38, 39, 40,
          41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54,
        ],
      },
    },
    {
      tee: 'Röd',
      gender: 'herr',
      courseRating: 54.9,
      slope: 92,
      par: 60,
      table: {
        start: -8,
        lowerBounds: [
          -4, -2.9, -1.7, -0.4, 0.8, 2, 3.2, 4.5, 5.7, 6.9, 8.2, 9.4, 10.6, 11.8,
          13.1, 14.3, 15.5, 16.8, 18, 19.2, 20.4, 21.7, 22.9, 24.1, 25.4, 26.6,
          27.8, 29, 30.3, 31.5, 32.7, 33.9, 35.2, 37, 38, 39, 40, 41, 42, 43, 44,
          45, 46, 47, 48, 49, 50, 51, 52, 53, 54,
        ],
      },
    },
    {
      tee: 'Gul',
      gender: 'dam',
      courseRating: 61.3,
      slope: 97,
      par: 60,
      table: {
        start: -2,
        lowerBounds: [
          -4, -3.2, -2, -0.9, 0.3, 1.4, 2.6, 3.8, 4.9, 6.1, 7.3, 8.4, 9.6, 10.8,
          11.9, 13.1, 14.3, 15.4, 16.6, 17.8, 18.9, 20.1, 21.3, 22.4, 23.6, 24.7,
          25.9, 27.1, 28.2, 29.4, 30.6, 31.7, 32.9, 34.1, 35.2,
        ],
      },
    },
    {
      tee: 'Röd',
      gender: 'dam',
      courseRating: 58.4,
      slope: 91,
      par: 60,
      table: {
        start: -5,
        lowerBounds: [
          -4, -3.6, -2.3, -1.1, 0.2, 1.4, 2.7, 3.9, 5.1, 6.4, 7.6, 8.9, 10.1,
          11.3, 12.6, 13.8, 15.1, 16.3, 17.6, 18.8, 20, 21.3, 22.5, 23.8, 25,
          26.3, 27.5, 28.7, 30, 31.2, 32.5, 33.7, 34.9, 37, 38, 39, 40, 41, 42,
          43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54,
        ],
      },
    },
  ],
};

/**
 * Inbyggda banor som alltid finns tillgängliga i appen (kan återanvändas
 * direkt utan att matas in manuellt).
 */
export const BUILTIN_COURSES: Course[] = [VIKSJO_9_COURSE];

const BUILTIN_COURSE_IDS = new Set(BUILTIN_COURSES.map((c) => c.id));

/** true om banan är inbyggd (och därmed inte kan tas bort). */
export function isBuiltinCourse(id: string): boolean {
  return BUILTIN_COURSE_IDS.has(id);
}

/** Standard-par för ett nytt hål beroende på antal hål. */
export const DEFAULT_PAR = 4;
