import type { AppData } from '../types';

const STORAGE_KEY = 'wallinmatch:v1';

const EMPTY: AppData = {
  currentTournament: null,
  history: [],
  courses: [],
};

/** Läser hela app-tillståndet från localStorage. Returnerar tomt vid fel. */
export function loadAppData(): AppData {
  if (typeof window === 'undefined' || !window.localStorage) return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      currentTournament: parsed.currentTournament ?? null,
      history: Array.isArray(parsed.history) ? parsed.history : [],
      courses: Array.isArray(parsed.courses) ? parsed.courses : [],
    };
  } catch (err) {
    console.error('Kunde inte läsa sparad data:', err);
    return { ...EMPTY };
  }
}

/** Sparar hela app-tillståndet till localStorage. */
export function saveAppData(data: AppData): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Kunde inte spara data:', err);
  }
}
