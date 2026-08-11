/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';
import { loadAppData } from './storage';
import { VIKSJO_9_COURSE } from '../data/sampleData';

beforeEach(() => {
  window.localStorage.clear();
});

describe('loadAppData – inbyggda banor', () => {
  it('uppdaterar en tidigare sparad inbyggd bana som saknar slopedata', () => {
    // Simulera en gammal sparad Viksjö (samma id) utan ratings.
    const stale = {
      id: VIKSJO_9_COURSE.id,
      name: 'Viksjö GK 9 hål',
      holes: VIKSJO_9_COURSE.holes.map((h) => ({ ...h })),
      // inga ratings
    };
    window.localStorage.setItem(
      'wallinmatch:v1',
      JSON.stringify({ currentTournament: null, history: [], courses: [stale] }),
    );

    const data = loadAppData();
    const viksjo = data.courses.find((c) => c.id === VIKSJO_9_COURSE.id);

    expect(viksjo).toBeTruthy();
    // Ratings ska nu finnas (kodens aktuella definition har ersatt den gamla).
    expect(viksjo!.ratings && viksjo!.ratings.length).toBeGreaterThan(0);
    // Ingen dubblett.
    expect(data.courses.filter((c) => c.id === VIKSJO_9_COURSE.id)).toHaveLength(1);
  });

  it('lägger till inbyggd bana om den saknas helt', () => {
    window.localStorage.setItem(
      'wallinmatch:v1',
      JSON.stringify({ currentTournament: null, history: [], courses: [] }),
    );
    const data = loadAppData();
    expect(data.courses.some((c) => c.id === VIKSJO_9_COURSE.id)).toBe(true);
  });

  it('behåller egna banor', () => {
    const custom = { id: 'course_custom', name: 'Min bana', holes: VIKSJO_9_COURSE.holes };
    window.localStorage.setItem(
      'wallinmatch:v1',
      JSON.stringify({ currentTournament: null, history: [], courses: [custom] }),
    );
    const data = loadAppData();
    expect(data.courses.some((c) => c.id === 'course_custom')).toBe(true);
    expect(data.courses.some((c) => c.id === VIKSJO_9_COURSE.id)).toBe(true);
  });
});
