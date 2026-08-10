import type { Course, Hole } from '../types';
import { createId } from '../lib/id';

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

/** Skapar en exempelbana: Viksjö GK 9 hål. */
export function createSampleCourse(): Course {
  const holes: Hole[] = [
    { number: 1, par: 4, strokeIndex: 5 },
    { number: 2, par: 3, strokeIndex: 9 },
    { number: 3, par: 5, strokeIndex: 1 },
    { number: 4, par: 4, strokeIndex: 3 },
    { number: 5, par: 4, strokeIndex: 7 },
    { number: 6, par: 3, strokeIndex: 8 },
    { number: 7, par: 5, strokeIndex: 2 },
    { number: 8, par: 4, strokeIndex: 4 },
    { number: 9, par: 4, strokeIndex: 6 },
  ];
  return { id: createId('course'), name: 'Viksjö GK', holes };
}

/** Standard-par för ett nytt hål beroende på antal hål. */
export const DEFAULT_PAR = 4;
