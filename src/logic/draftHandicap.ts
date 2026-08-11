import type { Course, TeeRating } from '../types';
import type { PlayerDraft } from '../data/sampleData';
import { parseHandicap } from '../lib/format';
import { calculatePlayingHandicap, findTeeRating } from './handicap';

export interface DerivedHandicap {
  /** Slope-rating som matchar spelarens tee/kön, om sådan finns. */
  rating?: TeeRating;
  /** Automatiskt beräknat spelhandicap, eller null om banan saknar slopedata. */
  playingHandicap: number | null;
}

/**
 * Härleder en spelares spelhandicap utifrån utkastet och den valda banan.
 * Beräknas automatiskt från slope-rating för tee/kön. Saknar banan slopedata
 * för kombinationen blir värdet null (spelaren räknas då som 0 slag).
 */
export function deriveDraftHandicap(
  draft: PlayerDraft,
  course: Course | null,
): DerivedHandicap {
  const exact = parseHandicap(draft.exactHandicap);
  const rating = course ? findTeeRating(course, draft.tee, draft.gender) : undefined;
  const playingHandicap =
    rating && exact != null
      ? calculatePlayingHandicap(exact, rating, course!.holes.length)
      : null;

  return { rating, playingHandicap };
}
