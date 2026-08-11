import type { Course, TeeRating } from '../types';
import type { PlayerDraft } from '../data/sampleData';
import { parseHandicap } from '../lib/format';
import { calculatePlayingHandicap, findTeeRating } from './handicap';

export interface DerivedHandicap {
  /** Slope-rating som matchar spelarens tee/kön, om sådan finns. */
  rating?: TeeRating;
  /** Automatiskt beräknat spelhandicap, eller null om det inte går. */
  auto: number | null;
  /** true om manuell inmatning ska visas (override eller ingen rating). */
  showManual: boolean;
  /** Det spelhandicap som faktiskt används (auto eller manuellt). */
  effective: number | null;
}

/**
 * Härleder en spelares spelhandicap utifrån utkastet och den valda banan.
 * Använder automatisk slope-beräkning när det finns rating för tee/kön,
 * annars manuellt inmatat värde.
 */
export function deriveDraftHandicap(
  draft: PlayerDraft,
  course: Course | null,
): DerivedHandicap {
  const exact = parseHandicap(draft.exactHandicap);
  const rating = course ? findTeeRating(course, draft.tee, draft.gender) : undefined;
  const auto =
    rating && exact != null
      ? calculatePlayingHandicap(exact, rating, course!.holes.length)
      : null;

  const showManual = draft.overridePlayingHandicap || auto == null;
  const manual = parseHandicap(draft.manualPlayingHandicap);
  const effective = showManual
    ? manual == null
      ? null
      : Math.round(manual)
    : auto;

  return { rating, auto, showManual, effective };
}
