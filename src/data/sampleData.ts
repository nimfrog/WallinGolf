import type { Course } from '../types';

/** Exempelnamn enligt specifikationen (endast förslag, kan ändras fritt). */
export const SAMPLE_PLAYER_NAMES = ['Andreas', 'Martin', 'Jessica', 'Melker'] as const;

export interface PlayerDraft {
  name: string;
  exactHandicap: string;
  playingHandicap: string;
  tee: string;
}

/** Fyra exempelspelare som förifyllda utkast i guiden. */
export function createSamplePlayerDrafts(): PlayerDraft[] {
  return [
    { name: 'Andreas', exactHandicap: '27,1', playingHandicap: '28', tee: 'Gul' },
    { name: 'Martin', exactHandicap: '15,4', playingHandicap: '16', tee: 'Gul' },
    { name: 'Jessica', exactHandicap: '22,8', playingHandicap: '25', tee: 'Röd' },
    { name: 'Melker', exactHandicap: '9,2', playingHandicap: '10', tee: 'Gul' },
  ];
}

/** Vanliga tee-alternativ. */
export const TEE_OPTIONS = ['Vit', 'Gul', 'Blå', 'Röd', 'Orange'] as const;

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
};

/**
 * Inbyggda banor som alltid finns tillgängliga i appen (kan återanvändas
 * direkt utan att matas in manuellt).
 */
export const BUILTIN_COURSES: Course[] = [VIKSJO_9_COURSE];

/** Standard-par för ett nytt hål beroende på antal hål. */
export const DEFAULT_PAR = 4;
