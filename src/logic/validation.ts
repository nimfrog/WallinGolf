import type { Course, Hole } from '../types';
import { parseHandicap } from '../lib/format';

export interface PlayerDraftInput {
  name: string;
  exactHandicap: string;
  tee: string;
}

export interface HoleDraftInput {
  number: number;
  par: string;
  strokeIndex: string;
}

/** Tillåtna banlängder. */
export const ALLOWED_HOLE_COUNTS = [9, 12, 18] as const;

/**
 * Validerar de fyra spelarna. Returnerar en lista med svenska felmeddelanden
 * (tom = giltigt).
 */
export function validatePlayers(players: PlayerDraftInput[]): string[] {
  const errors: string[] = [];

  if (players.length !== 4) {
    errors.push('Turneringen kräver exakt fyra spelare.');
  }

  players.forEach((p, i) => {
    const label = p.name.trim() || `Spelare ${i + 1}`;
    if (p.name.trim() === '') {
      errors.push(`Spelare ${i + 1} saknar namn.`);
    }
    if (parseHandicap(p.exactHandicap) == null) {
      errors.push(`${label}: ange ett giltigt exakt handicap.`);
    }
    if (p.tee.trim() === '') {
      errors.push(`${label}: välj tee.`);
    }
  });

  // Dubbletter av namn (varning, men blockerar).
  const names = players
    .map((p) => p.name.trim().toLowerCase())
    .filter((n) => n !== '');
  const dupes = names.filter((n, i) => names.indexOf(n) !== i);
  if (dupes.length > 0) {
    errors.push('Två spelare har samma namn – ge alla unika namn.');
  }

  return errors;
}

/** Validerar en banas hål-utkast. */
export function validateCourse(
  name: string,
  holeCount: number,
  holes: HoleDraftInput[],
): string[] {
  const errors: string[] = [];

  if (name.trim() === '') errors.push('Banan saknar namn.');

  if (!ALLOWED_HOLE_COUNTS.includes(holeCount as (typeof ALLOWED_HOLE_COUNTS)[number])) {
    errors.push('Antal hål måste vara 9, 12 eller 18.');
  }

  const parsedSI: number[] = [];
  holes.forEach((h) => {
    const par = Number(h.par);
    if (!Number.isInteger(par) || par < 3 || par > 6) {
      errors.push(`Hål ${h.number}: par måste vara mellan 3 och 6.`);
    }
    // Stroke Index anges 1–18 (9-hålsbanor använder ofta officiella
    // 18-hålsindex, t.ex. udda tal 1–17). Det är ordningen som styr
    // slagfördelningen, så unika värden räcker.
    const si = Number(h.strokeIndex);
    if (!Number.isInteger(si) || si < 1 || si > 18) {
      errors.push(`Hål ${h.number}: Stroke Index måste vara 1–18.`);
    } else {
      parsedSI.push(si);
    }
  });

  // Unika Stroke Index.
  const dupes = parsedSI.filter((si, i) => parsedSI.indexOf(si) !== i);
  if (dupes.length > 0) {
    errors.push('Stroke Index måste vara unika – varje värde får bara användas en gång.');
  }

  return errors;
}

/** Bygger ett giltigt Course-objekt från utkast (anropas efter validering). */
export function buildCourse(
  id: string,
  name: string,
  holes: HoleDraftInput[],
): Course {
  const built: Hole[] = holes.map((h) => ({
    number: h.number,
    par: Number(h.par),
    strokeIndex: Number(h.strokeIndex),
  }));
  return { id, name: name.trim(), holes: built };
}
